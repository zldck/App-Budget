import { useState } from 'react';
import { type Category, type Transaction, type CategoryColor, CATEGORY_COLORS, EMOJI_OPTIONS, COLOR_OPTIONS, getMonthKey, formatCurrency } from '../types';

interface BudgetPageProps {
  categories: Category[];
  setCategories: (updater: Category[] | ((prev: Category[]) => Category[])) => void;
  transactions: Transaction[];
  income: number;
}

export function BudgetPage({ categories, setCategories, transactions, income }: BudgetPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('🏠');
  const [formColor, setFormColor] = useState<CategoryColor>('indigo');
  const [formBudget, setFormBudget] = useState('');

  const currentMonthStr = getMonthKey();
  const categorySpending: Record<string, number> = {};
  transactions.filter(t => t.date.startsWith(currentMonthStr) && t.type === 'expense').forEach(t => {
    categorySpending[t.categoryId] = (categorySpending[t.categoryId] || 0) + t.amount;
  });

  const totalBudgeted = categories.reduce((sum, c) => sum + c.budgeted, 0);
  const totalSpent = Object.values(categorySpending).reduce((sum, v) => sum + v, 0);
  const unallocated = income - totalBudgeted;

  const openAddModal = () => { setEditingCategory(null); setFormName(''); setFormEmoji('🏠'); setFormColor('indigo'); setFormBudget(''); setShowModal(true); };
  const openEditModal = (cat: Category) => { setEditingCategory(cat); setFormName(cat.name); setFormEmoji(cat.emoji); setFormColor(cat.color); setFormBudget(cat.budgeted.toString()); setShowModal(true); };

  const saveCategory = () => {
    if (!formName.trim()) return;
    if (editingCategory) {
      setCategories(prev => prev.map(c => c.id === editingCategory.id ? { ...c, name: formName, emoji: formEmoji, color: formColor, budgeted: parseFloat(formBudget) || 0 } : c));
    } else {
      setCategories(prev => [...prev, { id: `cat-${Date.now()}`, name: formName, emoji: formEmoji, color: formColor, budgeted: parseFloat(formBudget) || 0 }]);
    }
    setShowModal(false);
  };

  const deleteCategory = (id: string) => { if (window.confirm('Delete this category?')) setCategories(prev => prev.filter(c => c.id !== id)); };

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 rounded-b-3xl px-5 pt-12 pb-6 -mx-4 -mt-4 text-white mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
        <h1 className="text-2xl font-bold relative z-10">Budget</h1>
        <p className="text-stone-400 text-sm mt-1 relative z-10">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
        <div className="grid grid-cols-3 gap-3 mt-5 relative z-10">
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3"><p className="text-stone-400 text-[10px] uppercase tracking-wider font-semibold">Budgeted</p><p className="text-lg font-bold mt-0.5">{formatCurrency(totalBudgeted)}</p></div>
          <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3"><p className="text-stone-400 text-[10px] uppercase tracking-wider font-semibold">Spent</p><p className="text-lg font-bold mt-0.5">{formatCurrency(totalSpent)}</p></div>
          <div className={`bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 ${unallocated < 0 ? 'ring-1 ring-rose-400/30' : ''}`}><p className="text-stone-400 text-[10px] uppercase tracking-wider font-semibold">{unallocated >= 0 ? 'Free' : 'Over'}</p><p className={`text-lg font-bold mt-0.5 ${unallocated < 0 ? 'text-rose-300/70' : 'text-emerald-400/60'}`}>{formatCurrency(Math.abs(unallocated))}</p></div>
        </div>
      </div>

      {unallocated > 0 && totalBudgeted > 0 && (
        <div className="bg-emerald-50/30 border border-emerald-200/30 rounded-2xl p-4 mb-4 flex items-center gap-3">
          <span className="text-xl">💡</span><p className="text-emerald-600/60 text-sm"><span className="font-bold">{formatCurrency(unallocated)}</span> unallocated from your income</p>
        </div>
      )}

      <button onClick={openAddModal} className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-2xl p-4 font-bold shadow-lg shadow-stone-300/20 active:scale-[0.98] transition-all mb-5 flex items-center justify-center gap-2">
        <span className="text-xl">+</span><span>Add Category</span>
      </button>

      <div className="space-y-3">
        {categories.map(cat => {
          const spent = categorySpending[cat.id] || 0;
          const pct = cat.budgeted > 0 ? Math.min(100, (spent / cat.budgeted) * 100) : 0;
          const isOver = spent > cat.budgeted && cat.budgeted > 0;
          const colors = CATEGORY_COLORS[cat.color];
          const catRemaining = cat.budgeted - spent;
          return (
            <div key={cat.id} className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${isOver ? 'border-rose-200/40 bg-rose-50/20' : 'border-stone-100/80'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl ${colors.light} flex items-center justify-center text-lg`}>{cat.emoji}</div>
                  <div><h3 className="font-bold text-stone-700">{cat.name}</h3><p className="text-xs text-stone-400 mt-0.5">{formatCurrency(spent)} of {formatCurrency(cat.budgeted)}</p></div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEditModal(cat)} className="w-8 h-8 rounded-lg text-stone-400 hover:text-stone-600 hover:bg-stone-100 flex items-center justify-center transition-colors text-sm">✏️</button>
                  <button onClick={() => deleteCategory(cat.id)} className="w-8 h-8 rounded-lg text-stone-400 hover:text-rose-500 hover:bg-rose-50/40 flex items-center justify-center transition-colors text-sm">🗑️</button>
                </div>
              </div>
              <div className="mt-3">
                <div className="h-2.5 bg-stone-100 rounded-full overflow-hidden"><div className={`h-full rounded-full progress-bar ${isOver ? 'bg-rose-300/60' : colors.bar}`} style={{ width: `${pct}%` }} /></div>
                <div className="flex justify-between mt-1.5">
                  <span className={`text-xs font-medium ${isOver ? 'text-rose-500/60' : 'text-stone-400'}`}>{isOver ? `🚨 Over by ${formatCurrency(Math.abs(catRemaining))}` : cat.budgeted > 0 ? `${pct.toFixed(0)}% used` : 'No budget set'}</span>
                  {!isOver && cat.budgeted > 0 && (<span className="text-xs text-emerald-500/60 font-medium">{formatCurrency(catRemaining)} left</span>)}
                </div>
              </div>
            </div>
          );
        })}
        {categories.length === 0 && (<div className="text-center py-12"><p className="text-5xl mb-3 animate-float">📊</p><p className="text-stone-400 font-medium">No categories yet</p><p className="text-stone-300 text-sm mt-1">Tap the button above to create one!</p></div>)}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-bold text-stone-700 mb-5">{editingCategory ? 'Edit Category' : 'New Category'}</h2>
            <div className="space-y-5">
              <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Category Name</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent text-stone-700 font-medium" placeholder="e.g., Groceries" autoFocus /></div>
              <div><label className="text-sm font-semibold text-stone-500 block mb-2">Icon</label>
                <div className="flex flex-wrap gap-2">{EMOJI_OPTIONS.map(emoji => (<button key={emoji} onClick={() => setFormEmoji(emoji)} className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg transition-all ${formEmoji === emoji ? 'bg-stone-200 ring-2 ring-stone-400 scale-110' : 'bg-stone-50 hover:bg-stone-100'}`}>{emoji}</button>))}</div>
              </div>
              <div><label className="text-sm font-semibold text-stone-500 block mb-2">Color</label>
                <div className="flex flex-wrap gap-2.5">{COLOR_OPTIONS.map(color => (<button key={color} onClick={() => setFormColor(color)} className={`w-9 h-9 rounded-full ${CATEGORY_COLORS[color].bg} transition-all ${formColor === color ? 'ring-2 ring-offset-2 ring-stone-400 scale-110' : 'hover:scale-105'}`} />))}</div>
              </div>
              <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Monthly Budget</label>
                <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">₱</span><input type="number" value={formBudget} onChange={e => setFormBudget(e.target.value)} className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent text-stone-700 font-medium" placeholder="0.00" /></div>
              </div>
              <button onClick={saveCategory} className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-xl py-3.5 font-bold active:scale-[0.98] transition-all">{editingCategory ? 'Save Changes' : 'Add Category'}</button>
              <button onClick={() => setShowModal(false)} className="w-full text-stone-400 rounded-xl py-2 font-medium text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
