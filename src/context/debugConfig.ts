/**
 * Debug Configuration
 * 
 * Provides configuration for debug tools
 */

// Default configuration
let debugConfig = {
  enabled: false
};

/**
 * Set debug configuration
 * 
 * @param config Debug configuration
 */
export function setDebugConfig(config: { enabled: boolean }): void {
  debugConfig = { ...config };
}

/**
 * Get debug configuration
 * 
 * @returns Current debug configuration
 */
export function getDebugConfig(): { enabled: boolean } {
  return { ...debugConfig };
}
