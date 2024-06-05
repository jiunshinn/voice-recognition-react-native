# voice-recognition-react-native

voice recognition at react native

The `voice-recognition-react-native` is a library that provides voice recognition functionality in React Native applications. This library supports voice recognition on iOS and Android.

## Installation

```sh
npm install voice-recognition-react-native
yarn add voice-recognition-react-native
```

## Setting

### Ios

in ios/Podfile

```rb
pod 'RNSpeechRecognition', :path => '../node_modules/voice-recognition-react-native/ios'
```

in Info.plist

```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>We need access to your microphone for speech recognition</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need access to your microphone for speech recognition</string>
```

and root of terminal

```sh
cd ios
pod install
cd ..
```

### Android

in android/app/src/main/AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO"/>
```

in MainApplication.java

```java
import com.voicerecognitionreactnative.VoiceRecognitionReactNativePackage; #add this line

public class MainApplication extends Application implements ReactApplication {

  @Override
  protected List<ReactPackage> getPackages() {
    return Arrays.<ReactPackage>asList(
        new MainReactPackage(),
        new VoiceRecognitionReactNativePackage() # add this line
    );
  }
}

```

## Usage

```js
import React, { useState, useEffect } from 'react';
import { SafeAreaView, Button, Text, View } from 'react-native';
import {
  startRecognition,
  stopRecognition,
  addRecognitionListener,
  removeRecognitionListener
} from 'voice-recognition-react-native';

const App = () => {
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [isRecognizing, setIsRecognizing] = useState<boolean>(false);

  useEffect(() => {
    const handleResult = (result: string) => {
      setRecognizedText(result);
      console.log('Recognition result received: ', result);
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
      console.log('Recognition started');
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
    console.log('Recognition stopped');
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
      <Button title="Start Recognition" onPress={handleStartRecognition} disabled={isRecognizing} />
      <Button title="Stop Recognition" onPress={handleStopRecognition} disabled={!isRecognizing} />
      <View style={{ padding: 10, backgroundColor: '#333', borderRadius: 5, marginTop: 20 }}>
        <Text style={{ color: '#fff', fontSize: 16 }}>
          Recognized Text: {recognizedText}
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default App;
```

## Support Api

startRecognition(): Promise<string>
Starts speech recognition. Returns a Promise that returns the recognized text.

stopRecognition(): void
Stop speech recognition.

addRecognitionListener(onResult: (result: string) => void, onError: (error: string) => void): void
Add listeners for speech recognition results and errors.

removeRecognitionListener(): void
remove recognition listeners

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
