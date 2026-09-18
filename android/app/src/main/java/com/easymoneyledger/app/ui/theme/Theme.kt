package com.easymoneyledger.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

val GreenPrimary = Color(0xFF0E6245)
val GreenPrimaryDark = Color(0xFF86D9AA)
val GreenContainer = Color(0xFFD3F5E1)
val OnGreenContainer = Color(0xFF002113)

val GreenGave = Color(0xFF167C47)
val RedTook = Color(0xFFC0392B)
val AmberPending = Color(0xFFD97706)
val BlueInfo = Color(0xFF1D4ED8)

val SurfaceLight = Color(0xFFF9FAF8)
val SurfaceDark = Color(0xFF121413)

private val LightColorScheme = lightColorScheme(
    primary = GreenPrimary,
    onPrimary = Color.White,
    primaryContainer = GreenContainer,
    onPrimaryContainer = OnGreenContainer,
    secondary = Color(0xFF4C6356),
    onSecondary = Color.White,
    background = SurfaceLight,
    surface = Color.White,
    onBackground = Color(0xFF191C1A),
    onSurface = Color(0xFF191C1A),
    outline = Color(0xFFE2E8F0)
)

private val DarkColorScheme = darkColorScheme(
    primary = GreenPrimaryDark,
    onPrimary = Color(0xFF003822),
    primaryContainer = Color(0xFF005234),
    onPrimaryContainer = Color(0xFFA3F2C2),
    secondary = Color(0xFFB3CCBA),
    onSecondary = Color(0xFF1F3529),
    background = SurfaceDark,
    surface = Color(0xFF1E211F),
    onBackground = Color(0xFFE1E3DF),
    onSurface = Color(0xFFE1E3DF),
    outline = Color(0xFF334155)
)

@Composable
fun EasyMoneyLedgerTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    content: @Composable () -> Unit
) {
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    MaterialTheme(
        colorScheme = colorScheme,
        content = content
    )
}
