package com.easymoneyledger.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.easymoneyledger.app.data.model.DashboardSummary
import com.easymoneyledger.app.data.model.LoanStatus
import com.easymoneyledger.app.data.model.TransactionType
import com.easymoneyledger.app.ui.theme.AmberPending
import com.easymoneyledger.app.ui.theme.GreenGave
import com.easymoneyledger.app.ui.theme.RedTook
import com.easymoneyledger.app.ui.viewmodel.LedgerViewModel
import com.easymoneyledger.app.ui.viewmodel.LoanItemUiState
import com.easymoneyledger.app.util.InterestCalculator

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeScreen(
    viewModel: LedgerViewModel,
    onNavigateToAddLoan: () -> Unit,
    onNavigateToLoanDetail: (Long) -> Unit,
    onNavigateToBackup: () -> Unit,
    onNavigateToSecurity: () -> Unit
) {
    val summary by viewModel.dashboardSummary.collectAsState()
    val loans by viewModel.filteredLoans.collectAsState()
    val searchQuery by viewModel.searchQuery.collectAsState()
    val selectedTypeFilter by viewModel.selectedTypeFilter.collectAsState()
    val selectedStatusFilter by viewModel.selectedStatusFilter.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Easy Money Ledger",
                            fontWeight = FontWeight.Bold,
                            fontSize = 20.sp
                        )
                        Text(
                            text = "Personal Loan & Borrowing Manager",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                },
                actions = {
                    IconButton(onClick = onNavigateToBackup) {
                        Icon(Icons.Default.Backup, contentDescription = "Backup and Restore")
                    }
                    IconButton(onClick = onNavigateToSecurity) {
                        Icon(Icons.Default.Lock, contentDescription = "Security PIN")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface
                )
            )
        },
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToAddLoan,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary,
                icon = { Icon(Icons.Default.Add, contentDescription = null) },
                text = { Text("+ Add Transaction", fontWeight = FontWeight.Bold, fontSize = 16.sp) }
            )
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp)
        ) {
            // Dashboard Cards
            item {
                DashboardSummarySection(summary = summary)
            }

            // Two main buttons: "Money I Gave" and "Money I Took"
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = {
                            if (selectedTypeFilter == TransactionType.GIVEN) {
                                viewModel.setTypeFilter(null)
                            } else {
                                viewModel.setTypeFilter(TransactionType.GIVEN)
                            }
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(54.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedTypeFilter == TransactionType.GIVEN) GreenGave else GreenGave.copy(alpha = 0.15f),
                            contentColor = if (selectedTypeFilter == TransactionType.GIVEN) Color.White else GreenGave
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.ArrowOutward, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "Money I Gave", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }

                    Button(
                        onClick = {
                            if (selectedTypeFilter == TransactionType.TAKEN) {
                                viewModel.setTypeFilter(null)
                            } else {
                                viewModel.setTypeFilter(TransactionType.TAKEN)
                            }
                        },
                        modifier = Modifier
                            .weight(1f)
                            .height(54.dp),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (selectedTypeFilter == TransactionType.TAKEN) RedTook else RedTook.copy(alpha = 0.15f),
                            contentColor = if (selectedTypeFilter == TransactionType.TAKEN) Color.White else RedTook
                        ),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.CallReceived, contentDescription = null, modifier = Modifier.size(20.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(text = "Money I Took", fontWeight = FontWeight.Bold, fontSize = 15.sp)
                    }
                }
            }

            // Search Bar
            item {
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { viewModel.updateSearchQuery(it) },
                    modifier = Modifier.fillMaxWidth(),
                    placeholder = { Text("Search by person name or mobile...") },
                    leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                    trailingIcon = {
                        if (searchQuery.isNotEmpty()) {
                            IconButton(onClick = { viewModel.updateSearchQuery("") }) {
                                Icon(Icons.Default.Clear, contentDescription = "Clear search")
                            }
                        }
                    },
                    singleLine = true,
                    shape = RoundedCornerShape(12.dp)
                )
            }

            // Filter Chips
            item {
                FilterChipsRow(
                    selectedTypeFilter = selectedTypeFilter,
                    selectedStatusFilter = selectedStatusFilter,
                    onSelectType = { viewModel.setTypeFilter(it) },
                    onSelectStatus = { viewModel.setStatusFilter(it) }
                )
            }

            // Section Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Transactions (${loans.size})",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    if (selectedTypeFilter != null || selectedStatusFilter != null || searchQuery.isNotBlank()) {
                        TextButton(onClick = {
                            viewModel.updateSearchQuery("")
                            viewModel.setTypeFilter(null)
                            viewModel.setStatusFilter(null)
                        }) {
                            Text("Reset Filters")
                        }
                    }
                }
            }

            // Empty state
            if (loans.isEmpty()) {
                item {
                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 24.dp),
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.4f)),
                        shape = RoundedCornerShape(16.dp)
                    ) {
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(32.dp),
                            horizontalAlignment = Alignment.CenterHorizontally,
                            verticalArrangement = Arrangement.Center
                        ) {
                            Icon(
                                imageVector = Icons.Default.AccountBalanceWallet,
                                contentDescription = null,
                                modifier = Modifier.size(56.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Spacer(modifier = Modifier.height(12.dp))
                            Text(
                                text = "No records found",
                                fontWeight = FontWeight.Bold,
                                fontSize = 18.sp
                            )
                            Spacer(modifier = Modifier.height(6.dp))
                            Text(
                                text = "Tap '+ Add Transaction' to record money given or taken.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // Loans List
            items(loans, key = { it.loanWithRepayments.loan.id }) { item ->
                LoanCardItem(
                    item = item,
                    onClick = { onNavigateToLoanDetail(item.loanWithRepayments.loan.id) }
                )
            }

            item {
                Spacer(modifier = Modifier.height(80.dp))
            }
        }
    }
}

@Composable
fun DashboardSummarySection(summary: DashboardSummary) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer),
        shape = RoundedCornerShape(18.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = "OVERVIEW SUMMARY",
                style = MaterialTheme.typography.labelSmall,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
            )
            Spacer(modifier = Modifier.height(12.dp))

            // Receivable and Payable Highlights
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "Total Receivable",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        text = InterestCalculator.formatCurrency(summary.totalReceivable),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 20.sp,
                        color = GreenGave
                    )
                }
                Column(modifier = Modifier.weight(1f), horizontalAlignment = Alignment.End) {
                    Text(
                        text = "Total Payable",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onPrimaryContainer
                    )
                    Text(
                        text = InterestCalculator.formatCurrency(summary.totalPayable),
                        fontWeight = FontWeight.ExtraBold,
                        fontSize = 20.sp,
                        color = RedTook
                    )
                }
            }

            Divider(
                modifier = Modifier.padding(vertical = 12.dp),
                color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.15f)
            )

            // Sub-metrics: Total Money Gave, Total Money Took, Total Interest
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text("Total Gave", style = MaterialTheme.typography.labelSmall)
                    Text(
                        InterestCalculator.formatCurrency(summary.totalMoneyGave),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text("Total Took", style = MaterialTheme.typography.labelSmall)
                    Text(
                        InterestCalculator.formatCurrency(summary.totalMoneyTook),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp
                    )
                }
                Column(horizontalAlignment = Alignment.End) {
                    Text("Total Interest", style = MaterialTheme.typography.labelSmall)
                    Text(
                        InterestCalculator.formatCurrency(summary.totalInterest),
                        fontWeight = FontWeight.Bold,
                        fontSize = 14.sp,
                        color = AmberPending
                    )
                }
            }
        }
    }
}

