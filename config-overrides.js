/* config-overrides.js */

const { override, overrideDevServer, addLessLoader, addWebpackAlias } = require("customize-cra");


const addProxy = () => (configFunction) => {
  configFunction.proxy = {
    "/API/globaldem": {
      target: 'https://portal.opentopography.org',
      changeOrigin: true,
    },
    "/api/interpreter": {
      target: 'https://overpass-api.de',
      changeOrigin: true,
    }
  };

  return configFunction;
};

module.exports = {
  webpack: override(
    addLessLoader(),
    ),
  devServer: overrideDevServer(addProxy()),
};