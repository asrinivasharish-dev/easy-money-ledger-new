package com.easymoneyledger.app.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey
import com.easymoneyledger.app.data.model.InterestFrequency
import com.easymoneyledger.app.data.model.InterestType
import com.easymoneyledger.app.data.model.TransactionType

@Entity(tableName = "loans")
data class LoanEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val personName: String,
    val mobileNumber: String? = null,
    val amount: Double,
    val transactionType: TransactionType,
    val interestType: InterestType = InterestType.NO_INTEREST,
    val interestRate: Double = 0.0,
    val interestFrequency: InterestFrequency = InterestFrequency.MONTHLY,
    val startDate: Long,
    val dueDate: Long,
    val notes: String? = null,
    val isArchived: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
