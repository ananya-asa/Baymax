const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add 'glb' to the asset extensions so Metro recognizes it
config.resolver.assetExts.push('glb');

module.exports = config;