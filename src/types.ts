export type TransactionType = 'GIVEN' | 'TAKEN';
export type InterestType = 'NO_INTEREST' | 'SIMPLE_INTEREST';
export type InterestFrequency = 'MONTHLY' | 'YEARLY';
export type LoanStatus = 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE';
export type TransactionMedium = 'CASH' | 'UPI' | 'BANK_TRANSFER' | 'CHEQUE' | 'OTHER_ONLINE';

export const DEFAULT_LOAN_CATEGORIES = [
  'Personal',
  'Business',
  'Medical',
  'Education',
  'Home',
  'Emergency',
  'Other',
] as const;

export type LoanCategory = (typeof DEFAULT_LOAN_CATEGORIES)[number] | string;

export interface Repayment {
  id: string;
  loanId: string;
  amount: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMedium?: TransactionMedium; // Cash, UPI, Bank Transfer, Cheque, Other Online
  transactionRef?: string; // e.g. UPI Ref / UTR / Cheque # / Bank Trans ID
  notes?: string;
  createdAt: number;
}

export interface AdditionalCredit {
  id: string;
  loanId: string;
  amount: number;
  date: string; // YYYY-MM-DD
  paymentMedium?: TransactionMedium; // Cash, UPI, Bank Transfer, etc.
  transactionRef?: string;
  notes?: string;
  createdAt: number;
}

export interface Loan {
  id: string;
  personName: string;
  mobileNumber?: string;
  amount: number; // Initial Principal
  paymentMedium?: TransactionMedium; // Initial disbursement medium (Cash, UPI, etc.)
  transactionRef?: string; // Reference number or UTR
  additionalCredits?: AdditionalCredit[]; // Multiple credits / top-ups taken over time
  transactionType: TransactionType; // 'GIVEN' (Money Lent) | 'TAKEN' (Money Borrowed)
  category?: string; // e.g. 'Personal', 'Business', 'Medical'
  interestType: InterestType;
  interestRate: number; // e.g. 2 for 2%
  interestFrequency: InterestFrequency; // 'MONTHLY' | 'YEARLY'
  startDate: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD (optional if indefinite / no due date)
  hasIndefiniteDueDate?: boolean; // True if loan has no fixed or indefinite due date
  notes?: string;
  createdAt: number;
  repayments: Repayment[];
}

export interface CalculationResult {
  principal: number; // Total Principal (initial + additional credits)
  initialPrincipal: number;
  additionalCreditsTotal: number;
  interestAmount: number;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  daysElapsed: number;
  timeFormatted: string;
  formulaExplanation: string;
  status: LoanStatus;
}

export interface DashboardSummary {
  totalMoneyGave: number;
  totalMoneyTook: number;
  totalInterest: number;
  totalReceivable: number;
  totalPayable: number;
}
