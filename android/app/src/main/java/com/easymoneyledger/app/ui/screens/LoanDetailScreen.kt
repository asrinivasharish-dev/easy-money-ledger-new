package com.easymoneyledger.app.ui.screens

import android.app.DatePickerDialog
import android.content.Intent
import android.net.Uri
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.easymoneyledger.app.data.local.entity.LoanWithRepayments
import com.easymoneyledger.app.data.local.entity.RepaymentEntity
import com.easymoneyledger.app.data.model.InterestType
import com.easymoneyledger.app.data.model.LoanStatus
import com.easymoneyledger.app.data.model.TransactionType
import com.easymoneyledger.app.ui.theme.GreenGave
import com.easymoneyledger.app.ui.theme.RedTook
import com.easymoneyledger.app.ui.viewmodel.LedgerViewModel
import com.easymoneyledger.app.util.InterestCalculator
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun LoanDetailScreen(
    loanId: Long,
    viewModel: LedgerViewModel,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current
    val allLoans by viewModel.rawLoans.collectAsState()
    val loanWithRepayments = allLoans.find { it.loan.id == loanId }

    var showRepaymentSheet by remember { mutableStateOf(false) }
    var showDeleteConfirmDialog by remember { mutableStateOf(false) }

    if (loanWithRepayments == null) {
        Scaffold(
            topBar = {
                TopAppBar(
                    title = { Text("Loan Details") },
                    navigationIcon = {
                        IconButton(onClick = onNavigateBack) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                        }
                    }
                )
            }
        ) { paddingValues ->
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Text("Record not found or has been deleted.")
            }
        }
        return
    }

    val loan = loanWithRepayments.loan
    val calc = InterestCalculator.calculateLoanWithRepayments(loanWithRepayments)
    val isGiven = loan.transactionType == TransactionType.GIVEN

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(loan.personName, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    // Mobile call shortcut if mobile number exists
                    if (!loan.mobileNumber.isNullOrBlank()) {
                        IconButton(onClick = {
                            val intent = Intent(Intent.ACTION_DIAL, Uri.parse("tel:${loan.mobileNumber}"))
                            context.startActivity(intent)
                        }) {
                            Icon(Icons.Default.Phone, contentDescription = "Call")
                        }
                    }
                    IconButton(onClick = { showDeleteConfirmDialog = true }) {
                        Icon(Icons.Default.Delete, contentDescription = "Delete Loan", tint = MaterialTheme.colorScheme.error)
                    }
                }
            )
        },
        bottomBar = {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shadowElevation = 8.dp,
                color = MaterialTheme.colorScheme.surface
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    Button(
                        onClick = { showRepaymentSheet = true },
                        modifier = Modifier
                            .weight(1f)
                            .height(52.dp),
                        colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Icon(Icons.Default.Payment, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Record Repayment", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                    }
                }
            }
        }
    ) { paddingValues ->
        LazyColumn(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .padding(horizontal = 16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Header summary card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(16.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (isGiven) GreenGave.copy(alpha = 0.08f) else RedTook.copy(alpha = 0.08f)
                    )
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text(
                                text = if (isGiven) "MONEY GIVEN (LENT)" else "MONEY TAKEN (BORROWED)",
                                fontWeight = FontWeight.Bold,
                                fontSize = 12.sp,
                                color = if (isGiven) GreenGave else RedTook
                            )
                            StatusBadge(status = calc.status)
                        }

                        Spacer(modifier = Modifier.height(10.dp))

                        Text(
                            text = if (isGiven) "Remaining to Receive" else "Remaining to Pay",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        Text(
                            text = InterestCalculator.formatCurrency(calc.remainingBalance),
                            fontWeight = FontWeight.ExtraBold,
                            fontSize = 28.sp,
                            color = if (isGiven) GreenGave else RedTook
                        )

                        Spacer(modifier = Modifier.height(14.dp))
                        LinearProgressIndicator(
                            progress = {
                                if (calc.totalAmount > 0) {
                                    (calc.totalPaid / calc.totalAmount).toFloat().coerceIn(0f, 1f)
                                } else 0f
                            },
                            modifier = Modifier
                                .fillMaxWidth()
                                .height(8.dp)
                                .clip(RoundedCornerShape(4.dp)),
                            color = GreenGave,
                            trackColor = MaterialTheme.colorScheme.outlineVariant
                        )
                    }
                }
            }

            // Loan Details Grid
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface)
                ) {
                    Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                        Text("Loan Overview", fontWeight = FontWeight.Bold, fontSize = 16.sp)
                        Divider(color = MaterialTheme.colorScheme.outlineVariant)

                        DetailRow(label = "Person Name", value = loan.personName)
                        if (!loan.mobileNumber.isNullOrBlank()) {
                            DetailRow(label = "Mobile Number", value = loan.mobileNumber)
                        }
                        DetailRow(label = "Principal Amount", value = InterestCalculator.formatCurrency(calc.principal))
                        DetailRow(
                            label = "Interest Type",
                            value = if (loan.interestType == InterestType.SIMPLE_INTEREST)
                                "${loan.interestRate}% (${loan.interestFrequency.label})"
                            else "No Interest"
                        )
                        DetailRow(label = "Interest Accumulated", value = InterestCalculator.formatCurrency(calc.interestAmount))
                        DetailRow(label = "Total Amount", value = InterestCalculator.formatCurrency(calc.totalAmount))
                        DetailRow(label = "Amount Already Paid", value = InterestCalculator.formatCurrency(calc.totalPaid))
                        DetailRow(label = "Remaining Balance", value = InterestCalculator.formatCurrency(calc.remainingBalance))
                        DetailRow(label = "Start Date", value = InterestCalculator.formatDate(loan.startDate))
                        DetailRow(label = "Due Date", value = InterestCalculator.formatDate(loan.dueDate))

                        if (!loan.notes.isNullOrBlank()) {
                            DetailRow(label = "Notes / Purpose", value = loan.notes)
                        }
                    }
                }
            }

            // Formula Explanation Card
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(14.dp),
                    colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.25f))
                ) {
                    Column(modifier = Modifier.padding(14.dp)) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Info, contentDescription = null, tint = MaterialTheme.colorScheme.primary, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text("Calculation Details", fontWeight = FontWeight.Bold, fontSize = 14.sp)
                        }
                        Spacer(modifier = Modifier.height(6.dp))
                        Text(
                            text = calc.formulaExplanation,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }

            // Payment History Header
            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Payment History (${loanWithRepayments.repayments.size})",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp
                    )
                }
            }

            // Payment History Items
            if (loanWithRepayments.repayments.isEmpty()) {
                item {
                    Text(
                        text = "No repayments recorded yet.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(vertical = 8.dp)
                    )
                }
            } else {
                items(loanWithRepayments.repayments.sortedByDescending { it.paymentDate }) { repayment ->
                    RepaymentItemRow(
                        repayment = repayment,
                        onDelete = { viewModel.addRepayment(loan.id, -repayment.amount, repayment.paymentDate, "Reversal") }
                    )
                }
            }

            item {
                Spacer(modifier = Modifier.height(60.dp))
            }
        }
    }

    // Delete Confirmation Dialog
    if (showDeleteConfirmDialog) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmDialog = false },
            title = { Text("Delete Record?") },
            text = { Text("Are you sure you want to permanently delete this loan for ${loan.personName}? All associated repayments will also be removed.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteConfirmDialog = false
                        viewModel.deleteLoan(loan.id)
                        onNavigateBack()
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = MaterialTheme.colorScheme.error)
                ) {
                    Text("Delete")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDeleteConfirmDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    // Record Repayment Bottom Sheet / Dialog
    if (showRepaymentSheet) {
        RepaymentModalDialog(
            loanId = loan.id,
            remainingBalance = calc.remainingBalance,
            onDismiss = { showRepaymentSheet = false },
            onSave = { amount, date, notes ->
                viewModel.addRepayment(loan.id, amount, date, notes)
                showRepaymentSheet = false
            }
        )
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = label, style = MaterialTheme.typography.bodyMedium, color = MaterialTheme.colorScheme.onSurfaceVariant)
        Text(text = value, fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
    }
}

