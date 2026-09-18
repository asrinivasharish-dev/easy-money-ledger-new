package com.easymoneyledger.app.util

import android.content.Context
import com.easymoneyledger.app.data.local.entity.LoanEntity
import com.easymoneyledger.app.data.local.entity.RepaymentEntity
import com.google.gson.Gson
import com.google.gson.GsonBuilder
import java.io.File
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

data class LedgerBackupData(
    val appVersion: String = "1.0.0",
    val backupDate: Long = System.currentTimeMillis(),
    val loans: List<LoanEntity>,
    val repayments: List<RepaymentEntity>
)

object BackupRestoreHelper {
    private val gson: Gson = GsonBuilder().setPrettyPrinting().create()

    fun createBackupJson(loans: List<LoanEntity>, repayments: List<RepaymentEntity>): String {
        val backup = LedgerBackupData(
            loans = loans,
            repayments = repayments
        )
        return gson.toJson(backup)
    }

    fun parseBackupJson(jsonString: String): LedgerBackupData {
        return gson.fromJson(jsonString, LedgerBackupData::class.java)
    }

    fun saveBackupToLocalFile(context: Context, jsonString: String): File {
        val timeStamp = SimpleDateFormat("yyyyMMdd_HHmmss", Locale.getDefault()).format(Date())
        val fileName = "easy_money_ledger_backup_$timeStamp.json"
        val dir = File(context.filesDir, "backups")
        if (!dir.exists()) dir.mkdirs()
        val file = File(dir, fileName)
        file.writeText(jsonString)
        return file
    }

    fun getLocalBackups(context: Context): List<File> {
        val dir = File(context.filesDir, "backups")
        if (!dir.exists()) return emptyList()
        return dir.listFiles()?.filter { it.extension == "json" }?.sortedByDescending { it.lastModified() } ?: emptyList()
    }
}
