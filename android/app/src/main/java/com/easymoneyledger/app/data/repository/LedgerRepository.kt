package com.easymoneyledger.app.data.repository

import com.easymoneyledger.app.data.local.dao.LoanDao
import com.easymoneyledger.app.data.local.dao.RepaymentDao
import com.easymoneyledger.app.data.local.entity.LoanEntity
import com.easymoneyledger.app.data.local.entity.LoanWithRepayments
import com.easymoneyledger.app.data.local.entity.RepaymentEntity
import com.easymoneyledger.app.data.model.DashboardSummary
import com.easymoneyledger.app.data.model.TransactionType
import com.easymoneyledger.app.util.InterestCalculator
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map

class LedgerRepository(
    private val loanDao: LoanDao,
    private val repaymentDao: RepaymentDao
) {

    val allLoansWithRepayments: Flow<List<LoanWithRepayments>> =
        loanDao.getAllLoansWithRepayments()

    fun getLoanById(id: Long): Flow<LoanWithRepayments?> =
        loanDao.getLoanWithRepaymentsById(id)

    suspend fun getLoanByIdSync(id: Long): LoanWithRepayments? =
        loanDao.getLoanWithRepaymentsByIdSync(id)

    suspend fun insertLoan(loan: LoanEntity): Long =
        loanDao.insertLoan(loan)

    suspend fun updateLoan(loan: LoanEntity) =
        loanDao.updateLoan(loan)

    suspend fun deleteLoanById(id: Long) =
        loanDao.deleteLoanById(id)

    suspend fun addRepayment(loanId: Long, amount: Double, paymentDate: Long, notes: String?): Long {
        val repayment = RepaymentEntity(
            loanId = loanId,
            amount = amount,
            paymentDate = paymentDate,
            notes = notes
        )
        return repaymentDao.insertRepayment(repayment)
    }

    suspend fun deleteRepayment(repayment: RepaymentEntity) =
        repaymentDao.deleteRepayment(repayment)

    val dashboardSummary: Flow<DashboardSummary> = allLoansWithRepayments.map { list ->
        var gaveTotal = 0.0
        var tookTotal = 0.0
        var totalInterest = 0.0
        var totalReceivable = 0.0
        var totalPayable = 0.0

        for (item in list) {
            val calc = InterestCalculator.calculateLoanWithRepayments(item)
            totalInterest += calc.interestAmount
            if (item.loan.transactionType == TransactionType.GIVEN) {
                gaveTotal += calc.principal
                totalReceivable += calc.remainingBalance
            } else {
                tookTotal += calc.principal
                totalPayable += calc.remainingBalance
            }
        }

        DashboardSummary(
            totalMoneyGave = gaveTotal,
            totalMoneyTook = tookTotal,
            totalInterest = totalInterest,
            totalReceivable = totalReceivable,
            totalPayable = totalPayable
        )
    }

    suspend fun restoreAllData(loans: List<LoanEntity>, repayments: List<RepaymentEntity>) {
        loanDao.clearAllLoans()
        repaymentDao.clearAllRepayments()
        loanDao.insertAllLoans(loans)
        repaymentDao.insertAllRepayments(repayments)
    }

    suspend fun getAllRepaymentsSync(): List<RepaymentEntity> =
        repaymentDao.getAllRepaymentsSync()
}
