/**
 * BridgeForm component for React Native
 *
 * A form component that integrates with Zod schemas and useBridgeCrud
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Platform,
  Appearance,
  ActivityIndicator,
  KeyboardAvoidingView
} from 'react-native';
// Try to import from actual modules, fall back to mocks if not available
import { Picker, Controller, useForm, zodResolver } from './mock-modules';
import DateTimePicker from './mock-modules';
import { useBridgeCrud } from '../../hooks/useBridgeCrud';
import { BridgeFormProps, FieldConfig, ThemeColors } from './types';
import {
  formatFieldName,
  determineFieldType,
  isFieldRequired,
  getOptionsFromSchema,
  getFieldsFromSchema,
  generateThemeColors,
  isIOS
} from './utils';
import { createStyles } from './styles';

/**
 * BridgeForm component
 */
export function BridgeForm<T extends Record<string, any>>({
  schema,
  mode,
  entityConfig,
  instanceId,
  initialData,
  id,
  fields,
  layout,
  onSuccess,
  onError,
  onCancel,
  labels = {},
  theme = 'auto',
  mainColor,
  style,
  customStyles = {}
}: BridgeFormProps<T>) {
  // Determine if dark mode is active
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (theme === 'dark') return true;
    if (theme === 'light') return false;

    // If 'auto', detect system preference
    return Appearance.getColorScheme() === 'dark';
  });

  // Listen for system theme changes if theme is 'auto'
  useEffect(() => {
    if (theme !== 'auto') return;

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      setIsDarkMode(colorScheme === 'dark');
    });

    return () => subscription.remove();
  }, [theme]);

  // Generate theme colors
  const colors = generateThemeColors(mainColor, isDarkMode);

  // Create styles based on theme colors
  const styles = createStyles(colors);

  // Get the shape of the schema
  const zodSchema = schema as any;
  const schemaShape = zodSchema._def.shape?.();

  // Determine fields to render
  const fieldsToRender = fields || getFieldsFromSchema(schema);

  // Set up form with React Hook Form and Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger
  } = useForm<T>({
    resolver: zodResolver(schema),
    defaultValues: initialData || {}
  });

  // Initialize form with initial data
  useEffect(() => {
    if (initialData) {
      Object.entries(initialData).forEach(([key, value]) => {
        setValue(key as any, value);
      });
    }
  }, [initialData, setValue]);

  // Set up CRUD operations with useBridgeCrud
  const {
    createItem,
    updateItem,
    loading,
    error: apiError,
    validationErrors: apiValidationErrors
  } = useBridgeCrud({
    entityConfig,
    instanceId,
    schemas: {
      create: mode === 'create' ? schema : undefined,
      update: mode === 'update' || mode === 'partial' ? schema : undefined
    }
  });

  // Handle form submission
  const onSubmit = async (data: T) => {
    try {
      let result: unknown;

      if (mode === 'create') {
        result = await createItem(data);
      } else if (mode === 'update') {
        if (!id) {
          throw new Error('ID is required for update mode');
        }
        result = await updateItem(id, data);
      } else if (mode === 'partial') {
        if (!id) {
          throw new Error('ID is required for partial mode');
        }

        // Only send changed fields
        const changedFields = Object.keys(data).reduce<Partial<T>>((acc, key) => {
          const k = key as keyof T;
          if (initialData && data[k] !== initialData[k]) {
            acc[k] = data[k];
          }
          return acc;
        }, {});

        if (Object.keys(changedFields).length > 0) {
          result = await updateItem(id, changedFields);
        } else {
          // No changes
          result = data;
        }
      }

      // Call onSuccess with the result
      if (onSuccess) {
        // Cast the result to T to satisfy TypeScript
        onSuccess(result as T);
      }
    } catch (error) {
      if (onError) onError(error as Error);
    }
  };

  // Render a field based on its type
  const renderField = (field: FieldConfig) => {
    // Skip if field doesn't exist in schema
    if (!schemaShape || !schemaShape[field.name]) {
      if (__DEV__) {
        console.warn(`Field "${field.name}" is not defined in the schema`);
      }
      return null;
    }

    // Get field schema
    const fieldSchema = schemaShape[field.name];

    // Determine field properties
    const required = isFieldRequired(fieldSchema);
    const type = determineFieldType(fieldSchema, field.type);
    const fieldOptions = field.options || getOptionsFromSchema(fieldSchema);

    // Make fieldOptions available to the JSX below
    const options = fieldOptions;

    // Get error message if any
    const error = errors[field.name]?.message as string | undefined;

    // If field has custom render function, use it
    if (field.render) {
      return (
        <View
          key={field.name}
          style={[
            styles.fieldContainer,
            field.width ? { width: field.width as any } : styles.fieldFull,
            field.style
          ]}
        >
          {field.render({
            field,
            value: watch(field.name),
            onChange: (value) => setValue(field.name, value),
            onBlur: () => trigger(field.name),
            error,
            required,
            disabled: field.disabled || false,
            isDarkMode,
            colors
          })}
        </View>
      );
    }

    // Calculate field width style
    const fieldWidthStyle = field.width
      ? { width: typeof field.width === 'number' ? `${field.width}%` : field.width as any }
      : styles.fieldFull;

    // Standard field rendering
    return (
      <View
        key={field.name}
        style={[
          styles.fieldContainer,
          fieldWidthStyle,
          customStyles.field,
          field.style
        ]}
      >
        {/* Render appropriate input based on type */}
        {renderInput(field, type, required, error)}
      </View>
    );
  };

  // Render specific input type
  const renderInput = (field: FieldConfig, type: string, required: boolean, error?: string) => {
    // Common label rendering (except for checkbox which has label after input)
    const renderLabel = () => {
      if (type === 'checkbox') return null;

      return (
        <Text style={[styles.label, customStyles.label]}>
          {field.label || formatFieldName(field.name)}
          {required && (
            <Text style={styles.required}>
              {labels.required || ' *'}
            </Text>
          )}
        </Text>
      );
    };

    // Description text
    const renderDescription = () => {
      if (!field.description) return null;

      return (
        <Text style={[styles.description, customStyles.description]}>
          {field.description}
        </Text>
      );
    };

    // Error message
    const renderError = () => {
      if (!error) return null;

      return (
        <Text style={[styles.error, customStyles.error]}>
          {error}
        </Text>
      );
    };

    // Render different input types
    switch (type) {
      case 'textarea':
        return (
          <>
            {renderLabel()}
            {renderDescription()}
            <Controller
              control={control}
              name={field.name}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value?.toString() || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.placeholder}
                  multiline
                  numberOfLines={5}
                  style={[
                    styles.input,
                    styles.textarea,
                    customStyles.input,
                    field.inputStyle,
                    field.disabled && styles.disabled
                  ]}
                  editable={!field.disabled}
                />
              )}
            />
            {renderError()}
          </>
        );

      case 'select': {
        // Get options for this field
        const selectOptions = field.options || getOptionsFromSchema(schemaShape[field.name]);

        return (
          <>
            {renderLabel()}
            {renderDescription()}
            <Controller
              control={control}
              name={field.name}
              render={({ field: { onChange, value } }) => (
                <View style={[styles.picker, field.disabled && styles.disabled]}>
                  <Picker
                    selectedValue={value}
                    onValueChange={onChange}
                    enabled={!field.disabled}
                    style={{ color: colors.text }}
                  >
                    <Picker.Item label="Select..." value="" />
                    {selectOptions?.map((option: { value: any; label: string }) => (
                      <Picker.Item
                        key={option.value}
                        label={option.label}
                        value={option.value}
                      />
                    ))}
                  </Picker>
                </View>
              )}
            />
            {renderError()}
          </>
        );
      }

      case 'checkbox':
        return (
          <Controller
            control={control}
            name={field.name}
            render={({ field: { onChange, value } }) => (
              <View style={styles.checkboxContainer}>
                <TouchableOpacity
                  onPress={() => !field.disabled && onChange(!value)}
                  style={[
                    styles.checkbox,
                    value && styles.checkboxChecked,
                    field.disabled && styles.disabled
                  ]}
                  disabled={field.disabled}
                >
                  {value && <Text style={styles.checkmark}>✓</Text>}
                </TouchableOpacity>
                <Text style={[styles.checkboxLabel, customStyles.label]}>
                  {field.label || formatFieldName(field.name)}
                  {required && (
                    <Text style={styles.required}>
                      {labels.required || ' *'}
                    </Text>
                  )}
                </Text>
                {renderError()}
              </View>
            )}
          />
        );

      case 'radio': {
        // Get options for this field
        const radioOptions = field.options || getOptionsFromSchema(schemaShape[field.name]);

        return (
          <>
            {renderLabel()}
            {renderDescription()}
            <Controller
              control={control}
              name={field.name}
              render={({ field: { onChange, value } }) => (
                <View style={styles.radioContainer}>
                  {radioOptions?.map((option: { value: any; label: string }) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => !field.disabled && onChange(option.value)}
                      style={styles.radioOption}
                      disabled={field.disabled}
                    >
                      <View style={[
                        styles.radio,
                        value === option.value && styles.radioSelected,
                        field.disabled && styles.disabled
                      ]}>
                        {value === option.value && (
                          <View style={styles.radioInner} />
                        )}
                      </View>
                      <Text style={styles.radioLabel}>{option.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {renderError()}
          </>
        );
      }

      case 'date':
        return (
          <>
            {renderLabel()}
            {renderDescription()}
            <Controller
              control={control}
              name={field.name}
              render={({ field: { onChange, value } }) => {
                const [showPicker, setShowPicker] = useState(false);
                const dateValue = value ? new Date(value) : new Date();

                return (
                  <>
                    <TouchableOpacity
                      onPress={() => !field.disabled && setShowPicker(true)}
                      style={[
                        styles.input,
                        customStyles.input,
                        field.inputStyle,
                        field.disabled && styles.disabled
                      ]}
                      disabled={field.disabled}
                    >
                      <Text style={{ color: value ? colors.text : colors.placeholder }}>
                        {value ? dateValue.toLocaleDateString() : (field.placeholder || 'Select date')}
                      </Text>
                    </TouchableOpacity>

                    {showPicker && (
                      <DateTimePicker
                        value={dateValue}
                        mode="date"
                        display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                        onChange={(_, selectedDate) => {
                          setShowPicker(Platform.OS === 'ios');
                          if (selectedDate) {
                            onChange(selectedDate.toISOString());
                          }
                        }}
                      />
                    )}
                  </>
                );
              }}
            />
            {renderError()}
          </>
        );

      default:
        // Handle text, number, email, password, etc.
        const keyboardType =
          type === 'number' ? 'numeric' :
          type === 'email' ? 'email-address' :
          'default';

        return (
          <>
            {renderLabel()}
            {renderDescription()}
            <Controller
              control={control}
              name={field.name}
              render={({ field: { onChange, onBlur, value } }) => (
                <TextInput
                  value={value?.toString() || ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder={field.placeholder}
                  placeholderTextColor={colors.placeholder}
                  secureTextEntry={type === 'password'}
                  keyboardType={keyboardType}
                  autoCapitalize={type === 'email' ? 'none' : 'sentences'}
                  style={[
                    styles.input,
                    customStyles.input,
                    field.inputStyle,
                    field.disabled && styles.disabled
                  ]}
                  editable={!field.disabled}
                />
              )}
            />
            {renderError()}
          </>
        );
    }
  };

  // Determine number of columns for layout
  const numColumns = layout?.columns || 1;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView>
        <View
          style={[
            styles.container,
            customStyles.form,
            style
          ]}
        >
          {/* Fields container */}
          <View style={styles.fieldsContainer}>
            {/* Render fields in a grid if multiple columns */}
            {numColumns > 1 ? (
              <View style={styles.fieldRow}>
                {fieldsToRender.map(renderField)}
              </View>
            ) : (
              fieldsToRender.map(renderField)
            )}
          </View>

          {/* API error message */}
          {apiError && (
            <Text style={styles.apiError}>
              {apiError.message}
            </Text>
          )}

          {/* Buttons */}
          <View style={styles.buttonsContainer}>
            {/* Cancel button */}
            {onCancel && (
              <TouchableOpacity
                onPress={onCancel}
                disabled={loading}
                style={[
                  styles.button,
                  styles.secondaryButton,
                  customStyles.button,
                  loading && styles.disabled
                ]}
              >
                <Text style={[
                  styles.buttonText,
                  styles.secondaryButtonText,
                  customStyles.buttonText
                ]}>
                  {labels.cancel || 'Cancel'}
                </Text>
              </TouchableOpacity>
            )}

            {/* Submit button */}
            <TouchableOpacity
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              style={[
                styles.button,
                styles.primaryButton,
                customStyles.button,
                loading && styles.disabled
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={[
                  styles.buttonText,
                  styles.primaryButtonText,
                  customStyles.buttonText
                ]}>
                  {labels.submit || (
                    mode === 'create' ? 'Create' : 'Save'
                  )}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export * from './types';
