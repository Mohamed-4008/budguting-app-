const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Disable service workers completely
  config.plugins = config.plugins.filter(plugin => {
    return !plugin.constructor || plugin.constructor.name !== 'GenerateSW';
  });
  
  // Also disable Workbox plugin if present
  config.plugins = config.plugins.filter(plugin => {
    return !plugin.constructor || plugin.constructor.name !== 'InjectManifest';
  });
  
  return config;
};