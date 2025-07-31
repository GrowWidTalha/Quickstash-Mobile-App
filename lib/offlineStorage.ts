import AsyncStorage from '@react-native-async-storage/async-storage';
import { StashArticle, StashArticleDetail } from '~/contexts/SavesContext';

export interface OfflineAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export class OfflineStorage {
  // Cache keys
  private static readonly SAVES_CACHE_KEY = 'cached_saves';
  private static readonly SAVE_DETAILS_CACHE_KEY = 'cached_save_details';
  private static readonly OFFLINE_ACTIONS_KEY = 'offline_actions';
  private static readonly LAST_SYNC_KEY = 'last_sync_timestamp';

  // Cache saves data
  static async cacheSaves(saves: StashArticle[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SAVES_CACHE_KEY, JSON.stringify(saves));
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to cache saves:', error);
    }
  }

  // Cache individual save detail
  static async cacheSaveDetail(saveDetail: StashArticleDetail): Promise<void> {
    try {
      const existingDetails = await this.getCachedSaveDetails();
      const updatedDetails = {
        ...existingDetails,
        [saveDetail.id]: saveDetail
      };
      await AsyncStorage.setItem(this.SAVE_DETAILS_CACHE_KEY, JSON.stringify(updatedDetails));
    } catch (error) {
      console.error('Failed to cache save detail:', error);
    }
  }

  // Get cached save details
  static async getCachedSaveDetails(): Promise<Record<string, StashArticleDetail>> {
    try {
      const cached = await AsyncStorage.getItem(this.SAVE_DETAILS_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Failed to get cached save details:', error);
      return {};
    }
  }

  // Get specific cached save detail
  static async getCachedSaveDetail(id: string): Promise<StashArticleDetail | null> {
    try {
      const details = await this.getCachedSaveDetails();
      return details[id] || null;
    } catch (error) {
      console.error('Failed to get cached save detail:', error);
      return null;
    }
  }

  // Get cached saves
  static async getCachedSaves(): Promise<StashArticle[]> {
    try {
      const cached = await AsyncStorage.getItem(this.SAVES_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (error) {
      console.error('Failed to get cached saves:', error);
      return [];
    }
  }

  // Add offline action to queue
  static async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
    try {
      const actions = await this.getOfflineActions();
      const newAction: OfflineAction = {
        ...action,
        id: Date.now().toString(),
        timestamp: Date.now()
      };
      actions.push(newAction);
      await AsyncStorage.setItem(this.OFFLINE_ACTIONS_KEY, JSON.stringify(actions));
    } catch (error) {
      console.error('Failed to add offline action:', error);
    }
  }

  // Get all offline actions
  static async getOfflineActions(): Promise<OfflineAction[]> {
    try {
      const actions = await AsyncStorage.getItem(this.OFFLINE_ACTIONS_KEY);
      return actions ? JSON.parse(actions) : [];
    } catch (error) {
      console.error('Failed to get offline actions:', error);
      return [];
    }
  }

  // Clear offline actions after successful sync
  static async clearOfflineActions(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.OFFLINE_ACTIONS_KEY);
    } catch (error) {
      console.error('Failed to clear offline actions:', error);
    }
  }

  // Get last sync timestamp
  static async getLastSyncTimestamp(): Promise<number | null> {
    try {
      const timestamp = await AsyncStorage.getItem(this.LAST_SYNC_KEY);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      console.error('Failed to get last sync timestamp:', error);
      return null;
    }
  }

  // Check if we have offline actions pending
  static async hasOfflineActions(): Promise<boolean> {
    try {
      const actions = await this.getOfflineActions();
      return actions.length > 0;
    } catch (error) {
      console.error('Failed to check offline actions:', error);
      return false;
    }
  }

  // Clear all cached data (useful for testing or user logout)
  static async clearAllCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.SAVES_CACHE_KEY,
        this.SAVE_DETAILS_CACHE_KEY,
        this.OFFLINE_ACTIONS_KEY,
        this.LAST_SYNC_KEY
      ]);
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
} 