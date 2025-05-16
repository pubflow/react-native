/**
 * Styles for BridgeForm component
 */
import { StyleSheet } from 'react-native';
import { ThemeColors } from './types';

/**
 * Creates styles for the form based on theme colors
 * @param colors Theme colors
 * @returns StyleSheet object
 */
export function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    // Form container
    container: {
      backgroundColor: colors.background,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
      width: '100%',
      maxWidth: 600,
      alignSelf: 'center',
    },
    
    // Fields container
    fieldsContainer: {
      width: '100%',
    },
    
    // Field row for grid layout
    fieldRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginHorizontal: -8, // Compensate for fieldContainer padding
    },
    
    // Individual field container
    fieldContainer: {
      marginBottom: 16,
      paddingHorizontal: 8,
    },
    
    // Field with 100% width
    fieldFull: {
      width: '100%',
    },
    
    // Field with 50% width
    fieldHalf: {
      width: '50%',
    },
    
    // Field with 33% width
    fieldThird: {
      width: '33.33%',
    },
    
    // Label
    label: {
      fontSize: 14,
      fontWeight: '500',
      marginBottom: 6,
      color: colors.text,
    },
    
    // Required indicator
    required: {
      color: colors.error,
      marginLeft: 2,
    },
    
    // Description text
    description: {
      fontSize: 12,
      color: colors.text + '99', // Add transparency
      marginBottom: 6,
    },
    
    // Text input
    input: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      paddingHorizontal: 12,
      fontSize: 16,
      color: colors.text,
      backgroundColor: colors.inputBackground,
    },
    
    // Focused input
    inputFocused: {
      borderColor: colors.primary,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 1,
    },
    
    // Textarea
    textarea: {
      height: 120,
      textAlignVertical: 'top',
      paddingTop: 12,
    },
    
    // Picker (select)
    picker: {
      height: 44,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      backgroundColor: colors.inputBackground,
    },
    
    // Checkbox container
    checkboxContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 8,
    },
    
    // Checkbox
    checkbox: {
      width: 20,
      height: 20,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 4,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
    },
    
    // Checked checkbox
    checkboxChecked: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    
    // Checkbox checkmark
    checkmark: {
      color: '#ffffff',
      fontSize: 14,
      fontWeight: 'bold',
    },
    
    // Checkbox label
    checkboxLabel: {
      fontSize: 16,
      marginLeft: 10,
      color: colors.text,
    },
    
    // Radio container
    radioContainer: {
      marginVertical: 8,
    },
    
    // Radio option
    radioOption: {
      flexDirection: 'row',
      alignItems: 'center',
      marginVertical: 6,
    },
    
    // Radio button
    radio: {
      width: 20,
      height: 20,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.inputBackground,
    },
    
    // Selected radio
    radioSelected: {
      borderColor: colors.primary,
    },
    
    // Radio inner circle
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary,
    },
    
    // Radio label
    radioLabel: {
      fontSize: 16,
      marginLeft: 10,
      color: colors.text,
    },
    
    // Error message
    error: {
      color: colors.error,
      fontSize: 12,
      marginTop: 4,
    },
    
    // API error message
    apiError: {
      color: colors.error,
      fontSize: 14,
      marginTop: 16,
      marginBottom: 8,
      textAlign: 'center',
    },
    
    // Buttons container
    buttonsContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: 24,
    },
    
    // Button base
    button: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 8,
      minWidth: 100,
      justifyContent: 'center',
      alignItems: 'center',
    },
    
    // Primary button (submit)
    primaryButton: {
      backgroundColor: colors.primary,
    },
    
    // Secondary button (cancel)
    secondaryButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
      marginRight: 12,
    },
    
    // Button text
    buttonText: {
      fontSize: 16,
      fontWeight: '500',
    },
    
    // Primary button text
    primaryButtonText: {
      color: '#ffffff',
    },
    
    // Secondary button text
    secondaryButtonText: {
      color: colors.text,
    },
    
    // Disabled state
    disabled: {
      opacity: 0.5,
    },
  });
}
