import React, { useState } from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownLeft,
  Calculator,
  Calendar,
  HelpCircle,
  Check,
  Briefcase,
  User,
  HeartPulse,
  GraduationCap,
  Home,
  AlertCircle,
  Tag,
  Plus,
  CalendarOff,
  BookUser
} from 'lucide-react';
import { Loan, TransactionType, InterestType, InterestFrequency, DEFAULT_LOAN_CATEGORIES, TransactionMedium } from '../types';
import { calculateLoan, formatINR } from '../utils/interestCalculator';
import { TransactionMediumSelector } from './TransactionMediumSelector';
import { ContactPickerModal } from './ContactPickerModal';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (loan: Omit<Loan, 'id' | 'createdAt' | 'repayments'>) => void;
  defaultType?: TransactionType;
  existingLoans?: Loan[];
  initialPersonName?: string;
  initialMobile?: string;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  Personal: <User className="w-3.5 h-3.5" />,
  Business: <Briefcase className="w-3.5 h-3.5" />,
  Medical: <HeartPulse className="w-3.5 h-3.5" />,
  Education: <GraduationCap className="w-3.5 h-3.5" />,
  Home: <Home className="w-3.5 h-3.5" />,
  Emergency: <AlertCircle className="w-3.5 h-3.5" />,
  Other: <Tag className="w-3.5 h-3.5" />,
};

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  defaultType = 'GIVEN',
  existingLoans = [],
  initialPersonName = '',
  initialMobile = '',
}) => {
  const [personName, setPersonName] = useState(initialPersonName);
  const [mobileNumber, setMobileNumber] = useState(initialMobile);
  const [category, setCategory] = useState<string>('Personal');
  const [customCategory, setCustomCategory] = useState<string>('');
  const [isCustomCategory, setIsCustomCategory] = useState<boolean>(false);
  const [amountStr, setAmountStr] = useState('');
  const [transactionType, setTransactionType] = useState<TransactionType>(defaultType);
  const [interestType, setInterestType] = useState<InterestType>('NO_INTEREST');
  const [interestRateStr, setInterestRateStr] = useState('2.0');
  const [interestFrequency, setInterestFrequency] = useState<InterestFrequency>('MONTHLY');
  const [paymentMedium, setPaymentMedium] = useState<TransactionMedium>('CASH');
  const [transactionRef, setTransactionRef] = useState<string>('');
  const [showPersonSuggestions, setShowPersonSuggestions] = useState(false);

  // Sync initial props when opened
  React.useEffect(() => {
    if (isOpen) {
      if (initialPersonName) setPersonName(initialPersonName);
      if (initialMobile) setMobileNumber(initialMobile);
    }
  }, [isOpen, initialPersonName, initialMobile]);

  // Extract unique previous borrowers / lenders
  const uniquePersons = React.useMemo(() => {
    const map = new Map<string, { name: string; mobile?: string; activeCredits: number; unpaid: number }>();
    existingLoans.forEach((l) => {
      const key = l.personName.trim().toLowerCase();
      const calc = calculateLoan(l);
      const isUnpaid = calc.remainingBalance > 0.01;
      const prev = map.get(key);
      if (!prev) {
        map.set(key, {
          name: l.personName.trim(),
          mobile: l.mobileNumber,
          activeCredits: isUnpaid ? 1 : 0,
          unpaid: isUnpaid ? calc.remainingBalance : 0,
        });
      } else {
        if (isUnpaid) {
          prev.activeCredits += 1;
          prev.unpaid += calc.remainingBalance;
        }
        if (!prev.mobile && l.mobileNumber) prev.mobile = l.mobileNumber;
      }
    });
    return Array.from(map.values());
  }, [existingLoans]);

  // Matching person if any
  const matchedPerson = React.useMemo(() => {
    if (!personName.trim()) return null;
    return uniquePersons.find((p) => p.name.toLowerCase() === personName.trim().toLowerCase()) || null;
  }, [personName, uniquePersons]);

  // Filter suggestions as user types
  const filteredSuggestions = React.useMemo(() => {
    if (!personName.trim()) return uniquePersons.slice(0, 5);
    return uniquePersons
      .filter((p) => p.name.toLowerCase().includes(personName.trim().toLowerCase()))
      .slice(0, 5);
  }, [personName, uniquePersons]);

  // Extract saved contacts that have a valid phone number for contact selection
  const savedContactsWithPhone = React.useMemo(() => {
    return uniquePersons
      .filter((p): p is typeof p & { mobile: string } => Boolean(p.mobile && p.mobile.trim()))
      .map((p) => ({
        name: p.name,
        mobile: p.mobile,
        activeCredits: p.activeCredits,
        unpaid: p.unpaid,
      }));
  }, [uniquePersons]);

  const [showContactPicker, setShowContactPicker] = useState(false);

  // Check if browser supports the native Web Contact Picker API
  const isDeviceContactsSupported = React.useMemo(() => {
    return (
      typeof window !== 'undefined' &&
      'contacts' in navigator &&
      typeof (navigator as unknown as { contacts: { select: unknown } }).contacts?.select === 'function'
    );
  }, []);

  // Quick picker function for device contacts
  const handleQuickDeviceContactPick = async () => {
    if (isDeviceContactsSupported) {
      try {
        const navContacts = (navigator as unknown as {
          contacts: {
            select: (props: string[], opts?: { multiple?: boolean }) => Promise<Array<{ name?: string[]; tel?: string[] }>>;
          };
        }).contacts;
        const contacts = await navContacts.select(['name', 'tel'], { multiple: false });
        if (contacts && contacts.length > 0) {
          const picked = contacts[0];
          const rawTel = Array.isArray(picked.tel) && picked.tel.length > 0 ? picked.tel[0] : '';
          const rawName = Array.isArray(picked.name) && picked.name.length > 0 ? picked.name[0] : '';
          if (rawTel) {
            setMobileNumber(rawTel.trim());
            if (!personName.trim() && rawName) {
              setPersonName(rawName.trim());
            }
            return;
          }
        }
      } catch (err: unknown) {
        const errorObj = err as { name?: string };
        if (errorObj?.name !== 'AbortError') {
          console.warn('Direct device contacts error, opening contacts modal:', err);
        }
      }
    }
    setShowContactPicker(true);
  };

  const today = new Date().toISOString().split('T')[0];
  const nextMonthDate = new Date();
  nextMonthDate.setDate(nextMonthDate.getDate() + 30);
  const defaultDueDate = nextMonthDate.toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(today);
  const [dueDate, setDueDate] = useState(defaultDueDate);
  const [hasIndefiniteDueDate, setHasIndefiniteDueDate] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const principal = parseFloat(amountStr) || 0;
  const interestRate = parseFloat(interestRateStr) || 0;
  const activeCategory = isCustomCategory && customCategory.trim() ? customCategory.trim() : category;

  // Live calculation preview
  const previewLoan: Loan = {
    id: 'preview',
    personName: personName || 'Preview Person',
    mobileNumber,
    amount: principal,
    paymentMedium,
    transactionRef: transactionRef.trim() || undefined,
    transactionType,
    category: activeCategory,
    interestType,
    interestRate,
    interestFrequency,
    startDate,
    dueDate: hasIndefiniteDueDate ? '' : dueDate,
    hasIndefiniteDueDate,
    notes,
    createdAt: Date.now(),
    repayments: []
  };

  const calc = calculateLoan(previewLoan);
  const isValid = personName.trim().length > 0 && principal > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    onSave({
      personName: personName.trim(),
      mobileNumber: mobileNumber.trim() || undefined,
      amount: principal,
      paymentMedium,
      transactionRef: transactionRef.trim() || undefined,
      transactionType,
      category: activeCategory,
      interestType,
      interestRate: interestType === 'SIMPLE_INTEREST' ? interestRate : 0,
      interestFrequency,
      startDate,
      dueDate: hasIndefiniteDueDate ? '' : dueDate,
      hasIndefiniteDueDate,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setPersonName('');
    setMobileNumber('');
    setCategory('Personal');
    setCustomCategory('');
    setIsCustomCategory(false);
    setAmountStr('');
    setPaymentMedium('CASH');
    setTransactionRef('');
    setHasIndefiniteDueDate(false);
    setNotes('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col animate-in fade-in slide-in-from-bottom-6 duration-200">
        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Add Transaction</h3>
            <p className="text-xs text-slate-500">Record money lent or borrowed</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Transaction Type Segmented Toggle */}
          <div>
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
              Transaction Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTransactionType('GIVEN')}
                className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition border ${
                  transactionType === 'GIVEN'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Money Given (Lent)</span>
              </button>

              <button
                type="button"
                onClick={() => setTransactionType('TAKEN')}
                className={`py-3 px-3 rounded-2xl flex items-center justify-center gap-2 font-bold text-sm transition border ${
                  transactionType === 'TAKEN'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent'
                }`}
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>Money Taken (Borrowed)</span>
              </button>
            </div>
          </div>

          {/* Person Name & Mobile */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Person Name <span className="text-rose-500">*</span>
                </label>
                {uniquePersons.length > 0 && !personName && (
                  <span className="text-[10px] text-slate-400">Select from existing borrowers / lenders</span>
                )}
              </div>
              <input
                type="text"
                required
                placeholder="e.g. Rahul Sharma"
                value={personName}
                onFocus={() => setShowPersonSuggestions(true)}
                onChange={(e) => {
                  setPersonName(e.target.value);
                  setShowPersonSuggestions(true);
                }}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 text-sm font-medium"
              />

              {/* Suggestions chips for quick select */}
              {showPersonSuggestions && filteredSuggestions.length > 0 && (
                <div className="mt-2 p-2 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5 px-1">
                    <span>Recent People in Ledger</span>
                    <button
                      type="button"
                      onClick={() => setShowPersonSuggestions(false)}
                      className="text-slate-400 hover:text-slate-600 normal-case"
                    >
                      Hide
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {filteredSuggestions.map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => {
                          setPersonName(s.name);
                          if (s.mobile) setMobileNumber(s.mobile);
                          setShowPersonSuggestions(false);
                        }}
                        className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 transition flex items-center gap-1.5"
                      >
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{s.name}</span>
                        {s.mobile && (
                          <span className="text-[10px] text-slate-500 font-mono font-normal">
                            ({s.mobile})
                          </span>
                        )}
                        {s.unpaid > 0 && (
                          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded">
                            {formatINR(s.unpaid)} unpaid
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Mobile Number <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowContactPicker(true)}
                  className="text-[11px] font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/90 rounded-lg px-2.5 py-0.5 transition flex items-center gap-1 shadow-2xs cursor-pointer active:scale-95"
                  title="Select phone number from contacts"
                >
                  <BookUser className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Select from Contacts</span>
                </button>
              </div>

              <div className="relative flex items-center">
                <input
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full pl-4 pr-11 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 text-sm font-medium bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowContactPicker(true)}
                  className="absolute right-2.5 p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition cursor-pointer"
                  title="Choose phone number from contacts"
                >
                  <BookUser className="w-4 h-4 text-emerald-600" />
                </button>
              </div>

              {/* Quick Contacts Chips */}
              {savedContactsWithPhone.length > 0 && !mobileNumber && (
                <div className="mt-2 flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Recent:</span>
                  {savedContactsWithPhone.slice(0, 4).map((c) => (
                    <button
                      key={`${c.name}-${c.mobile}`}
                      type="button"
                      onClick={() => {
                        setMobileNumber(c.mobile);
                        if (!personName.trim()) setPersonName(c.name);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 text-[11px] font-medium transition shrink-0 flex items-center gap-1 max-w-[170px] truncate cursor-pointer"
                      title={`${c.name}: ${c.mobile}`}
                    >
                      <span className="font-bold truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">({c.mobile.slice(-4)})</span>
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setShowContactPicker(true)}
                    className="text-[11px] font-bold text-emerald-700 hover:underline shrink-0 ml-0.5 cursor-pointer"
                  >
                    View all ({savedContactsWithPhone.length})
                  </button>
                </div>
              )}
            </div>

            {/* Multiple Credit Notice */}
            {matchedPerson && matchedPerson.activeCredits > 0 && (
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold">Active Credits Alert: </span>
                  <span>
                    <strong>{matchedPerson.name}</strong> currently has {matchedPerson.activeCredits} existing credit ledger(s) with{' '}
                    <strong>{formatINR(matchedPerson.unpaid)}</strong> total unpaid balance. This form will add an additional credit entry for them.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Category Field */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                Category
              </label>
              <span className="text-[11px] text-slate-500 font-medium">
                Selected: <span className="font-bold text-emerald-700">{activeCategory}</span>
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_LOAN_CATEGORIES.map((cat) => {
                const isSelected = !isCustomCategory && category === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setCategory(cat);
                      setIsCustomCategory(false);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {CATEGORY_ICONS[cat] || <Tag className="w-3.5 h-3.5" />}
                    <span>{cat}</span>
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setIsCustomCategory(true)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border ${
                  isCustomCategory
                    ? 'bg-emerald-700 text-white border-emerald-700 shadow-sm'
                    : 'bg-white text-slate-600 border-dashed border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Custom</span>
              </button>
            </div>

            {isCustomCategory && (
              <div className="mt-2 animate-in fade-in">
                <input
                  type="text"
                  placeholder="Enter custom category (e.g., Vehicle, Farm, Wedding)..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50/30 text-slate-900 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            )}
          </div>

          {/* Amount (Principal) */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Amount (Principal ₹) <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-base">₹</span>
              <input
                type="number"
                step="any"
                min="1"
                required
                placeholder="10000"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 text-base font-bold"
              />
            </div>
          </div>

          {/* Medium of Transaction (Cash / UPI / Online) */}
          <div className="p-3.5 bg-slate-50/70 border border-slate-200/80 rounded-2xl">
            <TransactionMediumSelector
              selectedMedium={paymentMedium}
              onSelectMedium={setPaymentMedium}
              transactionRef={transactionRef}
              onChangeTransactionRef={setTransactionRef}
              label={
                transactionType === 'GIVEN'
                  ? 'Disbursement Medium (Paid via)'
                  : 'Borrowing Medium (Received via)'
              }
            />
          </div>

          {/* Interest Type */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1.5">Interest Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setInterestType('NO_INTEREST')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                  interestType === 'NO_INTEREST'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                No Interest
              </button>
              <button
                type="button"
                onClick={() => setInterestType('SIMPLE_INTEREST')}
                className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                  interestType === 'SIMPLE_INTEREST'
                    ? 'bg-amber-600 text-white border-amber-600'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Simple Interest
              </button>
            </div>
          </div>

          {/* If Simple Interest: Rate & Calculation Frequency */}
          {interestType === 'SIMPLE_INTEREST' && (
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-amber-900 block mb-1">
                    Interest Rate (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={interestRateStr}
                      onChange={(e) => setInterestRateStr(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-white text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-amber-900 block mb-1">
                    Calculation Basis
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setInterestFrequency('MONTHLY')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border ${
                        interestFrequency === 'MONTHLY'
                          ? 'bg-amber-700 text-white border-amber-700'
                          : 'bg-white text-amber-900 border-amber-200'
                      }`}
                    >
                      Monthly
                    </button>
                    <button
                      type="button"
                      onClick={() => setInterestFrequency('YEARLY')}
                      className={`py-2 px-2 rounded-lg text-xs font-bold border ${
                        interestFrequency === 'YEARLY'
                          ? 'bg-amber-700 text-white border-amber-700'
                          : 'bg-white text-amber-900 border-amber-200'
                      }`}
                    >
                      Yearly
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-amber-900/80 font-medium leading-relaxed">
                💡 Simple Interest = Principal × Rate × Time. Monthly calculates time as (days ÷ 30).
              </div>
            </div>
          )}

          {/* Start Date & Due Date */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">Due Date</label>
                  <button
                    type="button"
                    onClick={() => setHasIndefiniteDueDate(!hasIndefiniteDueDate)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition flex items-center gap-1 ${
                      hasIndefiniteDueDate
                        ? 'bg-amber-100 text-amber-900 border-amber-300'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                    }`}
                    title={hasIndefiniteDueDate ? 'Switch to specific date' : 'Set as indefinite / no fixed due date'}
                  >
                    <span>♾️</span>
                    <span>{hasIndefiniteDueDate ? 'Indefinite' : 'No Due Date'}</span>
                  </button>
                </div>

                {hasIndefiniteDueDate ? (
                  <div className="w-full px-3 py-2 rounded-xl border border-amber-200/90 bg-amber-50/70 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <CalendarOff className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                      <span className="text-[11px] font-bold text-amber-950 truncate">No fixed date</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasIndefiniteDueDate(false)}
                      className="text-[10px] font-bold text-emerald-700 hover:underline shrink-0 ml-1"
                    >
                      Set Date
                    </button>
                  </div>
                ) : (
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 bg-white"
                  />
                )}
              </div>
            </div>

            {/* Quick presets for due date */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
              <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">Due:</span>
              <button
                type="button"
                onClick={() => {
                  setHasIndefiniteDueDate(false);
                  const d = new Date(startDate || today);
                  d.setDate(d.getDate() + 30);
                  setDueDate(d.toISOString().split('T')[0]);
                }}
                className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition shrink-0 ${
                  !hasIndefiniteDueDate &&
                  dueDate ===
                    (() => {
                      const d = new Date(startDate || today);
                      d.setDate(d.getDate() + 30);
                      return d.toISOString().split('T')[0];
                    })()
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
              >
                +30 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasIndefiniteDueDate(false);
                  const d = new Date(startDate || today);
                  d.setDate(d.getDate() + 60);
                  setDueDate(d.toISOString().split('T')[0]);
                }}
                className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition shrink-0 ${
                  !hasIndefiniteDueDate &&
                  dueDate ===
                    (() => {
                      const d = new Date(startDate || today);
                      d.setDate(d.getDate() + 60);
                      return d.toISOString().split('T')[0];
                    })()
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
              >
                +60 Days
              </button>
              <button
                type="button"
                onClick={() => {
                  setHasIndefiniteDueDate(false);
                  const d = new Date(startDate || today);
                  d.setDate(d.getDate() + 90);
                  setDueDate(d.toISOString().split('T')[0]);
                }}
                className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition shrink-0 ${
                  !hasIndefiniteDueDate &&
                  dueDate ===
                    (() => {
                      const d = new Date(startDate || today);
                      d.setDate(d.getDate() + 90);
                      return d.toISOString().split('T')[0];
                    })()
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200'
                }`}
              >
                +90 Days
              </button>
              <button
                type="button"
                onClick={() => setHasIndefiniteDueDate(true)}
                className={`px-2 py-0.5 rounded-lg border text-[10px] font-semibold transition shrink-0 flex items-center gap-1 ${
                  hasIndefiniteDueDate
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border-amber-200'
                }`}
              >
                <span>♾️</span>
                <span>No Due Date (Indefinite)</span>
              </button>
            </div>
            {hasIndefiniteDueDate && (
              <p className="text-[11px] text-amber-800 bg-amber-50/70 border border-amber-200/80 rounded-xl px-3 py-1.5 leading-snug">
                Open-ended loan without a fixed deadline. Overdue notices will not trigger.
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-bold text-slate-700 block mb-1">
              Notes / Purpose <span className="text-slate-400 font-normal">(Optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Emergency home repair, shop inventory"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600 text-slate-900 text-sm"
            />
          </div>

          {/* Automatic Calculation Preview Box */}
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-100 space-y-2 border border-slate-800 shadow-inner">
            <div className="flex items-center justify-between text-xs font-bold text-emerald-400 uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <Calculator className="w-3.5 h-3.5" />
                Automatic Calculation
              </span>
              <span>{hasIndefiniteDueDate ? 'No Due Date (Indefinite)' : `${calc.daysElapsed} days`}</span>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Principal Amount:</span>
                <span className="font-semibold text-white">{formatINR(calc.principal)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Interest Amount:</span>
                <span className="font-semibold text-amber-300">+{formatINR(calc.interestAmount)}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300">
                {transactionType === 'GIVEN' ? 'Total Amount Receivable:' : 'Total Amount Payable:'}
              </span>
              <span className={`text-base font-black ${transactionType === 'GIVEN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatINR(calc.totalAmount)}
              </span>
            </div>

            <div className="text-[11px] text-slate-400 pt-1 font-mono leading-tight bg-slate-950/60 p-2 rounded-lg border border-slate-800">
              Formula: {calc.formulaExplanation}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none text-white text-sm font-bold transition shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save Transaction</span>
            </button>
          </div>
        </form>
      </div>

      {/* Select Phone Number From Contacts Modal */}
      <ContactPickerModal
        isOpen={showContactPicker}
        onClose={() => setShowContactPicker(false)}
        onSelectContact={({ name, mobile }) => {
          setMobileNumber(mobile);
          if (name && (!personName.trim() || personName === 'Contact')) {
            setPersonName(name);
          }
        }}
        savedContacts={savedContactsWithPhone}
        currentName={personName}
        currentMobile={mobileNumber}
      />
    </div>
  );
};
