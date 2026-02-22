import { useState, useCallback, useMemo } from 'react';
import { useLocalStorage } from './hooks/useLocalStorage';
import { type AppData, type Category, type Bill, type Transaction, type DigitalWallet, DEFAULT_CATEGORIES } from './types';
import { Dashboard } from './components/Dashboard';
import { BudgetPage } from './components/BudgetPage';
import { BillsPage } from './components/BillsPage';
import { TransactionsPage } from './components/TransactionsPage';
import { WalletPage } from './components/WalletPage';
import { SetupScreen } from './components/SetupScreen';
import { Walkthrough } from './components/Walkthrough';

const DEFAULT_DATA: AppData = {
  monthlyIncome: 0,
  categories: DEFAULT_CATEGORIES,
  bills: [],
  transactions: [],
  wallets: [],
  isSetup: false,
};

type Page = 'dashboard' | 'budget' | 'bills' | 'wallet' | 'transactions';

const NAV_ITEMS: { id: Page; label: string; emoji: string; activeEmoji: string }[] = [
  { id: 'dashboard', emoji: '🏠', activeEmoji: '🏠', label: 'Home' },
  { id: 'budget', emoji: '📊', activeEmoji: '📊', label: 'Budget' },
  { id: 'bills', emoji: '📋', activeEmoji: '📋', label: 'Bills' },
  { id: 'wallet', emoji: '💳', activeEmoji: '💳', label: 'Wallet' },
  { id: 'transactions', emoji: '📝', activeEmoji: '📝', label: 'Activity' },
];

export function App() {
  const [rawData, setData] = useLocalStorage<AppData>('budgetflow-data', DEFAULT_DATA);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const data = useMemo<AppData>(() => ({
    ...DEFAULT_DATA,
    ...rawData,
    wallets: rawData.wallets || [],
  }), [rawData]);

  const setCategories = useCallback(
    (updater: Category[] | ((prev: Category[]) => Category[])) => {
      setData(prev => ({
        ...prev,
        categories: typeof updater === 'function' ? updater(prev.categories) : updater,
      }));
    },
    [setData]
  );

  const setBills = useCallback(
    (updater: Bill[] | ((prev: Bill[]) => Bill[])) => {
      setData(prev => ({
        ...prev,
        bills: typeof updater === 'function' ? updater(prev.bills) : updater,
      }));
    },
    [setData]
  );

  const setTransactions = useCallback(
    (updater: Transaction[] | ((prev: Transaction[]) => Transaction[])) => {
      setData(prev => ({
        ...prev,
        transactions: typeof updater === 'function' ? updater(prev.transactions) : updater,
      }));
    },
    [setData]
  );

  const setWallets = useCallback(
    (updater: DigitalWallet[] | ((prev: DigitalWallet[]) => DigitalWallet[])) => {
      setData(prev => ({
        ...prev,
        wallets: typeof updater === 'function' ? updater(prev.wallets || []) : updater,
      }));
    },
    [setData]
  );

  const setIncome = useCallback(
    (income: number) => {
      setData(prev => ({ ...prev, monthlyIncome: income }));
    },
    [setData]
  );

  const handleSetupComplete = useCallback(
    (income: number) => {
      setData(prev => ({ ...prev, monthlyIncome: income, isSetup: true }));
      const hasSeenWalkthrough = localStorage.getItem('budgetflow-walkthrough-seen');
      if (!hasSeenWalkthrough) {
        setTimeout(() => setShowWalkthrough(true), 400);
      }
    },
    [setData]
  );

  const handleWalkthroughComplete = useCallback(() => {
    setShowWalkthrough(false);
    localStorage.setItem('budgetflow-walkthrough-seen', 'true');
  }, []);

  const handleShowWalkthrough = useCallback(() => {
    setShowWalkthrough(true);
  }, []);

  const handleImportData = useCallback(
    (imported: AppData) => {
      setData({ ...DEFAULT_DATA, ...imported, isSetup: true, wallets: imported.wallets || [] });
    },
    [setData]
  );

  if (!data.isSetup) {
    return <SetupScreen onComplete={handleSetupComplete} />;
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-lg mx-auto relative">
        <main className="px-4 pt-4 pb-24">
          {currentPage === 'dashboard' && (
            <Dashboard
              income={data.monthlyIncome}
              setIncome={setIncome}
              categories={data.categories}
              bills={data.bills}
              transactions={data.transactions}
              wallets={data.wallets}
              onNavigate={page => setCurrentPage(page as Page)}
              allData={data}
              onImportData={handleImportData}
              onShowWalkthrough={handleShowWalkthrough}
            />
          )}
          {currentPage === 'budget' && (
            <BudgetPage
              categories={data.categories}
              setCategories={setCategories}
              transactions={data.transactions}
              income={data.monthlyIncome}
            />
          )}
          {currentPage === 'bills' && (
            <BillsPage
              bills={data.bills}
              setBills={setBills}
              categories={data.categories}
            />
          )}
          {currentPage === 'wallet' && (
            <WalletPage
              wallets={data.wallets}
              setWallets={setWallets}
            />
          )}
          {currentPage === 'transactions' && (
            <TransactionsPage
              transactions={data.transactions}
              setTransactions={setTransactions}
              categories={data.categories}
            />
          )}
        </main>
      </div>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-xl border-t border-stone-200/60">
        <div className="max-w-lg mx-auto flex justify-around py-1.5 px-1 safe-bottom">
          {NAV_ITEMS.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentPage(item.id)}
                className={`flex flex-col items-center gap-0.5 py-1.5 px-2.5 rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'text-stone-700 bg-stone-100'
                    : 'text-stone-400 hover:text-stone-600'
                }`}
              >
                <span
                  className={`text-lg transition-transform duration-200 ${
                    isActive ? 'scale-110' : ''
                  }`}
                >
                  {isActive ? item.activeEmoji : item.emoji}
                </span>
                <span className={`text-[9px] font-semibold ${isActive ? 'text-stone-700' : ''}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Walkthrough Overlay */}
      {showWalkthrough && (
        <Walkthrough onComplete={handleWalkthroughComplete} />
      )}
    </div>
  );
}
