import Constants from 'expo-constants';

/**
 * Environment configuration.
 *
 * EXPO_PUBLIC_* variables are statically inlined at build time by Expo's
 * babel transform — but ONLY for literal property access like
 * `process.env.EXPO_PUBLIC_API_URL`. Dynamic access via a variable key
 * (`process.env[key]`) is NOT replaced and ends up undefined at runtime,
 * causing the build to silently fall back to localhost.
 */

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

function fromExtra(key: string): string | undefined {
  const v = extra[key];
  return typeof v === 'string' && v.length > 0 ? v : undefined;
}

export const config = {
  apiUrl:
    process.env.EXPO_PUBLIC_API_URL ||
    fromExtra('EXPO_PUBLIC_API_URL') ||
    'http://localhost:4000',
  wsUrl:
    process.env.EXPO_PUBLIC_WS_URL ||
    fromExtra('EXPO_PUBLIC_WS_URL') ||
    'http://localhost:4000',
  wsPath:
    process.env.EXPO_PUBLIC_WS_PATH ||
    fromExtra('EXPO_PUBLIC_WS_PATH') ||
    '/ws',
  defaultLocale:
    process.env.EXPO_PUBLIC_DEFAULT_LOCALE ||
    fromExtra('EXPO_PUBLIC_DEFAULT_LOCALE') ||
    'de',
} as const;
