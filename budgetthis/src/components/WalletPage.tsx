import { useState, useMemo } from 'react';
import { type DigitalWallet, type CategoryColor, CATEGORY_COLORS, WALLET_PRESETS, COLOR_OPTIONS, formatCurrency, formatRelativeDate } from '../types';

interface WalletPageProps {
  wallets: DigitalWallet[];
  setWallets: (updater: DigitalWallet[] | ((prev: DigitalWallet[]) => DigitalWallet[])) => void;
}

export function WalletPage({ wallets, setWallets }: WalletPageProps) {
  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState<DigitalWallet | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmoji, setFormEmoji] = useState('💵');
  const [formBalance, setFormBalance] = useState('');
  const [formColor, setFormColor] = useState<CategoryColor>('emerald');
  const [showPresets, setShowPresets] = useState(true);

  const totalCOH = useMemo(() => wallets.reduce((sum, w) => sum + w.balance, 0), [wallets]);
  const outdatedWallets = useMemo(() => { const t = new Date().toISOString().split('T')[0]; return wallets.filter(w => !w.lastUpdated.startsWith(t)); }, [wallets]);

  const openAddModal = () => { setEditingWallet(null); setFormName(''); setFormEmoji('💵'); setFormBalance(''); setFormColor('emerald'); setShowPresets(true); setShowModal(true); };
  const openEditModal = (wallet: DigitalWallet) => { setEditingWallet(wallet); setFormName(wallet.name); setFormEmoji(wallet.emoji); setFormBalance(wallet.balance.toString()); setFormColor(wallet.color); setShowPresets(false); setShowModal(true); };
  const selectPreset = (preset: { name: string; emoji: string; color: CategoryColor }) => { setFormName(preset.name); setFormEmoji(preset.emoji); setFormColor(preset.color); setShowPresets(false); };

  const saveWallet = () => {
    if (!formName.trim()) return;
    const now = new Date().toISOString();
    if (editingWallet) { setWallets(prev => prev.map(w => w.id === editingWallet.id ? { ...w, name: formName, emoji: formEmoji, balance: parseFloat(formBalance) || 0, color: formColor, lastUpdated: now } : w)); }
    else { setWallets(prev => [...prev, { id: `wallet-${Date.now()}`, name: formName, emoji: formEmoji, balance: parseFloat(formBalance) || 0, lastUpdated: now, color: formColor }]); }
    setShowModal(false);
  };

  const quickUpdateBalance = (id: string, newBalance: number) => { setWallets(prev => prev.map(w => w.id === id ? { ...w, balance: newBalance, lastUpdated: new Date().toISOString() } : w)); };
  const deleteWallet = (id: string) => { if (window.confirm('Remove this wallet?')) setWallets(prev => prev.filter(w => w.id !== id)); };

  const walletGradients: Record<CategoryColor, string> = {
    indigo: 'from-indigo-400/50 to-indigo-600/50',
    emerald: 'from-emerald-400/50 to-emerald-600/50',
    rose: 'from-rose-400/50 to-rose-600/50',
    amber: 'from-amber-400/50 to-amber-600/50',
    sky: 'from-sky-400/50 to-sky-600/50',
    violet: 'from-violet-400/50 to-violet-600/50',
    orange: 'from-orange-400/50 to-orange-600/50',
    teal: 'from-teal-400/50 to-teal-600/50',
    pink: 'from-pink-400/50 to-pink-600/50',
    cyan: 'from-cyan-400/50 to-cyan-600/50',
  };

  return (
    <div className="pb-4">
      <div className="bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 rounded-b-3xl px-5 pt-12 pb-6 -mx-4 -mt-4 text-white mb-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/[0.03] rounded-full -translate-y-1/2 translate-x-1/2" />
        <h1 className="text-2xl font-bold relative z-10">💳 Digital Wallets</h1>
        <p className="text-stone-400 text-sm mt-1 relative z-10">Track your Cash on Hand</p>
        <div className="mt-5 bg-white/[0.06] backdrop-blur-sm rounded-2xl p-5 relative z-10">
          <p className="text-stone-400 text-xs uppercase tracking-wider font-semibold">Total Cash on Hand</p>
          <p className="text-4xl font-extrabold mt-1">{formatCurrency(totalCOH)}</p>
          <p className="text-stone-400 text-sm mt-1">Across {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {outdatedWallets.length > 0 && (
        <div className="bg-amber-50/40 border border-amber-200/30 rounded-2xl p-4 mb-4 animate-scale-in">
          <div className="flex items-center gap-3"><span className="text-2xl animate-pulse">🔔</span>
            <div><p className="font-bold text-amber-700/70 text-sm">{outdatedWallets.length} wallet{outdatedWallets.length > 1 ? 's' : ''} need updating</p><p className="text-amber-600/50 text-xs mt-0.5">Tap a wallet below to update its balance</p></div>
          </div>
        </div>
      )}

      <button onClick={openAddModal} className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-2xl p-4 font-bold shadow-lg shadow-stone-300/20 active:scale-[0.98] transition-all mb-5 flex items-center justify-center gap-2"><span className="text-xl">+</span><span>Add Wallet</span></button>

      <div className="space-y-3">
        {wallets.map(wallet => {
          const isOutdated = !wallet.lastUpdated.startsWith(new Date().toISOString().split('T')[0]);
          return <WalletCard key={wallet.id} wallet={wallet} gradient={walletGradients[wallet.color]} isOutdated={isOutdated} onEdit={() => openEditModal(wallet)} onDelete={() => deleteWallet(wallet.id)} onQuickUpdate={(bal) => quickUpdateBalance(wallet.id, bal)} />;
        })}
        {wallets.length === 0 && (<div className="text-center py-12"><p className="text-5xl mb-3 animate-float">💳</p><p className="text-stone-500 font-medium">No wallets yet</p><p className="text-stone-400 text-sm mt-1">Add your digital wallets and cash to track your COH!</p></div>)}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 animate-fade-in" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-t-3xl w-full max-w-lg p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-1 bg-stone-200 rounded-full mx-auto mb-5" />
            <h2 className="text-xl font-bold text-stone-700 mb-5">{editingWallet ? 'Update Wallet' : 'Add Wallet'}</h2>
            {!editingWallet && showPresets && (
              <div className="mb-6 animate-fade-in">
                <p className="text-sm font-semibold text-stone-500 mb-3">Quick Add</p>
                <div className="grid grid-cols-2 gap-2">
                  {WALLET_PRESETS.map(preset => { const existing = wallets.find(w => w.name === preset.name); return (
                    <button key={preset.name} onClick={() => selectPreset(preset)} disabled={!!existing} className={`flex items-center gap-2.5 p-3 rounded-xl text-left transition-all ${existing ? 'bg-stone-50 opacity-40 cursor-not-allowed' : 'bg-stone-50 hover:bg-stone-100 hover:ring-2 hover:ring-stone-200 active:scale-[0.97]'}`}>
                      <span className="text-xl">{preset.emoji}</span><span className="text-sm font-medium text-stone-600">{preset.name}</span>{existing && <span className="text-[10px] text-stone-400 ml-auto">Added</span>}
                    </button>); })}
                </div>
                <button onClick={() => setShowPresets(false)} className="w-full mt-3 text-stone-500 text-sm font-semibold py-2">Or add custom wallet →</button>
              </div>
            )}
            {(!showPresets || editingWallet) && (
              <div className="space-y-5 animate-fade-in">
                <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">Wallet Name</label><input type="text" value={formName} onChange={e => setFormName(e.target.value)} className="w-full px-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent font-medium" placeholder="e.g., GCash, Bank" autoFocus /></div>
                <div><label className="text-sm font-semibold text-stone-500 block mb-1.5">{editingWallet ? 'Updated Balance' : 'Current Balance'}</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-semibold">₱</span><input type="number" value={formBalance} onChange={e => setFormBalance(e.target.value)} className="w-full pl-9 pr-4 py-3.5 rounded-xl border border-stone-200 focus:outline-none focus:ring-2 focus:ring-stone-300 focus:border-transparent font-medium text-lg" placeholder="0.00" autoFocus={!!editingWallet} /></div></div>
                {!editingWallet && (<div><label className="text-sm font-semibold text-stone-500 block mb-2">Color</label><div className="flex flex-wrap gap-2.5">{COLOR_OPTIONS.map(color => (<button key={color} onClick={() => setFormColor(color)} className={`w-9 h-9 rounded-full ${CATEGORY_COLORS[color].bg} transition-all ${formColor === color ? 'ring-2 ring-offset-2 ring-stone-400 scale-110' : 'hover:scale-105'}`} />))}</div></div>)}
                <button onClick={saveWallet} className="w-full bg-stone-800 hover:bg-stone-700 text-white rounded-xl py-3.5 font-bold active:scale-[0.98] transition-all">{editingWallet ? 'Update Balance' : 'Add Wallet'}</button>
                {!editingWallet && !showPresets && (<button onClick={() => setShowPresets(true)} className="w-full text-stone-500 rounded-xl py-2 font-medium text-sm">← Back to presets</button>)}
                <button onClick={() => setShowModal(false)} className="w-full text-stone-400 rounded-xl py-2 font-medium text-sm">Cancel</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WalletCard({ wallet, gradient, isOutdated, onEdit, onDelete, onQuickUpdate }: { wallet: DigitalWallet; gradient: string; isOutdated: boolean; onEdit: () => void; onDelete: () => void; onQuickUpdate: (balance: number) => void; }) {
  const [showQuickEdit, setShowQuickEdit] = useState(false);
  const [quickValue, setQuickValue] = useState(wallet.balance.toString());
  const handleQuickSave = () => { onQuickUpdate(parseFloat(quickValue) || 0); setShowQuickEdit(false); };

  return (
    <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-5 text-white relative overflow-hidden shadow-md transition-all ${isOutdated ? 'ring-2 ring-amber-300/40 ring-offset-2' : ''}`}>
      <div className="absolute -right-4 -top-4 w-20 h-20 bg-white/[0.08] rounded-full" />
      <div className="absolute -left-6 -bottom-6 w-16 h-16 bg-white/[0.04] rounded-full" />
      {isOutdated && (<div className="absolute top-2 right-2 bg-amber-300/80 text-amber-900 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Needs update</div>)}
      <div className="flex items-start justify-between relative z-10">
        <div className="flex items-center gap-3"><span className="text-3xl">{wallet.emoji}</span><div><p className="font-bold text-lg">{wallet.name}</p><p className="text-white/50 text-xs">Updated {formatRelativeDate(wallet.lastUpdated)}</p></div></div>
      </div>
      {!showQuickEdit ? (
        <div className="mt-4 flex items-end justify-between relative z-10">
          <p className="text-3xl font-extrabold tracking-tight">{formatCurrency(wallet.balance)}</p>
          <div className="flex gap-1.5">
            <button onClick={() => { setQuickValue(wallet.balance.toString()); setShowQuickEdit(true); }} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors text-sm" title="Quick update">✏️</button>
            <button onClick={onEdit} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors text-sm" title="Edit wallet">⚙️</button>
            <button onClick={onDelete} className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center hover:bg-white/25 transition-colors text-sm" title="Delete">🗑️</button>
          </div>
        </div>
      ) : (
        <div className="mt-3 animate-fade-in relative z-10">
          <div className="flex gap-2">
            <div className="relative flex-1"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/50 font-semibold">₱</span>
              <input type="number" value={quickValue} onChange={e => setQuickValue(e.target.value)} className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-white/15 border border-white/20 text-white font-bold focus:outline-none focus:ring-2 focus:ring-white/30 placeholder-white/30" autoFocus onKeyDown={e => e.key === 'Enter' && handleQuickSave()} />
            </div>
            <button onClick={handleQuickSave} className="px-4 py-2.5 rounded-xl bg-white text-stone-700 font-bold text-sm active:scale-[0.95] transition-transform">Save</button>
            <button onClick={() => setShowQuickEdit(false)} className="px-3 py-2.5 rounded-xl bg-white/15 text-white font-semibold text-sm">✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
