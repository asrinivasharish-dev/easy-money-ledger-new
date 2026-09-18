package com.easymoneyledger.app.ui.screens

import android.app.DatePickerDialog
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.CalendarMonth
import androidx.compose.material.icons.filled.Calculate
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.easymoneyledger.app.data.local.entity.LoanEntity
import com.easymoneyledger.app.data.model.InterestFrequency
import com.easymoneyledger.app.data.model.InterestType
import com.easymoneyledger.app.data.model.TransactionType
import com.easymoneyledger.app.ui.theme.GreenGave
import com.easymoneyledger.app.ui.theme.RedTook
import com.easymoneyledger.app.ui.viewmodel.LedgerViewModel
import com.easymoneyledger.app.util.InterestCalculator
import java.util.Calendar

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddLoanScreen(
    viewModel: LedgerViewModel,
    onNavigateBack: () -> Unit
) {
    val context = LocalContext.current

    var personName by remember { mutableStateOf("") }
    var mobileNumber by remember { mutableStateOf("") }
    var amountText by remember { mutableStateOf("") }
    var transactionType by remember { mutableStateOf(TransactionType.GIVEN) }
    var interestType by remember { mutableStateOf(InterestType.NO_INTEREST) }
    var interestRateText by remember { mutableStateOf("2.0") }
    var interestFrequency by remember { mutableStateOf(InterestFrequency.MONTHLY) }

    val now = remember { System.currentTimeMillis() }
    val oneMonthLater = remember { now + (30L * 24L * 60L * 60L * 1000L) }
    var startDate by remember { mutableLongStateOf(now) }
    var dueDate by remember { mutableLongStateOf(oneMonthLater) }
    var notes by remember { mutableStateOf("") }

    val principal = amountText.toDoubleOrNull() ?: 0.0
    val interestRate = interestRateText.toDoubleOrNull() ?: 0.0

    // Live calculation for preview
    val previewLoan = LoanEntity(
        id = 0,
        personName = personName.ifBlank { "Preview" },
        mobileNumber = mobileNumber,
        amount = principal,
        transactionType = transactionType,
        interestType = interestType,
        interestRate = interestRate,
        interestFrequency = interestFrequency,
        startDate = startDate,
        dueDate = dueDate,
        notes = notes
    )
    val calculation = InterestCalculator.calculateLoan(previewLoan, repaymentsTotal = 0.0)

    val isFormValid = personName.isNotBlank() && principal > 0

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Add Transaction", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Transaction Type Toggle (Money Given / Money Taken)
            Text(text = "Transaction Type", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = { transactionType = TransactionType.GIVEN },
                    modifier = Modifier
                        .weight(1f)
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (transactionType == TransactionType.GIVEN) GreenGave else MaterialTheme.colorScheme.surfaceVariant,
                        contentColor = if (transactionType == TransactionType.GIVEN) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Money I Gave (Lent)", fontWeight = FontWeight.Bold)
                }

                Button(
                    onClick = { transactionType = TransactionType.TAKEN },
                    modifier = Modifier
                        .weight(1f)
                        .height(50.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (transactionType == TransactionType.TAKEN) RedTook else MaterialTheme.colorScheme.surfaceVariant,
                        contentColor = if (transactionType == TransactionType.TAKEN) Color.White else MaterialTheme.colorScheme.onSurfaceVariant
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Money I Took (Borrowed)", fontWeight = FontWeight.Bold)
                }
            }

            // Person Name
            OutlinedTextField(
                value = personName,
                onValueChange = { personName = it },
                label = { Text("Person Name *") },
                placeholder = { Text("e.g. Rahul Sharma") },
                modifier = Modifier.fillMaxWidth(),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            // Mobile Number
            OutlinedTextField(
                value = mobileNumber,
                onValueChange = { mobileNumber = it },
                label = { Text("Mobile Number (Optional)") },
                placeholder = { Text("e.g. 9876543210") },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            // Amount
            OutlinedTextField(
                value = amountText,
                onValueChange = { amountText = it },
                label = { Text("Amount (Principal ₹) *") },
                placeholder = { Text("10000") },
                prefix = { Text("₹ ", fontWeight = FontWeight.Bold) },
                modifier = Modifier.fillMaxWidth(),
                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                singleLine = true,
                shape = RoundedCornerShape(12.dp)
            )

            // Interest Type Toggle
            Text(text = "Interest Type", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                OutlinedButton(
                    onClick = { interestType = InterestType.NO_INTEREST },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (interestType == InterestType.NO_INTEREST) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("No Interest", fontWeight = FontWeight.Medium)
                }

                OutlinedButton(
                    onClick = { interestType = InterestType.SIMPLE_INTEREST },
                    modifier = Modifier.weight(1f),
                    colors = ButtonDefaults.outlinedButtonColors(
                        containerColor = if (interestType == InterestType.SIMPLE_INTEREST) MaterialTheme.colorScheme.primaryContainer else Color.Transparent
                    ),
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Text("Simple Interest", fontWeight = FontWeight.Medium)
                }
            }

            // Interest Rate & Calculation Frequency (if Simple Interest)
            if (interestType == InterestType.SIMPLE_INTEREST) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp)
                ) {
                    OutlinedTextField(
                        value = interestRateText,
                        onValueChange = { interestRateText = it },
                        label = { Text("Interest Rate (%)") },
                        suffix = { Text("%") },
                        modifier = Modifier.weight(1f),
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        shape = RoundedCornerShape(12.dp)
                    )

                    Column(modifier = Modifier.weight(1.2f)) {
                        Text(text = "Calculation Basis", fontSize = 12.sp, color = MaterialTheme.colorScheme.onSurfaceVariant)
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(6.dp)
                        ) {
                            FilterChip(
                                selected = interestFrequency == InterestFrequency.MONTHLY,
                                onClick = { interestFrequency = InterestFrequency.MONTHLY },
                                label = { Text("Monthly") }
                            )
                            FilterChip(
                                selected = interestFrequency == InterestFrequency.YEARLY,
                                onClick = { interestFrequency = InterestFrequency.YEARLY },
                                label = { Text("Yearly") }
                            )
                        }
                    }
                }
            }

            // Start Date & Due Date pickers
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                // Start Date
                OutlinedCard(
                    modifier = Modifier
                        .weight(1f)
                        .clickable {
                            val cal = Calendar.getInstance().apply { timeInMillis = startDate }
                            DatePickerDialog(
                                context,
                                { _, y, m, d ->
                                    val newCal = Calendar.getInstance().apply { set(y, m, d) }
                                    startDate = newCal.timeInMillis
                                    if (dueDate < startDate) {
                                        dueDate = startDate + (30L * 24L * 60L * 60L * 1000L)
                                    }
                                },
                                cal.get(Calendar.YEAR),
                                cal.get(Calendar.MONTH),
                                cal.get(Calendar.DAY_OF_MONTH)
                            ).show()
                        },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Start Date", style = MaterialTheme.typography.labelSmall)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CalendarMonth, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(InterestCalculator.formatDate(startDate), fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        }
                    }
                }

                // Due Date
                OutlinedCard(
                    modifier = Modifier
                        .weight(1f)
                        .clickable {
                            val cal = Calendar.getInstance().apply { timeInMillis = dueDate }
                            DatePickerDialog(
                                context,
                                { _, y, m, d ->
                                    val newCal = Calendar.getInstance().apply { set(y, m, d) }
                                    dueDate = newCal.timeInMillis
                                },
                                cal.get(Calendar.YEAR),
                                cal.get(Calendar.MONTH),
                                cal.get(Calendar.DAY_OF_MONTH)
                            ).show()
                        },
                    shape = RoundedCornerShape(12.dp)
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Text("Due Date", style = MaterialTheme.typography.labelSmall)
                        Spacer(modifier = Modifier.height(4.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.CalendarMonth, contentDescription = null, modifier = Modifier.size(16.dp))
                            Spacer(modifier = Modifier.width(6.dp))
                            Text(InterestCalculator.formatDate(dueDate), fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                        }
                    }
                }
            }

            // Notes
            OutlinedTextField(
                value = notes,
                onValueChange = { notes = it },
                label = { Text("Notes / Reason (Optional)") },
                placeholder = { Text("e.g. Emergency medical help, shop renovation") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 2,
                maxLines = 3,
                shape = RoundedCornerShape(12.dp)
            )

            // Live Automatic Calculation Box
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.secondaryContainer.copy(alpha = 0.35f)),
                shape = RoundedCornerShape(14.dp)
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Default.Calculate, contentDescription = null, tint = MaterialTheme.colorScheme.primary)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = "Automatic Calculation",
                            fontWeight = FontWeight.Bold,
                            fontSize = 15.sp,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }

                    Spacer(modifier = Modifier.height(10.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Principal Amount:", style = MaterialTheme.typography.bodyMedium)
                        Text(InterestCalculator.formatCurrency(calculation.principal), fontWeight = FontWeight.SemiBold)
                    }

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("Interest Amount:", style = MaterialTheme.typography.bodyMedium)
                        Text(InterestCalculator.formatCurrency(calculation.interestAmount), fontWeight = FontWeight.SemiBold, color = MaterialTheme.colorScheme.tertiary)
                    }

                    Divider(modifier = Modifier.padding(vertical = 8.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text(
                            text = if (transactionType == TransactionType.GIVEN) "Total Receivable:" else "Total Payable:",
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = InterestCalculator.formatCurrency(calculation.totalAmount),
                            fontWeight = FontWeight.Bold,
                            fontSize = 16.sp,
                            color = if (transactionType == TransactionType.GIVEN) GreenGave else RedTook
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Formula: ${calculation.formulaExplanation}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Save Button
            Button(
                onClick = {
                    val loan = LoanEntity(
                        personName = personName.trim(),
                        mobileNumber = mobileNumber.trim().ifEmpty { null },
                        amount = principal,
                        transactionType = transactionType,
                        interestType = interestType,
                        interestRate = if (interestType == InterestType.SIMPLE_INTEREST) interestRate else 0.0,
                        interestFrequency = interestFrequency,
                        startDate = startDate,
                        dueDate = dueDate,
                        notes = notes.trim().ifEmpty { null }
                    )
                    viewModel.addLoan(loan) {
                        onNavigateBack()
                    }
                },
                enabled = isFormValid,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(54.dp),
                shape = RoundedCornerShape(12.dp)
            ) {
                Text(
                    text = "Save Transaction",
                    fontSize = 16.sp,
                    fontWeight = FontWeight.Bold
                )
            }

            Spacer(modifier = Modifier.height(24.dp))
        }
    }
}
