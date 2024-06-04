import Foundation
import React
import Speech
import AVFoundation

@objc(VoiceRecognitionReactNative)
class VoiceRecognitionReactNative: RCTEventEmitter {

  private var speechRecognizer: SFSpeechRecognizer?
  private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
  private var recognitionTask: SFSpeechRecognitionTask?
  private var audioEngine = AVAudioEngine()
  private var recognitionResolve: RCTPromiseResolveBlock?
  private var recognitionReject: RCTPromiseRejectBlock?
  
  override init() {
    super.init()
    self.speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
  }

  override func supportedEvents() -> [String]! {
    return ["onRecognitionResult"]
  }
  
  @objc(startRecognition:reject:)
  func startRecognition(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    SFSpeechRecognizer.requestAuthorization { (authStatus) in
      switch authStatus {
      case .authorized:
        self.recognitionResolve = resolve
        self.recognitionReject = reject
        self.startRecording(resolve: resolve, reject: reject)
      case .denied, .restricted, .notDetermined:
        reject("authorization_error", "Speech recognition authorization denied.", nil)
      @unknown default:
        reject("authorization_error", "Speech recognition authorization unknown error.", nil)
      }
    }
  }

  @objc
  func stopRecognition() {
    audioEngine.stop()
    recognitionRequest?.endAudio()
    if let recognitionTask = recognitionTask {
      recognitionTask.cancel()
      self.recognitionTask = nil
      self.recognitionRequest = nil
      if let resolve = self.recognitionResolve {
        resolve("Recognition stopped")
        self.recognitionResolve = nil
        self.recognitionReject = nil
      }
    }
  }

  private func startRecording(resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
    if recognitionTask != nil {
      recognitionTask?.cancel()
      recognitionTask = nil
    }
    
    if audioEngine.isRunning {
      audioEngine.stop()
      audioEngine.inputNode.removeTap(onBus: 0)
    }
    
    let audioSession = AVAudioSession.sharedInstance()
    do {
      try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
      try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
    } catch {
      reject("audio_session_error", "Audio session setup error.", error)
      return
    }
    
    recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
    
    let inputNode = audioEngine.inputNode
    
    guard let recognitionRequest = recognitionRequest else {
      reject("recognition_request_error", "Unable to create recognition request.", nil)
      return
    }
    
    recognitionRequest.shouldReportPartialResults = true
    
    recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { result, error in
      if let result = result {
        let transcription = result.bestTranscription.formattedString
        self.sendEvent(withName: "onRecognitionResult", body: transcription)  // 실시간 결과 전달
        if result.isFinal {
          self.audioEngine.stop()
          inputNode.removeTap(onBus: 0)
          self.recognitionRequest = nil
          self.recognitionTask = nil
          if let resolve = self.recognitionResolve {
            resolve(transcription)
            self.recognitionResolve = nil
            self.recognitionReject = nil
          }
        }
      }
      
      if let error = error {
        self.audioEngine.stop()
        inputNode.removeTap(onBus: 0)
        self.recognitionRequest = nil
        self.recognitionTask = nil
        if let reject = self.recognitionReject {
          reject("recognition_error", "Speech recognition error.", error)
          self.recognitionResolve = nil
          self.recognitionReject = nil
        }
      }
    }
    
    let recordingFormat = inputNode.outputFormat(forBus: 0)
    inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { (buffer, when) in
      self.recognitionRequest?.append(buffer)
    }
    
    audioEngine.prepare()
    
    do {
      try audioEngine.start()
    } catch {
      reject("audio_engine_error", "Audio engine start error.", error)
      self.recognitionResolve = nil
      self.recognitionReject = nil
    }
  }

  @objc override static func requiresMainQueueSetup() -> Bool {
    return true
  }
}
