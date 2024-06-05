import React, { useState, useEffect } from 'react';
import { SafeAreaView, Button, Text, View } from 'react-native';
import {
  startRecognition,
  stopRecognition,
  addRecognitionListener,
  removeRecognitionListener,
} from 'voice-recognition-react-native';

const App = () => {
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

  useEffect(() => {
    const handleResult = (result: string) => {
      setRecognizedText(result);
    };

    const handleError = (error: string) => {
      console.error('Recognition error received: ', error);
      setIsRecognizing(false);
    };

    addRecognitionListener(handleResult, handleError);

    return () => {
      removeRecognitionListener();
    };
  }, []);

  const handleStartRecognition = async () => {
    try {
      setIsRecognizing(true);
      await startRecognition();
    } catch (error) {
      console.error('Recognition error: ', error);
      setIsRecognizing(false);
    }
  };

  const handleStopRecognition = () => {
    stopRecognition();
    setIsRecognizing(false);
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
