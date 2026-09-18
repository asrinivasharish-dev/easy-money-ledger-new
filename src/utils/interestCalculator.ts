import { Loan, CalculationResult, LoanStatus } from '../types';

export function formatINR(val: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
    minimumFractionDigits: val % 1 === 0 ? 0 : 2
  }).format(val);
}

export function formatDateStr(dateStr?: string): string {
  if (!dateStr || dateStr === 'INDEFINITE') return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDueDate(loan?: { dueDate?: string; hasIndefiniteDueDate?: boolean } | null): string {
  if (!loan || loan.hasIndefiniteDueDate || !loan.dueDate || loan.dueDate === 'INDEFINITE') {
    return 'No Due Date (Indefinite)';
  }
  return formatDateStr(loan.dueDate);
}

export function calculateLoan(loan: Loan, asOfDateStr?: string): CalculationResult {
  const initialPrincipal = Number(loan.amount) || 0;
  const additionalCredits = loan.additionalCredits || [];
  const additionalCreditsTotal = additionalCredits.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const principal = initialPrincipal + additionalCreditsTotal;

  const todayStr = new Date().toISOString().split('T')[0];
  const hasDueDate = Boolean(loan.dueDate && !loan.hasIndefiniteDueDate && loan.dueDate !== 'INDEFINITE');

  const start = new Date(loan.startDate + 'T00:00:00').getTime();
  const endDateStr = asOfDateStr || (hasDueDate ? loan.dueDate! : todayStr);
  const end = new Date(endDateStr + 'T00:00:00').getTime();

  const diffMillis = Math.max(0, end - start);
  const daysElapsed = Math.max(0, Math.round(diffMillis / (1000 * 60 * 60 * 24)));

  let interestAmount = 0;
  let timeFormatted = `${daysElapsed} days`;
  let formulaExplanation = '';

  if (loan.interestType === 'NO_INTEREST' || !loan.interestRate || loan.interestRate <= 0) {
    interestAmount = 0;
    if (additionalCreditsTotal > 0) {
      formulaExplanation = `No interest. Initial (${formatINR(initialPrincipal)}) + ${additionalCredits.length} credit top-up(s) (${formatINR(additionalCreditsTotal)}) = ${formatINR(principal)}`;
    } else {
      formulaExplanation = `No interest applied. Total = Principal (${formatINR(principal)})`;
    }
  } else {
    const rateDecimal = loan.interestRate / 100;
    let initialInterest = 0;

    if (loan.interestFrequency === 'MONTHLY') {
      const months = daysElapsed / 30;
      initialInterest = initialPrincipal * rateDecimal * months;
      timeFormatted = `${months.toFixed(1)} months`;
    } else {
      const years = daysElapsed / 365;
      initialInterest = initialPrincipal * rateDecimal * years;
      timeFormatted = `${years.toFixed(2)} years`;
    }

    let topUpInterest = 0;
    additionalCredits.forEach((c) => {
      const cDate = new Date((c.date || loan.startDate) + 'T00:00:00').getTime();
      const cDays = Math.max(0, Math.round(Math.max(0, end - cDate) / (1000 * 60 * 60 * 24)));
      const cAmt = Number(c.amount) || 0;
      if (loan.interestFrequency === 'MONTHLY') {
        topUpInterest += cAmt * rateDecimal * (cDays / 30);
      } else {
        topUpInterest += cAmt * rateDecimal * (cDays / 365);
      }
    });

    interestAmount = initialInterest + topUpInterest;

    if (additionalCreditsTotal > 0) {
      formulaExplanation = `${formatINR(initialPrincipal)} initial (${daysElapsed}d) + ${formatINR(additionalCreditsTotal)} across ${additionalCredits.length} top-up(s) @ ${loan.interestRate}%/${loan.interestFrequency === 'MONTHLY' ? 'mo' : 'yr'} = ${formatINR(interestAmount)} interest`;
    } else if (loan.interestFrequency === 'MONTHLY') {
      const months = daysElapsed / 30;
      formulaExplanation = `${formatINR(principal)} × ${loan.interestRate}%/mo × ${months.toFixed(1)} months (${daysElapsed} days) = ${formatINR(interestAmount)}`;
    } else {
      const years = daysElapsed / 365;
      formulaExplanation = `${formatINR(principal)} × ${loan.interestRate}%/yr × ${years.toFixed(2)} years (${daysElapsed} days) = ${formatINR(interestAmount)}`;
    }
  }

  // Round interest to 2 decimals
  interestAmount = Math.round(interestAmount * 100) / 100;

  const totalAmount = Math.round((principal + interestAmount) * 100) / 100;
  const totalPaid = (loan.repayments || []).reduce((sum, r) => sum + (Number(r.amount) || 0), 0);
  const remainingBalance = Math.max(0, Math.round((totalAmount - totalPaid) * 100) / 100);

  const isPastDue = Boolean(hasDueDate && loan.dueDate && todayStr > loan.dueDate);

  let status: LoanStatus = 'PENDING';
  if (remainingBalance <= 0.01) {
    status = 'PAID';
  } else if (totalPaid > 0.01) {
    status = isPastDue ? 'OVERDUE' : 'PARTIALLY_PAID';
  } else if (isPastDue) {
    status = 'OVERDUE';
  } else {
    status = 'PENDING';
  }

  return {
    principal,
    initialPrincipal,
    additionalCreditsTotal,
    interestAmount,
    totalAmount,
    totalPaid,
    remainingBalance,
    daysElapsed,
    timeFormatted,
    formulaExplanation,
    status
  };
}