@Composable
fun FilterChipsRow(
    selectedTypeFilter: TransactionType?,
    selectedStatusFilter: LoanStatus?,
    onSelectType: (TransactionType?) -> Unit,
    onSelectStatus: (LoanStatus?) -> Unit
) {
    val scrollState = rememberScrollState()
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .horizontalScroll(scrollState),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        FilterChip(
            selected = selectedTypeFilter == null && selectedStatusFilter == null,
            onClick = {
                onSelectType(null)
                onSelectStatus(null)
            },
            label = { Text("All") }
        )
        FilterChip(
            selected = selectedTypeFilter == TransactionType.GIVEN,
            onClick = { onSelectType(if (selectedTypeFilter == TransactionType.GIVEN) null else TransactionType.GIVEN) },
            label = { Text("Money Given") }
        )
        FilterChip(
            selected = selectedTypeFilter == TransactionType.TAKEN,
            onClick = { onSelectType(if (selectedTypeFilter == TransactionType.TAKEN) null else TransactionType.TAKEN) },
            label = { Text("Money Taken") }
        )
        FilterChip(
            selected = selectedStatusFilter == LoanStatus.PENDING,
            onClick = { onSelectStatus(if (selectedStatusFilter == LoanStatus.PENDING) null else LoanStatus.PENDING) },
            label = { Text("Pending") }
        )
        FilterChip(
            selected = selectedStatusFilter == LoanStatus.PARTIALLY_PAID,
            onClick = { onSelectStatus(if (selectedStatusFilter == LoanStatus.PARTIALLY_PAID) null else LoanStatus.PARTIALLY_PAID) },
            label = { Text("Partially Paid") }
        )
        FilterChip(
            selected = selectedStatusFilter == LoanStatus.PAID,
            onClick = { onSelectStatus(if (selectedStatusFilter == LoanStatus.PAID) null else LoanStatus.PAID) },
            label = { Text("Paid") }
        )
        FilterChip(
            selected = selectedStatusFilter == LoanStatus.OVERDUE,
            onClick = { onSelectStatus(if (selectedStatusFilter == LoanStatus.OVERDUE) null else LoanStatus.OVERDUE) },
            label = { Text("Overdue") }
        )
    }
}

