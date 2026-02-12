package com.dgv6.bridge

import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.telephony.SmsMessage
import android.util.Log

class SmsReceiver : BroadcastReceiver() {
    override fun onReceive(context: Context, intent: Intent) {
        if (intent.action == "android.provider.Telephony.SMS_RECEIVED") {
            val bundle: Bundle? = intent.extras
            if (bundle != null) {
                val pdus = bundle.get("pdus") as Array<*>
                val format = bundle.getString("format")
                val subscriptionId = bundle.getInt("subscription", -1)
                
                for (pdu in pdus) {
                    val message = SmsMessage.createFromPdu(pdu as ByteArray, format)
                    val sender = message.displayOriginatingAddress ?: "Unknown"
                    val body = message.displayMessageBody ?: ""
                    
                    // 1. Send to background service for server forwarding
                    val serviceIntent = Intent(context, ForegroundService::class.java).apply {
                        putExtra("sender", sender)
                        putExtra("message", body)
                        putExtra("sub_id", subscriptionId)
                        action = "FORWARD_SMS"
                    }
                    context.startForegroundService(serviceIntent)

                    // 2. Notify UI if app is open
                    MainActivity.getInstance()?.notifySmsReceived(sender, body, if (subscriptionId <= 1) "SIM 1" else "SIM 2")
                }
            }
        }
    }
}