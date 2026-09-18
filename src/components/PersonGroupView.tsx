import React, { useState } from 'react';
import {
  User,
  Phone,
  ChevronDown,
  ChevronUp,
  ArrowUpRight,
  ArrowDownLeft,
  CreditCard,
  PlusCircle,
  Clock,
  Layers
} from 'lucide-react';
import { Loan } from '../types';
import { calculateLoan, formatINR } from '../utils/interestCalculator';
import { TransactionCard } from './TransactionCard';

interface PersonGroupViewProps {
  loans: Loan[];
  selectedLoanId?: string | null;
  onSelectLoan: (loanId: string) => void;
  onOpenAddForPerson?: (personName: string, mobileNumber?: string) => void;
  isTabletGrid?: boolean;
}

interface PersonSummary {
  personName: string;
  mobileNumber?: string;
  loans: Loan[];
  totalPrincipal: number;
  totalReceivable: number;
  totalPayable: number;
  totalPaid: number;
  netOutstanding: number;
  activeCount: number;
  hasOverdue: boolean;
}

export const PersonGroupView: React.FC<PersonGroupViewProps> = ({
  loans,
  selectedLoanId,
  onSelectLoan,
  onOpenAddForPerson,
  isTabletGrid = false,
}) => {
  // Group loans by normalized person name
  const personMap = new Map<string, PersonSummary>();

  loans.forEach((loan) => {
    const key = loan.personName.trim().toLowerCase();
    const existing = personMap.get(key);
    const calc = calculateLoan(loan);

    const isGiven = loan.transactionType === 'GIVEN';
    const receivable = isGiven ? calc.remainingBalance : 0;
    const payable = !isGiven ? calc.remainingBalance : 0;
    const isOverdue = calc.status === 'OVERDUE';
    const isActive = calc.remainingBalance > 0.01;

    if (!existing) {
      personMap.set(key, {
        personName: loan.personName.trim(),
        mobileNumber: loan.mobileNumber,
        loans: [loan],
        totalPrincipal: calc.principal,
        totalReceivable: receivable,
        totalPayable: payable,
        totalPaid: calc.totalPaid,
        netOutstanding: receivable - payable,
        activeCount: isActive ? 1 : 0,
        hasOverdue: isOverdue,
      });
    } else {
      existing.loans.push(loan);
      existing.totalPrincipal += calc.principal;
      existing.totalReceivable += receivable;
      existing.totalPayable += payable;
      existing.totalPaid += calc.totalPaid;
      existing.netOutstanding += receivable - payable;
      if (isActive) existing.activeCount += 1;
      if (isOverdue) existing.hasOverdue = true;
      if (!existing.mobileNumber && loan.mobileNumber) {
        existing.mobileNumber = loan.mobileNumber;
      }
    }
  });

  const personSummaries = Array.from(personMap.values()).sort(
    (a, b) => Math.abs(b.netOutstanding) - Math.abs(a.netOutstanding)
  );

  // State to track collapsed persons (default all expanded)
  const [collapsedPersons, setCollapsedPersons] = useState<Record<string, boolean>>({});

  const toggleCollapse = (nameKey: string) => {
    setCollapsedPersons((prev) => ({
      ...prev,
      [nameKey]: !prev[nameKey],
    }));
  };

  if (personSummaries.length === 0) {
    return (
      <div className="text-center py-12 px-4 rounded-3xl bg-white border border-slate-200/80 shadow-2xs">
        <User className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-700">No person ledgers found</p>
        <p className="text-xs text-slate-500 mt-0.5">Transactions will be grouped here per person.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs px-1 text-slate-500 font-medium">
        <span>
          Showing <strong className="text-slate-800">{personSummaries.length}</strong> people with active ledgers
        </span>
        <span className="text-[11px] text-slate-400">Multiple credits grouped automatically</span>
      </div>

      {personSummaries.map((summary) => {
        const key = summary.personName.toLowerCase();
        const isCollapsed = collapsedPersons[key] ?? false;
        const isNetReceivable = summary.netOutstanding >= 0;

        return (
          <div
            key={key}
            className="rounded-3xl bg-white border border-slate-200/80 overflow-hidden shadow-2xs transition-all hover:border-slate-300"
          >
            {/* Person Group Header */}
            <div
              onClick={() => toggleCollapse(key)}
              className="p-4 bg-gradient-to-r from-slate-50 to-white cursor-pointer select-none flex items-center justify-between gap-3 border-b border-slate-100"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-11 h-11 rounded-2xl bg-emerald-700/10 text-emerald-800 flex items-center justify-center font-black text-base shrink-0 border border-emerald-700/20">
                  {summary.personName.charAt(0).toUpperCase()}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{summary.personName}</h3>
                    {summary.hasOverdue && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-100 text-rose-700 shrink-0">
                        Overdue
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 shrink-0">
                      {summary.loans.length} {summary.loans.length === 1 ? 'Credit' : 'Credits'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                    {summary.mobileNumber ? (
                      <span className="flex items-center gap-1 font-medium text-[11px] text-slate-600">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{summary.mobileNumber}</span>
                      </span>
                    ) : (
                      <span className="text-[11px] text-slate-400">No phone</span>
                    )}
                    <span>•</span>
                    <span className="text-[11px]">
                      {summary.activeCount > 0 ? (
                        <span className="text-emerald-700 font-bold">{summary.activeCount} Active</span>
                      ) : (
                        <span className="text-slate-400">Fully Cleared</span>
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Balance & Toggle */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">
                    {isNetReceivable ? 'Net To Receive' : 'Net To Pay'}
                  </span>
                  <span
                    className={`text-sm font-black ${
                      Math.abs(summary.netOutstanding) < 0.01
                        ? 'text-slate-500'
                        : isNetReceivable
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}
                  >
                    {formatINR(Math.abs(summary.netOutstanding))}
                  </span>
                </div>

                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition"
                  aria-label={isCollapsed ? 'Expand' : 'Collapse'}
                >
                  {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Sub-loans List */}
            {!isCollapsed && (
              <div className="p-3 bg-slate-50/50 space-y-2.5">
                {/* Person Sub-metrics Bar */}
                <div className="p-2.5 rounded-2xl bg-white border border-slate-200/60 flex items-center justify-between text-xs text-slate-600">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total Disbursed:</span>
                      <span className="font-bold text-slate-900">{formatINR(summary.totalPrincipal)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Total Repaid:</span>
                      <span className="font-bold text-emerald-700">{formatINR(summary.totalPaid)}</span>
                    </div>
                  </div>

                  {onOpenAddForPerson && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenAddForPerson(summary.personName, summary.mobileNumber);
                      }}
                      className="px-2.5 py-1 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-[11px] flex items-center gap-1 shadow-2xs transition"
                      title={`Give another credit to ${summary.personName}`}
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>New Credit</span>
                    </button>
                  )}
                </div>

                {/* Cards for each loan taken by this person */}
                <div className={isTabletGrid ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5' : 'space-y-2.5'}>
                  {summary.loans.map((loan) => (
                    <TransactionCard
                      key={loan.id}
                      loan={loan}
                      isSelected={selectedLoanId === loan.id}
                      onClick={() => onSelectLoan(loan.id)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
