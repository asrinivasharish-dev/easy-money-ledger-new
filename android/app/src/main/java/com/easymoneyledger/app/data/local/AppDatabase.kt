package com.easymoneyledger.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
import androidx.room.TypeConverters
import com.easymoneyledger.app.data.local.dao.LoanDao
import com.easymoneyledger.app.data.local.dao.RepaymentDao
import com.easymoneyledger.app.data.local.entity.LoanEntity
import com.easymoneyledger.app.data.local.entity.RepaymentEntity

@Database(
    entities = [LoanEntity::class, RepaymentEntity::class],
    version = 1,
    exportSchema = false
)
abstract class AppDatabase : RoomDatabase() {
    abstract fun loanDao(): LoanDao
    abstract fun repaymentDao(): RepaymentDao

    companion object {
        @Volatile
        private var INSTANCE: AppDatabase? = null

        fun getDatabase(context: Context): AppDatabase {
            return INSTANCE ?: synchronized(this) {
                val instance = Room.databaseBuilder(
                    context.applicationContext,
                    AppDatabase::class.java,
                    "easy_money_ledger.db"
                ).fallbackToDestructiveMigration().build()
                INSTANCE = instance
                instance
            }
        }
    }
}
