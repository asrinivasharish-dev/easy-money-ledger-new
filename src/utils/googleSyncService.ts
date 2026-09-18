import {
  auth,
  googleProvider,
  signInWithPopup,
  firebaseSignOut,
  db,
  doc,
  setDoc,
  deleteDoc,
  collection,
  getDocs,
  writeBatch,
  User,
} from '../firebase';
import { Loan } from '../types';

export type SyncStatus = 'LOCAL_ONLY' | 'SYNCING' | 'SYNCED' | 'ERROR';

export interface SyncState {
  user: User | null;
  status: SyncStatus;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  isCloudReady: boolean;
}

// Convert a loan to safe Firestore data
export function sanitizeLoanForFirestore(loan: Loan, userId: string): Record<string, any> {
  const data: Record<string, any> = {
    id: loan.id,
    userId,
    personName: loan.personName.trim().slice(0, 200),
    amount: Math.max(0.01, Number(loan.amount) || 0),
    transactionType: loan.transactionType,
    category: loan.category ? loan.category.trim().slice(0, 50) : 'Personal',
    interestType: loan.interestType,
    interestRate: Math.max(0, Number(loan.interestRate) || 0),
    interestFrequency: loan.interestFrequency || 'MONTHLY',
    startDate: loan.startDate || new Date().toISOString().split('T')[0],
    dueDate: loan.hasIndefiniteDueDate ? '' : (loan.dueDate || ''),
    hasIndefiniteDueDate: Boolean(loan.hasIndefiniteDueDate || !loan.dueDate),
    paymentMedium: loan.paymentMedium || 'CASH',
    transactionRef: loan.transactionRef ? loan.transactionRef.trim().slice(0, 100) : '',
    additionalCredits: (loan.additionalCredits || []).map((c) => ({
      id: c.id,
      loanId: c.loanId,
      amount: Math.max(0, Number(c.amount) || 0),
      date: c.date || new Date().toISOString().split('T')[0],
      paymentMedium: c.paymentMedium || 'CASH',
      transactionRef: c.transactionRef ? c.transactionRef.trim().slice(0, 100) : '',
      notes: (c.notes || '').slice(0, 500),
      createdAt: Number(c.createdAt) || Date.now(),
    })),
    repayments: (loan.repayments || []).map((r) => ({
      id: r.id,
      loanId: r.loanId,
      amount: Math.max(0, Number(r.amount) || 0),
      paymentDate: r.paymentDate,
      paymentMedium: r.paymentMedium || 'UPI',
      transactionRef: r.transactionRef ? r.transactionRef.trim().slice(0, 100) : '',
      notes: (r.notes || '').slice(0, 500),
      createdAt: Number(r.createdAt) || Date.now(),
    })),
    createdAt: Number(loan.createdAt) || Date.now(),
    updatedAt: Date.now(),
  };

  if (loan.mobileNumber && loan.mobileNumber.trim()) {
    data.mobileNumber = loan.mobileNumber.trim().slice(0, 30);
  }
  if (loan.notes && loan.notes.trim()) {
    data.notes = loan.notes.trim().slice(0, 2000);
  }

  return data;
}

// Convert Firestore document back to Loan
export function convertDocToLoan(data: any): Loan {
  return {
    id: data.id,
    personName: data.personName || 'Unnamed',
    mobileNumber: data.mobileNumber || '',
    amount: Number(data.amount) || 0,
    paymentMedium: data.paymentMedium || 'CASH',
    transactionRef: data.transactionRef || '',
    transactionType: data.transactionType === 'TAKEN' ? 'TAKEN' : 'GIVEN',
    category: data.category || 'Personal',
    interestType: data.interestType === 'SIMPLE_INTEREST' ? 'SIMPLE_INTEREST' : 'NO_INTEREST',
    interestRate: Number(data.interestRate) || 0,
    interestFrequency: data.interestFrequency === 'YEARLY' ? 'YEARLY' : 'MONTHLY',
    startDate: data.startDate || new Date().toISOString().split('T')[0],
    dueDate: data.dueDate || '',
    hasIndefiniteDueDate: Boolean(data.hasIndefiniteDueDate || !data.dueDate || data.dueDate === 'INDEFINITE'),
    notes: data.notes || '',
    createdAt: Number(data.createdAt) || Date.now(),
    additionalCredits: Array.isArray(data.additionalCredits)
      ? data.additionalCredits.map((c: any) => ({
          id: c.id || 'cred-' + Math.random().toString(36).substring(2, 9),
          loanId: c.loanId || data.id,
          amount: Number(c.amount) || 0,
          date: c.date || new Date().toISOString().split('T')[0],
          paymentMedium: c.paymentMedium || 'CASH',
          transactionRef: c.transactionRef || '',
          notes: c.notes || '',
          createdAt: Number(c.createdAt) || Date.now(),
        }))
      : [],
    repayments: Array.isArray(data.repayments)
      ? data.repayments.map((r: any) => ({
          id: r.id || 'rep-' + Math.random().toString(36).substring(2, 9),
          loanId: r.loanId || data.id,
          amount: Number(r.amount) || 0,
          paymentDate: r.paymentDate || new Date().toISOString().split('T')[0],
          paymentMedium: r.paymentMedium || 'UPI',
          transactionRef: r.transactionRef || '',
          notes: r.notes || '',
          createdAt: Number(r.createdAt) || Date.now(),
        }))
      : [],
  };
}

// Sign in with Google Popup
export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

// Sign out
export async function logoutGoogle(): Promise<void> {
  await firebaseSignOut(auth);
}

// Push a single loan to cloud
export async function saveLoanToCloud(userId: string, loan: Loan): Promise<void> {
  const payload = sanitizeLoanForFirestore(loan, userId);
  const loanRef = doc(db, 'users', userId, 'loans', loan.id);
  await setDoc(loanRef, payload, { merge: true });
}

// Delete loan from cloud
export async function deleteLoanFromCloud(userId: string, loanId: string): Promise<void> {
  const loanRef = doc(db, 'users', userId, 'loans', loanId);
  await deleteDoc(loanRef);
}

// Batch upload all local loans into cloud (initial migration/sync)
export async function uploadLoansBatch(userId: string, loans: Loan[]): Promise<void> {
  if (loans.length === 0) return;
  const batch = writeBatch(db);
  for (const loan of loans) {
    const payload = sanitizeLoanForFirestore(loan, userId);
    const loanRef = doc(db, 'users', userId, 'loans', loan.id);
    batch.set(loanRef, payload, { merge: true });
  }
  await batch.commit();
}

// Fetch all cloud loans once (for fallback or manual sync)
export async function fetchCloudLoans(userId: string): Promise<Loan[]> {
  const colRef = collection(db, 'users', userId, 'loans');
  const snapshot = await getDocs(colRef);
  const cloudLoans: Loan[] = [];
  snapshot.forEach((docSnap) => {
    cloudLoans.push(convertDocToLoan(docSnap.data()));
  });
  return cloudLoans.sort((a, b) => b.createdAt - a.createdAt);
}
