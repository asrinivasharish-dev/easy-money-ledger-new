package com.easymoneyledger.app.util

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import com.easymoneyledger.app.data.local.AppDatabase
import com.easymoneyledger.app.data.model.LoanStatus
import kotlinx.coroutines.flow.firstOrNull
import java.util.concurrent.TimeUnit

object NotificationHelper {
    const val CHANNEL_ID = "loan_reminders_channel"
    private const val CHANNEL_NAME = "Loan Due & Overdue Reminders"

    fun createNotificationChannel(context: Context) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                CHANNEL_NAME,
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifies when personal loans or borrowings are due or overdue"
            }
            val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            manager.createNotificationChannel(channel)
        }
    }

    fun scheduleDailyReminderWorker(context: Context) {
        val workRequest = PeriodicWorkRequestBuilder<LoanReminderWorker>(24, TimeUnit.HOURS)
            .build()
        WorkManager.getInstance(context).enqueueUniquePeriodicWork(
            "EasyMoneyLedgerReminder",
            ExistingPeriodicWorkPolicy.KEEP,
            workRequest
        )
    }

    fun showNotification(context: Context, id: Int, title: String, message: String) {
        val manager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        val builder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setContentTitle(title)
            .setContentText(message)
            .setStyle(NotificationCompat.BigTextStyle().bigText(message))
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)

        manager.notify(id, builder.build())
    }
}

class LoanReminderWorker(
    private val context: Context,
    workerParams: WorkerParameters
) : CoroutineWorker(context, workerParams) {

    override suspend fun doWork(): Result {
        return try {
            val db = AppDatabase.getDatabase(context)
            val loans = db.loanDao().getAllLoansWithRepayments().firstOrNull() ?: emptyList()
            val now = System.currentTimeMillis()
            val oneDayMillis = 24 * 60 * 60 * 1000L

            var overdueCount = 0
            var upcomingCount = 0

            for (item in loans) {
                val calc = InterestCalculator.calculateLoanWithRepayments(item)
                if (calc.status == LoanStatus.PAID) continue

                val diff = item.loan.dueDate - now
                if (diff < 0) {
                    overdueCount++
                } else if (diff <= 2 * oneDayMillis) {
                    upcomingCount++
                }
            }

            if (overdueCount > 0) {
                NotificationHelper.showNotification(
                    context,
                    1001,
                    "Easy Money Ledger: Overdue Alert",
                    "You have $overdueCount overdue loan(s). Check your ledger to settle."
                )
            } else if (upcomingCount > 0) {
                NotificationHelper.showNotification(
                    context,
                    1002,
                    "Easy Money Ledger: Upcoming Due Date",
                    "You have $upcomingCount loan(s) due in the next 48 hours."
                )
            }

            Result.success()
        } catch (e: Exception) {
            Result.retry()
        }
    }
}
