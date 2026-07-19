/**
 * Mobile Storage Service
 * AsyncStorage wrapper with JSON handling and expiry support
 * Production-ready for Expo / React Native
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@StadiumOS:';

class StorageService {
  async setItem(key, value, expiryMinutes = null) {
    try {
      const payload = {
        value,
        timestamp: Date.now(),
        expiry: expiryMinutes ? Date.now() + expiryMinutes * 60 * 1000 : null,
      };
      await AsyncStorage.setItem(`${PREFIX}${key}`, JSON.stringify(payload));
      return true;
    } catch (e) {
      console.error('Storage setItem error', e);
      return false;
    }
  }

  async getItem(key) {
    try {
      const raw = await AsyncStorage.getItem(`${PREFIX}${key}`);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed.expiry && Date.now() > parsed.expiry) {
        await this.removeItem(key);
        return null;
      }
      return parsed.value;
    } catch (e) {
      console.error('Storage getItem error', e);
      return null;
    }
  }

  async removeItem(key) {
    try {
      await AsyncStorage.removeItem(`${PREFIX}${key}`);
      return true;
    } catch (e) {
      console.error('Storage removeItem error', e);
      return false;
    }
  }

  async clear() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const filtered = keys.filter(k => k.startsWith(PREFIX));
      await AsyncStorage.multiRemove(filtered);
      return true;
    } catch (e) {
      console.error('Storage clear error', e);
      return false;
    }
  }

  async getAll() {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const filtered = keys.filter(k => k.startsWith(PREFIX));
      const result = await AsyncStorage.multiGet(filtered);
      const out = {};
      result.forEach(([k, v]) => {
        try {
          const parsed = JSON.parse(v);
          if (!parsed.expiry || Date.now() < parsed.expiry) {
            out[k.replace(PREFIX, '')] = parsed.value;
          }
        } catch {}
      });
      return out;
    } catch (e) {
      console.error('Storage getAll error', e);
      return {};
    }
  }

  async multiSet(items) {
    // items: [{key, value, expiry}]
    try {
      const pairs = items.map(({ key, value, expiryMinutes }) => {
        const payload = { value, timestamp: Date.now(), expiry: expiryMinutes ? Date.now() + expiryMinutes * 60 * 1000 : null };
        return [`${PREFIX}${key}`, JSON.stringify(payload)];
      });
      await AsyncStorage.multiSet(pairs);
      return true;
    } catch (e) {
      console.error('multiSet error', e);
      return false;
    }
  }
}

export default new StorageService();
