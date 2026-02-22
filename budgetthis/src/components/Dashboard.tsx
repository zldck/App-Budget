import { useState, useMemo, useRef } from 'react';
import { type Category, type Bill, type Transaction, type DigitalWallet, type AppData, CATEGORY_COLORS, formatCurrency, getMonthKey, getMonthlyAllocation, getTodayKey, getDaysLeftInMonth, getDaysAfterToday } from '../types';

interface DashboardProps {
  income: number;
  setIncome: (income: number) => void;
  categories: Category[];
  bills: Bill[];
  transactions: Transaction[];
  wallets: DigitalWallet[];
  onNavigate: (page: string) => void;
  allData: AppData;
  onImportData: (data: AppData) => void;
  onShowWalkthrough: () => void;
}

export function Dashboard({ income, setIncome, categories, bills, transactions, wallets, onNavigate, allData, onImportData, onShowWalkthrough }: DashboardProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [editIncomeValue, setEditIncomeValue] = useState(income.toString());
  const [dismissedAlerts, setDismissedAlerts] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentMonthStr = getMonthKey();
  const todayStr = getTodayKey();
  const currentMonthLabel = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

  const { totalSpent, categorySpending, todaySpent, totalMonthIncome, daySpendingHistory } = useMemo(() => {
    const monthExpenses = transactions.filter(t => t.date.startsWith(currentMonthStr) && t.type === 'expense');
    const monthIncomes = transactions.filter(t => t.date.startsWith(currentMonthStr) && t.type === 'income');
    const spending: Record<string, number> = {};
    monthExpenses.forEach(t => { spending[t.categoryId] = (spending[t.categoryId] || 0) + t.amount; });
    const todayExp = monthExpenses.filter(t => t.date === todayStr).reduce((sum, t) => sum + t.amount, 0);
    const dailyMap: Record<string, number> = {};
    monthExpenses.forEach(t => { dailyMap[t.date] = (dailyMap[t.date] || 0) + t.amount; });
    return {
      totalSpent: monthExpenses.reduce((sum, t) => sum + t.amount, 0),
      categorySpending: spending,
      todaySpent: todayExp,
      totalMonthIncome: monthIncomes.reduce((sum, t) => sum + t.amount, 0),
      daySpendingHistory: dailyMap,
    };
  }, [transactions, currentMonthStr, todayStr]);

  const daysLeftIncToday = getDaysLeftInMonth();
  const daysAfterToday = getDaysAfterToday();
  const remaining = income - totalSpent;
  const dailyBudget = remaining > 0 ? remaining / daysLeftIncToday : 0;
  const todayRemaining = dailyBudget - todaySpent;
  const todayUsedPct = dailyBudget > 0 ? Math.min(100, (todaySpent / dailyBudget) * 100) : (todaySpent > 0 ? 100 : 0);
  const currentDay = new Date().getDate();
  const avgDailySpend = currentDay > 0 ? totalSpent / currentDay : 0;

  const zeroExpenseDays = useMemo(() => {
    if (remaining <= 0) return daysAfterToday;
    if (avgDailySpend <= 0) return 0;
    const daysCanAfford = Math.floor(remaining / avgDailySpend);
    return Math.max(0, daysAfterToday - daysCanAfford);
  }, [remaining, avgDailySpend, daysAfterToday]);

  const spendingStreak = useMemo(() => {
    let streak = 0;
    const today = new Date();
    for (let i = 1; i <= 30; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (!daySpendingHistory[key] || daySpendingHistory[key] === 0) { streak++; } else { break; }
    }
    return streak;
  }, [daySpendingHistory]);

  const isOverspendingToday = todaySpent > dailyBudget && dailyBudget > 0;
  const isOverspendingMonth = totalSpent > income;
  const isApproachingLimit = totalSpent > income * 0.85 && !isOverspendingMonth;
  const spentPercentage = income > 0 ? Math.min(100, (totalSpent / income) * 100) : 0;
  const healthScore = income > 0 ? Math.max(0, Math.min(100, ((income - totalSpent) / income) * 100)) : 100;
  const healthEmoji = healthScore >= 80 ? '🔥' : healthScore >= 60 ? '😊' : healthScore >= 40 ? '😐' : healthScore >= 20 ? '😟' : '🚨';
  const totalCOH = wallets.reduce((sum, w) => sum + w.balance, 0);
  const walletsNeedUpdate = wallets.filter(w => !w.lastUpdated.startsWith(todayStr));

  const monthlyAllocation = useMemo(() => {
    return bills.filter(b => !b.isPaid).reduce((sum, bill) => sum + getMonthlyAllocation(bill), 0);
  }, [bills]);

  const upcomingBills = useMemo(() => {
    const now = new Date();
    const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return bills
      .filter(b => !b.isPaid && new Date(b.dueDate) <= thirtyDaysLater && new Date(b.dueDate) >= now)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  }, [bills]);

  const recentTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  }, [transactions]);

  const totalBudgeted = categories.reduce((sum, c) => sum + c.budgeted, 0);
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const saveIncome = () => {
    const parsed = parseFloat(editIncomeValue);
    if (parsed > 0) setIncome(parsed);
    setShowSettings(false);
  };

  const topCategories = categories
    .filter(c => c.budgeted > 0)
    .map(c => ({ ...c, spent: categorySpending[c.id] || 0 }))
    .sort((a, b) => b.spent - a.spent)
    .slice(0, 5);

  const dismissAlert = (id: string) => { setDismissedAlerts(prev => [...prev, id]); };

  const handleExport = () => {
    const dataStr = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `budgetflow-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target?.result as string);
        if (imported && typeof imported.monthlyIncome === 'number' && Array.isArray(imported.categories)) {
          if (window.confirm('This will replace all your current data. Continue?')) {
            onImportData({ ...imported, wallets: imported.wallets || [] });
          }
        } else { alert('Invalid backup file format.'); }
      } catch { alert('Could not read backup file.'); }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const weekHeatmap = useMemo(() => {
    const days: { label: string; amount: number; date: string }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      days.push({ label: d.toLocaleString('default', { weekday: 'narrow' }), amount: daySpendingHistory[key] || 0, date: key });
    }
    return days;
  }, [daySpendingHistory]);

  const maxWeekSpend = Math.max(...weekHeatmap.map(d => d.amount), 1);

  return (
    <div className="pb-4 space-y-4">
      {/* HEADER */}
      <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 rounded-b-3xl px-5 pt-12 pb-6 -mx-4 -mt-4 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/[0.03] rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="flex items-center justify-between relative z-10">
          <div>
            <p className="text-stone-400 text-sm">{greeting} 👋</p>
            <h1 className="text-2xl font-bold mt-0.5">{currentMonthLabel}</h1>
          </div>
          <button onClick={() => { setEditIncomeValue(income.toString()); setShowSettings(true); }} className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors">⚙️</button>
        </div>

        {/* DAILY BUDGET HERO */}
        <div className="mt-5 bg-white/[0.06] backdrop-blur-sm rounded-2xl p-5 relative z-10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-stone-400 text-xs uppercase tracking-wider font-medium">{todaySpent > 0 ? "Today's Remaining" : "Today's Budget"}</p>
              <p className={`text-3xl font-extrabold mt-1 animate-count-up ${todayRemaining < 0 ? 'text-rose-300/80' : ''}`}>
                {todayRemaining < 0 ? '-' : ''}{formatCurrency(Math.abs(todayRemaining))}
              </p>
              {todayRemaining < 0 && <p className="text-rose-300/70 text-xs mt-0.5 animate-shake">⚠️ over today&apos;s limit</p>}
              <p className="text-stone-400 text-sm mt-1.5">
                {todaySpent > 0 ? (<span>Spent <span className="font-bold text-white">{formatCurrency(todaySpent)}</span> today</span>) : (<span>✨ No spending yet — great start!</span>)}
              </p>
            </div>
            <div className="relative flex-shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={todayRemaining < 0 ? '#e8c4c0' : '#a8a29e'} strokeWidth="3" strokeDasharray={`${todayUsedPct} ${100 - todayUsedPct}`} strokeLinecap="round" className="transition-all duration-1000" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl">{isOverspendingToday ? '🚨' : todaySpent === 0 ? '✨' : healthEmoji}</span>
              </div>
            </div>
          </div>
          <div className="mt-3 flex gap-2 text-xs">
            <div className="bg-white/[0.06] rounded-lg px-3 py-1.5 flex-1 text-center"><span className="text-stone-500">Daily avg</span><p className="font-bold">{formatCurrency(avgDailySpend)}</p></div>
            <div className="bg-white/[0.06] rounded-lg px-3 py-1.5 flex-1 text-center"><span className="text-stone-500">Days left</span><p className="font-bold">{daysLeftIncToday}</p></div>
            <div className="bg-white/[0.06] rounded-lg px-3 py-1.5 flex-1 text-center"><span className="text-stone-500">Remaining</span><p className={`font-bold ${remaining < 0 ? 'text-rose-300/80' : ''}`}>{remaining < 0 ? '-' : ''}{formatCurrency(Math.abs(remaining))}</p></div>
          </div>
        </div>

        {/* WEEK HEATMAP */}
        <div className="mt-4 relative z-10">
          <p className="text-stone-500 text-[10px] uppercase tracking-wider font-semibold mb-2">Last 7 Days</p>
          <div className="flex gap-1.5">
            {weekHeatmap.map((day, i) => {
              const intensity = day.amount / maxWeekSpend;
              const isToday = day.date === todayStr;
              return (
                <div key={i} className="flex-1 text-center">
                  <div className={`h-8 rounded-lg transition-all flex items-center justify-center text-[9px] font-bold ${isToday ? 'ring-2 ring-stone-400/40' : ''}`}
                    style={{ backgroundColor: day.amount === 0 ? 'rgba(255,255,255,0.04)' : `rgba(168, 162, 158, ${0.12 + intensity * 0.35})` }}
                    title={`${formatCurrency(day.amount)}`}>
                    {day.amount > 0 ? `₱${day.amount >= 1000 ? (day.amount/1000).toFixed(0)+'k' : day.amount.toFixed(0)}` : '–'}
                  </div>
                  <p className={`text-[9px] mt-1 ${isToday ? 'text-white font-bold' : 'text-stone-500'}`}>{day.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {isOverspendingMonth && !dismissedAlerts.includes('over-month') && (
        <div className="bg-rose-100/60 border border-rose-200/50 rounded-2xl p-4 animate-scale-in relative">
          <button onClick={() => dismissAlert('over-month')} className="absolute top-2 right-2 text-rose-300 hover:text-rose-500 text-sm w-6 h-6 flex items-center justify-center">✕</button>
          <div className="flex items-center gap-3">
            <span className="text-3xl animate-urgent-pulse">💸</span>
            <div>
              <p className="font-bold text-lg text-rose-700/80">Over Budget!</p>
              <p className="text-rose-600/60 text-sm">You&apos;re {formatCurrency(totalSpent - income)} over your {formatCurrency(income)} monthly income</p>
              <p className="text-rose-500/50 text-xs mt-1">🛑 All remaining {daysAfterToday} days should be zero-spend</p>
            </div>
          </div>
        </div>
      )}

      {isApproachingLimit && !dismissedAlerts.includes('approaching') && (
        <div className="bg-amber-50/60 border border-amber-200/40 rounded-2xl p-4 animate-scale-in relative">
          <button onClick={() => dismissAlert('approaching')} className="absolute top-2 right-2 text-amber-300 hover:text-amber-500 text-sm w-6 h-6 flex items-center justify-center">✕</button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚡</span>
            <div>
              <p className="font-bold text-amber-700/80">Heads Up!</p>
              <p className="text-amber-600/60 text-sm">You&apos;ve used {spentPercentage.toFixed(0)}% of your monthly budget</p>
              <p className="text-amber-500/50 text-xs mt-0.5">Only {formatCurrency(remaining)} left for {daysLeftIncToday} days</p>
            </div>
          </div>
        </div>
      )}

      {isOverspendingToday && !isOverspendingMonth && !dismissedAlerts.includes('over-today') && (
        <div className="bg-rose-50/50 border border-rose-200/40 rounded-2xl p-4 animate-scale-in relative">
          <button onClick={() => dismissAlert('over-today')} className="absolute top-2 right-2 text-rose-300 hover:text-rose-500 text-sm w-6 h-6 flex items-center justify-center">✕</button>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🛑</span>
            <div>
              <p className="font-bold text-rose-700/70">Slow Down Today!</p>
              <p className="text-rose-500/60 text-sm">You spent {formatCurrency(todaySpent - dailyBudget)} over today&apos;s {formatCurrency(dailyBudget)} budget</p>
            </div>
          </div>
        </div>
      )}

      {/* ZERO EXPENSE DAYS */}
      {zeroExpenseDays > 0 && !isOverspendingMonth && totalSpent > 0 && (
        <div className="bg-amber-50/50 border border-amber-200/40 rounded-2xl p-4 animate-slide-in-right">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-100/60 rounded-xl flex items-center justify-center text-xl flex-shrink-0 animate-float">📅</div>
            <div>
              <p className="font-bold text-amber-800/70">{zeroExpenseDays} Zero-Spend Day{zeroExpenseDays > 1 ? 's' : ''} Needed</p>
              <p className="text-amber-600/60 text-sm mt-0.5">Plan <span className="font-bold">{zeroExpenseDays} day{zeroExpenseDays > 1 ? 's' : ''}</span> with no spending to survive this month</p>
              {spendingStreak > 0 && (<p className="text-amber-500/50 text-xs mt-1">🏆 You had {spendingStreak} zero-spend day{spendingStreak > 1 ? 's' : ''} recently!</p>)}
            </div>
          </div>
        </div>
      )}

      {zeroExpenseDays === 0 && totalSpent > 0 && !isOverspendingMonth && (
        <div className="bg-emerald-50/40 border border-emerald-200/30 rounded-2xl p-4 animate-slide-in-right">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎉</span>
            <div>
              <p className="font-bold text-emerald-700/70">You&apos;re On Track!</p>
              <p className="text-emerald-500/60 text-sm">No zero-spend days needed. Keep it up!</p>
            </div>
          </div>
        </div>
      )}

      {/* WALLET COH */}
      {wallets.length > 0 && (
        <button onClick={() => onNavigate('wallet')} className={`w-full rounded-2xl p-4 text-left active:scale-[0.99] transition-transform ${walletsNeedUpdate.length > 0 ? 'bg-stone-100/80 border border-stone-200/50' : 'bg-stone-50 border border-stone-200/40'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${walletsNeedUpdate.length > 0 ? 'bg-stone-200/60' : 'bg-stone-200/40'}`}>💳</div>
            <div className="flex-1">
              {walletsNeedUpdate.length > 0 ? (
                <><p className="font-bold text-stone-700 text-sm">🔔 Update {walletsNeedUpdate.length} wallet{walletsNeedUpdate.length > 1 ? 's' : ''}</p><p className="text-stone-500 text-xs mt-0.5">Have you added COH to your digital wallets today?</p></>
              ) : (
                <><p className="font-bold text-stone-600 text-sm">✅ Wallets Updated</p><p className="text-stone-400 text-xs mt-0.5">All wallets are up to date</p></>
              )}
            </div>
            <div className="text-right"><p className="font-extrabold text-sm text-stone-700">{formatCurrency(totalCOH)}</p><p className="text-[10px] text-stone-400">Total COH</p></div>
          </div>
        </button>
      )}

      {wallets.length === 0 && transactions.length > 0 && (
        <button onClick={() => onNavigate('wallet')} className="w-full bg-stone-100/60 border border-stone-200/40 rounded-2xl p-4 text-left active:scale-[0.99] transition-transform">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-stone-200/50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">💳</div>
            <div><p className="font-bold text-stone-700 text-sm">Track Your Cash on Hand</p><p className="text-stone-500 text-xs mt-0.5">Add your digital wallets (GCash, PayMaya, etc.) →</p></div>
          </div>
        </button>
      )}

      {/* QUICK STATS */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-100/80">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Spent</p>
          <p className="text-lg font-bold text-stone-700 mt-1">{formatCurrency(totalSpent)}</p>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mt-2"><div className="h-full bg-rose-300/60 rounded-full progress-bar" style={{ width: `${Math.min(100, spentPercentage)}%` }} /></div>
        </div>
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-100/80">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Budgeted</p>
          <p className="text-lg font-bold text-stone-700 mt-1">{formatCurrency(totalBudgeted)}</p>
          <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden mt-2"><div className="h-full bg-stone-400/50 rounded-full progress-bar" style={{ width: `${income > 0 ? Math.min(100, (totalBudgeted / income) * 100) : 0}%` }} /></div>
        </div>
        <div className="bg-white rounded-2xl p-3.5 shadow-sm border border-stone-100/80">
          <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold">Health</p>
          <p className="text-lg font-bold mt-1">{healthEmoji} {healthScore.toFixed(0)}%</p>
          {totalMonthIncome > 0 && (<p className="text-emerald-500/70 text-[10px] font-medium mt-1">+{formatCurrency(totalMonthIncome)}</p>)}
        </div>
      </div>

      {/* BILL ALLOCATION */}
      {monthlyAllocation > 0 && (
        <button onClick={() => onNavigate('bills')} className="w-full bg-stone-100/70 border border-stone-200/50 rounded-2xl p-4 text-left active:scale-[0.99] transition-transform">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-stone-200/50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">📋</div>
            <div className="flex-1">
              <h3 className="font-bold text-stone-700 text-sm">Monthly Bill Allocation</h3>
              <p className="text-stone-600 mt-0.5">Save <span className="font-extrabold text-lg">{formatCurrency(monthlyAllocation)}</span><span className="text-sm">/month</span></p>
              <p className="text-stone-400 text-xs mt-0.5">to cover all upcoming bills • Tap to see breakdown →</p>
            </div>
          </div>
        </button>
      )}

      {/* CATEGORY SPENDING */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100/80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-stone-700">Spending by Category</h3>
          <button onClick={() => onNavigate('budget')} className="text-sm text-stone-500 font-semibold hover:text-stone-600">See all →</button>
        </div>
        <div className="space-y-3.5">
          {topCategories.map(cat => {
            const pct = cat.budgeted > 0 ? Math.min(100, (cat.spent / cat.budgeted) * 100) : 0;
            const isOver = cat.spent > cat.budgeted && cat.budgeted > 0;
            const colors = CATEGORY_COLORS[cat.color];
            return (
              <div key={cat.id}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="flex items-center gap-2"><span className="text-base">{cat.emoji}</span><span className="font-medium text-stone-600">{cat.name}</span></span>
                  <span className={`text-xs font-semibold ${isOver ? 'text-rose-500/70' : 'text-stone-400'}`}>₱{cat.spent.toFixed(0)} / ₱{cat.budgeted.toFixed(0)}{isOver && ' 🚨'}</span>
                </div>
                <div className="h-2 bg-stone-100 rounded-full overflow-hidden"><div className={`h-full rounded-full progress-bar ${isOver ? 'bg-rose-300/60' : colors.bar}`} style={{ width: `${pct}%` }} /></div>
              </div>
            );
          })}
          {topCategories.length === 0 && (
            <button onClick={() => onNavigate('budget')} className="w-full text-center py-6 text-stone-400 hover:text-stone-500 transition-colors">
              <p className="text-3xl mb-2">📊</p><p className="text-sm font-medium">Set up budget categories to track spending</p><p className="text-xs mt-1">Tap here to get started →</p>
            </button>
          )}
        </div>
      </div>

      {/* UPCOMING BILLS */}
      {upcomingBills.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-700">Upcoming Bills</h3>
            <button onClick={() => onNavigate('bills')} className="text-sm text-stone-500 font-semibold">See all →</button>
          </div>
          <div className="space-y-2.5">
            {upcomingBills.slice(0, 4).map(bill => {
              const daysUntil = Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
              const urgency = daysUntil <= 3 ? 'bg-rose-50/40 border-rose-200/40' : daysUntil <= 7 ? 'bg-amber-50/40 border-amber-200/40' : 'bg-stone-50 border-stone-100';
              return (
                <div key={bill.id} className={`flex items-center justify-between p-3.5 rounded-xl border ${urgency}`}>
                  <div>
                    <p className="font-semibold text-stone-700 text-sm">{bill.name}</p>
                    <p className={`text-xs mt-0.5 ${daysUntil <= 3 ? 'text-rose-500/70 font-semibold' : 'text-stone-400'}`}>
                      {daysUntil === 0 ? '🔴 Due today!' : daysUntil === 1 ? '⚠️ Due tomorrow' : `Due in ${daysUntil} days`}
                    </p>
                  </div>
                  <p className="font-bold text-stone-700">{formatCurrency(bill.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* RECENT TRANSACTIONS */}
      {recentTransactions.length > 0 && (
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-stone-100/80">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-stone-700">Recent Activity</h3>
            <button onClick={() => onNavigate('transactions')} className="text-sm text-stone-500 font-semibold">See all →</button>
          </div>
          <div className="space-y-2">
            {recentTransactions.map(txn => {
              const cat = categories.find(c => c.id === txn.categoryId);
              const colors = cat ? CATEGORY_COLORS[cat.color] : CATEGORY_COLORS.indigo;
              return (
                <div key={txn.id} className="flex items-center gap-3 py-2">
                  <div className={`w-9 h-9 rounded-lg ${colors.light} flex items-center justify-center text-sm flex-shrink-0`}>{cat?.emoji || '💰'}</div>
                  <div className="flex-1 min-w-0"><p className="font-medium text-stone-700 text-sm truncate">{txn.description}</p><p className="text-xs text-stone-400">{cat?.name || 'Uncategorized'}</p></div>
                  <p className={`font-bold text-sm flex-shrink-0 ${txn.type === 'income' ? 'text-emerald-500/70' : 'text-stone-700'}`}>{txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* EMPTY STATE */}
      {transactions.length === 0 && bills.length === 0 && (
        <div className="bg-stone-100/50 rounded-2xl p-8 text-center border border-stone-200/40">
          <div className="text-5xl mb-4 animate-float">🎯</div>
          <h3 className="font-bold text-stone-700 text-lg mb-2">Ready to start budgeting?</h3>
          <p className="text-stone-400 text-sm mb-6">Set up your categories, add bills, and start tracking daily expenses!</p>
          <div className="flex gap-2">
            <button onClick={() => onNavigate('budget')} className="flex-1 bg-stone-800 text-white rounded-xl py-3 font-semibold text-sm active:scale-[0.97] transition-transform">Set Budget</button>
            <button onClick={() => onNavigate('transactions')} className="flex-1 bg-white text-stone-600 border border-stone-200 rounded-xl py-3 font-semibold text-sm active:scale-[0.97] transition-transform">Add Expense</button>
          </div>
        </div>
      )}

      {/* SETTINGS MODAL */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 animate-fade-in" onClick={() => setShowSettings(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-4" />
            <h2 className="text-xl font-bold text-stone-700 mb-5">⚙️ Settings</h2>
            <div className="space-y-5">
              <div>
                <label className="text-sm font-semibold text-stone-500 block mb-1.5">Monthly Income</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">₱</span>
                  <input type="number" value={editIncomeValue} onChange={e => setEditIncomeValue(e.target.value)} className="w-full pl-8 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent text-lg font-semibold" placeholder="0.00" />
                </div>
              </div>
              <button onClick={saveIncome} className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-xl py-3.5 font-bold active:scale-[0.98] transition-all">Save Income</button>

              <div className="border-t border-stone-100 pt-5">
                <button onClick={() => { setShowSettings(false); setTimeout(() => onShowWalkthrough(), 300); }} className="w-full flex items-center gap-3 p-4 rounded-xl bg-stone-100/60 border border-stone-200/50 text-left hover:bg-stone-100 transition-colors active:scale-[0.98]">
                  <span className="text-xl">📖</span>
                  <div><p className="font-semibold text-stone-700 text-sm">App Walkthrough</p><p className="text-stone-500 text-xs">Replay the intro tutorial & feature guide</p></div>
                </button>
              </div>

              <div className="border-t border-stone-100 pt-5">
                <h3 className="font-bold text-stone-700 mb-1">📦 Backup & Sync</h3>
                <p className="text-stone-400 text-xs mb-4">Save your data or restore from a previous backup</p>
                <div className="space-y-2.5">
                  <button onClick={handleExport} className="w-full flex items-center gap-3 p-4 rounded-xl bg-stone-100/60 border border-stone-200/50 text-left hover:bg-stone-100 transition-colors active:scale-[0.98]">
                    <span className="text-xl">💾</span>
                    <div><p className="font-semibold text-stone-700 text-sm">Export / Download Backup</p><p className="text-stone-500 text-xs">Save as JSON file • Upload to Google Drive for cloud sync</p></div>
                  </button>
                  <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 rounded-xl bg-stone-100/60 border border-stone-200/50 text-left hover:bg-stone-100 transition-colors active:scale-[0.98]">
                    <span className="text-xl">📂</span>
                    <div><p className="font-semibold text-stone-700 text-sm">Import / Restore Backup</p><p className="text-stone-500 text-xs">Load from JSON file • Restore from Google Drive backup</p></div>
                  </button>
                  <input type="file" ref={fileInputRef} onChange={handleImport} accept=".json" className="hidden" />
                  <div className="bg-stone-50 rounded-xl p-3 border border-stone-100">
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold mb-1">💡 Cloud Sync Tip</p>
                    <p className="text-xs text-stone-500">Export your data and save the file to Google Drive, iCloud, or Dropbox for automatic cloud backup. Import it on any device!</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-stone-100 pt-4">
                <button onClick={() => { if (window.confirm('Reset all data? This cannot be undone.')) { window.localStorage.removeItem('budgetflow-data'); window.localStorage.removeItem('budgetflow-walkthrough-seen'); window.location.reload(); } }} className="w-full text-rose-400/70 rounded-xl py-3 font-semibold text-sm hover:bg-rose-50/30 transition-colors">🗑️ Reset All Data</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
