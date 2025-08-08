import { enableTailwind } from "@remotion/tailwind-v4";

/**
 *  @param {import('webpack').Configuration} currentConfig
 */
export const webpackOverride = (currentConfig) => {
  const config = enableTailwind(currentConfig);

  // Ensure static assets are properly handled
  config.module.rules.push({
    test: /\.(png|jpg|jpeg|gif|svg)$/i,
    type: "asset/resource",
  });

  return config;
};
