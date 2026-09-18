package com.easymoneyledger.app.util

import com.easymoneyledger.app.data.local.entity.LoanEntity
import com.easymoneyledger.app.data.local.entity.LoanWithRepayments
import com.easymoneyledger.app.data.model.InterestFrequency
import com.easymoneyledger.app.data.model.InterestType
import com.easymoneyledger.app.data.model.LoanStatus
import java.text.NumberFormat
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale
import kotlin.math.max
import kotlin.math.roundToLong

data class CalculationResult(
    val principal: Double,
    val interestAmount: Double,
    val totalAmount: Double,
    val totalPaid: Double,
    val remainingBalance: Double,
    val daysElapsed: Long,
    val timeUnitFormatted: String,
    val formulaExplanation: String,
    val status: LoanStatus
)

object InterestCalculator {

    private val indianCurrencyFormat = NumberFormat.getCurrencyInstance(Locale("en", "IN"))

    fun formatCurrency(amount: Double): String {
        return "₹" + String.format(Locale.US, "%,.2f", amount)
    }

    fun formatDate(epochMillis: Long): String {
        val sdf = SimpleDateFormat("dd MMM yyyy", Locale.getDefault())
        return sdf.format(Date(epochMillis))
    }

    /**
     * Calculates Simple Interest:
     * Simple Interest = Principal × Rate × Time
     *
     * For monthly: Time in months = days / 30.0
     * For yearly: Time in years = days / 365.0
     */
    fun calculateLoan(
        loan: LoanEntity,
        repaymentsTotal: Double = 0.0,
        asOfDate: Long = loan.dueDate
    ): CalculationResult {
        val principal = loan.amount
        val timeDiffMillis = max(0L, asOfDate - loan.startDate)
        val daysElapsed = max(0L, timeDiffMillis / (1000L * 60L * 60L * 24L))

        val (interestAmount, timeUnitFormatted, formulaExplanation) = when (loan.interestType) {
            InterestType.NO_INTEREST -> {
                Triple(
                    0.0,
                    "$daysElapsed days",
                    "No Interest applied. Total = Principal (${formatCurrency(principal)})"
                )
            }
            InterestType.SIMPLE_INTEREST -> {
                val rateDecimal = loan.interestRate / 100.0
                if (loan.interestFrequency == InterestFrequency.MONTHLY) {
                    val months = daysElapsed / 30.0
                    val interest = principal * rateDecimal * months
                    val explanation = "${formatCurrency(principal)} × ${loan.interestRate}%/mo × ${String.format(Locale.US, "%.1f", months)} months ($daysElapsed days) = ${formatCurrency(interest)}"
                    Triple(interest, "${String.format(Locale.US, "%.1f", months)} months", explanation)
                } else {
                    val years = daysElapsed / 365.0
                    val interest = principal * rateDecimal * years
                    val explanation = "${formatCurrency(principal)} × ${loan.interestRate}%/yr × ${String.format(Locale.US, "%.2f", years)} years ($daysElapsed days) = ${formatCurrency(interest)}"
                    Triple(interest, "${String.format(Locale.US, "%.2f", years)} years", explanation)
                }
            }
        }

        val totalAmount = principal + interestAmount
        val remainingBalance = max(0.0, totalAmount - repaymentsTotal)
        val now = System.currentTimeMillis()

        val status = when {
            remainingBalance <= 0.01 -> LoanStatus.PAID
            repaymentsTotal > 0.01 -> LoanStatus.PARTIALLY_PAID
            now > loan.dueDate -> LoanStatus.OVERDUE
            else -> LoanStatus.PENDING
        }

        return CalculationResult(
            principal = principal,
            interestAmount = interestAmount,
            totalAmount = totalAmount,
            totalPaid = repaymentsTotal,
            remainingBalance = remainingBalance,
            daysElapsed = daysElapsed,
            timeUnitFormatted = timeUnitFormatted,
            formulaExplanation = formulaExplanation,
            status = status
        )
    }

    fun calculateLoanWithRepayments(loanWithRepayments: LoanWithRepayments): CalculationResult {
        val totalPaid = loanWithRepayments.repayments.sumOf { it.amount }
        return calculateLoan(loanWithRepayments.loan, totalPaid)
    }
}
