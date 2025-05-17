/**
 * Authentication Hook for React Native
 *
 * Provides a hook for accessing authentication functionality
 */

import { useContext, useState, useCallback, useEffect, useRef } from 'react';
import { User } from '@pubflow/core';
import { PubflowContext } from '../context/PubflowProvider';
import { SecureStorageAdapter } from '../storage/secureStorage';

const DEBUG_AUTH = true && process.env.NODE_ENV === 'development';

/**
 * Authentication hook result
 */
export interface UseAuthResult {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email?: string; userName?: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  validateSession: () => Promise<{ isValid: boolean; expiresAt?: string }>;
  refreshUser: () => Promise<User | null>;
}

/**
 * Hook for accessing authentication functionality
 *
 * @param instanceId Pubflow instance ID
 * @returns Authentication hook result
 */
export function useAuth(instanceId?: string): UseAuthResult {
  const context = useContext(PubflowContext);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);
  const validationInProgress = useRef(false);
  const storage = useRef<SecureStorageAdapter | null>(null);

  if (!context) {
    throw new Error('useAuth must be used within a PubflowProvider');
  }

  const instance = instanceId || context.defaultInstance;
  const pubflowInstance = context.instances[instance];

  if (!pubflowInstance) {
    throw new Error(`Pubflow instance '${instance}' not found`);
  }

  // Initialize storage adapter with the same configuration as the provider
  useEffect(() => {
    if (!storage.current) {
      storage.current = new SecureStorageAdapter({
        prefix: 'pubflow',
        useSecureStorage: pubflowInstance.config.useSecureStorage ?? false,
        useAsyncStorageFallback: true
      });
    }
  }, [pubflowInstance.config.useSecureStorage]);

  // Wrap login to handle loading state and storage
  const login = useCallback(async (credentials: { email?: string; userName?: string; password: string }) => {
    if (!storage.current) throw new Error('Storage adapter not initialized');
    
    if (DEBUG_AUTH) {
      console.log('useAuth.login: Starting login process');
    }
    
    setIsLoading(true);
    try {
      const result = await pubflowInstance.login(credentials);
      
      if (DEBUG_AUTH) {
        console.log('useAuth.login: Login result:', result);
      }
      
      // Update instance state only if login was successful
      if (result.success && result.user) {
        pubflowInstance.user = result.user;
        pubflowInstance.isAuthenticated = true;
      }
      
      return result;
    } catch (error) {
      if (DEBUG_AUTH) {
        console.error('useAuth.login: Error during login:', error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pubflowInstance]);

  // Wrap logout to handle loading state
  const logout = useCallback(async () => {
    if (!storage.current) throw new Error('Storage adapter not initialized');
    
    if (DEBUG_AUTH) {
      console.log('useAuth.logout: Starting logout process');
    }
    
    setIsLoading(true);
    try {
      await pubflowInstance.logout();
      // Reset instance state
      pubflowInstance.user = null;
      pubflowInstance.isAuthenticated = false;
    } catch (error) {
      if (DEBUG_AUTH) {
        console.error('useAuth.logout: Error during logout:', error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pubflowInstance]);

  // Centralized session validation
  const validateSession = useCallback(async () => {
    if (!storage.current) throw new Error('Storage adapter not initialized');
    
    // Prevent concurrent validations
    if (validationInProgress.current) {
      if (DEBUG_AUTH) {
        console.log('useAuth.validateSession: Validation already in progress');
      }
      return { isValid: false, error: 'Validation already in progress' };
    }
    
    validationInProgress.current = true;
    setIsLoading(true);
    
    if (DEBUG_AUTH) {
      console.log('useAuth.validateSession: Starting session validation');
    }
    
    try {
      const result = await pubflowInstance.validateSession();
      
      if (DEBUG_AUTH) {
        console.log('useAuth.validateSession: Validation result:', result);
      }
      
      // Update instance state based on validation result
      if (result.isValid && result.user) {
        pubflowInstance.user = result.user;
        pubflowInstance.isAuthenticated = true;
      } else {
        pubflowInstance.user = null;
        pubflowInstance.isAuthenticated = false;
      }
      
      return result;
    } catch (error) {
      if (DEBUG_AUTH) {
        console.error('useAuth.validateSession: Error during validation:', error);
      }
      return { isValid: false, error: error instanceof Error ? error.message : 'Unknown error' };
    } finally {
      setIsLoading(false);
      validationInProgress.current = false;
    }
  }, [pubflowInstance]);

  // Add refreshUser function to manually refresh user data
  const refreshUser = useCallback(async () => {
    if (!storage.current) throw new Error('Storage adapter not initialized');
    
    if (DEBUG_AUTH) {
      console.log('useAuth.refreshUser: Starting user refresh');
    }
    
    setIsLoading(true);
    try {
      const result = await pubflowInstance.validateSession();
      if (result.user) {
        pubflowInstance.user = result.user;
        pubflowInstance.isAuthenticated = true;
      }
      return result.user || null;
    } catch (error) {
      if (DEBUG_AUTH) {
        console.error('useAuth.refreshUser: Error during refresh:', error);
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [pubflowInstance]);

  // Validate session only once on mount if configured
  useEffect(() => {
    if (isInitialized.current || !storage.current) return;
    if (!pubflowInstance.config.sessionConfig?.validateOnStartup) {
      isInitialized.current = true;
      return;
    }
    
    const validate = async () => {
      if (DEBUG_AUTH) {
        console.log('useAuth: Initial session validation');
      }
      
      try {
        await validateSession();
      } catch (error) {
        if (DEBUG_AUTH) {
          console.error('useAuth: Initial session validation error:', error);
        }
      } finally {
        isInitialized.current = true;
      }
    };

    validate();
  }, [validateSession, pubflowInstance.config.sessionConfig?.validateOnStartup]);

  return {
    user: pubflowInstance.user || null,
    isAuthenticated: pubflowInstance.isAuthenticated,
    isLoading,
    login,
    logout,
    validateSession,
    refreshUser
  };
}
