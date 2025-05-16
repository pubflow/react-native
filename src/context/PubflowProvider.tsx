/**
 * Pubflow Provider for React Native
 *
 * Provides a context provider for Pubflow in React Native applications
 */

import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { SWRConfig } from 'swr';
import {
  initConfig,
  getConfig,
  PubflowConfig,
  PubflowInstanceConfig,
  ApiClient,
  AuthService,
  User
} from '@pubflow/core';
import { SecureStorageAdapter } from '../storage/secureStorage';
import { setDebugConfig } from './debugConfig';

/**
 * Pubflow context value
 */
export interface PubflowContextValue {
  instances: Record<string, PubflowInstance>;
  defaultInstance: string;
}

/**
 * Pubflow instance
 */
export interface PubflowInstance {
  config: PubflowInstanceConfig;
  apiClient: ApiClient;
  authService: AuthService;
  user: User | null | undefined;  // Allow undefined to fix type issues
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email?: string; userName?: string; password: string }) => Promise<any>;
  logout: () => Promise<void>;
  validateSession: () => Promise<{ isValid: boolean; expiresAt?: string; user?: User }>;
}

/**
 * Create Pubflow context
 */
export const PubflowContext = createContext<PubflowContextValue>({
  instances: {},
  defaultInstance: 'default'
});

/**
 * Persistent cache configuration
 */
export interface PersistentCacheConfig {
  /**
   * Whether to enable persistent cache
   */
  enabled: boolean;

  /**
   * Cache provider function
   */
  provider?: () => Map<any, any>;

  /**
   * Cache options
   */
  options?: any;
}

/**
 * Pubflow provider props
 */
export interface PubflowProviderProps {
  children: React.ReactNode;
  config?: PubflowConfig;
  instances?: PubflowInstanceConfig[];
  defaultInstance?: string;
  onSessionExpired?: () => void;
  onSessionRefreshed?: () => void;
  showSessionAlerts?: boolean;

  /**
   * Persistent cache configuration
   */
  persistentCache?: PersistentCacheConfig;

  /**
   * Enable debug tools
   * When enabled, storage debug utilities will be available
   * Default: false
   */
  enableDebugTools?: boolean;
}

/**
 * Pubflow provider for React Native
 */
