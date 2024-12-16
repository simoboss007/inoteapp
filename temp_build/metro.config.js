const { getDefaultConfig } = require('expo/metro-config');

module.exports = (() => {
  const config = getDefaultConfig(__dirname);

  const { transformer, resolver } = config;

  config.resolver = {
    ...resolver,
    assetExts: [...resolver.assetExts, 'ttf'],
    sourceExts: [...resolver.sourceExts],
    extraNodeModules: {
      '@expo/vector-icons': require.resolve('@expo/vector-icons'),
    },
  };

  // Prevent duplicate module names
  config.resolver.hasteImplModulePath = null;

  // Clear cache settings
  config.cacheStores = [];
  config.resetCache = true;

  // Add watchFolders configuration
  config.watchFolders = [__dirname];

  return config;
})();
