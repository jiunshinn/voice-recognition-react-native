package com.voicerecognitionreactnative

import android.Manifest
import android.app.Activity
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.speech.RecognitionListener
import android.speech.RecognizerIntent
import android.speech.SpeechRecognizer
import android.util.Log
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.*
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.facebook.react.modules.core.PermissionListener

class VoiceRecognitionReactNativeModule(private val reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext), ActivityEventListener, PermissionListener {

  private var speechRecognizer: SpeechRecognizer? = null
  private var recognitionPromise: Promise? = null

  init {
    reactContext.addActivityEventListener(this)
    Handler(Looper.getMainLooper()).post {
      speechRecognizer = SpeechRecognizer.createSpeechRecognizer(reactContext)
    }
  }

  override fun getName(): String {
    return NAME
  }

  @ReactMethod
  fun startRecognition(promise: Promise) {
    recognitionPromise = promise

    val currentActivity = currentActivity
    if (currentActivity == null) {
      promise.reject("ACTIVITY_NOT_FOUND", "Activity not found")
      return
    }

    if (ContextCompat.checkSelfPermission(reactContext, Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
      Log.d(NAME, "Requesting microphone permission")
      ActivityCompat.requestPermissions(currentActivity, arrayOf(Manifest.permission.RECORD_AUDIO), REQUEST_RECORD_AUDIO_PERMISSION)
    } else {
      Log.d(NAME, "Microphone permission already granted")
      startListening()
    }
  }

  @ReactMethod
  fun stopRecognition() {
    Log.d(NAME, "Stopping recognition")
    Handler(Looper.getMainLooper()).post {
      speechRecognizer?.stopListening()
      recognitionPromise?.resolve("Recognition stopped")
      recognitionPromise = null
    }
  }

  private fun startListening() {
    Log.d(NAME, "Starting to listen")
    val intent = Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH)
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM)
    intent.putExtra(RecognizerIntent.EXTRA_LANGUAGE, "en-US")

    Handler(Looper.getMainLooper()).post {
      speechRecognizer?.setRecognitionListener(object : RecognitionListener {
        override fun onReadyForSpeech(params: Bundle?) {
          Log.d(NAME, "Ready for speech")
        }

        override fun onBeginningOfSpeech() {
          Log.d(NAME, "Speech beginning")
        }

        override fun onRmsChanged(rmsdB: Float) {}

        override fun onBufferReceived(buffer: ByteArray?) {}

        override fun onEndOfSpeech() {
          Log.d(NAME, "Speech end")
        }

        override fun onError(error: Int) {
          Log.e(NAME, "Recognition error: $error")
          if (error != SpeechRecognizer.ERROR_CLIENT) {
            sendEvent("onRecognitionError", error.toString())
            recognitionPromise?.reject("RECOGNITION_ERROR", "Speech recognition error: $error")
          } else {
            recognitionPromise?.resolve("Recognition stopped")
          }
          recognitionPromise = null
        }

        override fun onResults(results: Bundle?) {
          Log.d(NAME, "Results received")
          val matches = results?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          if (!matches.isNullOrEmpty()) {
            sendEvent("onRecognitionResult", matches[0])
            recognitionPromise?.resolve(matches[0])
            recognitionPromise = null
          }
        }

        override fun onPartialResults(partialResults: Bundle?) {
          val matches = partialResults?.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION)
          if (!matches.isNullOrEmpty()) {
            sendEvent("onRecognitionPartialResult", matches[0])
          }
        }

        override fun onEvent(eventType: Int, params: Bundle?) {}
      })
      speechRecognizer?.startListening(intent)
    }
  }

  private fun sendEvent(eventName: String, eventData: String) {
    reactContext.getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, eventData)
  }

  override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray): Boolean {
    if (requestCode == REQUEST_RECORD_AUDIO_PERMISSION) {
      if (grantResults.isNotEmpty() && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
        Log.d(NAME, "Microphone permission granted")
        startListening()
        return true
      } else {
        Log.e(NAME, "Microphone permission denied")
        recognitionPromise?.reject("PERMISSION_DENIED", "Microphone permission denied")
        recognitionPromise = null
        return false
      }
    }
    return false
  }

  @ReactMethod
  fun addListener(eventName: String) {
    // Set up any upstream listeners or background tasks as necessary
  }

  @ReactMethod
  fun removeListeners(count: Int) {
    // Remove upstream listeners, stop unnecessary background tasks
  }

  override fun onNewIntent(intent: Intent?) {}

  override fun onActivityResult(activity: Activity?, requestCode: Int, resultCode: Int, data: Intent?) {}

  companion object {
    const val NAME = "VoiceRecognitionReactNative"
    const val REQUEST_RECORD_AUDIO_PERMISSION = 1
  }
}
