const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");

const config = getDefaultConfig(__dirname);

// 支持 expo-sqlite 的 web 端 WebAssembly (.wasm) 文件
if (!config.resolver.assetExts.includes("wasm")) {
  config.resolver.assetExts.push("wasm");
}

// 注入 Web 端 SharedArrayBuffer 所需的跨域策略响应头
if (!config.server) {
  config.server = {};
}
const prevEnhance = config.server.enhanceMiddleware;
config.server.enhanceMiddleware = (middleware, server) => {
  const current = prevEnhance ? prevEnhance(middleware, server) : middleware;
  return (req, res, next) => {
    res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    return current(req, res, next);
  };
};

module.exports = withNativeWind(config, { input: "./global.css" });

