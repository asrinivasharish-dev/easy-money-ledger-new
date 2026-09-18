package com.easymoneyledger.app

import android.app.Application
import com.easymoneyledger.app.util.NotificationHelper

class LedgerApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Initialize notification channel for due date and overdue reminders
        NotificationHelper.createNotificationChannel(this)

        // Schedule daily background check worker for upcoming/overdue payments
        NotificationHelper.scheduleDailyReminderWorker(this)
    }
}
