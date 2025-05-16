/**
 * Offline Indicator Component for React Native
 * 
 * Provides a component for displaying an offline indicator
 */

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { NetInfo } from '../utils/netInfo';

/**
 * Offline Indicator props
 */
export interface OfflineIndicatorProps {
  /**
   * Text to display when offline
   */
  offlineText?: string;
  
  /**
   * Text to display when back online
   */
  onlineText?: string;
  
  /**
   * Duration to show the online message (in ms)
   */
  onlineDuration?: number;
  
  /**
   * Style for the container
   */
  style?: any;
  
  /**
   * Style for the offline text
   */
  offlineTextStyle?: any;
  
  /**
   * Style for the online text
   */
  onlineTextStyle?: any;
  
  /**
   * Whether to show the indicator
   */
  visible?: boolean;
}

/**
 * Component for displaying an offline indicator
 */
export function OfflineIndicator({
  offlineText = 'No internet connection',
  onlineText = 'Back online',
  onlineDuration = 3000,
  style,
  offlineTextStyle,
  onlineTextStyle,
  visible = true
}: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showOnlineMessage, setShowOnlineMessage] = useState(false);
  const opacity = React.useRef(new Animated.Value(0)).current;
  
  // Listen for network changes
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const offline = !state.isConnected;
      
      // If we were offline and now we're online, show the online message
      if (isOffline && !offline) {
        setShowOnlineMessage(true);
        
        // Animate in
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true
        }).start();
        
        // Hide after duration
        setTimeout(() => {
          Animated.timing(opacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true
          }).start(() => {
            setShowOnlineMessage(false);
          });
        }, onlineDuration);
      }
      
      setWasOffline(isOffline);
      setIsOffline(offline);
    });
    
    return () => {
      unsubscribe();
    };
  }, [isOffline, opacity, onlineDuration]);
  
  // Don't render if not visible
  if (!visible) {
    return null;
  }
  
  // Render offline indicator
  if (isOffline) {
    return (
      <View style={[styles.offlineContainer, style]}>
        <Text style={[styles.offlineText, offlineTextStyle]}>{offlineText}</Text>
      </View>
    );
  }
  
  // Render online message
  if (showOnlineMessage && wasOffline) {
    return (
      <Animated.View style={[styles.onlineContainer, style, { opacity }]}>
        <Text style={[styles.onlineText, onlineTextStyle]}>{onlineText}</Text>
      </Animated.View>
    );
  }
  
  return null;
}

const styles = StyleSheet.create({
  offlineContainer: {
    backgroundColor: '#b71c1c',
    padding: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
  },
  onlineContainer: {
    backgroundColor: '#2e7d32',
    padding: 10,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    alignItems: 'center',
  },
  onlineText: {
    color: '#fff',
  },
});
