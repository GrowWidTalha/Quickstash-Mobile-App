import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { fetcher } from '~/lib/fetcher';
import { useAuth } from './AuthContext';
import { OfflineStorage } from '~/lib/offlineStorage';
import NetInfo from '@react-native-community/netinfo';

// Types
export interface StashArticle {
  id: string;
  title: string;
  url: string;
  excerpt: string;
  imageUrl: string;
  isArchived: boolean;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
  readTime: number;
  source: string;
}

export interface StashArticleDetail extends StashArticle {
  content: string;
}

interface SavesContextType {
  // State
  saves: StashArticle[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  isOnline: boolean;
  hasOfflineActions: boolean;
  
  // Actions
  fetchSaves: () => Promise<void>;
  addSave: (url: string) => Promise<{ success: boolean; error?: string }>;
  updateSave: (id: string, updates: Partial<StashArticle>) => Promise<{ success: boolean; error?: string }>;
  deleteSave: (id: string) => Promise<{ success: boolean; error?: string }>;
  markAsRead: (id: string) => Promise<{ success: boolean; error?: string }>;
  archiveSave: (id: string) => Promise<{ success: boolean; error?: string }>;
  getSaveById: (id: string) => Promise<{ data: StashArticleDetail | null; error?: string }>;
  syncOfflineActions: () => Promise<void>;
  
  // Computed
  readArticles: StashArticle[];
  unreadArticles: StashArticle[];
  archivedArticles: StashArticle[];
  unarchivedArticles: StashArticle[];
}

const SavesContext = createContext<SavesContextType | undefined>(undefined);

export const useSaves = () => {
  const context = useContext(SavesContext);
  if (!context) {
    throw new Error('useSaves must be used within a SavesProvider');
  }
  return context;
};

export const SavesProvider = ({ children }: { children: ReactNode }) => {
  const { user, sessionLoaded } = useAuth();
  const [saves, setSaves] = useState<StashArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [hasOfflineActions, setHasOfflineActions] = useState(false);

  // Computed properties
  const readArticles = saves.filter(article => article.isRead);
  const unreadArticles = saves.filter(article => !article.isRead);
  const archivedArticles = saves.filter(article => article.isArchived);
  const unarchivedArticles = saves.filter(article => !article.isArchived);

  // Network status monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOnline(state.isConnected ?? true);
    });
    return unsubscribe;
  }, []);

  // Check for offline actions on mount
  useEffect(() => {
    const checkOfflineActions = async () => {
      const hasActions = await OfflineStorage.hasOfflineActions();
      setHasOfflineActions(hasActions);
    };
    checkOfflineActions();
  }, []);

  // Fetch all saves
  const fetchSaves = useCallback(async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      if (isOnline) {
        const response = await fetcher("getAllSaves");
        
        if (response.success && response.data?.saves) {
          setSaves(response.data.saves);
          // Cache the data
          await OfflineStorage.cacheSaves(response.data.saves);
        } else {
          setError(response.error || 'Failed to fetch saves');
        }
      } else {
        // Use cached data when offline
        const cachedSaves = await OfflineStorage.getCachedSaves();
        setSaves(cachedSaves);
      }
    } catch (err: any) {
      // Fallback to cached data on error
      const cachedSaves = await OfflineStorage.getCachedSaves();
      setSaves(cachedSaves);
      setError(err.message || 'Failed to fetch saves');
    } finally {
      setLoading(false);
    }
  }, [user, isOnline]);

  // Add new save
  const addSave = useCallback(async (url: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      if (isOnline) {
        const response = await fetcher("addSave", { url });
        
        if (response.success && response.data?.save) {
          setSaves(prev => [response.data.save, ...prev]);
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Failed to add save' };
        }
      } else {
        // Create optimistic update for offline
        const optimisticSave: StashArticle = {
          id: `offline_${Date.now()}`,
          title: 'Loading...',
          url,
          excerpt: '',
          imageUrl: '',
          isArchived: false,
          isRead: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          readTime: 0,
          source: 'offline'
        };
        
        setSaves(prev => [optimisticSave, ...prev]);
        
        // Queue for later sync
        await OfflineStorage.addOfflineAction({
          type: 'add',
          data: { url }
        });
        setHasOfflineActions(true);
        
        return { success: true };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to add save' };
    }
  }, [user, isOnline]);

  // Update save
  const updateSave = useCallback(async (id: string, updates: Partial<StashArticle>) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      if (isOnline) {
        const response = await fetcher("updateSave", { id, ...updates });
        
        if (response.success && response.data?.save) {
          setSaves(prev => prev.map(save => 
            save.id === id ? { ...save, ...response.data.save } : save
          ));
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Failed to update save' };
        }
      } else {
        // Optimistic update for offline
        setSaves(prev => prev.map(save => 
          save.id === id ? { ...save, ...updates } : save
        ));
        
        // Queue for later sync
        await OfflineStorage.addOfflineAction({
          type: 'update',
          data: { id, ...updates }
        });
        setHasOfflineActions(true);
        
        return { success: true };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update save' };
    }
  }, [user, isOnline]);

  // Delete save
  const deleteSave = useCallback(async (id: string) => {
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      if (isOnline) {
        const response = await fetcher("deleteSave", { id });
        
        if (response.success) {
          setSaves(prev => prev.filter(save => save.id !== id));
          return { success: true };
        } else {
          return { success: false, error: response.error || 'Failed to delete save' };
        }
      } else {
        // Optimistic delete for offline
        setSaves(prev => prev.filter(save => save.id !== id));
        
        // Queue for later sync
        await OfflineStorage.addOfflineAction({
          type: 'delete',
          data: { id }
        });
        setHasOfflineActions(true);
        
        return { success: true };
      }
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to delete save' };
    }
  }, [user, isOnline]);

  // Mark as read
  const markAsRead = useCallback(async (id: string) => {
    return updateSave(id, { isRead: true });
  }, [updateSave]);

  // Archive save
  const archiveSave = useCallback(async (id: string) => {
    return updateSave(id, { isArchived: true });
  }, [updateSave]);

  // Get save by ID
  const getSaveById = useCallback(async (id: string) => {
    if (!user) return { data: null, error: 'User not authenticated' };
    
    try {
      if (isOnline) {
        const response = await fetcher("getSaveById", { id });
        
        if (response.success && response.data) {
          // Cache the save detail for offline access
          await OfflineStorage.cacheSaveDetail(response.data);
          return { data: response.data };
        } else {
          return { data: null, error: response.error || 'Failed to fetch save' };
        }
      } else {
        // Try to find the save in cached data when offline
        // First check if we have the full save detail cached
        const cachedDetail = await OfflineStorage.getCachedSaveDetail(id);
        if (cachedDetail) {
          return { data: cachedDetail };
        }
        
        // Fallback to basic save data from the list
        const cachedSaves = await OfflineStorage.getCachedSaves();
        const foundSave = cachedSaves.find(save => save.id === id);
        
        if (foundSave) {
          // For offline saves, we might not have the full content
          // Create a basic StashArticleDetail with available data
          const saveDetail: StashArticleDetail = {
            ...foundSave,
            content: foundSave.excerpt || 'Content not available offline'
          };
          return { data: saveDetail };
        } else {
          return { data: null, error: 'Save not found in cached data' };
        }
      }
    } catch (err: any) {
      // Fallback to cached data on error
      try {
        // First check for cached save detail
        const cachedDetail = await OfflineStorage.getCachedSaveDetail(id);
        if (cachedDetail) {
          return { data: cachedDetail };
        }
        
        // Fallback to basic save data
        const cachedSaves = await OfflineStorage.getCachedSaves();
        const foundSave = cachedSaves.find(save => save.id === id);
        
        if (foundSave) {
          const saveDetail: StashArticleDetail = {
            ...foundSave,
            content: foundSave.excerpt || 'Content not available offline'
          };
          return { data: saveDetail };
        }
      } catch (cacheErr) {
        console.error('Failed to access cached data:', cacheErr);
      }
      
      return { data: null, error: err.message || 'Failed to fetch save' };
    }
  }, [user, isOnline]);

  // Sync offline actions when back online
  const syncOfflineActions = useCallback(async () => {
    if (!isOnline || !user) return;
    
    const actions = await OfflineStorage.getOfflineActions();
    if (actions.length === 0) return;
    
    for (const action of actions) {
      try {
        switch (action.type) {
          case 'add':
            await fetcher("addSave", action.data);
            break;
          case 'update':
            await fetcher("updateSave", action.data);
            break;
          case 'delete':
            await fetcher("deleteSave", action.data);
            break;
        }
      } catch (error) {
        console.error('Failed to sync action:', action, error);
      }
    }
    
    await OfflineStorage.clearOfflineActions();
    setHasOfflineActions(false);
    
    // Refresh saves after sync
    await fetchSaves();
  }, [isOnline, user, fetchSaves]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && hasOfflineActions) {
      syncOfflineActions();
    }
  }, [isOnline, hasOfflineActions, syncOfflineActions]);

  // Auto-fetch saves when user is authenticated
  useEffect(() => {
    if (sessionLoaded && user) {
      fetchSaves();
    } else if (sessionLoaded && !user) {
      setSaves([]);
      setError(null);
      // Clear cache on logout
      OfflineStorage.clearAllCache();
    }
  }, [sessionLoaded, user, fetchSaves]);

  const contextValue: SavesContextType = {
    // State
    saves,
    loading,
    refreshing,
    error,
    isOnline,
    hasOfflineActions,
    
    // Actions
    fetchSaves,
    addSave,
    updateSave,
    deleteSave,
    markAsRead,
    archiveSave,
    getSaveById,
    syncOfflineActions,
    
    // Computed
    readArticles,
    unreadArticles,
    archivedArticles,
    unarchivedArticles,
  };

  return (
    <SavesContext.Provider value={contextValue}>
      {children}
    </SavesContext.Provider>
  );
}; 