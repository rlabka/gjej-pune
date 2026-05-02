// Monorepo-aware Metro config for Expo + NativeWind
// https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// 1. Watch the whole monorepo so Metro picks up edits in packages/shared, etc.
config.watchFolders = [...(config.watchFolders ?? []), workspaceRoot];

// 2. Resolve modules from both the app-level node_modules and the hoisted root.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
];

// 3. Allow `@jmp/shared` to be resolved from source (no build step).
config.resolver.extraNodeModules = {
  ...(config.resolver.extraNodeModules ?? {}),
  '@jmp/shared': path.resolve(workspaceRoot, 'packages/shared/src'),
};

module.exports = withNativeWind(config, { input: './global.css' });