@Composable
fun RepaymentItemRow(repayment: RepaymentEntity, onDelete: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        shape = RoundedCornerShape(10.dp),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f))
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(12.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = InterestCalculator.formatCurrency(repayment.amount),
                    fontWeight = FontWeight.Bold,
                    fontSize = 16.sp,
                    color = GreenGave
                )
                Text(
                    text = InterestCalculator.formatDate(repayment.paymentDate),
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                if (!repayment.notes.isNullOrBlank()) {
                    Text(
                        text = repayment.notes,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
            }

            IconButton(onClick = onDelete) {
                Icon(
                    Icons.Default.DeleteOutline,
                    contentDescription = "Delete repayment",
                    tint = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun RepaymentModalDialog(
    loanId: Long,
    remainingBalance: Double,
    onDismiss: () -> Unit,
    onSave: (amount: Double, date: Long, notes: String?) -> Unit
) {
    val context = LocalContext.current
    var amountText by remember { mutableStateOf("") }
    var paymentDate by remember { mutableLongStateOf(System.currentTimeMillis()) }
    var notes by remember { mutableStateOf("") }

    val amount = amountText.toDoubleOrNull() ?: 0.0
    val newRemaining = kotlin.math.max(0.0, remainingBalance - amount)

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Record Repayment", fontWeight = FontWeight.Bold) },
        text = {
            Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                OutlinedTextField(
                    value = amountText,
                    onValueChange = { amountText = it },
                    label = { Text("Payment Amount (₹) *") },
                    prefix = { Text("₹ ", fontWeight = FontWeight.Bold) },
                    modifier = Modifier.fillMaxWidth(),
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                    shape = RoundedCornerShape(12.dp)
                )

                OutlinedCard(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable {
                            val cal = Calendar.getInstance().apply { timeInMillis = paymentDate }
                            DatePickerDialog(
                                context,
                                { _, y, m, d ->
                                    val newCal = Calendar.getInstance().apply { set(y, m, d) }
                                    paymentDate = newCal.timeInMillis
                                },
                                cal.get(Calendar.YEAR),
                                cal.get(Calendar.MONTH),
                                cal.get(Calendar.DAY_OF_MONTH)
                            ).show()
                        },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Payment Date", style = MaterialTheme.typography.labelSmall)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CalendarMonth, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(InterestCalculator.formatDate(paymentDate), fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                        }
                    }
                }

                OutlinedTextField(
                    value = notes,
                    onValueChange = { notes = it },
                    label = { Text("Notes (e.g. GPay, Cash, Bank Transfer)") },
                    modifier = Modifier.fillMaxWidth(),
                    shape = RoundedCornerShape(12.dp)
                )

                if (amount > 0) {
                    Card(
                        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f)),
                        shape = RoundedCornerShape(10.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(10.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Text("New Balance:", fontWeight = FontWeight.Medium)
                            Text(
                                text = InterestCalculator.formatCurrency(newRemaining),
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    if (amount > 0) {
                        onSave(amount, paymentDate, notes.trim().ifEmpty { null })
                    }
                },
                enabled = amount > 0
            ) {
                Text("Save Payment")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}
