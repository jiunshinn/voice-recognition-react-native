import {
  NativeModules,
  NativeEventEmitter,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
} from 'react-native';

const { VoiceRecognitionReactNative } = NativeModules;
const recognitionEmitter = new NativeEventEmitter(VoiceRecognitionReactNative);

type RecognitionResultCallback = (result: string) => void;
type RecognitionErrorCallback = (error: string) => void;

let resultSubscription: any = null;
let errorSubscription: any = null;

const requestAndroidPermission = async (): Promise<boolean> => {
  const permission = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;

  if (!permission) {
    console.error('RECORD_AUDIO permission is not defined');
    return false;
  }

  try {
    const granted = await PermissionsAndroid.request(permission, {
      title: 'Voice Recognition Permission',
      message:
        'This app needs access to your microphone for speech recognition.',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    });

    if (granted === PermissionsAndroid.RESULTS.GRANTED) {
      return true;
    } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      Alert.alert(
        'Microphone Permission',
        'Microphone permission is required to use this feature. Please go to settings to enable it.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
      return false;
    } else {
      return false;
    }
  } catch (err) {
    console.error('Permission request error: ', err);
    return false;
  }
};

export const startRecognition = async (): Promise<string> => {
  if (Platform.OS === 'ios') {
    return VoiceRecognitionReactNative.startRecognition();
  } else if (Platform.OS === 'android') {
    const hasPermission = await requestAndroidPermission();
    if (hasPermission) {
      return VoiceRecognitionReactNative.startRecognition();
    } else {
      throw new Error('Microphone permission denied');
    }
  } else {
    throw new Error('Platform not supported');
  }
};

export const stopRecognition = (): void => {
  VoiceRecognitionReactNative.stopRecognition();
};

export const addRecognitionListener = (
  onResult: RecognitionResultCallback,
  onError: RecognitionErrorCallback
): void => {
  resultSubscription = recognitionEmitter.addListener(
    'onRecognitionResult',
    onResult
  );
  errorSubscription = recognitionEmitter.addListener(
    'onRecognitionError',
    (error: string) => {
      if (
        error !== 'Recognition stopped' &&
        error !== 'Recognition request was canceled'
      ) {
        onError(error);
      }
    }
  );
};

export const removeRecognitionListener = (): void => {
  resultSubscription?.remove();
  errorSubscription?.remove();
  resultSubscription = null;
  errorSubscription = null;
};
