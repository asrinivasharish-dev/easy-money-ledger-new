package com.easymoneyledger.app.data.model

enum class TransactionType(val label: String) {
    GIVEN("Money Given"),
    TAKEN("Money Taken")
}

enum class InterestType(val label: String) {
    NO_INTEREST("No Interest"),
    SIMPLE_INTEREST("Simple Interest")
}

enum class InterestFrequency(val label: String) {
    MONTHLY("Monthly"),
    YEARLY("Yearly")
}

enum class LoanStatus(val label: String) {
    PENDING("Pending"),
    PARTIALLY_PAID("Partially Paid"),
    PAID("Paid"),
    OVERDUE("Overdue")
}

data class DashboardSummary(
    val totalMoneyGave: Double = 0.0,
    val totalMoneyTook: Double = 0.0,
    val totalInterest: Double = 0.0,
    val totalReceivable: Double = 0.0,
    val totalPayable: Double = 0.0
)
