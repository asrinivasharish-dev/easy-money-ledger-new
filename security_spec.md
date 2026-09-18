# Security Specification - Easy Money Ledger (Multi-Device Sync)

## 1. Data Invariants
- Each user can only read, create, update, and delete their own loan records (`users/{userId}/loans/{loanId}`).
- `userId` must match the authenticated Google account UID (`request.auth.uid`).
- Unauthenticated access is denied for all ledger data.
- The `id` path variable must be a valid document ID string.
- Financial numbers (`amount`, `interestRate`) must be non-negative valid numbers.
- `transactionType` must strictly be either `'GIVEN'` or `'TAKEN'`.
- `interestType` must strictly be either `'NO_INTEREST'` or `'SIMPLE_INTEREST'`.
- `interestFrequency` must strictly be either `'MONTHLY'` or `'YEARLY'`.

## 2. The Dirty Dozen Payloads (Targeting Exploits)
1. **Unauthenticated Read:** Request from an unauthenticated user to `/users/user123/loans` -> DENIED.
2. **Cross-User Snooping:** User A attempting to read `/users/userB/loans/loan1` -> DENIED.
3. **Cross-User Writing:** User A attempting to create a loan in `/users/userB/loans/loan1` -> DENIED.
4. **Forged Owner UID:** User A creating a loan in their own path but with `userId: "admin"` -> DENIED.
5. **Path Traversal / ID Injection:** Document ID containing forbidden characters like `../../etc` -> DENIED (`isValidId`).
6. **Negative Principal Amount:** Creating a loan with `amount: -5000` -> DENIED.
7. **Gigantic String Payload (Denial of Wallet):** `personName` exceeding 200 characters -> DENIED.
8. **Invalid Transaction Type:** `transactionType: "STOLEN"` -> DENIED.
9. **Invalid Interest Type:** `interestType: "COMPOUND"` -> DENIED.
10. **Corrupted Repayments Array:** `repayments` array with more than 500 entries -> DENIED.
11. **Malicious Map Injection:** Extra unexpected administrative fields inserted -> DENIED.
12. **Blanket Query Exploitation:** Collection group query attempting to list all loans across all users -> DENIED.
