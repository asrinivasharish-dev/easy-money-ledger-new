import { Loan } from '../types';

export const INITIAL_LOANS: Loan[] = [
  {
    id: 'loan-1',
    personName: 'Rahul Sharma',
    mobileNumber: '+91 98765 43210',
    amount: 10000,
    transactionType: 'GIVEN',
    category: 'Personal',
    interestType: 'SIMPLE_INTEREST',
    interestRate: 2.0,
    interestFrequency: 'MONTHLY',
    startDate: '2026-06-01',
    dueDate: '2026-09-01',
    notes: 'Personal emergency help for bike repair',
    createdAt: Date.now() - 90 * 86400000,
    repayments: [
      {
        id: 'rep-1',
        loanId: 'loan-1',
        amount: 3000,
        paymentDate: '2026-07-15',
        notes: 'GPay payment instalment 1',
        createdAt: Date.now() - 45 * 86400000
      }
    ]
  },
  {
    id: 'loan-2',
    personName: 'Suresh Kumar',
    mobileNumber: '+91 91234 56789',
    amount: 25000,
    transactionType: 'TAKEN',
    category: 'Business',
    interestType: 'SIMPLE_INTEREST',
    interestRate: 12.0,
    interestFrequency: 'YEARLY',
    startDate: '2026-05-15',
    dueDate: '2026-11-15',
    notes: 'Shop inventory purchase advance',
    createdAt: Date.now() - 110 * 86400000,
    repayments: [
      {
        id: 'rep-2',
        loanId: 'loan-2',
        amount: 5000,
        paymentDate: '2026-08-01',
        notes: 'Cash payment towards principal',
        createdAt: Date.now() - 30 * 86400000
      }
    ]
  },
  {
    id: 'loan-3',
    personName: 'Priya Patel',
    mobileNumber: '+91 99887 76655',
    amount: 5000,
    transactionType: 'GIVEN',
    category: 'Education',
    interestType: 'NO_INTEREST',
    interestRate: 0,
    interestFrequency: 'MONTHLY',
    startDate: '2026-07-01',
    dueDate: '2026-08-15',
    notes: 'College textbooks advance',
    createdAt: Date.now() - 60 * 86400000,
    repayments: []
  },
  {
    id: 'loan-4',
    personName: 'Amit Verma',
    mobileNumber: '+91 98111 22334',
    amount: 15000,
    paymentMedium: 'UPI',
    transactionType: 'GIVEN',
    category: 'Friends & Family',
    interestType: 'NO_INTEREST',
    interestRate: 0,
    interestFrequency: 'MONTHLY',
    startDate: '2026-08-01',
    dueDate: '',
    hasIndefiniteDueDate: true,
    notes: 'Friendly loan for family function — open return date',
    createdAt: Date.now() - 30 * 86400000,
    repayments: []
  }
];
