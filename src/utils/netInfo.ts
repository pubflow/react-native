/**
 * Network Information Utility
 * 
 * Provides utilities for checking network connectivity
 */

// Define a simple interface for network state
interface NetworkState {
  isConnected: boolean;
  isInternetReachable?: boolean;
  type?: string;
}

// Define a listener type
type NetInfoChangeListener = (state: NetworkState) => void;

/**
 * Network information utility
 * 
 * This is a simple wrapper around NetInfo that works even if the package is not installed
 */
export class NetInfo {
  private static listeners: NetInfoChangeListener[] = [];
  private static netInfoPackage: any = null;
  private static isInitialized = false;
  private static currentState: NetworkState = { isConnected: true };
  
  /**
   * Initialize NetInfo
   */
  private static initialize() {
    if (this.isInitialized) {
      return;
    }
    
    try {
      // Try to import @react-native-community/netinfo
      this.netInfoPackage = require('@react-native-community/netinfo');
      
      // Subscribe to network state changes
      this.netInfoPackage.addEventListener((state: any) => {
        this.currentState = {
          isConnected: state.isConnected,
          isInternetReachable: state.isInternetReachable,
          type: state.type
        };
        
        // Notify listeners
        this.listeners.forEach(listener => {
          listener(this.currentState);
        });
      });
    } catch (error) {
      console.warn('NetInfo package not found. Network connectivity features will be limited.');
    }
    
    this.isInitialized = true;
  }
  
  /**
   * Check if the device is connected to the internet
   * 
   * @returns Whether the device is connected
   */
  static async isConnected(): Promise<boolean> {
    this.initialize();
    
    if (this.netInfoPackage) {
      try {
        const state = await this.netInfoPackage.fetch();
        return state.isConnected;
      } catch (error) {
        console.error('Error checking network connectivity:', error);
        return true; // Assume connected on error
      }
    }
    
    return true; // Assume connected if NetInfo is not available
  }
  
  /**
   * Add a listener for network state changes
   * 
   * @param listener Listener function
   * @returns Unsubscribe function
   */
  static addEventListener(listener: NetInfoChangeListener): () => void {
    this.initialize();
    this.listeners.push(listener);
    
    // Immediately call the listener with the current state
    listener(this.currentState);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index !== -1) {
        this.listeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Get the current network state
   * 
   * @returns Current network state
   */
  static getState(): NetworkState {
    this.initialize();
    return this.currentState;
  }
}
