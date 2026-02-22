import { useState, useMemo } from 'react';
import { type Transaction, type Category, CATEGORY_COLORS, formatCurrency, getMonthKey } from '../types';

interface TransactionsPageProps {
  transactions: Transaction[];
  setTransactions: (updater: Transaction[] | ((prev: Transaction[]) => Transaction[])) => void;
  categories: Category[];
}

export function TransactionsPage({ transactions, setTransactions, categories }: TransactionsPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [formDesc, setFormDesc] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().split('T')[0]);
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formType, setFormType] = useState<'expense' | 'income'>('expense');
  const [filterCategory, setFilterCategory] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());

  const openAddModal = () => { setFormDesc(''); setFormAmount(''); setFormDate(new Date().toISOString().split('T')[0]); setFormCategoryId(categories[0]?.id || ''); setFormType('expense'); setShowModal(true); };

  const saveTransaction = () => {
    if (!formDesc.trim() || !formAmount) return;
    setTransactions(prev => [{ id: `txn-${Date.now()}`, description: formDesc, amount: parseFloat(formAmount) || 0, date: formDate, categoryId: formCategoryId, type: formType }, ...prev]);
    setShowModal(false);
  };

  const deleteTransaction = (id: string) => { setTransactions(prev => prev.filter(t => t.id !== id)); };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => t.date.startsWith(selectedMonth)).filter(t => filterCategory === 'all' || t.categoryId === filterCategory).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, selectedMonth, filterCategory]);

  const grouped = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filteredTransactions.forEach(t => { if (!groups[t.date]) groups[t.date] = []; groups[t.date].push(t); });
    return groups;
  }, [filteredTransactions]);

  const monthTransactions = transactions.filter(t => t.date.startsWith(selectedMonth));
  const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpenses = monthTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const changeMonth = (direction: number) => { const [year, month] = selectedMonth.split('-').map(Number); setSelectedMonth(getMonthKey(new Date(year, month - 1 + direction, 1))); };
  const monthLabel = (() => { const [year, month] = selectedMonth.split('-').map(Number); return new Date(year, month - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' }); })();
  const isCurrentMonth = selectedMonth === getMonthKey();

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 rounded-b-3xl px-5 pt-12 pb-6 -mx-4 -mt-4 text-white mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
        <h1 className="text-2xl font-bold relative z-10">Transactions</h1>
        <div className="flex items-center justify-between mt-4 relative z-10">
          <button onClick={() => changeMonth(-1)} className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/15 transition-colors text-lg">←</button>
          <span className="font-semibold">{monthLabel}</span>
          <button onClick={() => changeMonth(1)} className={`w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center transition-colors text-lg ${isCurrentMonth ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/15'}`} disabled={isCurrentMonth}>→</button>
        </div>
        <div className="flex justify-between mt-4 relative z-10">
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1 mr-2"><p className="text-stone-400 text-[10px] uppercase tracking-wider font-semibold">Income</p><p className="text-lg font-bold text-emerald-400/60">+{formatCurrency(totalIncome)}</p></div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-4 py-2.5 flex-1 ml-2"><p className="text-stone-400 text-[10px] uppercase tracking-wider font-semibold">Expenses</p><p className="text-lg font-bold text-rose-300/60">-{formatCurrency(totalExpenses)}</p></div>
        </div>
      </div>

      <button onClick={openAddModal} className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-2xl p-4 font-bold shadow-lg shadow-stone-300/20 active:scale-[0.98] transition-all mb-4 flex items-center justify-center gap-2"><span className="text-xl">+</span><span>Add Transaction</span></button>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-3 mb-3">
        <button onClick={() => setFilterCategory('all')} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${filterCategory === 'all' ? 'bg-stone-700 text-white shadow-md' : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'}`}>All</button>
        {categories.map(cat => (<button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-all flex-shrink-0 ${filterCategory === cat.id ? 'bg-stone-700 text-white shadow-md' : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'}`}>{cat.emoji} {cat.name}</button>))}
      </div>

      <div className="space-y-5">
        {Object.entries(grouped).map(([date, txns]) => (
          <div key={date}>
            <p className="text-xs text-stone-400 uppercase tracking-wider font-semibold mb-2 px-1">{new Date(date + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>
            <div className="space-y-2">
              {txns.map(txn => {
                const cat = categories.find(c => c.id === txn.categoryId);
                const colors = cat ? CATEGORY_COLORS[cat.color] : CATEGORY_COLORS.indigo;
                return (
                  <div key={txn.id} className="bg-white rounded-2xl p-4 shadow-sm border border-stone-100/80 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${colors.light} flex items-center justify-center text-lg flex-shrink-0`}>{cat?.emoji || '💰'}</div>
                    <div className="flex-1 min-w-0"><p className="font-semibold text-stone-700 text-sm truncate">{txn.description}</p><p className="text-xs text-stone-400 mt-0.5">{cat?.name || 'Uncategorized'}</p></div>
                    <div className="text-right flex-shrink-0 flex items-center gap-2">
                      <p className={`font-bold ${txn.type === 'income' ? 'text-emerald-500/70' : 'text-stone-700'}`}>{txn.type === 'income' ? '+' : '-'}{formatCurrency(txn.amount)}</p>
                      <button onClick={() => deleteTransaction(txn.id)} className="w-6 h-6 text-stone-300 hover:text-rose-400 flex items-center justify-center transition-colors text-xs">✕</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {filteredTransactions.length === 0 && (<div className="text-center py-12"><p className="text-5xl mb-3 animate-float">💳</p><p className="text-stone-500 font-medium">No transactions found</p><p className="text-stone-400 text-sm mt-1">{filterCategory !== 'all' ? 'Try a different category filter' : 'Add your first transaction!'}</p></div>)}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-bold text-stone-700 mb-5">New Transaction</h2>
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-1.5 bg-stone-100 p-1.5 rounded-xl">
                <button onClick={() => setFormType('expense')} className={`py-3 rounded-lg text-sm font-bold transition-all ${formType === 'expense' ? 'bg-white text-rose-500/80 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>💸 Expense</button>
                <button onClick={() => setFormType('income')} className={`py-3 rounded-lg text-sm font-bold transition-all ${formType === 'income' ? 'bg-white text-emerald-500/80 shadow-sm' : 'text-stone-400 hover:text-stone-600'}`}>💰 Income</button>
              </div>
              <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Description</label><input type="text" value={formDesc} onChange={e => setFormDesc(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent font-medium" placeholder="e.g., Coffee at Starbucks" autoFocus /></div>
              <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Amount</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">₱</span><input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent font-medium text-lg" placeholder="0.00" /></div></div>
              <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Date</label><input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent font-medium" /></div>
              <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Category</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {categories.map(cat => {
                    const colors = CATEGORY_COLORS[cat.color];
                    return (<button key={cat.id} onClick={() => setFormCategoryId(cat.id)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${formCategoryId === cat.id ? `${colors.light} ${colors.text} ring-2 ring-stone-300 ring-offset-1` : 'bg-stone-50 text-stone-500 hover:bg-stone-100'}`}><span>{cat.emoji}</span><span className="truncate">{cat.name}</span></button>);
                  })}
                </div>
              </div>
              <button onClick={saveTransaction} className={`w-full rounded-xl py-3.5 font-bold active:scale-[0.98] transition-all ${formType === 'expense' ? 'bg-stone-800 hover:bg-stone-700 text-white' : 'bg-emerald-600/70 hover:bg-emerald-600/80 text-white'}`}>Add {formType === 'expense' ? 'Expense' : 'Income'}</button>
              <button onClick={() => setShowModal(false)} className="w-full text-stone-400 rounded-xl py-2 font-medium text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