@Composable
fun LoanCardItem(
    item: LoanItemUiState,
    onClick: () -> Unit
) {
    val loan = item.loanWithRepayments.loan
    val calc = item.calculation
    val isGiven = loan.transactionType == TransactionType.GIVEN

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(14.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(modifier = Modifier.padding(14.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(38.dp)
                            .clip(CircleShape)
                            .background(if (isGiven) GreenGave.copy(alpha = 0.15f) else RedTook.copy(alpha = 0.15f)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = if (isGiven) Icons.Default.ArrowOutward else Icons.Default.CallReceived,
                            contentDescription = null,
                            tint = if (isGiven) GreenGave else RedTook,
                            modifier = Modifier.size(20.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(10.dp))
                    Column {
                        Text(
                            text = loan.personName,
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp
                        )
                        if (!loan.mobileNumber.isNullOrBlank()) {
                            Text(
                                text = loan.mobileNumber,
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }

                StatusBadge(status = calc.status)
            }

            Divider(modifier = Modifier.padding(vertical = 10.dp), color = MaterialTheme.colorScheme.outlineVariant)

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Column {
                    Text(
                        text = if (isGiven) "Principal Lent" else "Principal Borrowed",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = InterestCalculator.formatCurrency(calc.principal),
                        fontWeight = FontWeight.SemiBold,
                        fontSize = 14.sp
                    )
                }

                if (calc.interestAmount > 0) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally) {
                        Text(
                            text = "Interest",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = "+" + InterestCalculator.formatCurrency(calc.interestAmount),
                            fontWeight = FontWeight.SemiBold,
                            fontSize = 14.sp,
                            color = AmberPending
                        )
                    }
                }

                Column(horizontalAlignment = Alignment.End) {
                    Text(
                        text = if (isGiven) "Remaining to Receive" else "Remaining to Pay",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = InterestCalculator.formatCurrency(calc.remainingBalance),
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = if (isGiven) GreenGave else RedTook
                    )
                }
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Due: ${InterestCalculator.formatDate(loan.dueDate)}",
                    style = MaterialTheme.typography.labelSmall,
                    color = if (calc.status == LoanStatus.OVERDUE) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (calc.totalPaid > 0) {
                    Text(
                        text = "Paid: ${InterestCalculator.formatCurrency(calc.totalPaid)}",
                        style = MaterialTheme.typography.labelSmall,
                        color = GreenGave,
                        fontWeight = FontWeight.Medium
                    )
                }
            }
        }
    }
}

@Composable
fun StatusBadge(status: LoanStatus) {
    val (bgColor, textColor) = when (status) {
        LoanStatus.PAID -> Pair(GreenGave.copy(alpha = 0.15f), GreenGave)
        LoanStatus.PARTIALLY_PAID -> Pair(Color(0xFFE0F2FE), Color(0xFF0369A1))
        LoanStatus.PENDING -> Pair(AmberPending.copy(alpha = 0.15f), AmberPending)
        LoanStatus.OVERDUE -> Pair(RedTook.copy(alpha = 0.15f), RedTook)
    }

    Surface(
        color = bgColor,
        shape = RoundedCornerShape(8.dp)
    ) {
        Text(
            text = status.label,
            color = textColor,
            fontSize = 12.sp,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp)
        )
    }
}
