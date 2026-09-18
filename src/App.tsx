import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  Lock,
  Download,
  FolderArchive,
  Bell,
  Code,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  SlidersHorizontal,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  X,
  Cloud,
  CloudCheck,
  RefreshCw,
  Layers,
  Tag,
  Users,
  ListFilter
} from 'lucide-react';
import { Loan, Repayment, AdditionalCredit, TransactionType, LoanStatus, DashboardSummary, TransactionMedium } from './types';
import { INITIAL_LOANS } from './data/initialData';
import { calculateLoan } from './utils/interestCalculator';
import { getCategoryTheme } from './utils/categoryUtils';
import { PhoneFrame, DeviceFrameMode } from './components/PhoneFrame';
import { DashboardCards } from './components/DashboardCards';
import { TransactionCard } from './components/TransactionCard';
import { CategoryGroupView } from './components/CategoryGroupView';
import { PersonGroupView } from './components/PersonGroupView';
import { TabletDetailPane } from './components/TabletDetailPane';
import { AddTransactionModal } from './components/AddTransactionModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { RepaymentModal } from './components/RepaymentModal';
import { AdditionalCreditModal } from './components/AdditionalCreditModal';
import { PinLockModal } from './components/PinLockModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { AndroidCodeViewerModal } from './components/AndroidCodeViewerModal';
import { GoogleSyncModal } from './components/GoogleSyncModal';
import { downloadAndroidProjectZip } from './utils/androidProjectFiles';
import { auth, db, onAuthStateChanged, User, collection, onSnapshot } from './firebase';
import {
  loginWithGoogle,
  logoutGoogle,
  saveLoanToCloud,
  deleteLoanFromCloud,
  uploadLoansBatch,
  fetchCloudLoans,
  convertDocToLoan,
  SyncStatus,
} from './utils/googleSyncService';

const STORAGE_KEY_LOANS = 'easy_money_ledger_loans_v1';
const STORAGE_KEY_PIN = 'easy_money_ledger_pin_v1';

