import { useState } from 'react';

interface WalkthroughProps {
  onComplete: () => void;
}

const STEPS = [
  {
    emoji: '👋',
    title: 'Welcome to BudgetFlow',
    subtitle: 'Your friendly peso tracker',
    points: [
      { icon: '💡', text: 'Know exactly how much you can spend each day' },
      { icon: '📊', text: 'Track every peso across all your wallets' },
      { icon: '🎯', text: 'Stay on budget without the stress' },
    ],
  },
  {
    emoji: '📱',
    title: 'Your Daily Dashboard',
    subtitle: 'Everything at a glance',
    points: [
      { icon: '🔵', text: 'See your daily budget & remaining balance at the top' },
      { icon: '📅', text: '7-day spending heatmap shows your pattern' },
      { icon: '⚡', text: 'Smart alerts warn you when overspending' },
    ],
  },
  {
    emoji: '💰',
    title: 'Set Your Budget',
    subtitle: 'Organize spending by category',
    points: [
      { icon: '📂', text: 'Create categories like Food, Transport, Bills' },
      { icon: '🎨', text: 'Pick emojis & colors to make them yours' },
      { icon: '📊', text: 'Track spending vs. budget in real-time' },
    ],
  },
  {
    emoji: '📋',
    title: 'Plan Your Bills',
    subtitle: 'Never miss a payment',
    points: [
      { icon: '📅', text: 'Add bills with due dates — one-time or recurring' },
      { icon: '🔄', text: 'Supports monthly, quarterly & yearly schedules' },
      { icon: '💡', text: 'Auto-calculates how much to set aside each month' },
    ],
  },
  {
    emoji: '💳',
    title: 'Track Your Wallets',
    subtitle: 'Cash on Hand across all accounts',
    points: [
      { icon: '📱', text: 'Add GCash, PayMaya, bank, cash — any wallet' },
      { icon: '🔔', text: 'Daily reminders to update your balances' },
      { icon: '💵', text: 'See total Cash on Hand in one place' },
    ],
  },
  {
    emoji: '🛡️',
    title: 'Smart Alerts',
    subtitle: 'Stay on track automatically',
    points: [
      { icon: '🚨', text: 'Get warned when you spend over your daily or monthly limit' },
      { icon: '📅', text: 'Zero-spend day calculator tells you how many rest days you need' },
      { icon: '🏆', text: 'Spending streaks motivate you to stay consistent' },
    ],
  },
  {
    emoji: '💾',
    title: 'Backup & Restore',
    subtitle: 'Your data is safe',
    points: [
      { icon: '📦', text: 'Export your data as a file anytime' },
      { icon: '☁️', text: 'Upload to Google Drive or iCloud for cloud backup' },
      { icon: '📂', text: 'Import & restore on any device instantly' },
    ],
  },
  {
    emoji: '🚀',
    title: "You're All Set!",
    subtitle: 'Here\'s how to get started',
    points: [
      { icon: '1️⃣', text: 'Set your monthly income (already done!)' },
      { icon: '2️⃣', text: 'Create budget categories on the Budget tab' },
      { icon: '3️⃣', text: 'Add your first daily expense on Activity tab' },
    ],
  },
];

export function Walkthrough({ onComplete }: WalkthroughProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 z-[100] bg-stone-900/97 backdrop-blur-md flex items-center justify-center p-5 animate-fade-in">
      <div className="w-full max-w-sm">
        {/* Skip */}
        {!isLast && (
          <button
            onClick={onComplete}
            className="absolute top-5 right-5 text-stone-500 hover:text-stone-300 text-sm font-medium transition-colors z-10"
          >
            Skip →
          </button>
        )}

        {/* Step Counter */}
        <p className="text-stone-600 text-xs font-medium text-center mb-6">
          {currentStep + 1} of {STEPS.length}
        </p>

        {/* Content */}
        <div key={currentStep} className="text-center animate-scale-in">
          <div className="text-6xl mb-5 animate-float">{step.emoji}</div>
          <h2 className="text-2xl font-bold text-white mb-1">{step.title}</h2>
          <p className="text-stone-400 text-sm mb-7">{step.subtitle}</p>

          <div className="space-y-2.5 mb-10 text-left">
            {step.points.map((point, i) => (
              <div
                key={i}
                className="bg-white/[0.06] backdrop-blur-sm rounded-2xl px-4 py-3.5 flex items-start gap-3"
              >
                <span className="text-lg flex-shrink-0 mt-0.5">{point.icon}</span>
                <p className="text-stone-300 text-sm leading-relaxed">{point.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-7 bg-stone-400'
                  : i < currentStep
                  ? 'w-1.5 bg-stone-600'
                  : 'w-1.5 bg-stone-700'
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {!isFirst && (
            <button
              onClick={() => setCurrentStep(prev => prev - 1)}
              className="px-5 py-3.5 rounded-2xl font-semibold text-stone-500 hover:text-stone-300 transition-colors"
            >
              Back
            </button>
          )}
          <button
            onClick={() => {
              if (isLast) {
                onComplete();
              } else {
                setCurrentStep(prev => prev + 1);
              }
            }}
            className={`flex-1 rounded-2xl py-3.5 font-bold text-base active:scale-[0.97] transition-all ${
              isLast
                ? 'bg-stone-700 hover:bg-stone-600 text-white shadow-lg shadow-stone-900/25'
                : 'bg-white/90 text-stone-800'
            }`}
          >
            {isLast ? "Let's Go! 🎉" : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}
