import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Calendar, CalendarOff, Phone, ChevronRight } from 'lucide-react';
import { Loan, LoanStatus } from '../types';
import { calculateLoan, formatINR, formatDateStr } from '../utils/interestCalculator';
import { getCategoryTheme } from '../utils/categoryUtils';
import { TransactionMediumBadge } from '../utils/mediumUtils';

interface TransactionCardProps {
  loan: Loan;
  onClick: () => void;
  isSelected?: boolean;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ loan, onClick, isSelected = false }) => {
  const calc = calculateLoan(loan);
  const isGiven = loan.transactionType === 'GIVEN';
  const categoryTheme = getCategoryTheme(loan.category);

  const getStatusBadge = (status: LoanStatus) => {
    switch (status) {
      case 'PAID':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Paid</span>;
      case 'PARTIALLY_PAID':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">Partially Paid</span>;
      case 'OVERDUE':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Overdue</span>;
      case 'PENDING':
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-200">Pending</span>;
    }
  };

  return (
    <div
      onClick={onClick}
      className={`rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.99] group border ${
        isSelected
          ? 'bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-sm'
          : 'bg-white border-slate-200/80 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
              isGiven ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
            }`}
          >
            {isGiven ? <ArrowUpRight className="w-5 h-5" /> : <ArrowDownLeft className="w-5 h-5" />}
          </div>
          <div>
            <h4 className="font-bold text-slate-900 text-base leading-tight group-hover:text-emerald-700 transition">
              {loan.personName}
            </h4>
            <div className="flex items-center flex-wrap gap-1.5 mt-0.5">
              <span className="text-[11px] text-slate-500 font-medium">
                {isGiven ? 'Money Given' : 'Money Taken'}
              </span>
              <TransactionMediumBadge medium={loan.paymentMedium || 'CASH'} />
              {loan.category && (
                <span
                  className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${categoryTheme.badgeBg} ${categoryTheme.badgeText} ${categoryTheme.badgeBorder}`}
                >
                  {categoryTheme.icon}
                  <span>{loan.category}</span>
                </span>
              )}
              {loan.mobileNumber && (
                <span className="text-[11px] text-slate-400 flex items-center gap-0.5">
                  • <Phone className="w-2.5 h-2.5 inline" /> {loan.mobileNumber}
                </span>
              )}
            </div>
          </div>
        </div>

        <div>{getStatusBadge(calc.status)}</div>
      </div>

      <div className="mt-3.5 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2">
        <div>
          <span className="text-[11px] text-slate-400 block font-medium">Principal</span>
          <span className="text-sm font-semibold text-slate-800">{formatINR(calc.principal)}</span>
          {calc.interestAmount > 0 && (
            <span className="text-[10px] text-amber-600 block">
              +{formatINR(calc.interestAmount)} interest ({loan.interestRate}% {loan.interestFrequency.toLowerCase()})
            </span>
          )}
        </div>

        <div className="text-right">
          <span className="text-[11px] text-slate-400 block font-medium">
            {isGiven ? 'Remaining to Receive' : 'Remaining to Pay'}
          </span>
          <span
            className={`text-base font-extrabold ${
              isGiven ? 'text-emerald-600' : 'text-rose-600'
            }`}
          >
            {formatINR(calc.remainingBalance)}
          </span>
          {calc.totalPaid > 0 && (
            <span className="text-[10px] text-emerald-600 block">Paid: {formatINR(calc.totalPaid)}</span>
          )}
        </div>
      </div>

      <div className="mt-2 pt-2 border-t border-dashed border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          {loan.hasIndefiniteDueDate || !loan.dueDate ? (
            <>
              <CalendarOff className="w-3 h-3 text-amber-600" />
              <span className="text-amber-800 font-medium">No Due Date (Indefinite)</span>
            </>
          ) : (
            <>
              <Calendar className="w-3 h-3 text-slate-400" />
              <span className={calc.status === 'OVERDUE' ? 'text-rose-600 font-semibold' : ''}>
                Due: {formatDateStr(loan.dueDate)}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1 text-emerald-700 font-medium group-hover:translate-x-0.5 transition-transform">
          <span>View Details</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};
