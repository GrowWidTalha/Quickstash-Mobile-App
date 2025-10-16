const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const { withNativeWind } = require('nativewind/metro');
const {
  getSentryExpoConfig
} = require("@sentry/react-native/metro");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getSentryExpoConfig(__dirname);

// If nativewind needs options, pass them
const configWithNativeWind = withNativeWind(config, { input: "./global.css" });

// Wrap the final config with Reanimated's wrapper
module.exports = wrapWithReanimatedMetroConfig(configWithNativeWind);