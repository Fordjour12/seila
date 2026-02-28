import type { ExpoConfig } from "expo/config";

const appEnv = process.env.APP_ENV ?? "development";
const isDev = appEnv === "development";
const isPreview = appEnv === "preview";
const isProd = appEnv === "production";

const getBundleIdentifier = () => {
   if (isDev) return "com.thedevelophantom.seila.dev";
   if (isPreview) return "com.thedevelophantom.seila.preview";
   return "com.thedevelophantom.seila";
};
const config: ExpoConfig = {
   scheme: isProd ? "seila" : "seila-dev",
   userInterfaceStyle: "automatic",
   orientation: "default",
   icon: "./assets/images/icon.png",
   web: {
      bundler: "metro",
      favicon: "./assets/images/favicon.png",
   },
   name: isProd ? "Seila" : "Seila (Dev)",
   slug: isProd ? "seila" : "seila-dev",
   splash: {
      image: "./assets/images/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#EBEBE8",
   },
   plugins: [
      [
         "expo-font",
         {
            fonts: [
               "./assets/fonts/Raleway/Raleway-Thin.ttf",
               "./assets/fonts/Raleway/Raleway-ThinItalic.ttf",
               "./assets/fonts/Raleway/Raleway-Light.ttf",
               "./assets/fonts/Raleway/Raleway-LightItalic.ttf",
               "./assets/fonts/Raleway/Raleway-Regular.ttf",
               "./assets/fonts/Raleway/Raleway-Italic.ttf",
               "./assets/fonts/Raleway/Raleway-Medium.ttf",
               "./assets/fonts/Raleway/Raleway-MediumItalic.ttf",
               "./assets/fonts/Raleway/Raleway-SemiBold.ttf",
               "./assets/fonts/Raleway/Raleway-SemiBoldItalic.ttf",
               "./assets/fonts/Raleway/Raleway-Bold.ttf",
               "./assets/fonts/Raleway/Raleway-BoldItalic.ttf",
               "./assets/fonts/Raleway/Raleway-ExtraBold.ttf",
               "./assets/fonts/Raleway/Raleway-ExtraBoldItalic.ttf",
               "./assets/fonts/Raleway/Raleway-Black.ttf",
               "./assets/fonts/Raleway/Raleway-BlackItalic.ttf",
            ],
         }],
      "expo-router",
      "expo-secure-store",
      "@react-native-community/datetimepicker",
   ],
   ios: {
      bundleIdentifier: getBundleIdentifier(),
   },
   android: {
      adaptiveIcon: {
         backgroundColor: "#280541",
         foregroundImage: "./assets/images/android-icon-foreground.png",
         backgroundImage: "./assets/images/android-icon-background.png",
         monochromeImage: "./assets/images/android-icon-monochrome.png",
      },
      softwareKeyboardLayoutMode: "resize",
      package: getBundleIdentifier(),
   },
   extra: {
      eas: {
         projectId: "fd9bd7a0-f252-48ff-96f4-0022ccf4e58a"
      },
   },
   experiments: {
      typedRoutes: true,
      reactCompiler: true,
   },
   "updates": {
      "url": "https://u.expo.dev/fd9bd7a0-f252-48ff-96f4-0022ccf4e58a"
   },
   "runtimeVersion": {
      "policy": "appVersion"
   }
};

export default config;
