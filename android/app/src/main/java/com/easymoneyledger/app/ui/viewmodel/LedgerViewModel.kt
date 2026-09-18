package com.easymoneyledger.app.ui.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.easymoneyledger.app.data.local.AppDatabase
import com.easymoneyledger.app.data.local.entity.LoanEntity
import com.easymoneyledger.app.data.local.entity.LoanWithRepayments
import com.easymoneyledger.app.data.model.DashboardSummary
import com.easymoneyledger.app.data.model.LoanStatus
import com.easymoneyledger.app.data.model.TransactionType
import com.easymoneyledger.app.data.repository.LedgerRepository
import com.easymoneyledger.app.util.BackupRestoreHelper
import com.easymoneyledger.app.util.InterestCalculator
import com.easymoneyledger.app.util.PinSecurityManager
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharingStarted
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.stateIn
import kotlinx.coroutines.launch

data class LoanItemUiState(
    val loanWithRepayments: LoanWithRepayments,
    val calculation: com.easymoneyledger.app.util.CalculationResult
)

class LedgerViewModel(application: Application) : AndroidViewModel(application) {

    private val repository: LedgerRepository
    val pinSecurityManager = PinSecurityManager(application)

    init {
        val db = AppDatabase.getDatabase(application)
        repository = LedgerRepository(db.loanDao(), db.repaymentDao())
    }

    val dashboardSummary: StateFlow<DashboardSummary> = repository.dashboardSummary
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), DashboardSummary())

    val rawLoans: StateFlow<List<LoanWithRepayments>> = repository.allLoansWithRepayments
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    // Search and Filter State
    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _selectedTypeFilter = MutableStateFlow<TransactionType?>(null)
    val selectedTypeFilter = _selectedTypeFilter.asStateFlow()

    private val _selectedStatusFilter = MutableStateFlow<LoanStatus?>(null)
    val selectedStatusFilter = _selectedStatusFilter.asStateFlow()

    // PIN lock state
    private val _isLocked = MutableStateFlow(pinSecurityManager.isPinSet())
    val isLocked = _isLocked.asStateFlow()

    val filteredLoans: StateFlow<List<LoanItemUiState>> = combine(
        rawLoans,
        _searchQuery,
        _selectedTypeFilter,
        _selectedStatusFilter
    ) { loans, query, typeFilter, statusFilter ->
        loans.map { loanWithRepayments ->
            val calc = InterestCalculator.calculateLoanWithRepayments(loanWithRepayments)
            LoanItemUiState(loanWithRepayments, calc)
        }.filter { item ->
            val matchesQuery = query.isBlank() ||
                    item.loanWithRepayments.loan.personName.contains(query, ignoreCase = true) ||
                    (item.loanWithRepayments.loan.mobileNumber?.contains(query) == true)

            val matchesType = typeFilter == null || item.loanWithRepayments.loan.transactionType == typeFilter
            val matchesStatus = statusFilter == null || item.calculation.status == statusFilter

            matchesQuery && matchesType && matchesStatus
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun updateSearchQuery(query: String) {
        _searchQuery.value = query
    }

    fun setTypeFilter(type: TransactionType?) {
        _selectedTypeFilter.value = type
    }

    fun setStatusFilter(status: LoanStatus?) {
        _selectedStatusFilter.value = status
    }

    fun addLoan(loan: LoanEntity, onComplete: (Long) -> Unit = {}) {
        viewModelScope.launch {
            val id = repository.insertLoan(loan)
            onComplete(id)
        }
    }

    fun deleteLoan(loanId: Long) {
        viewModelScope.launch {
            repository.deleteLoanById(loanId)
        }
    }

    fun addRepayment(loanId: Long, amount: Double, paymentDate: Long, notes: String?) {
        viewModelScope.launch {
            repository.addRepayment(loanId, amount, paymentDate, notes)
        }
    }

    fun unlockApp(pin: String): Boolean {
        val success = pinSecurityManager.verifyPin(pin)
        if (success) {
            _isLocked.value = false
        }
        return success
    }

    fun lockApp() {
        if (pinSecurityManager.isPinSet()) {
            _isLocked.value = true
        }
    }

    fun setPin(pin: String): Boolean {
        val ok = pinSecurityManager.setPin(pin)
        if (ok) {
            _isLocked.value = false
        }
        return ok
    }

    fun disablePin() {
        pinSecurityManager.disablePin()
        _isLocked.value = false
    }

    suspend fun createBackupJson(): String {
        val loans = rawLoans.value.map { it.loan }
        val repayments = repository.getAllRepaymentsSync()
        return BackupRestoreHelper.createBackupJson(loans, repayments)
    }

    fun restoreBackup(jsonString: String, onSuccess: () -> Unit, onError: (String) -> Unit) {
        viewModelScope.launch {
            try {
                val data = BackupRestoreHelper.parseBackupJson(jsonString)
                repository.restoreAllData(data.loans, data.repayments)
                onSuccess()
            } catch (e: Exception) {
                onError(e.localizedMessage ?: "Invalid backup file format")
            }
        }
    }
}
