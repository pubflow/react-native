/**
 * Types for BridgeForm component
 */
import { ReactNode } from 'react';
import { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { z } from 'zod';
import { EntityConfig } from '@pubflow/core';

/**
 * Field configuration for BridgeForm
 */
export interface FieldConfig {
  /** Field name (must exist in the schema) */
  name: string;
  
  /** Custom label (defaults to formatted field name) */
  label?: string;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Help text description */
  description?: string;
  
  /** Field type */
  type?: 'text' | 'number' | 'email' | 'password' | 'select' | 'checkbox' | 
         'radio' | 'date' | 'textarea' | 'hidden';
  
  /** Options for select/radio fields */
  options?: Array<{value: any, label: string}>;
  
  /** Field width (%, px, etc.) */
  width?: string | number;
  
  /** Whether the field should be hidden */
  hidden?: boolean;
  
  /** Whether the field should be disabled */
  disabled?: boolean;
  
  /** Default value */
  defaultValue?: any;
  
  /** Whether the field should have autofocus */
  autoFocus?: boolean;
  
  /** Custom style for the field container */
  style?: StyleProp<ViewStyle>;
  
  /** Custom style for the input */
  inputStyle?: StyleProp<TextStyle>;
  
  /** Custom render function */
  render?: (props: FieldRenderProps) => ReactNode;
}

/**
 * Props for custom field rendering
 */
export interface FieldRenderProps {
  /** Field configuration */
  field: FieldConfig;
  
  /** Current field value */
  value: any;
  
  /** Function to change value */
  onChange: (value: any) => void;
  
  /** Function for blur event */
  onBlur: () => void;
  
  /** Validation error if any */
  error?: string;
  
  /** Whether the field is required */
  required: boolean;
  
  /** Whether the field is disabled */
  disabled: boolean;
  
  /** Whether dark mode is active */
  isDarkMode: boolean;
  
  /** Theme colors */
  colors: ThemeColors;
}

/**
 * Theme colors for the form
 */
export interface ThemeColors {
  /** Primary color */
  primary: string;
  
  /** Primary color for hover/active states */
  primaryDark: string;
  
  /** Primary color with transparency for focus states */
  primaryLight: string;
  
  /** Text color */
  text: string;
  
  /** Background color */
  background: string;
  
  /** Border color */
  border: string;
  
  /** Input background color */
  inputBackground: string;
  
  /** Error color */
  error: string;
  
  /** Placeholder color */
  placeholder: string;
}

/**
 * BridgeForm component props
 */
export interface BridgeFormProps<T extends Record<string, any>> {
  /** Zod schema for validation */
  schema: z.ZodType<T>;
  
  /** Form mode */
  mode: 'create' | 'update' | 'partial';
  
  /** Entity configuration for BridgeApi */
  entityConfig: EntityConfig;
  
  /** Pubflow instance ID */
  instanceId?: string;
  
  /** Initial data (for update/partial mode) */
  initialData?: Partial<T>;
  
  /** Record ID (for update/partial mode) */
  id?: string;
  
  /** Fields to display (all schema fields by default) */
  fields?: FieldConfig[];
  
  /** Layout configuration */
  layout?: {
    /** Number of columns for grid layout */
    columns?: number;
    
    /** Gap between fields */
    gap?: number;
  };
  
  /** Success callback */
  onSuccess?: (data: T) => void;
  
  /** Error callback */
  onError?: (error: Error) => void;
  
  /** Cancel callback */
  onCancel?: () => void;
  
  /** Custom labels */
  labels?: {
    /** Submit button text */
    submit?: string;
    
    /** Cancel button text */
    cancel?: string;
    
    /** Required field indicator text */
    required?: string;
  };
  
  /** Theme */
  theme?: 'light' | 'dark' | 'auto';
  
  /** Main color for the form (buttons, focus rings, etc.) */
  mainColor?: string;
  
  /** Container style */
  style?: StyleProp<ViewStyle>;
  
  /** Custom styles */
  customStyles?: {
    /** Form container style */
    form?: StyleProp<ViewStyle>;
    
    /** Field container style */
    field?: StyleProp<ViewStyle>;
    
    /** Label style */
    label?: StyleProp<TextStyle>;
    
    /** Input style */
    input?: StyleProp<TextStyle>;
    
    /** Description style */
    description?: StyleProp<TextStyle>;
    
    /** Error message style */
    error?: StyleProp<TextStyle>;
    
    /** Button style */
    button?: StyleProp<ViewStyle>;
    
    /** Button text style */
    buttonText?: StyleProp<TextStyle>;
  };
}
