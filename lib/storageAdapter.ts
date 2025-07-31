import { StashArticle } from '~/contexts/SavesContext';

// Interface for storage adapters - makes it easy to swap implementations
export interface StorageAdapter {
  // Saves operations
  cacheSaves(saves: StashArticle[]): Promise<void>;
  getCachedSaves(): Promise<StashArticle[]>;
  
  // Offline actions operations
  addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void>;
  getOfflineActions(): Promise<OfflineAction[]>;
  clearOfflineActions(): Promise<void>;
  hasOfflineActions(): Promise<boolean>;
  
  // Metadata operations
  getLastSyncTimestamp(): Promise<number | null>;
  clearAllCache(): Promise<void>;
}

export interface OfflineAction {
  id: string;
  type: 'add' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

// Current AsyncStorage implementation
export class AsyncStorageAdapter implements StorageAdapter {
  private static readonly SAVES_CACHE_KEY = 'cached_saves';
  private static readonly OFFLINE_ACTIONS_KEY = 'offline_actions';
  private static readonly LAST_SYNC_KEY = 'last_sync_timestamp';

  async cacheSaves(saves: StashArticle[]): Promise<void> {
    // Implementation will be moved from OfflineStorage
    throw new Error('Not implemented - use OfflineStorage for now');
  }

  async getCachedSaves(): Promise<StashArticle[]> {
    throw new Error('Not implemented - use OfflineStorage for now');
  }

  async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
    throw new Error('Not implemented - use OfflineStorage for now');
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    throw new Error('Not implemented - use OfflineStorage for now');
  }

  async clearOfflineActions(): Promise<void> {
    throw new Error('Not implemented - use OfflineStorage for now');
  }

  async hasOfflineActions(): Promise<boolean> {
    throw new Error('Not implemented - use OfflineStorage for now');
  }

  async getLastSyncTimestamp(): Promise<number | null> {
    throw new Error('Not implemented - use OfflineStorage for now');
  }

  async clearAllCache(): Promise<void> {
    throw new Error('Not implemented - use OfflineStorage for now');
  }
}

// Future WatermelonDB adapter (placeholder)
export class WatermelonDBAdapter implements StorageAdapter {
  async cacheSaves(saves: StashArticle[]): Promise<void> {
    // TODO: Implement with WatermelonDB
    throw new Error('WatermelonDB adapter not implemented yet');
  }

  async getCachedSaves(): Promise<StashArticle[]> {
    throw new Error('WatermelonDB adapter not implemented yet');
  }

  async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
    throw new Error('WatermelonDB adapter not implemented yet');
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    throw new Error('WatermelonDB adapter not implemented yet');
  }

  async clearOfflineActions(): Promise<void> {
    throw new Error('WatermelonDB adapter not implemented yet');
  }

  async hasOfflineActions(): Promise<boolean> {
    throw new Error('WatermelonDB adapter not implemented yet');
  }

  async getLastSyncTimestamp(): Promise<number | null> {
    throw new Error('WatermelonDB adapter not implemented yet');
  }

  async clearAllCache(): Promise<void> {
    throw new Error('WatermelonDB adapter not implemented yet');
  }
}

// Future SQLite adapter (placeholder)
export class SQLiteAdapter implements StorageAdapter {
  async cacheSaves(saves: StashArticle[]): Promise<void> {
    // TODO: Implement with expo-sqlite
    throw new Error('SQLite adapter not implemented yet');
  }

  async getCachedSaves(): Promise<StashArticle[]> {
    throw new Error('SQLite adapter not implemented yet');
  }

  async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp'>): Promise<void> {
    throw new Error('SQLite adapter not implemented yet');
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    throw new Error('SQLite adapter not implemented yet');
  }

  async clearOfflineActions(): Promise<void> {
    throw new Error('SQLite adapter not implemented yet');
  }

  async hasOfflineActions(): Promise<boolean> {
    throw new Error('SQLite adapter not implemented yet');
  }

  async getLastSyncTimestamp(): Promise<number | null> {
    throw new Error('SQLite adapter not implemented yet');
  }

  async clearAllCache(): Promise<void> {
    throw new Error('SQLite adapter not implemented yet');
  }
}

// Storage factory - easy to switch implementations
export class StorageFactory {
  private static instance: StorageAdapter | null = null;
  private static adapterType: 'asyncStorage' | 'watermelonDB' | 'sqlite' = 'asyncStorage';

  static setAdapterType(type: 'asyncStorage' | 'watermelonDB' | 'sqlite') {
    this.adapterType = type;
    this.instance = null; // Reset instance to force recreation
  }

  static getStorage(): StorageAdapter {
    if (!this.instance) {
      switch (this.adapterType) {
        case 'watermelonDB':
          this.instance = new WatermelonDBAdapter();
          break;
        case 'sqlite':
          this.instance = new SQLiteAdapter();
          break;
        case 'asyncStorage':
        default:
          this.instance = new AsyncStorageAdapter();
          break;
      }
    }
    return this.instance;
  }
} 