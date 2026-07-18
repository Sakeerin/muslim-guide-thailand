// Metro config for the native app.
//
// The app reuses the web project's translation catalogs (../messages/*.json)
// as the single source of truth. Those files live outside this project root,
// so Metro must be told to watch that folder and resolve the "@messages"
// alias to it. Everything else uses Expo's zero-config defaults.
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

const messagesDir = path.resolve(__dirname, '../messages');
config.watchFolders = [messagesDir];
config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  '@messages': messagesDir,
};

module.exports = config;
