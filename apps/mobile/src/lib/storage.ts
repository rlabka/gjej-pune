import * as SecureStore from 'expo-secure-store';

/**
 * Secure storage wrapper.
 *
 * Uses iOS Keychain / Android Keystore via expo-secure-store.
 * API is async to match native constraints — unlike web localStorage.
 */

export const storage = {
  async get(key: string): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (err) {
      console.warn('[storage] get failed', key, err);
      return null;
    }
  },

  async set(key: string, value: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (err) {
      console.warn('[storage] set failed', key, err);
    }
  },

  async remove(key: string): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (err) {
      console.warn('[storage] remove failed', key, err);
    }
  },
};
