import JSZip from 'jszip';

export interface AndroidFileDefinition {
  content: string;
  language: 'kotlin' | 'gradle' | 'xml' | 'toml' | 'markdown' | 'properties';
}

export const ANDROID_FILES: Record<string, AndroidFileDefinition> = {
  'settings.gradle.kts': {
    language: 'gradle',
    content: `pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\\\.android.*")
                includeGroupByRegex("com\\\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "EasyMoneyLedger"
include(":app")
`
  },
  'build.gradle.kts': {
    language: 'gradle',
    content: `plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.ksp) apply false
}
`
  },
  'gradle/libs.versions.toml': {
    language: 'toml',
    content: `[versions]
agp = "8.6.0"
kotlin = "2.0.20"
coreKtx = "1.13.1"
lifecycleRuntimeKtx = "2.8.5"
activityCompose = "1.9.2"
composeBom = "2024.09.00"
navigationCompose = "2.8.0"
room = "2.6.1"
ksp = "2.0.20-1.0.25"
workManager = "2.9.1"
materialIconsExtended = "1.7.0"
gson = "2.10.1"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version.ref = "coreKtx" }
androidx-lifecycle-runtime-ktx = { group = "androidx.lifecycle", name = "lifecycle-runtime-ktx", version.ref = "lifecycleRuntimeKtx" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycleRuntimeKtx" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
androidx-ui = { group = "androidx.compose.ui", name = "ui" }
androidx-ui-graphics = { group = "androidx.compose.ui", name = "ui-graphics" }
androidx-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
androidx-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
androidx-material3 = { group = "androidx.compose.material3", name = "material3" }
androidx-material-icons-extended = { group = "androidx.compose.material", name = "material-icons-extended", version.ref = "materialIconsExtended" }
androidx-navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }

# Room SQLite Database
androidx-room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
androidx-room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
androidx-room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }

# Background WorkManager for Due Date & Overdue Reminders
androidx-work-runtime-ktx = { group = "androidx.work", name = "work-runtime-ktx", version.ref = "workManager" }

# Offline JSON Backup & Restore
gson = { group = "com.google.code.gson", name = "gson", version.ref = "gson" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
`
  },
  'app/build.gradle.kts': {
    language: 'gradle',
    content: `plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.ksp)
}

android {
    namespace = "com.easymoneyledger.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.easymoneyledger.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        compose = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.ui)
    implementation(libs.androidx.ui.graphics)
    implementation(libs.androidx.ui.tooling.preview)
    implementation(libs.androidx.material3)
    implementation(libs.androidx.material.icons.extended)
    implementation(libs.androidx.navigation.compose)

    // Room Database
    implementation(libs.androidx.room.runtime)
    implementation(libs.androidx.room.ktx)
    ksp(libs.androidx.room.compiler)

    // WorkManager & Background Reminders
    implementation(libs.androidx.work.runtime.ktx)

    // JSON backup/restore
    implementation(libs.gson)

    debugImplementation(libs.androidx.ui.tooling)
}
`
  },
  'app/src/main/AndroidManifest.xml': {
    language: 'xml',
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
    <uses-permission android:name="android.permission.VIBRATE" />

    <application
        android:name=".LedgerApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.EasyMoneyLedger">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:windowSoftInputMode="adjustResize"
            android:theme="@style/Theme.EasyMoneyLedger">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
`
  },
  'app/src/main/java/com/easymoneyledger/app/MainActivity.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.compose.rememberNavController
import com.easymoneyledger.app.ui.navigation.AppNavGraph
import com.easymoneyledger.app.ui.theme.EasyMoneyLedgerTheme
import com.easymoneyledger.app.ui.viewmodel.LedgerViewModel

class MainActivity : ComponentActivity() {

    private val viewModel: LedgerViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()

        setContent {
            EasyMoneyLedgerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val navController = rememberNavController()
                    AppNavGraph(
                        navController = navController,
                        viewModel = viewModel
                    )
                }
            }
        }
    }

    override fun onStop() {
        super.onStop()
        if (viewModel.pinSecurityManager.isPinSet()) {
            viewModel.lockApp()
        }
    }
}
`
  },
  'app/src/main/java/com/easymoneyledger/app/LedgerApplication.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app

import android.app.Application
import com.easymoneyledger.app.util.NotificationHelper

class LedgerApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        NotificationHelper.createNotificationChannel(this)
        NotificationHelper.scheduleDailyReminderWorker(this)
    }
}
`
  },
  'app/src/main/java/com/easymoneyledger/app/data/model/Enums.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app.data.model

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
`
  },
  'app/src/main/java/com/easymoneyledger/app/data/local/entity/LoanEntity.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app.data.local.entity

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
    val dueDate: Long? = null,
    val hasIndefiniteDueDate: Boolean = false,
    val notes: String? = null,
    val isArchived: Boolean = false,
    val createdAt: Long = System.currentTimeMillis()
)
`
  },
  'app/src/main/java/com/easymoneyledger/app/data/local/entity/RepaymentEntity.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app.data.local.entity

import androidx.room.Embedded
import androidx.room.Entity
import androidx.room.ForeignKey
import androidx.room.Index
import androidx.room.PrimaryKey
import androidx.room.Relation

@Entity(
    tableName = "repayments",
    foreignKeys = [
        ForeignKey(
            entity = LoanEntity::class,
            parentColumns = ["id"],
            childColumns = ["loanId"],
            onDelete = ForeignKey.CASCADE
        )
    ],
    indices = [Index("loanId")]
)
data class RepaymentEntity(
    @PrimaryKey(autoGenerate = true)
    val id: Long = 0,
    val loanId: Long,
    val amount: Double,
    val paymentDate: Long,
    val notes: String? = null,
    val createdAt: Long = System.currentTimeMillis()
)

data class LoanWithRepayments(
    @Embedded val loan: LoanEntity,
    @Relation(
        parentColumn = "id",
        entityColumn = "loanId"
    )
    val repayments: List<RepaymentEntity>
)
`
  },
  'app/src/main/java/com/easymoneyledger/app/data/local/dao/Daos.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app.data.local.dao

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
`
  },
  'app/src/main/java/com/easymoneyledger/app/data/local/AppDatabase.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app.data.local

import android.content.Context
import androidx.room.Database
import androidx.room.Room
import androidx.room.RoomDatabase
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
`
  },
  'app/src/main/java/com/easymoneyledger/app/data/repository/LedgerRepository.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app.data.repository

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

    suspend fun insertLoan(loan: LoanEntity): Long = loanDao.insertLoan(loan)

    suspend fun deleteLoanById(id: Long) = loanDao.deleteLoanById(id)

    suspend fun addRepayment(loanId: Long, amount: Double, paymentDate: Long, notes: String?): Long {
        val repayment = RepaymentEntity(
            loanId = loanId,
            amount = amount,
            paymentDate = paymentDate,
            notes = notes
        )
        return repaymentDao.insertRepayment(repayment)
    }

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

    suspend fun getAllRepaymentsSync(): List<RepaymentEntity> = repaymentDao.getAllRepaymentsSync()
}
`
  },
  'app/src/main/java/com/easymoneyledger/app/util/InterestCalculator.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app.util

import com.easymoneyledger.app.data.local.entity.LoanEntity
import com.easymoneyledger.app.data.local.entity.LoanWithRepayments
import com.easymoneyledger.app.data.model.InterestFrequency
import com.easymoneyledger.app.data.model.InterestType
import com.easymoneyledger.app.data.model.LoanStatus
import java.util.Locale
import kotlin.math.max

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

    fun formatCurrency(amount: Double): String {
        return "₹" + String.format(Locale.US, "%,.2f", amount)
    }

    /**
     * Calculates Simple Interest:
     * Simple Interest = Principal × Rate × Time
     * Monthly: Time in months = days / 30.0
     * Yearly: Time in years = days / 365.0
     */
    fun calculateLoan(
        loan: LoanEntity,
        repaymentsTotal: Double = 0.0,
        asOfDate: Long? = null
    ): CalculationResult {
        val principal = loan.amount
        val effectiveEnd = asOfDate ?: (if (loan.hasIndefiniteDueDate || loan.dueDate == null) System.currentTimeMillis() else loan.dueDate)
        val timeDiffMillis = max(0L, effectiveEnd - loan.startDate)
        val daysElapsed = max(0L, timeDiffMillis / (1000L * 60L * 60L * 24L))

        val (interestAmount, timeUnitFormatted, formulaExplanation) = when (loan.interestType) {
            InterestType.NO_INTEREST -> {
                Triple(
                    0.0,
                    "$daysElapsed days",
                    "No Interest applied. Total = Principal (\${formatCurrency(principal)})"
                )
            }
            InterestType.SIMPLE_INTEREST -> {
                val rateDecimal = loan.interestRate / 100.0
                if (loan.interestFrequency == InterestFrequency.MONTHLY) {
                    val months = daysElapsed / 30.0
                    val interest = principal * rateDecimal * months
                    val explanation = "\${formatCurrency(principal)} × \${loan.interestRate}%/mo × \${String.format(Locale.US, \"%.1f\", months)} months ($daysElapsed days) = \${formatCurrency(interest)}"
                    Triple(interest, "\${String.format(Locale.US, \"%.1f\", months)} months", explanation)
                } else {
                    val years = daysElapsed / 365.0
                    val interest = principal * rateDecimal * years
                    val explanation = "\${formatCurrency(principal)} × \${loan.interestRate}%/yr × \${String.format(Locale.US, \"%.2f\", years)} years ($daysElapsed days) = \${formatCurrency(interest)}"
                    Triple(interest, "\${String.format(Locale.US, \"%.2f\", years)} years", explanation)
                }
            }
        }

        val totalAmount = principal + interestAmount
        val remainingBalance = max(0.0, totalAmount - repaymentsTotal)
        val now = System.currentTimeMillis()
        val isPastDue = !loan.hasIndefiniteDueDate && loan.dueDate != null && now > loan.dueDate

        val status = when {
            remainingBalance <= 0.01 -> LoanStatus.PAID
            repaymentsTotal > 0.01 -> if (isPastDue) LoanStatus.OVERDUE else LoanStatus.PARTIALLY_PAID
            isPastDue -> LoanStatus.OVERDUE
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
`
  },
  'app/src/main/java/com/easymoneyledger/app/ui/viewmodel/LedgerViewModel.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app.ui.viewmodel

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
import kotlinx.coroutines.flow.*
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

    private val _searchQuery = MutableStateFlow("")
    val searchQuery = _searchQuery.asStateFlow()

    private val _selectedTypeFilter = MutableStateFlow<TransactionType?>(null)
    val selectedTypeFilter = _selectedTypeFilter.asStateFlow()

    private val _selectedStatusFilter = MutableStateFlow<LoanStatus?>(null)
    val selectedStatusFilter = _selectedStatusFilter.asStateFlow()

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

    fun updateSearchQuery(query: String) { _searchQuery.value = query }
    fun setTypeFilter(type: TransactionType?) { _selectedTypeFilter.value = type }
    fun setStatusFilter(status: LoanStatus?) { _selectedStatusFilter.value = status }

    fun addLoan(loan: LoanEntity, onComplete: (Long) -> Unit = {}) {
        viewModelScope.launch {
            val id = repository.insertLoan(loan)
            onComplete(id)
        }
    }

    fun deleteLoan(loanId: Long) {
        viewModelScope.launch { repository.deleteLoanById(loanId) }
    }

    fun addRepayment(loanId: Long, amount: Double, paymentDate: Long, notes: String?) {
        viewModelScope.launch { repository.addRepayment(loanId, amount, paymentDate, notes) }
    }

    fun unlockApp(pin: String): Boolean {
        val success = pinSecurityManager.verifyPin(pin)
        if (success) _isLocked.value = false
        return success
    }

    fun lockApp() {
        if (pinSecurityManager.isPinSet()) _isLocked.value = true
    }

    fun setPin(pin: String): Boolean {
        val ok = pinSecurityManager.setPin(pin)
        if (ok) _isLocked.value = false
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
}
`
  },
  'app/src/main/java/com/easymoneyledger/app/ui/navigation/NavGraph.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app.ui.navigation

import androidx.compose.runtime.*
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.easymoneyledger.app.ui.screens.*
import com.easymoneyledger.app.ui.viewmodel.LedgerViewModel

object Destinations {
    const val HOME = "home"
    const val ADD_LOAN = "add_loan"
    const val LOAN_DETAIL = "loan_detail/{loanId}"
    const val BACKUP = "backup"
    const val SECURITY = "security"

    fun loanDetailRoute(loanId: Long): String = "loan_detail/$loanId"
}

@Composable
fun AppNavGraph(
    navController: NavHostController,
    viewModel: LedgerViewModel
) {
    val isLocked by viewModel.isLocked.collectAsState()

    if (isLocked) {
        PinLockScreen(
            viewModel = viewModel,
            isSettingUpPin = false,
            onSuccess = { /* Unlocked */ }
        )
        return
    }

    NavHost(
        navController = navController,
        startDestination = Destinations.HOME
    ) {
        composable(Destinations.HOME) {
            HomeScreen(
                viewModel = viewModel,
                onNavigateToAddLoan = { navController.navigate(Destinations.ADD_LOAN) },
                onNavigateToLoanDetail = { loanId -> navController.navigate(Destinations.loanDetailRoute(loanId)) },
                onNavigateToBackup = { navController.navigate(Destinations.BACKUP) },
                onNavigateToSecurity = { navController.navigate(Destinations.SECURITY) }
            )
        }

        composable(Destinations.ADD_LOAN) {
            AddLoanScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Destinations.LOAN_DETAIL,
            arguments = listOf(navArgument("loanId") { type = NavType.LongType })
        ) { backStackEntry ->
            val loanId = backStackEntry.arguments?.getLong("loanId") ?: 0L
            LoanDetailScreen(
                loanId = loanId,
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Destinations.BACKUP) {
            BackupRestoreScreen(
                viewModel = viewModel,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Destinations.SECURITY) {
            PinLockScreen(
                viewModel = viewModel,
                isSettingUpPin = true,
                onSuccess = { navController.popBackStack() }
            )
        }
    }
}
`
  },
  'app/src/main/java/com/easymoneyledger/app/data/sync/GoogleCloudSyncManager.kt': {
    language: 'kotlin',
    content: `package com.easymoneyledger.app.data.sync

import android.content.Context
import com.easymoneyledger.app.data.local.LoanEntity
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await

/**
 * Multi-Device Cloud Sync Manager for Easy Money Ledger Android.
 * Synchronizes local Room database records with Google Cloud Firestore
 * using Google Account authentication.
 */
class GoogleCloudSyncManager(private val context: Context) {
    private val auth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }
    private val firestore: FirebaseFirestore by lazy { FirebaseFirestore.getInstance() }

    val currentUserId: String?
        get() = auth.currentUser?.uid

    suspend fun uploadLoanToCloud(loan: LoanEntity) {
        val uid = currentUserId ?: return
        val docRef = firestore.collection("users").document(uid)
            .collection("loans").document(loan.id.toString())

        val data = hashMapOf(
            "id" to loan.id.toString(),
            "userId" to uid,
            "personName" to loan.personName,
            "mobileNumber" to (loan.mobileNumber ?: ""),
            "amount" to loan.principalAmount,
            "transactionType" to loan.transactionType,
            "interestType" to loan.interestType,
            "interestRate" to loan.interestRate,
            "interestFrequency" to loan.interestFrequency,
            "startDate" to loan.startDate,
            "dueDate" to loan.dueDate,
            "notes" to (loan.notes ?: ""),
            "createdAt" to loan.createdAt,
            "updatedAt" to System.currentTimeMillis()
        )

        docRef.set(data).await()
    }

    suspend fun deleteLoanFromCloud(loanId: Long) {
        val uid = currentUserId ?: return
        firestore.collection("users").document(uid)
            .collection("loans").document(loanId.toString())
            .delete().await()
    }
}
`
  }
};

export async function downloadAndroidProjectZip(): Promise<void> {
  const zip = new JSZip();
  const root = zip.folder('EasyMoneyLedger');
  if (!root) return;

  for (const [relativePath, fileDef] of Object.entries(ANDROID_FILES)) {
    root.file(relativePath, fileDef.content);
  }

  // Add sample gradle wrapper properties
  root.file('gradle/wrapper/gradle-wrapper.properties', `distributionBase=GRADLE_USER_HOME
distributionPath=wrapper/dists
distributionUrl=https\\://services.gradle.org/distributions/gradle-8.7-bin.zip
networkTimeout=10000
validateDistributionUrl=true
zipStoreBase=GRADLE_USER_HOME
zipStorePath=wrapper/dists
`);

  const content = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'EasyMoneyLedger_AndroidStudio.zip';
  a.click();
  URL.revokeObjectURL(url);
}
