/**
 * Mock modules for React Native components
 *
 * This file provides type-only exports to satisfy TypeScript when the actual
 * dependencies are not installed. These will be replaced by the real implementations
 * at runtime when the dependencies are properly installed.
 */

import React from 'react';
import { View, Text, TextInput } from 'react-native';

// Mock @react-native-picker/picker
export const Picker: React.FC<any> & { Item: React.FC<any> } = (props) => {
  return null;
};

Picker.Item = ({ label, value }: { label: string; value: any }) => null;

// Mock @react-native-community/datetimepicker
export default function DateTimePicker(props: {
  value: Date;
  onChange: (event: any, date?: Date) => void;
  mode: 'date' | 'time';
  display?: string;
  [key: string]: any;
}) {
  return null;
}

// Mock react-hook-form
export const useForm = <T extends Record<string, any>>(options?: any) => ({
  control: {},
  handleSubmit: (fn: any) => (e: any) => {
    e.preventDefault();
    return fn({});
  },
  formState: { errors: {} as Record<string, { message?: string }> },
  setValue: (name: string, value: any) => {},
  watch: (name: string) => undefined,
  trigger: (name: string) => Promise.resolve(true),
  reset: () => {}
});

export const Controller = ({
  name,
  control,
  rules,
  render
}: {
  name: string;
  control: any;
  rules?: any;
  render: (props: { field: { onChange: any; onBlur?: any; value: any } }) => React.ReactNode
}) => {
  return null;
};

// Mock @hookform/resolvers/zod
export const zodResolver = (schema: any) => schema;
