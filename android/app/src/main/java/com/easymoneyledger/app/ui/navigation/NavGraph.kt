package com.easymoneyledger.app.ui.navigation

import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
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
            onSuccess = { /* viewModel.unlockApp updates isLocked */ }
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
