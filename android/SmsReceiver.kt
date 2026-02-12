
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
                
                // Detect which SIM slot received the message
                val subscriptionId = bundle.getInt("subscription", -1)
                
                for (pdu in pdus) {
                    val message = SmsMessage.createFromPdu(pdu as ByteArray, format)
                    val sender = message.displayOriginatingAddress
                    val body = message.displayMessageBody
                    
                    Log.d("DGV6_BRIDGE", "SMS Received from $sender on SIM Slot ID: $subscriptionId")
                    
                    // Send to Foreground Service for Processing/Forwarding
                    val serviceIntent = Intent(context, ForegroundService::class.java).apply {
                        putExtra("sender", sender)
                        putExtra("message", body)
                        putExtra("sub_id", subscriptionId)
                        action = "FORWARD_SMS"
                    }
                    context.startForegroundService(serviceIntent)
                }
            }
        }
    }
}
