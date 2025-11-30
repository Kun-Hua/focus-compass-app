import AsyncStorage from '@react-native-async-storage/async-storage';

export interface StorageDriver {
  getItem(key: string): Promise<string | null>;
  setItem(key: string, value: string): Promise<void>;
  removeItem(key: string): Promise<void>;
}

class AsyncStorageDriver implements StorageDriver {
  async getItem(key: string) {
    return AsyncStorage.getItem(key);
  }

  async setItem(key: string, value: string) {
    await AsyncStorage.setItem(key, value);
  }

  async removeItem(key: string) {
    await AsyncStorage.removeItem(key);
  }
}

export const asyncStorageDriver: StorageDriver = new AsyncStorageDriver();