export function PubflowProvider({
  children,
  config,
  instances,
  defaultInstance = 'default',
  onSessionExpired,
  onSessionRefreshed,
  showSessionAlerts = false,
  persistentCache = { enabled: false },
  enableDebugTools = false
}: PubflowProviderProps) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [contextValue, setContextValue] = useState<PubflowContextValue>({
    instances: {},
    defaultInstance
  });

  // Configure debug tools
  useEffect(() => {
    setDebugConfig({ enabled: enableDebugTools });

    if (enableDebugTools) {
      console.log('Pubflow debug tools enabled');
    }
  }, [enableDebugTools]);

  // Handle session expiration
  const handleSessionExpired = useCallback(() => {
    if (showSessionAlerts) {
      Alert.alert(
        'Session Expired',
        'Your session has expired. Please log in again.',
        [{ text: 'OK' }]
      );
    }

    if (onSessionExpired) {
      onSessionExpired();
    }
  }, [onSessionExpired, showSessionAlerts]);

  // Handle session refresh
  const handleSessionRefreshed = useCallback(() => {
    if (showSessionAlerts) {
      Alert.alert(
        'Session Refreshed',
        'Your session has been refreshed.',
        [{ text: 'OK' }]
      );
    }

    if (onSessionRefreshed) {
      onSessionRefreshed();
    }
  }, [onSessionRefreshed, showSessionAlerts]);

  useEffect(() => {
    const initialize = async () => {
      try {
        // Initialize instances
        const instancesMap: Record<string, PubflowInstance> = {};

        if (instances && instances.length > 0) {
          // Initialize multiple instances
          for (const instanceConfig of instances) {
            // Initialize configuration
            const fullConfig = initConfig({
              ...instanceConfig,
              sessionConfig: {
                ...instanceConfig.sessionConfig,
                onSessionExpired: handleSessionExpired,
                onSessionRefreshed: handleSessionRefreshed
              }
            }, instanceConfig.id);

            // Create storage adapter
            const storage = new SecureStorageAdapter({
              prefix: fullConfig.storageConfig?.prefix,
              useSecureStorage: fullConfig.useSecureStorage
            });

            // Create API client
            const apiClient = new ApiClient(fullConfig, storage);

            // Create auth service
            const authService = new AuthService(apiClient, storage, fullConfig);

            // Get current user
            let user = null;
            let isAuthenticated = false;

            try {
              user = await authService.getCurrentUser();
              isAuthenticated = !!user;
            } catch (error) {
              console.error(`Error getting current user for instance ${instanceConfig.id}:`, error);
            }

            // Create instance
            instancesMap[instanceConfig.id] = {
              config: fullConfig,
              apiClient,
              authService,
              user,
              isAuthenticated,
              isLoading: false,
              login: async (credentials) => {
                const result = await authService.login(credentials);

                if (result.success && result.user) {
                  // Update instance
                  setContextValue(prev => ({
                    ...prev,
                    instances: {
                      ...prev.instances,
                      [instanceConfig.id]: {
                        ...prev.instances[instanceConfig.id],
                        user: result.user,
                        isAuthenticated: true
                      }
                    }
                  }));
                }

                return result;
              },
              logout: async () => {
                await authService.logout();

                // Update instance
                setContextValue(prev => ({
                  ...prev,
                  instances: {
                    ...prev.instances,
                    [instanceConfig.id]: {
                      ...prev.instances[instanceConfig.id],
                      user: null,
                      isAuthenticated: false
                    }
                  }
                }));
              },
              validateSession: async () => {
                const result = await authService.validateSession();

                // Update instance
                setContextValue(prev => ({
                  ...prev,
                  instances: {
                    ...prev.instances,
                    [instanceConfig.id]: {
                      ...prev.instances[instanceConfig.id],
                      user: result.user || null,
                      isAuthenticated: result.isValid
                    }
                  }
                }));

                return result;
              }
            };
          }
        } else if (config) {
          // Initialize single instance
          // Initialize configuration
          const fullConfig = initConfig({
            ...config,
            sessionConfig: {
              ...config.sessionConfig,
              onSessionExpired: handleSessionExpired,
              onSessionRefreshed: handleSessionRefreshed
            }
          }, defaultInstance);

          // Create storage adapter
          const storage = new SecureStorageAdapter({
            prefix: fullConfig.storageConfig?.prefix,
            useSecureStorage: fullConfig.useSecureStorage
          });

          // Create API client
          const apiClient = new ApiClient(fullConfig, storage);

          // Create auth service
          const authService = new AuthService(apiClient, storage, fullConfig);

          // Get current user
          let user = null;
          let isAuthenticated = false;

          try {
            user = await authService.getCurrentUser();
            isAuthenticated = !!user;
          } catch (error) {
            console.error('Error getting current user:', error);
          }

          // Create instance
          instancesMap[defaultInstance] = {
            config: fullConfig,
            apiClient,
            authService,
            user,
            isAuthenticated,
            isLoading: false,
            login: async (credentials) => {
              const result = await authService.login(credentials);

              if (result.success && result.user) {
                // Update instance
                setContextValue(prev => ({
                  ...prev,
                  instances: {
                    ...prev.instances,
                    [defaultInstance]: {
                      ...prev.instances[defaultInstance],
                      user: result.user,
                      isAuthenticated: true
                    }
                  }
                }));
              }

              return result;
            },
            logout: async () => {
              await authService.logout();

              // Update instance
              setContextValue(prev => ({
                ...prev,
                instances: {
                  ...prev.instances,
                  [defaultInstance]: {
                    ...prev.instances[defaultInstance],
                    user: null,
                    isAuthenticated: false
                  }
                }
              }));
            },
            validateSession: async () => {
              const result = await authService.validateSession();

              // Update instance
              setContextValue(prev => ({
                ...prev,
                instances: {
                  ...prev.instances,
                  [defaultInstance]: {
                    ...prev.instances[defaultInstance],
                    user: result.user || null,
                    isAuthenticated: result.isValid
                  }
                }
              }));

              return result;
            }
          };
        }

        // Set context value
        setContextValue({
          instances: instancesMap,
          defaultInstance
        });

        // Set initialized
        setIsInitialized(true);
      } catch (error) {
        console.error('Error initializing Pubflow:', error);
      }
    };

    initialize();
  }, [config, instances, defaultInstance, handleSessionExpired, handleSessionRefreshed]);

  // Show loading state
  if (!isInitialized) {
    return null;
  }

  // If persistent cache is enabled, wrap with SWRConfig
  if (persistentCache.enabled && persistentCache.provider) {
    return (
      <SWRConfig value={{ provider: persistentCache.provider }}>
        <PubflowContext.Provider value={contextValue}>
          {children}
        </PubflowContext.Provider>
      </SWRConfig>
    );
  }

  // Otherwise, just use the regular provider
  return (
    <PubflowContext.Provider value={contextValue}>
      {children}
    </PubflowContext.Provider>
  );
}
