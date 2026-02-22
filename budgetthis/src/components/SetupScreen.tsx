import { useState } from 'react';

interface SetupScreenProps {
  onComplete: (income: number) => void;
}

export function SetupScreen({ onComplete }: SetupScreenProps) {
  const [income, setIncome] = useState('');
  const [step, setStep] = useState(0);

  const handleContinue = () => {
    const parsed = parseFloat(income);
    if (parsed > 0) {
      onComplete(parsed);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-stone-800 via-stone-900 to-stone-800 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {step === 0 && (
          <div className="text-center text-white animate-scale-in">
            <div className="text-7xl mb-6 animate-float">💰</div>
            <h1 className="text-4xl font-extrabold mb-3 tracking-tight">BudgetFlow</h1>
            <p className="text-stone-300 text-lg mb-2">Smart. Simple. Daily.</p>
            <p className="text-stone-400 text-sm mb-10">Take control of your pesos every day.<br />Know exactly what you can spend.</p>

            <div className="space-y-3 mb-10">
              <div className="flex items-center gap-3 bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 text-left">
                <span className="text-2xl">📊</span>
                <div>
                  <p className="font-semibold text-sm">Daily Budget Tracker</p>
                  <p className="text-stone-400 text-xs">Know exactly how much you can spend each day</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 text-left">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-semibold text-sm">Zero-Spend Day Alerts</p>
                  <p className="text-stone-400 text-xs">Stay on track with smart spending reminders</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 text-left">
                <span className="text-2xl">💳</span>
                <div>
                  <p className="font-semibold text-sm">Digital Wallet COH</p>
                  <p className="text-stone-400 text-xs">Track your cash across GCash, PayMaya & more</p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-white/[0.06] backdrop-blur-sm rounded-2xl p-4 text-left">
                <span className="text-2xl">💾</span>
                <div>
                  <p className="font-semibold text-sm">Backup & Restore</p>
                  <p className="text-stone-400 text-xs">Save locally or export to Google Drive</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep(1)}
              className="w-full bg-stone-700 hover:bg-stone-600 text-white rounded-2xl py-4 font-bold text-lg shadow-xl shadow-stone-900/30 active:scale-[0.97] transition-all animate-pulse-glow"
            >
              Get Started 🚀
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="text-center text-white animate-scale-in">
            <div className="text-6xl mb-4 animate-float">💵</div>
            <h2 className="text-2xl font-bold mb-2">What&apos;s your monthly income?</h2>
            <p className="text-stone-400 mb-8">This helps us calculate your daily budget. You can change this anytime.</p>

            <div className="relative mb-6">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-2xl text-stone-400 font-bold">₱</span>
              <input
                type="number"
                value={income}
                onChange={e => setIncome(e.target.value)}
                className="w-full pl-12 pr-4 py-5 rounded-2xl text-3xl font-bold text-center text-stone-800 focus:outline-none focus:ring-4 focus:ring-stone-400/20 shadow-xl"
                placeholder="25,000"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-4 gap-2 mb-6">
              {[15000, 25000, 35000, 50000].map(preset => (
                <button
                  key={preset}
                  onClick={() => setIncome(preset.toString())}
                  className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                    income === preset.toString()
                      ? 'bg-stone-600 text-white shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20'
                  }`}
                >
                  ₱{(preset / 1000).toFixed(0)}k
                </button>
              ))}
            </div>

            {income && parseFloat(income) > 0 && (
              <div className="bg-white/[0.06] backdrop-blur-sm rounded-xl p-3 mb-6 animate-fade-in">
                <p className="text-stone-400 text-xs">Your daily budget will be approximately</p>
                <p className="text-2xl font-extrabold mt-1">
                  ₱{(parseFloat(income) / 30).toFixed(2)}<span className="text-base font-normal opacity-60">/day</span>
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="px-6 py-4 rounded-2xl font-semibold text-white/50 hover:text-white transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleContinue}
                className={`flex-1 rounded-2xl py-4 font-bold text-lg shadow-xl active:scale-[0.97] transition-all ${
                  income && parseFloat(income) > 0
                    ? 'bg-stone-700 hover:bg-stone-600 text-white shadow-stone-900/30'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
                disabled={!income || parseFloat(income) <= 0}
              >
                Let&apos;s Go! ✨
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
