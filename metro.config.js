// metro.config.js
// Learn more: https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const { wrapWithReanimatedMetroConfig } = require('react-native-reanimated/metro-config');
const { withNativeWind } = require('nativewind/metro');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// If nativewind needs options, pass them
const configWithNativeWind = withNativeWind(config, { input: "./global.css" });

// Wrap the final config with Reanimated's wrapper
module.exports = wrapWithReanimatedMetroConfig(configWithNativeWind);
