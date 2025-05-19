/**
 * Bridge API Raw Hook for React Native
 *
 * Provides a hook for accessing Bridge API functionality using direct fetch
 */

import { useContext } from 'react';
import { EntityConfig, EntityData } from '@pubflow/core';
import { PubflowContext } from '../context/PubflowProvider';
import { BridgeApiRawService } from '../services/BridgeApiRawService';

/**
 * Hook for accessing Bridge API functionality using direct fetch
 *
 * @param config Entity configuration
 * @param instanceId Pubflow instance ID
 * @returns Bridge API raw service
 */
export function useBridgeApiRaw<T extends EntityData>(
  config: EntityConfig,
  instanceId?: string
): BridgeApiRawService<T> {
  const context = useContext(PubflowContext);

  if (!context) {
    throw new Error('useBridgeApiRaw must be used within a PubflowProvider');
  }

  const instance = instanceId || context.defaultInstance;
  const pubflowInstance = context.instances[instance];

  if (!pubflowInstance) {
    throw new Error(`Pubflow instance '${instance}' not found`);
  }

  // Use hardcoded base URL for now since getBaseUrl is not available
  const baseUrl = 'https://api.pml.edu.do';

  return new BridgeApiRawService<T>(config, baseUrl);
}