export default function App() {
  // Local persistence for offline ledger
  const [loans, setLoans] = useState<Loan[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_LOANS);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved loans', e);
      }
    }
    return INITIAL_LOANS;
  });

  const [savedPin, setSavedPin] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEY_PIN) || null;
  });

  const [isLocked, setIsLocked] = useState<boolean>(() => {
    return !!localStorage.getItem(STORAGE_KEY_PIN);
  });

  // UI States & Device Orientation
  const [deviceMode, setDeviceMode] = useState<DeviceFrameMode>('tablet-portrait');
  const [currentTime, setCurrentTime] = useState('09:41');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<TransactionType | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<LoanStatus | null>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | null>(null);
  const [viewGroupingMode, setViewGroupingMode] = useState<'flat' | 'category' | 'person'>('flat');
  const isGroupByCategory = viewGroupingMode === 'category';

  // Responsive Viewport detection for real tablets & browsers
  const [windowWidth, setWindowWidth] = useState<number>(() =>
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );
  const [isLandscapeWindow, setIsLandscapeWindow] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth > window.innerHeight : true
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      setIsLandscapeWindow(window.innerWidth > window.innerHeight);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Determine if Tablet Landscape Dual-Pane layout is active
  const isLandscapeLayout = useMemo(() => {
    if (deviceMode === 'tablet-landscape') return true;
    if (deviceMode === 'phone' || deviceMode === 'tablet-portrait') return false;
    // In fluid responsive mode: activate when width is tablet-sized (>= 980px) and landscape
    return windowWidth >= 980 && isLandscapeWindow;
  }, [deviceMode, windowWidth, isLandscapeWindow]);

  const handleRotateDevice = () => {
    setDeviceMode((prev) => {
      if (prev === 'tablet-portrait') return 'tablet-landscape';
      if (prev === 'tablet-landscape') return 'tablet-portrait';
      if (prev === 'phone') return 'tablet-landscape';
      return 'tablet-portrait';
    });
  };

  // Modals & Active Panes
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [repaymentModalLoanId, setRepaymentModalLoanId] = useState<string | null>(null);
  const [editingRepayment, setEditingRepayment] = useState<Repayment | null>(null);
  const [additionalCreditModalLoanId, setAdditionalCreditModalLoanId] = useState<string | null>(null);
  const [editingAdditionalCredit, setEditingAdditionalCredit] = useState<AdditionalCredit | null>(null);
  const [initialPersonForAdd, setInitialPersonForAdd] = useState<{ name: string; mobile?: string } | null>(null);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isSettingUpPin, setIsSettingUpPin] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);
  const [isGoogleSyncModalOpen, setIsGoogleSyncModalOpen] = useState(false);

  // Google Multi-Device Cloud Sync State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('LOCAL_ONLY');
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [syncErrorMessage, setSyncErrorMessage] = useState<string | null>(null);
  const isInitialSyncAttempted = useRef<boolean>(false);

  // Notification Banner
  const [showNotificationBanner, setShowNotificationBanner] = useState(true);

  // Clock for Android status bar
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Listen for Google Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        setSyncStatus('SYNCING');
      } else {
        setSyncStatus('LOCAL_ONLY');
        setSyncErrorMessage(null);
        isInitialSyncAttempted.current = false;
      }
    });
    return () => unsubscribe();
  }, []);

  // Real-time Firestore Cloud Multi-Device Sync
  useEffect(() => {
    if (!currentUser) return;

    setSyncStatus('SYNCING');
    const loansColRef = collection(db, 'users', currentUser.uid, 'loans');

    const unsubscribe = onSnapshot(
      loansColRef,
      (snapshot) => {
        const cloudLoans: Loan[] = [];
        snapshot.forEach((docSnap) => {
          cloudLoans.push(convertDocToLoan(docSnap.data()));
        });

        cloudLoans.sort((a, b) => b.createdAt - a.createdAt);

        if (cloudLoans.length > 0) {
          setLoans(cloudLoans);
          setSyncStatus('SYNCED');
          setLastSyncedAt(new Date());
          setSyncErrorMessage(null);
        } else if (snapshot.empty && !isInitialSyncAttempted.current) {
          // If cloud is empty on first sign-in, upload existing offline loans automatically
          isInitialSyncAttempted.current = true;
          setLoans((currentLoans) => {
            if (currentLoans.length > 0) {
              uploadLoansBatch(currentUser.uid, currentLoans)
                .then(() => {
                  setSyncStatus('SYNCED');
                  setLastSyncedAt(new Date());
                })
                .catch((err) => {
                  console.error('Initial batch sync error:', err);
                  setSyncStatus('ERROR');
                  setSyncErrorMessage(err.message);
                });
            } else {
              setSyncStatus('SYNCED');
              setLastSyncedAt(new Date());
            }
            return currentLoans;
          });
        } else {
          setLoans(cloudLoans);
          setSyncStatus('SYNCED');
          setLastSyncedAt(new Date());
        }
      },
      (error) => {
        console.error('Firestore real-time sync error:', error);
        setSyncStatus('ERROR');
        setSyncErrorMessage(error.message);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Save to localStorage whenever loans change (offline local cache)
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
  }, [loans]);

  // Save PIN
  const handleSetPin = (pin: string | null) => {
    if (pin) {
      localStorage.setItem(STORAGE_KEY_PIN, pin);
      setSavedPin(pin);
      setIsLocked(false);
    } else {
      localStorage.removeItem(STORAGE_KEY_PIN);
      setSavedPin(null);
      setIsLocked(false);
    }
    setIsPinModalOpen(false);
  };

  // Summary Metrics Computation
  const summary: DashboardSummary = useMemo(() => {
    let totalMoneyGave = 0;
    let totalMoneyTook = 0;
    let totalInterest = 0;
    let totalReceivable = 0;
    let totalPayable = 0;

    for (const loan of loans) {
      const calc = calculateLoan(loan);
      totalInterest += calc.interestAmount;
      if (loan.transactionType === 'GIVEN') {
        totalMoneyGave += calc.principal;
        totalReceivable += calc.remainingBalance;
      } else {
        totalMoneyTook += calc.principal;
        totalPayable += calc.remainingBalance;
      }
    }

    return {
      totalMoneyGave,
      totalMoneyTook,
      totalInterest,
      totalReceivable,
      totalPayable,
    };
  }, [loans]);

  // Notifications calculation: due within 48 hours or overdue
  const notificationAlerts = useMemo(() => {
    const now = Date.now();
    const twoDaysMillis = 2 * 24 * 60 * 60 * 1000;
    const overdue: Loan[] = [];
    const upcoming: Loan[] = [];

    for (const loan of loans) {
      const calc = calculateLoan(loan);
      if (calc.status === 'PAID') continue;
      if (loan.hasIndefiniteDueDate || !loan.dueDate || loan.dueDate === 'INDEFINITE') continue;
      const dueTime = new Date(loan.dueDate + 'T23:59:59').getTime();
      if (isNaN(dueTime)) continue;
      const diff = dueTime - now;

      if (diff < 0) {
        overdue.push(loan);
      } else if (diff <= twoDaysMillis) {
        upcoming.push(loan);
      }
    }

    return { overdue, upcoming };
  }, [loans]);

  // Available categories with count of loans
  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>();
    loans.forEach((l) => {
      const cat = l.category?.trim() || 'Personal';
      counts.set(cat, (counts.get(cat) || 0) + 1);
    });

    // Preset standard categories
    ['Personal', 'Business', 'Medical', 'Education', 'Home'].forEach((c) => {
      if (!counts.has(c)) counts.set(c, 0);
    });

    return Array.from(counts.entries()).map(([name, count]) => ({
      name,
      count,
    }));
  }, [loans]);

  // Filtered Loans
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      const calc = calculateLoan(loan);

      // Search Query
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        loan.personName.toLowerCase().includes(q) ||
        (loan.mobileNumber && loan.mobileNumber.toLowerCase().includes(q)) ||
        (loan.notes && loan.notes.toLowerCase().includes(q)) ||
        (loan.category && loan.category.toLowerCase().includes(q));

      // Type filter
      const matchesType = !selectedTypeFilter || loan.transactionType === selectedTypeFilter;

      // Status filter
      const matchesStatus = !selectedStatusFilter || calc.status === selectedStatusFilter;

      // Category filter
      const matchesCategory =
        !selectedCategoryFilter ||
        (loan.category?.trim().toLowerCase() || 'personal') === selectedCategoryFilter.trim().toLowerCase();

      return matchesSearch && matchesType && matchesStatus && matchesCategory;
    });
  }, [loans, searchQuery, selectedTypeFilter, selectedStatusFilter, selectedCategoryFilter]);

  // Loan CRUD with Real-Time Google Multi-Device Sync
  const handleAddLoan = async (newLoanData: Omit<Loan, 'id' | 'createdAt' | 'repayments'>) => {
    const newLoan: Loan = {
      ...newLoanData,
      id: 'loan-' + Date.now(),
      createdAt: Date.now(),
      repayments: [],
    };
    setLoans((prev) => [newLoan, ...prev]);

    if (currentUser) {
      setSyncStatus('SYNCING');
      try {
        await saveLoanToCloud(currentUser.uid, newLoan);
        setSyncStatus('SYNCED');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error syncing new loan to cloud:', err);
        setSyncStatus('ERROR');
        setSyncErrorMessage(err.message);
      }
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== loanId));
    if (selectedLoanId === loanId) {
      setSelectedLoanId(null);
    }
    if (currentUser) {
      setSyncStatus('SYNCING');
      try {
        await deleteLoanFromCloud(currentUser.uid, loanId);
        setSyncStatus('SYNCED');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error deleting loan from cloud:', err);
      }
    }
  };

  const handleAddRepayment = async (
    loanId: string,
    amount: number,
    paymentDate: string,
    paymentMedium?: TransactionMedium,
    transactionRef?: string,
    notes?: string
  ) => {
    let updatedLoan: Loan | null = null;
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        const newRepayment: Repayment = {
          id: 'rep-' + Date.now(),
          loanId,
          amount,
          paymentDate,
          paymentMedium: paymentMedium || 'UPI',
          transactionRef: transactionRef || undefined,
          notes,
          createdAt: Date.now(),
        };
        updatedLoan = {
          ...l,
          repayments: [...(l.repayments || []), newRepayment],
        };
        return updatedLoan;
      })
    );

    if (currentUser && updatedLoan) {
      setSyncStatus('SYNCING');
      try {
        await saveLoanToCloud(currentUser.uid, updatedLoan);
        setSyncStatus('SYNCED');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error saving repayment to cloud:', err);
      }
    }
  };

  const handleDeleteRepayment = async (loanId: string, repaymentId: string) => {
    let updatedLoan: Loan | null = null;
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        updatedLoan = {
          ...l,
          repayments: (l.repayments || []).filter((r) => r.id !== repaymentId),
        };
        return updatedLoan;
      })
    );

    if (currentUser && updatedLoan) {
      setSyncStatus('SYNCING');
      try {
        await saveLoanToCloud(currentUser.uid, updatedLoan);
        setSyncStatus('SYNCED');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error syncing repayment deletion:', err);
      }
    }
  };

  const handleEditRepayment = async (
    loanId: string,
    repaymentId: string,
    amount: number,
    paymentDate: string,
    paymentMedium?: TransactionMedium,
    transactionRef?: string,
    notes?: string
  ) => {
    let updatedLoan: Loan | null = null;
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        const updatedRepayments = (l.repayments || []).map((r) =>
          r.id === repaymentId
            ? {
                ...r,
                amount,
                paymentDate,
                paymentMedium: paymentMedium || r.paymentMedium || 'UPI',
                transactionRef: transactionRef !== undefined ? transactionRef : r.transactionRef,
                notes,
              }
            : r
        );
        updatedLoan = {
          ...l,
          repayments: updatedRepayments,
        };
        return updatedLoan;
      })
    );

    if (currentUser && updatedLoan) {
      setSyncStatus('SYNCING');
      try {
        await saveLoanToCloud(currentUser.uid, updatedLoan);
        setSyncStatus('SYNCED');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error updating repayment in cloud:', err);
      }
    }
  };

  const handleAddAdditionalCredit = async (
    loanId: string,
    amount: number,
    date: string,
    paymentMedium?: TransactionMedium,
    transactionRef?: string,
    notes?: string
  ) => {
    let updatedLoan: Loan | null = null;
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        const newCredit: AdditionalCredit = {
          id: 'credit-' + Date.now(),
          loanId,
          amount,
          date,
          paymentMedium: paymentMedium || 'CASH',
          transactionRef: transactionRef || undefined,
          notes,
          createdAt: Date.now(),
        };
        updatedLoan = {
          ...l,
          additionalCredits: [...(l.additionalCredits || []), newCredit],
        };
        return updatedLoan;
      })
    );

    if (currentUser && updatedLoan) {
      setSyncStatus('SYNCING');
      try {
        await saveLoanToCloud(currentUser.uid, updatedLoan);
        setSyncStatus('SYNCED');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error saving additional credit to cloud:', err);
      }
    }
  };

  const handleEditAdditionalCredit = async (
    loanId: string,
    creditId: string,
    amount: number,
    date: string,
    paymentMedium?: TransactionMedium,
    transactionRef?: string,
    notes?: string
  ) => {
    let updatedLoan: Loan | null = null;
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        const updatedCredits = (l.additionalCredits || []).map((c) =>
          c.id === creditId
            ? {
                ...c,
                amount,
                date,
                paymentMedium: paymentMedium || c.paymentMedium || 'CASH',
                transactionRef: transactionRef !== undefined ? transactionRef : c.transactionRef,
                notes,
              }
            : c
        );
        updatedLoan = {
          ...l,
          additionalCredits: updatedCredits,
        };
        return updatedLoan;
      })
    );

    if (currentUser && updatedLoan) {
      setSyncStatus('SYNCING');
      try {
        await saveLoanToCloud(currentUser.uid, updatedLoan);
        setSyncStatus('SYNCED');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error updating credit in cloud:', err);
      }
    }
  };

  const handleDeleteAdditionalCredit = async (loanId: string, creditId: string) => {
    let updatedLoan: Loan | null = null;
    setLoans((prev) =>
      prev.map((l) => {
        if (l.id !== loanId) return l;
        updatedLoan = {
          ...l,
          additionalCredits: (l.additionalCredits || []).filter((c) => c.id !== creditId),
        };
        return updatedLoan;
      })
    );

    if (currentUser && updatedLoan) {
      setSyncStatus('SYNCING');
      try {
        await saveLoanToCloud(currentUser.uid, updatedLoan);
        setSyncStatus('SYNCED');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error deleting credit in cloud:', err);
      }
    }
  };

  const handleRestoreData = async (restoredLoans: Loan[]) => {
    setLoans(restoredLoans);
    if (currentUser) {
      setSyncStatus('SYNCING');
      try {
        await uploadLoansBatch(currentUser.uid, restoredLoans);
        setSyncStatus('SYNCED');
        setLastSyncedAt(new Date());
      } catch (err: any) {
        console.error('Error syncing restored data to cloud:', err);
      }
    }
  };

  // Google Sync Handlers
  const handleGoogleSignIn = async () => {
    setSyncErrorMessage(null);
    try {
      const user = await loginWithGoogle();
      setCurrentUser(user);
    } catch (err: any) {
      console.error('Google Sign In Error:', err);
      setSyncErrorMessage(err.message || 'Failed to sign in with Google.');
      throw err;
    }
  };

  const handleGoogleSignOut = async () => {
    await logoutGoogle();
    setCurrentUser(null);
    setSyncStatus('LOCAL_ONLY');
    setSyncErrorMessage(null);
  };

  const handleManualSyncNow = async () => {
    if (!currentUser) return;
    setSyncStatus('SYNCING');
    try {
      const freshLoans = await fetchCloudLoans(currentUser.uid);
      if (freshLoans.length > 0) {
        setLoans(freshLoans);
      }
      setSyncStatus('SYNCED');
      setLastSyncedAt(new Date());
    } catch (err: any) {
      setSyncStatus('ERROR');
      setSyncErrorMessage(err.message);
      throw err;
    }
  };

  const handleUploadLocalToCloud = async () => {
    if (!currentUser) return;
    setSyncStatus('SYNCING');
    try {
      await uploadLoansBatch(currentUser.uid, loans);
      setSyncStatus('SYNCED');
      setLastSyncedAt(new Date());
    } catch (err: any) {
      setSyncStatus('ERROR');
      setSyncErrorMessage(err.message);
      throw err;
    }
  };

  const selectedLoan = loans.find((l) => l.id === selectedLoanId) || null;
  const repaymentLoan = loans.find((l) => l.id === repaymentModalLoanId) || null;
  const additionalCreditLoan = loans.find((l) => l.id === additionalCreditModalLoanId) || null;

  return (
    <PhoneFrame
      deviceMode={deviceMode}
      onChangeDeviceMode={setDeviceMode}
      onRotateDevice={handleRotateDevice}
      onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
      onDownloadZip={downloadAndroidProjectZip}
      currentTime={currentTime}
    >
      {/* If PIN Locked */}
      {isLocked && savedPin && (
        <PinLockModal
          isOpen={true}
          isSettingUp={false}
          savedPin={savedPin}
          onUnlockSuccess={() => setIsLocked(false)}
          onSetPinSuccess={handleSetPin}
        />
      )}

      {/* Main App Layout */}
      <div className="flex-1 flex flex-col h-full bg-slate-50 overflow-hidden relative">
        {/* App Bar (Material 3 TopAppBar) */}
        <header className="px-3.5 sm:px-5 pt-3 pb-2.5 bg-white border-b border-slate-200/80 flex items-center justify-between shadow-xs sticky top-0 z-20">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 leading-tight">Easy Money Ledger</h2>
                <span className="hidden sm:inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {isLandscapeLayout ? 'Tablet Dual-Pane' : deviceMode === 'tablet-portrait' ? 'Tablet Portrait' : 'Phone View'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium block">Offline Personal Loans & Repayments</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {/* Google Multi-Device Cloud Sync Button */}
            {currentUser ? (
              <button
                id="google-sync-header-btn"
                onClick={() => setIsGoogleSyncModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 text-emerald-800 text-xs font-bold transition shadow-2xs"
                title="Google Account Synced (Tap to manage multi-device sync)"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || ''}
                    className="w-4 h-4 rounded-full border border-emerald-400"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
                <span className="text-[11px] font-bold max-w-[80px] truncate">
                  {currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Synced'}
                </span>
                <Cloud className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              </button>
            ) : (
              <button
                id="google-signin-header-btn"
                onClick={() => setIsGoogleSyncModalOpen(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-2xs"
                title="Sign in with Google to sync across multiple devices"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z" />
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z" />
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z" />
                </svg>
                <span className="text-[11px] font-bold text-slate-700">Google Sync</span>
              </button>
            )}

            {/* Backup & Restore Action */}
            <button
              onClick={() => setIsBackupModalOpen(true)}
              className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-600 transition"
              title="Backup and Restore JSON"
            >
              <Download className="w-4 h-4" />
            </button>

            {/* PIN Security Action */}
            <button
              onClick={() => {
                setIsSettingUpPin(true);
                setIsPinModalOpen(true);
              }}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                savedPin ? 'text-emerald-700 bg-emerald-50' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title={savedPin ? 'PIN Lock Enabled (tap to change)' : 'Set PIN Lock'}
            >
              <Lock className="w-4 h-4" />
            </button>

            {/* Lock Now if PIN is set */}
            {savedPin && (
              <button
                onClick={() => setIsLocked(true)}
                className="text-[11px] font-bold px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                title="Lock App Now"
              >
                Lock
              </button>
            )}
          </div>
        </header>

        {/* Real-time Google Multi-Device Status Strip */}
        {currentUser && (
          <div className="px-3.5 py-1.5 bg-slate-900 text-white text-[11px] flex items-center justify-between shadow-xs z-10 shrink-0">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <span className="font-semibold text-emerald-300">Multi-Device Cloud Active:</span>
              <span className="text-slate-300 truncate">{currentUser.email}</span>
            </div>
            <button
              onClick={() => setIsGoogleSyncModalOpen(true)}
              className="text-emerald-400 hover:text-emerald-200 underline font-bold shrink-0 ml-2"
            >
              Sync Details
            </button>
          </div>
        )}

        {/* Scrollable View Content: Adaptive Dual-Pane for Landscape vs Responsive Single Column for Portrait */}
        {isLandscapeLayout ? (
          <div className="flex-1 flex flex-row overflow-hidden relative">
            {/* Left Column: Transaction List & Controls */}
            <div className="w-[50%] lg:w-[52%] h-full flex flex-col border-r border-slate-200/80 bg-slate-50 relative">
              <div className="flex-1 overflow-y-auto p-4 space-y-3.5 pb-20">
                {/* Reminders */}
                {showNotificationBanner && (notificationAlerts.overdue.length > 0 || notificationAlerts.upcoming.length > 0) && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-2 shadow-xs text-xs text-amber-950 animate-in fade-in">
                    <div className="flex items-start gap-2.5">
                      <Bell className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div className="space-y-0.5">
                        <span className="font-bold block">Payment Reminders:</span>
                        {notificationAlerts.overdue.length > 0 && (
                          <span className="text-rose-700 font-semibold block">
                            ⚠️ {notificationAlerts.overdue.length} overdue loan(s) needing settlement.
                          </span>
                        )}
                        {notificationAlerts.upcoming.length > 0 && (
                          <span className="text-amber-800 block">
                            📅 {notificationAlerts.upcoming.length} loan(s) due within 48 hours.
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowNotificationBanner(false)}
                      className="text-amber-700 hover:text-amber-950 p-1 rounded-full hover:bg-amber-100"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Clean Dashboard Cards with 5 Metrics & 2 Main Buttons */}
                <DashboardCards
                  summary={summary}
                  selectedTypeFilter={selectedTypeFilter}
                  onSelectTypeFilter={setSelectedTypeFilter}
                />

                {/* Search Bar */}
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search by person name, mobile..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar select-none">
                  <button
                    onClick={() => {
                      setSelectedTypeFilter(null);
                      setSelectedStatusFilter(null);
                    }}
                    className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 ${
                      !selectedTypeFilter && !selectedStatusFilter
                        ? 'bg-slate-800 text-white'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    All ({loans.length})
                  </button>

                  <button
                    onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'GIVEN' ? null : 'GIVEN')}
                    className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 ${
                      selectedTypeFilter === 'GIVEN'
                        ? 'bg-emerald-700 text-white'
                        : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    Money Given
                  </button>

                  <button
                    onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'TAKEN' ? null : 'TAKEN')}
                    className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 ${
                      selectedTypeFilter === 'TAKEN'
                        ? 'bg-rose-700 text-white'
                        : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    Money Taken
                  </button>

                  {(['PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] as LoanStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => setSelectedStatusFilter(selectedStatusFilter === st ? null : st)}
                      className={`px-3 py-1.5 rounded-full font-medium transition shrink-0 capitalize ${
                        selectedStatusFilter === st
                          ? 'bg-slate-900 text-white font-bold'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.replace('_', ' ').toLowerCase()}
                    </button>
                  ))}
                </div>

                {/* Category Filters Bar & Grouping Toggle */}
                <div className="flex items-center justify-between gap-1.5 pt-0.5">
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar select-none flex-1">
                    <button
                      onClick={() => setSelectedCategoryFilter(null)}
                      className={`px-2.5 py-1 rounded-full font-bold transition shrink-0 flex items-center gap-1 text-[11px] ${
                        !selectedCategoryFilter
                          ? 'bg-slate-900 text-white shadow-2xs'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Tag className="w-3 h-3" />
                      <span>All Categories</span>
                    </button>

                    {availableCategories.map(({ name, count }) => {
                      const isSelected = selectedCategoryFilter?.toLowerCase() === name.toLowerCase();
                      const theme = getCategoryTheme(name);
                      return (
                        <button
                          key={name}
                          onClick={() => setSelectedCategoryFilter(isSelected ? null : name)}
                          className={`px-2.5 py-1 rounded-full font-medium transition shrink-0 flex items-center gap-1 text-[11px] border ${
                            isSelected
                              ? `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} font-bold ring-2 ring-slate-400/30 shadow-2xs`
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {theme.icon}
                          <span>{name}</span>
                          {count > 0 && (
                            <span
                              className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                                isSelected ? 'bg-black/10' : 'bg-slate-100 text-slate-500'
                              }`}
                            >
                              {count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* View Grouping Switcher: List vs By Category vs By Person */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
                    <button
                      onClick={() => setViewGroupingMode('flat')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                        viewGroupingMode === 'flat'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Flat list view"
                    >
                      <ListFilter className="w-3 h-3" />
                      <span>List</span>
                    </button>
                    <button
                      onClick={() => setViewGroupingMode('category')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                        viewGroupingMode === 'category'
                          ? 'bg-white text-emerald-700 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Group loans by category (Personal, Business, Medical, etc.)"
                    >
                      <Tag className="w-3 h-3" />
                      <span>Category</span>
                    </button>
                    <button
                      onClick={() => setViewGroupingMode('person')}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                        viewGroupingMode === 'person'
                          ? 'bg-white text-amber-800 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                      title="Group loans by person (track multiple credits & top-ups per borrower/lender)"
                    >
                      <Users className="w-3 h-3" />
                      <span>By Person</span>
                    </button>
                  </div>
                </div>

                {/* Transactions List */}
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1">
                    <span>
                      Transactions ({filteredLoans.length})
                      {selectedCategoryFilter && (
                        <span className="ml-1 text-emerald-700 font-bold">· {selectedCategoryFilter}</span>
                      )}
                      {viewGroupingMode === 'person' && (
                        <span className="ml-1 text-amber-700 font-bold">· Grouped by Person</span>
                      )}
                      {viewGroupingMode === 'category' && (
                        <span className="ml-1 text-emerald-700 font-bold">· Grouped by Category</span>
                      )}
                    </span>
                    {(selectedTypeFilter || selectedStatusFilter || selectedCategoryFilter || searchQuery) && (
                      <button
                        onClick={() => {
                          setSelectedTypeFilter(null);
                          setSelectedStatusFilter(null);
                          setSelectedCategoryFilter(null);
                          setSearchQuery('');
                        }}
                        className="text-emerald-700 hover:underline font-bold"
                      >
                        Reset filters
                      </button>
                    )}
                  </div>

                  {filteredLoans.length === 0 ? (
                    <div className="text-center py-12 px-4 rounded-3xl bg-white border border-dashed border-slate-200">
                      <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                        <FolderArchive className="w-6 h-6" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">No records found</h4>
                      <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                        {loans.length === 0
                          ? "Your ledger is empty. Tap 'Add Transaction' below to record your first loan."
                          : 'No transactions match your current search or filter.'}
                      </p>
                    </div>
                  ) : viewGroupingMode === 'category' ? (
                    <CategoryGroupView
                      loans={filteredLoans}
                      selectedLoanId={selectedLoanId}
                      onSelectLoan={(id) => setSelectedLoanId(id)}
                      isTabletGrid={false}
                    />
                  ) : viewGroupingMode === 'person' ? (
                    <PersonGroupView
                      loans={filteredLoans}
                      selectedLoanId={selectedLoanId}
                      onSelectLoan={(id) => setSelectedLoanId(id)}
                      onOpenAddForPerson={(personName, mobileNumber) => {
                        setInitialPersonForAdd({ name: personName, mobile: mobileNumber });
                        setIsAddModalOpen(true);
                      }}
                      isTabletGrid={false}
                    />
                  ) : (
                    filteredLoans.map((loan) => (
                      <TransactionCard
                        key={loan.id}
                        loan={loan}
                        isSelected={selectedLoanId === loan.id}
                        onClick={() => setSelectedLoanId(loan.id)}
                      />
                    ))
                  )}
                </div>
              </div>

              {/* Floating Add Transaction Button for Landscape Left Pane */}
              <div className="absolute bottom-4 right-4 z-30">
                <button
                  onClick={() => {
                    setInitialPersonForAdd(null);
                    setIsAddModalOpen(true);
                  }}
                  className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs shadow-lg shadow-emerald-700/40 transition active:scale-95"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>Add Transaction</span>
                </button>
              </div>
            </div>

            {/* Right Column: Tablet Detail Pane & Command Center */}
            <div className="w-[50%] lg:w-[48%] h-full overflow-y-auto bg-slate-100/50 p-4">
              <TabletDetailPane
                loan={selectedLoan}
                summary={summary}
                allLoans={loans}
                onSelectLoan={(id) => setSelectedLoanId(id)}
                onOpenAddRepayment={(id) => {
                  setEditingRepayment(null);
                  setRepaymentModalLoanId(id);
                }}
                onEditRepayment={(loanId, rep) => {
                  setEditingRepayment(rep);
                  setRepaymentModalLoanId(loanId);
                }}
                onDeleteRepayment={handleDeleteRepayment}
                onOpenAddAdditionalCredit={(id) => {
                  setEditingAdditionalCredit(null);
                  setAdditionalCreditModalLoanId(id);
                }}
                onEditAdditionalCredit={(loanId, credit) => {
                  setEditingAdditionalCredit(credit);
                  setAdditionalCreditModalLoanId(loanId);
                }}
                onDeleteAdditionalCredit={handleDeleteAdditionalCredit}
                onDeleteLoan={(id) => {
                  handleDeleteLoan(id);
                  if (selectedLoanId === id) setSelectedLoanId(null);
                }}
                onOpenAddTransaction={() => {
                  setInitialPersonForAdd(null);
                  setIsAddModalOpen(true);
                }}
                onSelectPersonFilter={(personName) => {
                  setSearchQuery(personName);
                }}
              />
            </div>
          </div>
        ) : (
          /* Single Column Mode: Tablet Portrait or Phone */
          <main className="flex-1 overflow-y-auto p-3.5 sm:p-5 space-y-3.5 pb-24">
            {/* Notification Reminders for Due & Overdue payments */}
            {showNotificationBanner && (notificationAlerts.overdue.length > 0 || notificationAlerts.upcoming.length > 0) && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start justify-between gap-2 shadow-xs text-xs text-amber-950 animate-in fade-in">
                <div className="flex items-start gap-2.5">
                  <Bell className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <span className="font-bold block">Payment Reminders:</span>
                    {notificationAlerts.overdue.length > 0 && (
                      <span className="text-rose-700 font-semibold block">
                        ⚠️ {notificationAlerts.overdue.length} overdue loan(s) needing settlement.
                      </span>
                    )}
                    {notificationAlerts.upcoming.length > 0 && (
                      <span className="text-amber-800 block">
                        📅 {notificationAlerts.upcoming.length} loan(s) due within 48 hours.
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => setShowNotificationBanner(false)}
                  className="text-amber-700 hover:text-amber-950 p-1 rounded-full hover:bg-amber-100"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Clean Dashboard Cards with 5 Metrics & 2 Main Buttons */}
            <DashboardCards
              summary={summary}
              selectedTypeFilter={selectedTypeFilter}
              onSelectTypeFilter={setSelectedTypeFilter}
            />

            {/* Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by person name, mobile..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-600 shadow-xs"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar select-none">
              <button
                onClick={() => {
                  setSelectedTypeFilter(null);
                  setSelectedStatusFilter(null);
                }}
                className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 ${
                  !selectedTypeFilter && !selectedStatusFilter
                    ? 'bg-slate-800 text-white'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                All ({loans.length})
              </button>

              <button
                onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'GIVEN' ? null : 'GIVEN')}
                className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 ${
                  selectedTypeFilter === 'GIVEN'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-emerald-800 border border-emerald-200 hover:bg-emerald-50'
                }`}
              >
                Money Given
              </button>

              <button
                onClick={() => setSelectedTypeFilter(selectedTypeFilter === 'TAKEN' ? null : 'TAKEN')}
                className={`px-3 py-1.5 rounded-full font-bold transition shrink-0 ${
                  selectedTypeFilter === 'TAKEN'
                    ? 'bg-rose-700 text-white'
                    : 'bg-white text-rose-800 border border-rose-200 hover:bg-rose-50'
                }`}
              >
                Money Taken
              </button>

              {(['PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE'] as LoanStatus[]).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedStatusFilter(selectedStatusFilter === st ? null : st)}
                  className={`px-3 py-1.5 rounded-full font-medium transition shrink-0 capitalize ${
                    selectedStatusFilter === st
                      ? 'bg-slate-900 text-white font-bold'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {st.replace('_', ' ').toLowerCase()}
                </button>
              ))}
            </div>

            {/* Category Filters Bar & Grouping Toggle */}
            <div className="flex items-center justify-between gap-1.5 pt-0.5">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar select-none flex-1">
                <button
                  onClick={() => setSelectedCategoryFilter(null)}
                  className={`px-2.5 py-1 rounded-full font-bold transition shrink-0 flex items-center gap-1 text-[11px] ${
                    !selectedCategoryFilter
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Tag className="w-3 h-3" />
                  <span>All Categories</span>
                </button>

                {availableCategories.map(({ name, count }) => {
                  const isSelected = selectedCategoryFilter?.toLowerCase() === name.toLowerCase();
                  const theme = getCategoryTheme(name);
                  return (
                    <button
                      key={name}
                      onClick={() => setSelectedCategoryFilter(isSelected ? null : name)}
                      className={`px-2.5 py-1 rounded-full font-medium transition shrink-0 flex items-center gap-1 text-[11px] border ${
                        isSelected
                          ? `${theme.badgeBg} ${theme.badgeText} ${theme.badgeBorder} font-bold ring-2 ring-slate-400/30 shadow-2xs`
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {theme.icon}
                      <span>{name}</span>
                      {count > 0 && (
                        <span
                          className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                            isSelected ? 'bg-black/10' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* View Grouping Switcher: List vs By Category vs By Person */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/80 shrink-0">
                <button
                  onClick={() => setViewGroupingMode('flat')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    viewGroupingMode === 'flat'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Flat list view"
                >
                  <ListFilter className="w-3 h-3" />
                  <span>List</span>
                </button>
                <button
                  onClick={() => setViewGroupingMode('category')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    viewGroupingMode === 'category'
                      ? 'bg-white text-emerald-700 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Group loans by category (Personal, Business, Medical, etc.)"
                >
                  <Tag className="w-3 h-3" />
                  <span>Category</span>
                </button>
                <button
                  onClick={() => setViewGroupingMode('person')}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold transition flex items-center gap-1 ${
                    viewGroupingMode === 'person'
                      ? 'bg-white text-amber-800 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                  title="Group loans by person (track multiple credits & top-ups per borrower/lender)"
                >
                  <Users className="w-3 h-3" />
                  <span>By Person</span>
                </button>
              </div>
            </div>

            {/* Transactions List (2 columns on tablet portrait, 1 column on phone) */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 font-semibold px-1 mb-2.5">
                <span>
                  Transactions ({filteredLoans.length})
                  {selectedCategoryFilter && (
                    <span className="ml-1 text-emerald-700 font-bold">· {selectedCategoryFilter}</span>
                  )}
                  {viewGroupingMode === 'person' && (
                    <span className="ml-1 text-amber-700 font-bold">· Grouped by Person</span>
                  )}
                  {viewGroupingMode === 'category' && (
                    <span className="ml-1 text-emerald-700 font-bold">· Grouped by Category</span>
                  )}
                </span>
                {(selectedTypeFilter || selectedStatusFilter || selectedCategoryFilter || searchQuery) && (
                  <button
                    onClick={() => {
                      setSelectedTypeFilter(null);
                      setSelectedStatusFilter(null);
                      setSelectedCategoryFilter(null);
                      setSearchQuery('');
                    }}
                    className="text-emerald-700 hover:underline font-bold"
                  >
                    Reset filters
                  </button>
                )}
              </div>

              {filteredLoans.length === 0 ? (
                <div className="text-center py-12 px-4 rounded-3xl bg-white border border-dashed border-slate-200">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <FolderArchive className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">No records found</h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                    {loans.length === 0
                      ? "Your ledger is empty. Tap 'Add Transaction' below to record your first loan."
                      : 'No transactions match your current search or filter.'}
                  </p>
                </div>
              ) : viewGroupingMode === 'category' ? (
                <CategoryGroupView
                  loans={filteredLoans}
                  selectedLoanId={selectedLoanId}
                  onSelectLoan={(id) => setSelectedLoanId(id)}
                  isTabletGrid={deviceMode !== 'phone'}
                />
              ) : viewGroupingMode === 'person' ? (
                <PersonGroupView
                  loans={filteredLoans}
                  selectedLoanId={selectedLoanId}
                  onSelectLoan={(id) => setSelectedLoanId(id)}
                  onOpenAddForPerson={(personName, mobileNumber) => {
                    setInitialPersonForAdd({ name: personName, mobile: mobileNumber });
                    setIsAddModalOpen(true);
                  }}
                  isTabletGrid={deviceMode !== 'phone'}
                />
              ) : (
                <div className={deviceMode !== 'phone' ? 'grid grid-cols-1 md:grid-cols-2 gap-3' : 'space-y-2.5'}>
                  {filteredLoans.map((loan) => (
                    <TransactionCard
                      key={loan.id}
                      loan={loan}
                      isSelected={selectedLoanId === loan.id}
                      onClick={() => setSelectedLoanId(loan.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          </main>
        )}

        {/* Floating Add Transaction Button for Portrait/Phone Mode */}
        {!isLandscapeLayout && (
          <div className="absolute bottom-4 right-4 z-30">
            <button
              onClick={() => {
                setInitialPersonForAdd(null);
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-sm shadow-xl shadow-emerald-700/40 transition active:scale-95"
            >
              <Plus className="w-5 h-5 stroke-[2.5]" />
              <span>Add Transaction</span>
            </button>
          </div>
        )}
      </div>

      {/* Add Loan Modal */}
      <AddTransactionModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setInitialPersonForAdd(null);
        }}
        onSave={handleAddLoan}
        defaultType={selectedTypeFilter || 'GIVEN'}
        existingLoans={loans}
        initialPersonName={initialPersonForAdd?.name}
        initialMobile={initialPersonForAdd?.mobile}
      />

      {/* Loan Details Modal (shown when selected in Portrait or Phone mode) */}
      <TransactionDetailModal
        loan={selectedLoan}
        isOpen={!!selectedLoan && !isLandscapeLayout}
        allLoans={loans}
        onClose={() => setSelectedLoanId(null)}
        onAddRepayment={handleAddRepayment}
        onEditRepayment={handleEditRepayment}
        onDeleteRepayment={handleDeleteRepayment}
        onAddAdditionalCredit={handleAddAdditionalCredit}
        onEditAdditionalCredit={handleEditAdditionalCredit}
        onDeleteAdditionalCredit={handleDeleteAdditionalCredit}
        onDeleteLoan={(id) => {
          handleDeleteLoan(id);
          if (selectedLoanId === id) setSelectedLoanId(null);
        }}
        onSelectPersonFilter={(personName) => {
          setSearchQuery(personName);
          setSelectedLoanId(null);
        }}
      />

      {/* Repayment Modal (can be opened from TabletDetailPane or TransactionDetailModal) */}
      {repaymentLoan && (
        <RepaymentModal
          isOpen={!!repaymentModalLoanId && !!repaymentLoan}
          loan={repaymentLoan}
          initialRepayment={editingRepayment}
          onClose={() => {
            setRepaymentModalLoanId(null);
            setEditingRepayment(null);
          }}
          onSave={(amount, paymentDate, paymentMedium, transactionRef, notes, repaymentId) => {
            if (repaymentModalLoanId) {
              if (repaymentId) {
                handleEditRepayment(repaymentModalLoanId, repaymentId, amount, paymentDate, paymentMedium, transactionRef, notes);
              } else {
                handleAddRepayment(repaymentModalLoanId, amount, paymentDate, paymentMedium, transactionRef, notes);
              }
              setRepaymentModalLoanId(null);
              setEditingRepayment(null);
            }
          }}
        />
      )}

      {/* Additional Credit Modal (can be opened from TabletDetailPane or TransactionDetailModal) */}
      {additionalCreditLoan && (
        <AdditionalCreditModal
          isOpen={!!additionalCreditModalLoanId && !!additionalCreditLoan}
          loan={additionalCreditLoan}
          initialCredit={editingAdditionalCredit}
          onClose={() => {
            setAdditionalCreditModalLoanId(null);
            setEditingAdditionalCredit(null);
          }}
          onSave={(amount, date, paymentMedium, transactionRef, notes, creditId) => {
            if (additionalCreditModalLoanId) {
              if (creditId) {
                handleEditAdditionalCredit(additionalCreditModalLoanId, creditId, amount, date, paymentMedium, transactionRef, notes);
              } else {
                handleAddAdditionalCredit(additionalCreditModalLoanId, amount, date, paymentMedium, transactionRef, notes);
              }
              setAdditionalCreditModalLoanId(null);
              setEditingAdditionalCredit(null);
            }
          }}
        />
      )}

      {/* PIN Security Modal */}
      <PinLockModal
        isOpen={isPinModalOpen}
        isSettingUp={isSettingUpPin}
        savedPin={savedPin}
        onUnlockSuccess={() => setIsPinModalOpen(false)}
        onSetPinSuccess={handleSetPin}
        onClose={() => setIsPinModalOpen(false)}
      />

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        loans={loans}
        onClose={() => setIsBackupModalOpen(false)}
        onRestore={handleRestoreData}
      />

      {/* Android Code Viewer & ZIP Download Modal */}
      <AndroidCodeViewerModal
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />

      {/* Google Multi-Device Cloud Sync Modal */}
      <GoogleSyncModal
        isOpen={isGoogleSyncModalOpen}
        onClose={() => setIsGoogleSyncModalOpen(false)}
        user={currentUser}
        syncStatus={syncStatus}
        lastSyncedAt={lastSyncedAt}
        totalLoansCount={loans.length}
        errorMessage={syncErrorMessage}
        onSignIn={handleGoogleSignIn}
        onSignOut={handleGoogleSignOut}
        onSyncNow={handleManualSyncNow}
        onUploadLocalData={handleUploadLocalToCloud}
      />
    </PhoneFrame>
  );
}
