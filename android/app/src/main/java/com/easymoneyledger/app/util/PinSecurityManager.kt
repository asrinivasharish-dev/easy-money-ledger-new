package com.easymoneyledger.app.util

import android.content.Context
import android.content.SharedPreferences
import java.security.MessageDigest

class PinSecurityManager(context: Context) {

    private val prefs: SharedPreferences =
        context.getSharedPreferences("easy_money_ledger_security_prefs", Context.MODE_PRIVATE)

    companion object {
        private const val KEY_PIN_HASH = "pin_hash"
        private const val KEY_PIN_ENABLED = "pin_enabled"
        private const val KEY_BIOMETRIC_ENABLED = "biometric_enabled"
    }

    fun isPinSet(): Boolean {
        return prefs.getBoolean(KEY_PIN_ENABLED, false) && !prefs.getString(KEY_PIN_HASH, null).isNullOrEmpty()
    }

    fun setPin(pin: String): Boolean {
        if (pin.length < 4) return false
        val hashed = hashPin(pin)
        prefs.edit()
            .putString(KEY_PIN_HASH, hashed)
            .putBoolean(KEY_PIN_ENABLED, true)
            .apply()
        return true
    }

    fun verifyPin(pin: String): Boolean {
        val storedHash = prefs.getString(KEY_PIN_HASH, null) ?: return false
        return hashPin(pin) == storedHash
    }

    fun disablePin() {
        prefs.edit()
            .remove(KEY_PIN_HASH)
            .putBoolean(KEY_PIN_ENABLED, false)
            .apply()
    }

    private fun hashPin(pin: String): String {
        val bytes = MessageDigest.getInstance("SHA-256").digest(pin.toByteArray())
        return bytes.joinToString("") { "%02x".format(it) }
    }
}
