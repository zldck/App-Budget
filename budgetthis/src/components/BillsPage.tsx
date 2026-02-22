import { useState, useMemo } from 'react';
import { type Bill, type Category, CATEGORY_COLORS, formatCurrency, getMonthlyAllocation } from '../types';

interface BillsPageProps {
  bills: Bill[];
  setBills: (updater: Bill[] | ((prev: Bill[]) => Bill[])) => void;
  categories: Category[];
}

export function BillsPage({ bills, setBills, categories }: BillsPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [formName, setFormName] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formCategoryId, setFormCategoryId] = useState('');
  const [formRecurring, setFormRecurring] = useState(false);
  const [formFrequency, setFormFrequency] = useState<Bill['frequency']>('monthly');
  const [showBreakdown, setShowBreakdown] = useState(false);

  const { totalAllocation, billAllocations } = useMemo(() => {
    const allocations: { bill: Bill; monthlyAmount: number; monthsLeft: number }[] = [];
    let total = 0;
    bills.filter(b => !b.isPaid).forEach(bill => {
      const monthly = getMonthlyAllocation(bill);
      let months: number;
      if (bill.recurring) { switch (bill.frequency) { case 'monthly': months = 1; break; case 'quarterly': months = 3; break; case 'yearly': months = 12; break; default: months = 1; } }
      else { const today = new Date(); const dueDate = new Date(bill.dueDate); months = Math.max(1, (dueDate.getFullYear() - today.getFullYear()) * 12 + (dueDate.getMonth() - today.getMonth())); }
      allocations.push({ bill, monthlyAmount: monthly, monthsLeft: months }); total += monthly;
    });
    return { totalAllocation: total, billAllocations: allocations.sort((a, b) => b.monthlyAmount - a.monthlyAmount) };
  }, [bills]);

  const openAddModal = () => { setEditingBill(null); setFormName(''); setFormAmount(''); const nm = new Date(); nm.setMonth(nm.getMonth() + 1); setFormDueDate(nm.toISOString().split('T')[0]); setFormCategoryId(categories[0]?.id || ''); setFormRecurring(false); setFormFrequency('monthly'); setShowModal(true); };
  const openEditModal = (bill: Bill) => { setEditingBill(bill); setFormName(bill.name); setFormAmount(bill.amount.toString()); setFormDueDate(bill.dueDate); setFormCategoryId(bill.categoryId); setFormRecurring(bill.recurring); setFormFrequency(bill.frequency); setShowModal(true); };

  const saveBill = () => {
    if (!formName.trim() || !formAmount) return;
    if (editingBill) { setBills(prev => prev.map(b => b.id === editingBill.id ? { ...b, name: formName, amount: parseFloat(formAmount) || 0, dueDate: formDueDate, categoryId: formCategoryId, recurring: formRecurring, frequency: formRecurring ? formFrequency : 'one-time' } : b)); }
    else { setBills(prev => [...prev, { id: `bill-${Date.now()}`, name: formName, amount: parseFloat(formAmount) || 0, dueDate: formDueDate, categoryId: formCategoryId, recurring: formRecurring, frequency: formRecurring ? formFrequency : 'one-time', isPaid: false }]); }
    setShowModal(false);
  };

  const togglePaid = (id: string) => { setBills(prev => prev.map(b => (b.id === id ? { ...b, isPaid: !b.isPaid } : b))); };
  const deleteBill = (id: string) => { if (window.confirm('Delete this bill?')) setBills(prev => prev.filter(b => b.id !== id)); };

  const sortedBills = [...bills].sort((a, b) => { if (a.isPaid !== b.isPaid) return a.isPaid ? 1 : -1; return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime(); });
  const unpaidTotal = bills.filter(b => !b.isPaid).reduce((s, b) => s + b.amount, 0);
  const paidCount = bills.filter(b => b.isPaid).length;

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 rounded-b-3xl px-5 pt-12 pb-6 -mx-4 -mt-4 text-white mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
        <h1 className="text-2xl font-bold relative z-10">Bills & Payments</h1>
        <p className="text-stone-400 text-sm mt-1 relative z-10">Plan ahead, stay stress-free</p>
        <div className="flex justify-between mt-4 relative z-10">
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-4 py-2.5"><p className="text-stone-400 text-[10px] uppercase tracking-wider font-semibold">Unpaid</p><p className="text-lg font-bold">{formatCurrency(unpaidTotal)}</p></div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl px-4 py-2.5"><p className="text-stone-400 text-[10px] uppercase tracking-wider font-semibold">Paid</p><p className="text-lg font-bold text-emerald-400/60">{paidCount}/{bills.length}</p></div>
        </div>
      </div>

      {/* Allocation Card */}
      <div className="bg-stone-800 rounded-2xl p-5 mb-4 text-white shadow-lg shadow-stone-300/15 relative overflow-hidden">
        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/[0.05] rounded-full" />
        <div className="flex items-center gap-2 mb-2"><span className="text-xl">💡</span><h3 className="font-bold">Save Each Month</h3></div>
        <p className="text-3xl font-extrabold tracking-tight">{formatCurrency(totalAllocation)}<span className="text-base font-normal opacity-60">/mo</span></p>
        <p className="text-stone-400 text-sm mt-1">to cover all your upcoming bills</p>
        {billAllocations.length > 0 && (<button onClick={() => setShowBreakdown(!showBreakdown)} className="mt-3 text-sm font-semibold bg-white/10 px-4 py-2 rounded-lg hover:bg-white/15 transition-colors">{showBreakdown ? 'Hide' : 'Show'} Breakdown ↓</button>)}
        {showBreakdown && (
          <div className="mt-4 space-y-2 animate-fade-in">
            {billAllocations.map(({ bill, monthlyAmount, monthsLeft }) => (
              <div key={bill.id} className="flex items-center justify-between py-2 border-t border-white/10 first:border-0">
                <div><p className="text-sm font-medium">{bill.name}</p><p className="text-stone-400 text-xs">{bill.recurring ? bill.frequency : `${monthsLeft} month${monthsLeft > 1 ? 's' : ''} left`}{' • '}{formatCurrency(bill.amount)} total</p></div>
                <p className="text-sm font-bold">{formatCurrency(monthlyAmount)}/mo</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={openAddModal} className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-2xl p-4 font-bold shadow-lg shadow-stone-300/20 active:scale-[0.98] transition-all mb-5 flex items-center justify-center gap-2"><span className="text-xl">+</span><span>Add Bill</span></button>

      <div className="space-y-3">
        {sortedBills.map(bill => {
          const cat = categories.find(c => c.id === bill.categoryId);
          const daysUntil = Math.ceil((new Date(bill.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
          const isOverdue = daysUntil < 0 && !bill.isPaid;
          const colors = cat ? CATEGORY_COLORS[cat.color] : CATEGORY_COLORS.indigo;
          return (
            <div key={bill.id} className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${bill.isPaid ? 'opacity-60 border-emerald-200/30 bg-emerald-50/15' : isOverdue ? 'border-rose-200/40 bg-rose-50/15' : 'border-stone-100/80'}`}>
              <div className="flex items-center gap-3">
                <button onClick={() => togglePaid(bill.id)} className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all flex-shrink-0 ${bill.isPaid ? 'bg-emerald-400/70 border-emerald-400/70 text-white' : isOverdue ? 'border-rose-300/60 hover:border-rose-400' : 'border-stone-300 hover:border-stone-400'}`}>
                  {bill.isPaid && <span className="text-xs font-bold">✓</span>}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className={`font-bold text-sm ${bill.isPaid ? 'line-through text-stone-400' : 'text-stone-700'}`}>{bill.name}</h3>
                    {bill.recurring && (<span className="text-[10px] bg-stone-100 text-stone-500 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider">{bill.frequency}</span>)}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {cat && (<span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${colors.light} ${colors.text}`}>{cat.emoji} {cat.name}</span>)}
                    <span className={`text-xs ${isOverdue ? 'text-rose-500/60 font-bold' : bill.isPaid ? 'text-emerald-500/60' : 'text-stone-400'}`}>
                      {isOverdue ? `🔴 Overdue by ${Math.abs(daysUntil)} days` : bill.isPaid ? '✅ Paid' : daysUntil === 0 ? '⚠️ Due today' : daysUntil === 1 ? '⚠️ Due tomorrow' : `📅 ${new Date(bill.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                    </span>
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className={`font-extrabold ${bill.isPaid ? 'text-stone-400' : 'text-stone-700'}`}>{formatCurrency(bill.amount)}</p>
                  <div className="flex gap-1 mt-1 justify-end">
                    <button onClick={() => openEditModal(bill)} className="w-6 h-6 text-stone-300 hover:text-stone-600 flex items-center justify-center transition-colors text-xs">✏️</button>
                    <button onClick={() => deleteBill(bill.id)} className="w-6 h-6 text-stone-300 hover:text-rose-500 flex items-center justify-center transition-colors text-xs">🗑️</button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {bills.length === 0 && (<div className="text-center py-12"><p className="text-5xl mb-3 animate-float">📋</p><p className="text-stone-500 font-medium">No bills yet</p><p className="text-stone-400 text-sm mt-1">Add your bills to plan monthly savings!</p></div>)}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-bold text-stone-700 mb-5">{editingBill ? 'Edit Bill' : 'New Bill'}</h2>
            <div className="space-y-5">
              <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Bill Name</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent font-medium" placeholder="e.g., Netflix, Rent" autoFocus /></div>
              <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Amount</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">₱</span><input type="number" value={formAmount} onChange={e => setFormAmount(e.target.value)} className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent font-medium" placeholder="0.00" /></div></div>
              <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Due Date</label><input type="date" value={formDueDate} onChange={e => setFormDueDate(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent font-medium" /></div>
              <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Category</label>
                <select value={formCategoryId} onChange={e => setFormCategoryId(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent bg-white font-medium">
                  <option value="">Select category</option>{categories.map(cat => (<option key={cat.id} value={cat.id}>{cat.emoji} {cat.name}</option>))}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-3"><span className="text-sm font-semibold text-stone-500">Recurring Bill</span>
                  <button onClick={() => setFormRecurring(!formRecurring)} className={`w-12 h-7 rounded-full transition-all relative ${formRecurring ? 'bg-stone-600' : 'bg-stone-200'}`}><div className={`absolute w-5 h-5 bg-white rounded-full top-1 transition-all shadow-sm ${formRecurring ? 'left-6' : 'left-1'}`} /></button>
                </div>
                {formRecurring && (<div className="grid grid-cols-3 gap-2 animate-fade-in">{(['monthly', 'quarterly', 'yearly'] as const).map(freq => (<button key={freq} onClick={() => setFormFrequency(freq)} className={`py-2.5 rounded-xl text-sm font-semibold transition-all capitalize ${formFrequency === freq ? 'bg-stone-700 text-white shadow-md' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'}`}>{freq}</button>))}</div>)}
              </div>
              {formAmount && formDueDate && (
                <div className="bg-stone-100/60 rounded-xl p-4 animate-fade-in">
                  <p className="text-sm text-stone-600">💡 Monthly allocation: <span className="font-bold">{formatCurrency(formRecurring ? formFrequency === 'monthly' ? parseFloat(formAmount) || 0 : formFrequency === 'quarterly' ? (parseFloat(formAmount) || 0) / 3 : (parseFloat(formAmount) || 0) / 12 : (() => { const today = new Date(); const due = new Date(formDueDate); const m = Math.max(1, (due.getFullYear() - today.getFullYear()) * 12 + (due.getMonth() - today.getMonth())); return (parseFloat(formAmount) || 0) / m; })())}/mo</span></p>
                </div>
              )}
              <button onClick={saveBill} className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-xl py-3.5 font-bold active:scale-[0.98] transition-all">{editingBill ? 'Save Changes' : 'Add Bill'}</button>
              <button onClick={() => setShowModal(false)} className="w-full text-stone-400 rounded-xl py-2 font-medium text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
