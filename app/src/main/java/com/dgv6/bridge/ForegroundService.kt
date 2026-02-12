package com.dgv6.bridge

import android.app.*
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKeys
import org.json.JSONObject
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class ForegroundService : Service() {

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        if (intent?.action == "FORWARD_SMS") {
            val sender = intent.getStringExtra("sender") ?: "Unknown"
            val message = intent.getStringExtra("message") ?: ""
            val subId = intent.getIntExtra("sub_id", 0)
            
            // Get nicknames for logging
            val nickname = getNickname(subId)
            
            // Forward to server
            forwardToWebhook(sender, message, nickname)
        }

        startForegroundNotification()
        return START_STICKY
    }

    private fun getNickname(subId: Int): String {
        val prefs = getSecurePrefs()
        return if (subId <= 1) {
            prefs.getString("sim1_nickname", "SIM 1") ?: "SIM 1"
        } else {
            prefs.getString("sim2_nickname", "SIM 2") ?: "SIM 2"
        }
    }

    private fun getSecurePrefs() = EncryptedSharedPreferences.create(
        "dgv6_secure_prefs",
        MasterKeys.getOrCreate(MasterKeys.AES256_GCM_SPEC),
        this,
        EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
        EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
    )

    private fun startForegroundNotification() {
        val channelId = "dgv6_bridge_service"
        val channel = NotificationChannel(channelId, "DGV6 Gateway Active", NotificationManager.IMPORTANCE_LOW)
        val manager = getSystemService(NotificationManager::class.java)
        manager.createNotificationChannel(channel)

        val notification = NotificationCompat.Builder(this, channelId)
            .setContentTitle("DGV6 Bridge v2.0")
            .setContentText("Gateway Service Active | Monitoring Encrypted Channels")
            .setSmallIcon(android.R.drawable.stat_notify_sync)
            .setOngoing(true)
            .build()

        startForeground(1, notification)
    }

    private fun forwardToWebhook(sender: String, message: String, nickname: String) {
        val prefs = getSecurePrefs()
        val webhookUrl = prefs.getString("webhook_url", "")
        val secretKey = prefs.getString("secret_key", "")

        if (webhookUrl.isNullOrEmpty() || secretKey.isNullOrEmpty()) return

        thread {
            var success = false
            var attempts = 0
            val maxAttempts = 5
            
            while (!success && attempts < maxAttempts) {
                try {
                    val url = URL(webhookUrl)
                    val conn = url.openConnection() as HttpURLConnection
                    conn.requestMethod = "POST"
                    conn.setRequestProperty("Content-Type", "application/json")
                    conn.doOutput = true
                    conn.connectTimeout = 10000
                    
                    val json = JSONObject().apply {
                        put("action", "RECEIVE_SMS")
                        put("secret", secretKey)
                        put("sender", sender)
                        put("message", message)
                        put("sim_nickname", nickname)
                    }

                    val os = conn.outputStream
                    val writer = OutputStreamWriter(os, "UTF-8")
                    writer.write(json.toString())
                    writer.flush()
                    writer.close()
                    os.close()

                    if (conn.responseCode == 200) {
                        success = true
                    } else {
                        attempts++
                        Thread.sleep(2000L * attempts) // Exponential backoff
                    }
                } catch (e: Exception) {
                    attempts++
                    Thread.sleep(2000L * attempts)
                }
            }
        }
    }

    override fun onBind(intent: Intent?): IBinder? = null
}