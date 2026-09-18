# Easy Money Ledger (Android Project)

A complete offline personal loan and borrowing ledger app built with **Kotlin**, **Jetpack Compose**, **Material 3**, and **Room Database**.

## Key Features

1. **Money Lent & Borrowed Tracking**
   - Record "Money Given" (Receivable) and "Money Taken" (Payable)
   - Add Person Name, Mobile Number (optional with 1-tap call shortcut)
   - Add Notes / Purpose

2. **Accurate Simple Interest Calculation**
   - Formula: `Simple Interest = Principal × Rate × Time`
   - **Monthly calculation**: Time in months computed from elapsed days (`days / 30.0`)
   - **Yearly calculation**: Time in years computed from elapsed days (`days / 365.0`)
   - Clear live step-by-step breakdown displayed to prevent any confusion

3. **Repayment Tracking**
   - Add partial or full repayments with custom date and notes
   - Instant dynamic recalculation of remaining balance and status (`Pending`, `Partially Paid`, `Paid`, `Overdue`)

4. **Search and Filtering**
   - Live search by Person Name or Mobile Number
   - Filters for: `Money Given`, `Money Taken`, `Paid`, `Partially Paid`, `Pending`, `Overdue`

5. **100% Offline & Local Room Database**
   - Offline SQLite Room Database with cascading repayments
   - No financial data sent to any remote server

6. **Local JSON Backup & Restore**
   - Export full backup to a local `.json` file
   - Share backup via WhatsApp / Drive / Email
   - 1-click restore from JSON backup

7. **App Security: 4-Digit PIN Lock**
   - Set custom PIN with SHA-256 local verification
   - Auto-locks on app exit

8. **Notification Reminders**
   - WorkManager daily background worker checking for due dates within 48h and overdue debts

## How to Open in Android Studio

1. Open Android Studio (Ladybug / Hedgehog / Iguana / Koala or newer)
2. Select **Open Project** and navigate to this `android/` directory
3. Allow Gradle to sync dependencies
4. Click **Run** (`Shift + F10`) or **Build > Build Bundle(s) / APK(s) > Build APK(s)**
