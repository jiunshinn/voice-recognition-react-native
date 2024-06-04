import {
  NativeModules,
  Platform,
  PermissionsAndroid,
  Alert,
  Linking,
} from 'react-native';

const { VoiceRecognitionReactNative } = NativeModules;

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
