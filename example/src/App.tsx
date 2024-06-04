import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Button,
  Text,
  View,
  NativeEventEmitter,
  NativeModules,
} from 'react-native';
import { startRecognition } from 'voice-recognition-react-native';

const { VoiceRecognitionReactNative } = NativeModules;
const recognitionEmitter = new NativeEventEmitter(VoiceRecognitionReactNative);

const App = () => {
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

  useEffect(() => {
    const subscription = recognitionEmitter.addListener(
      'onRecognitionResult',
      (result: string) => {
        setRecognizedText(result);
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);

  const handleStartRecognition = async () => {
    try {
      setIsRecognizing(true);
      const result = await startRecognition();
      setRecognizedText(result);
      setIsRecognizing(false);
    } catch (error) {
      setIsRecognizing(false);
    }
  };

  const handleStopRecognition = () => {
    if (
      VoiceRecognitionReactNative &&
      typeof VoiceRecognitionReactNative.stopRecognition === 'function'
    ) {
      VoiceRecognitionReactNative.stopRecognition();
      setIsRecognizing(false);
    } else {
      console.error('stopRecognition is not a function');
    }
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
      }}
    >
      <Button
        title="Start Recognition"
        onPress={handleStartRecognition}
        disabled={isRecognizing}
      />
      <Button
        title="Stop Recognition"
        onPress={handleStopRecognition}
        disabled={!isRecognizing}
      />
      <View
        style={{
          padding: 10,
          backgroundColor: '#333',
          borderRadius: 5,
          marginTop: 20,
        }}
      >
        <Text style={{ color: '#fff', fontSize: 16 }}>
          Recognized Text: {recognizedText}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default App;
