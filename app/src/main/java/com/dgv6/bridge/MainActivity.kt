package com.dgv6.bridge

import android.Manifest
import android.annotation.SuppressLint
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.webkit.*
import android.util.Log
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys

class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    companion object {
        private var instance: MainActivity? = null
        fun getInstance(): MainActivity? = instance
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        instance = this
        setContentView(R.layout.activity_main)

        webView = findViewById(R.id.webview)
        
        val settings = webView.settings
        settings.javaScriptEnabled = true
        settings.domStorageEnabled = true
        settings.databaseEnabled = true
        settings.loadWithOverviewMode = true
        settings.useWideViewPort = true
        settings.mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW

        // Interface for React to call Kotlin
        webView.addJavascriptInterface(WebAppInterface(this), "NativeBridge")
        
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                Log.d("DGV6_BRIDGE", "WebView Loaded Asset: $url")
            }
        }

        // Bridge Console Logs to Logcat (Essential for debugging the APK)
        webView.webChromeClient = object : WebChromeClient() {
            override fun onConsoleMessage(message: ConsoleMessage?): Boolean {
                Log.d("DGV6_REACT", "${message?.message()} -- From line ${message?.lineNumber()} of ${message?.sourceId()}")
                return true
            }
        }
        
        // Load the React bundle from the assets folder
        webView.loadUrl("file:///android_asset/www/index.html")

        requestCriticalPermissions()
    }

    override fun onDestroy() {
        super.onDestroy()
        instance = null
    }

    fun notifySmsReceived(sender: String, message: String, sim: String) {
        runOnUiThread {
            webView.evaluateJavascript("window.onNativeSmsReceived?.('$sender', '${message.replace("'", "\\'")}', '$sim')", null)
        }
    }

    private fun requestCriticalPermissions() {
        val permissions = mutableListOf(
            Manifest.permission.RECEIVE_SMS,
            Manifest.permission.READ_SMS,
            Manifest.permission.INTERNET,
            Manifest.permission.WAKE_LOCK,
            Manifest.permission.RECEIVE_BOOT_COMPLETED
        )

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            permissions.add(Manifest.permission.POST_NOTIFICATIONS)
        }

        val missing = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }

        if (missing.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, missing.toTypedArray(), 101)
        }
    }

    inner class WebAppInterface(private val context: Context) {
        @JavascriptInterface
        fun saveConfig(webhook: String, secret: String, sim1: String, sim2: String) {
            val masterKeyAlias = MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC)
            val sharedPreferences = EncryptedSharedPreferences.create(
                "dgv6_secure_prefs",
                masterKeyAlias,
                context,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
            
            sharedPreferences.edit().apply {
                putString("webhook_url", webhook)
                putString("secret_key", secret)
                putString("sim1_nickname", sim1)
                putString("sim2_nickname", sim2)
                apply()
            }
            Log.d("DGV6_BRIDGE", "Secure Config Locked for: $webhook")
        }
    }
}