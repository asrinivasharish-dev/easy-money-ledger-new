package com.easymoneyledger.app.data.local.dao

import androidx.room.Dao
import androidx.room.Delete
import androidx.room.Insert
import androidx.room.OnConflictStrategy
import androidx.room.Query
import androidx.room.Transaction
import androidx.room.Update
import com.easymoneyledger.app.data.local.entity.LoanEntity
import com.easymoneyledger.app.data.local.entity.LoanWithRepayments
import com.easymoneyledger.app.data.local.entity.RepaymentEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface LoanDao {
    @Transaction
    @Query("SELECT * FROM loans ORDER BY createdAt DESC")
    fun getAllLoansWithRepayments(): Flow<List<LoanWithRepayments>>

    @Transaction
    @Query("SELECT * FROM loans WHERE id = :id LIMIT 1")
    fun getLoanWithRepaymentsById(id: Long): Flow<LoanWithRepayments?>

    @Transaction
    @Query("SELECT * FROM loans WHERE id = :id LIMIT 1")
    suspend fun getLoanWithRepaymentsByIdSync(id: Long): LoanWithRepayments?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertLoan(loan: LoanEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAllLoans(loans: List<LoanEntity>)

    @Update
    suspend fun updateLoan(loan: LoanEntity)

    @Delete
    suspend fun deleteLoan(loan: LoanEntity)

    @Query("DELETE FROM loans WHERE id = :id")
    suspend fun deleteLoanById(id: Long)

    @Query("DELETE FROM loans")
    suspend fun clearAllLoans()
}

@Dao
interface RepaymentDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertRepayment(repayment: RepaymentEntity): Long

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAllRepayments(repayments: List<RepaymentEntity>)

    @Delete
    suspend fun deleteRepayment(repayment: RepaymentEntity)

    @Query("SELECT * FROM repayments WHERE loanId = :loanId ORDER BY paymentDate DESC")
    fun getRepaymentsForLoan(loanId: Long): Flow<List<RepaymentEntity>>

    @Query("SELECT * FROM repayments")
    suspend fun getAllRepaymentsSync(): List<RepaymentEntity>

    @Query("DELETE FROM repayments")
    suspend fun clearAllRepayments()
}
