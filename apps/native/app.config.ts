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
      ["expo-font"],
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
      edgeToEdgeEnabled: true,
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

};

export default config;
