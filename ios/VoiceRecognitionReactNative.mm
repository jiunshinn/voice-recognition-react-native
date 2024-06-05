#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(VoiceRecognitionReactNative, NSObject)
RCT_EXTERN_METHOD(startRecognition: (RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(stopRecognition)
@end


