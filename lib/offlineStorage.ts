// offlineStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { StashArticleDetail } from '~/contexts/SavesContext';
import { extractHostname } from './utils';

export interface OfflineAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

export class OfflineStorage {
  // Cache keys
  private static readonly SAVES_CACHE_KEY = 'cached_saves';
  private static readonly SAVE_DETAILS_CACHE_KEY = 'cached_save_details_meta'; // we store metadata here
  private static readonly OFFLINE_ACTIONS_KEY = 'offline_actions';
  private static readonly LAST_SYNC_KEY = 'last_sync_timestamp';

  // File system folder for article HTML
  private static readonly ARTICLES_DIR = `${FileSystem.documentDirectory}articles/`;
  // threshold to decide whether to store content in file or in async storage (chars)
  private static readonly HTML_TO_FILE_THRESHOLD = 1500;

  // Ensure directory exists
  private static async ensureArticlesDir() {
    try {
      const info = await FileSystem.getInfoAsync(this.ARTICLES_DIR);
      if (!info.exists) {
        await FileSystem.makeDirectoryAsync(this.ARTICLES_DIR, { intermediates: true });
      }
    } catch (e) {
      console.error('Failed to ensure articles dir:', e);
    }
  }

  // Cache saves list (metadata only)
  static async cacheSaves(saves: any[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SAVES_CACHE_KEY, JSON.stringify(saves));
      await AsyncStorage.setItem(this.LAST_SYNC_KEY, Date.now().toString());
    } catch (error) {
      console.error('Failed to cache saves:', error);
    }
  }

  // Cache individual save detail. This will store the HTML content in a file if it's large.
  static async cacheSaveDetail(saveDetail: StashArticleDetail): Promise<void> {
    try {
      // Ensure articles dir exists
      await this.ensureArticlesDir();

      // load existing metadata map
      const metaRaw = await AsyncStorage.getItem(this.SAVE_DETAILS_CACHE_KEY);
      const existingMeta = metaRaw ? JSON.parse(metaRaw) : {};

      // prepare metadata entry
      const metaEntry: any = {
        id: saveDetail.id,
        title: saveDetail.title,
        url: saveDetail.url,
        featured_image_url: saveDetail.featured_image_url,
        isArchived: saveDetail.isArchived,
        isRead: saveDetail.isRead,
        updatedAt: saveDetail.updatedAt || Date.now().toString(),
        // filePath will be set if we wrote the HTML to file
        filePath: null,
        // small excerpt kept in meta for list display / preview
        excerpt: saveDetail.content ? saveDetail.content.slice(0, 300) : saveDetail.excerpt || '',
      };

      // If content exists and is big enough, write to file and save path to meta
      if (saveDetail.content && saveDetail.content.length >= this.HTML_TO_FILE_THRESHOLD) {
        const filename = `${saveDetail.id}.html`;
        const path = `${this.ARTICLES_DIR}${filename}`;

        try {
          await FileSystem.writeAsStringAsync(path, saveDetail.content, { encoding: FileSystem.EncodingType.UTF8 });
          metaEntry.filePath = path;
        } catch (fileErr) {
          console.error('Failed to write article HTML to file, falling back to meta storage', fileErr);
          // fallthrough — we'll store the content in meta object below
        }
      } else if (saveDetail.content) {
        // store small content in metadata (so you don't need extra file read)
        metaEntry.smallContent = saveDetail.content;
      }

      // write back meta map
      const updatedMeta = {
        ...existingMeta,
        [saveDetail.id]: metaEntry
      };
      await AsyncStorage.setItem(this.SAVE_DETAILS_CACHE_KEY, JSON.stringify(updatedMeta));
    } catch (error) {
      console.error('Failed to cache save detail:', error);
    }
  }

  // Get cached save details metadata map
  static async getCachedSaveDetails(): Promise<Record<string, any>> {
    try {
      const cached = await AsyncStorage.getItem(this.SAVE_DETAILS_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Failed to get cached save details meta:', error);
      return {};
    }
  }

  // Get specific cached save detail — reads file if filePath is present
  static async getCachedSaveDetail(id: string): Promise<StashArticleDetail | null> {
    try {
      const detailsMeta = await this.getCachedSaveDetails();
      const meta = detailsMeta[id];
      if (!meta) return null;

      // If there's a filePath, read the file contents
      if (meta.filePath) {
        try {
          const content = await FileSystem.readAsStringAsync(meta.filePath, { encoding: FileSystem.EncodingType.UTF8 });
          return {
            id: meta.id,
            title: meta.title,
            url: meta.url,
            excerpt: meta.excerpt || '',
            featured_image_url: meta.featured_image_url || '',
            isArchived: meta.isArchived || false,
            isRead: meta.isRead || false,
            createdAt: meta.createdAt || '',
            updatedAt: meta.updatedAt || '',
            source: meta.source || extractHostname(meta.url),
            content
          };
        } catch (readErr) {
          console.error('Failed to read article file content:', readErr);
          // fallback to smallContent if it exists
          if (meta.smallContent) {
            return {
              id: meta.id,
              title: meta.title,
              url: meta.url,
              excerpt: meta.excerpt || '',
              featured_image_url: meta.featured_image_url || '',
              isArchived: meta.isArchived || false,
              isRead: meta.isRead || false,
              createdAt: meta.createdAt || '',
              updatedAt: meta.updatedAt || '',
              source: meta.source || extractHostname(meta.url),
              content: meta.smallContent
            };
          }
          return null;
        }
      }

      // If we stored smallContent in metadata
      if (meta.smallContent) {
        return {
          id: meta.id,
          title: meta.title,
          url: meta.url,
          excerpt: meta.excerpt || '',
          featured_image_url: meta.featured_image_url || '',
          isArchived: meta.isArchived || false,
          isRead: meta.isRead || false,
          createdAt: meta.createdAt || '',
          updatedAt: meta.updatedAt || '',
          source: meta.source || extractHostname(meta.url),
          content: meta.smallContent
        };
      }

      // if no file and no smallContent, return basic meta (no content)
      return {
        id: meta.id,
        title: meta.title,
        url: meta.url,
        excerpt: meta.excerpt || '',
        featured_image_url: meta.featured_image_url || '',
        isArchived: meta.isArchived || false,
        isRead: meta.isRead || false,
        createdAt: meta.createdAt || '',
        updatedAt: meta.updatedAt || '',
        source: meta.source || extractHostname(meta.url),
        content: ''
      };
    } catch (error) {
      console.error('Failed to get cached save detail:', error);
      return null;
    }
  }

  // Get cached saves
  static async getCachedSaves(): Promise<any[]> {
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

  // Delete cached save detail (including file if exists)
  static async deleteCachedSaveDetail(id: string): Promise<void> {
    try {
      const meta = await this.getCachedSaveDetails();
      const entry = meta[id];
      if (!entry) return;
      if (entry.filePath) {
        try {
          await FileSystem.deleteAsync(entry.filePath, { idempotent: true });
        } catch (e) {
          console.warn('Failed to delete article file:', e);
        }
      }
      delete meta[id];
      await AsyncStorage.setItem(this.SAVE_DETAILS_CACHE_KEY, JSON.stringify(meta));
    } catch (e) {
      console.error('Failed to delete cached save detail:', e);
    }
  }

  // Clear all cached data (useful for testing or user logout)
  static async clearAllCache(): Promise<void> {
    try {
      // remove metadata first
      await AsyncStorage.multiRemove([
        this.SAVES_CACHE_KEY,
        this.SAVE_DETAILS_CACHE_KEY,
        this.OFFLINE_ACTIONS_KEY,
        this.LAST_SYNC_KEY
      ]);
      // attempt to delete articles folder (best-effort)
      try {
        const info = await FileSystem.getInfoAsync(this.ARTICLES_DIR);
        if (info.exists) {
          await FileSystem.deleteAsync(this.ARTICLES_DIR, { idempotent: true });
        }
      } catch (fsErr) {
        console.warn('Failed to remove articles directory:', fsErr);
      }
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }
}
