/**
 * Advanced Filter Component for React Native
 *
 * Provides a component for advanced filtering in BridgeList
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  FlatList
} from 'react-native';
import { FilterOperator, FilterDefinition } from '@pubflow/core';

/**
 * Field definition for advanced filter
 */
export interface FilterFieldDefinition {
  /**
   * Field name
   */
  name: string;

  /**
   * Field label
   */
  label: string;

  /**
   * Field type
   */
  type: 'text' | 'number' | 'date' | 'select' | 'boolean';

  /**
   * Field options (for select type)
   */
  options?: Array<{ value: string; label: string }>;

  /**
   * Operator for this field (e.g., 'contains', 'eq', 'gt')
   * Can be specified as a string or using FilterOperator enum
   * Will be used directly as the filter operator
   */
  operator?: string | FilterOperator;
}

/**
 * Advanced Filter props
 */
export interface AdvancedFilterProps {
  /**
   * Fields to filter on
   */
  fields: FilterFieldDefinition[];

  /**
   * Current filters
   */
  filters: FilterDefinition[];

  /**
   * Add filter callback
   */
  onAddFilter: (field: string, operator: FilterOperator | string, value: any) => void;

  /**
   * Remove filter callback
   */
  onRemoveFilter: (field: string) => void;

  /**
   * Reset filters callback
   */
  onResetFilters: () => void;

  /**
   * Component style
   */
  style?: any;

  /**
   * Text customization
   */
  texts?: {
    title?: string;
    addFilter?: string;
    resetFilters?: string;
    apply?: string;
    cancel?: string;
    field?: string;
    operator?: string;
    value?: string;
    filterButton?: string;
    activeFilters?: string;
    noActiveFilters?: string;
    selectField?: string;
    selectOperator?: string;
    enterValue?: string;
  };

  /**
   * Color customization
   */
  colors?: {
    primary?: string;
    secondary?: string;
    background?: string;
    text?: string;
    border?: string;
  };
}

/**
 * Advanced Filter component
 */
export function AdvancedFilter({
  fields,
  filters,
  onAddFilter,
  onRemoveFilter,
  onResetFilters,
  style,
  texts = {},
  colors = {}
}: AdvancedFilterProps) {
  // Default texts
  const defaultTexts = {
    title: 'Advanced Filters',
    addFilter: 'Add Filter',
    resetFilters: 'Reset Filters',
    apply: 'Apply',
    cancel: 'Cancel',
    field: 'Field',
    operator: 'Operator',
    value: 'Value',
    filterButton: 'Filter',
    activeFilters: 'Active Filters',
    noActiveFilters: 'No active filters',
    selectField: 'Select a field',
    selectOperator: 'Select an operator',
    enterValue: 'Enter a value'
  };

  // Merge default and custom texts
  const finalTexts = { ...defaultTexts, ...texts };

  // Default colors
  const defaultColors = {
    primary: '#007AFF',
    secondary: '#f8f9fa',
    background: '#ffffff',
    text: '#333333',
    border: '#dddddd'
  };

  // Merge default and custom colors
  const finalColors = { ...defaultColors, ...colors };

  // State
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedField, setSelectedField] = useState<FilterFieldDefinition | null>(null);
  const [selectedOperator, setSelectedOperator] = useState<FilterOperator | string>(FilterOperator.EQUALS);
  const [filterValue, setFilterValue] = useState('');
  const [showFieldSelector, setShowFieldSelector] = useState(false);
  // Ya no necesitamos el selector de operador
  const [_showOperatorSelector, _setShowOperatorSelector] = useState(false);
  // Estado para mostrar/ocultar el selector de opciones
  const [showOptionsSelector, setShowOptionsSelector] = useState(false);

  // Set operator when field changes
  useEffect(() => {
    if (selectedField) {
      // Use the operator defined in the field, or default to 'eq' (equals)
      // Convert FilterOperator enum to string if needed
      let fieldOperator = selectedField.operator || 'eq';

      // Ensure we're using the string value
      if (typeof fieldOperator !== 'string') {
        // If it's an enum value, convert it to string
        fieldOperator = String(fieldOperator);
      }

      // Set the operator and reset the value
      setSelectedOperator(fieldOperator);
      setFilterValue('');
    }
  }, [selectedField]);

  // Get operator label
  const getOperatorLabel = (operator: FilterOperator | string) => {
    switch (operator) {
      case FilterOperator.EQUALS: return 'Equals';
      case FilterOperator.NOT_EQUALS: return 'Not Equals';
      case FilterOperator.CONTAINS: return 'Contains';
      case FilterOperator.NOT_CONTAINS: return 'Not Contains';
      case FilterOperator.STARTS_WITH: return 'Starts With';
      case FilterOperator.ENDS_WITH: return 'Ends With';
      case FilterOperator.GREATER_THAN: return 'Greater Than';
      case FilterOperator.GREATER_THAN_OR_EQUALS: return 'Greater Than or Equals';
      case FilterOperator.LESS_THAN: return 'Less Than';
      case FilterOperator.LESS_THAN_OR_EQUALS: return 'Less Than or Equals';
      case FilterOperator.IN: return 'In';
      case FilterOperator.NOT_IN: return 'Not In';
      case FilterOperator.IS_NULL: return 'Is Null';
      case FilterOperator.IS_NOT_NULL: return 'Is Not Null';
      default: return String(operator);
    }
  };

  // Esta función ahora se usa directamente en el botón Apply

  // Esta función ya no es necesaria ya que usamos el operador predefinido

  return (
    <View style={[styles.container, style]}>
      {/* Filter Button */}
      <TouchableOpacity
        style={[styles.filterButton, { backgroundColor: finalColors.primary }]}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.filterButtonText}>{finalTexts.filterButton}</Text>
        {filters.length > 0 && (
          <View style={styles.filterBadge}>
            <Text style={styles.filterBadgeText}>{filters.length}</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Filter Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: finalColors.background }]}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: finalColors.text }]}>{finalTexts.title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            {/* Active Filters Section */}
            <View style={styles.activeFiltersSection}>
              <Text style={[styles.sectionTitle, { color: finalColors.text }]}>{finalTexts.activeFilters}</Text>

              {filters.length > 0 ? (
                <View style={styles.activeFiltersList}>
                  {filters.map((filter, index) => {
                    const field = fields.find(f => f.name === filter.field);
                    return (
                      <View key={index} style={[styles.activeFilterItem, { backgroundColor: `${finalColors.primary}20` }]}>
                        <View style={styles.activeFilterInfo}>
                          <Text style={[styles.activeFilterField, { color: finalColors.text }]}>
                            {field?.label || filter.field}
                          </Text>
                          <Text style={[styles.activeFilterDetails, { color: finalColors.text }]}>
                            {getOperatorLabel(filter.operator)} {filter.value}
                          </Text>
                        </View>
                        <TouchableOpacity
                          style={[styles.removeFilterButton, { backgroundColor: `${finalColors.primary}40` }]}
                          onPress={() => onRemoveFilter(filter.field)}
                        >
                          <Text style={styles.removeFilterButtonText}>×</Text>
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {filters.length > 0 && (
                    <TouchableOpacity
                      style={[styles.resetFiltersButton, { borderColor: finalColors.primary }]}
                      onPress={onResetFilters}
                    >
                      <Text style={[styles.resetFiltersButtonText, { color: finalColors.primary }]}>
                        {finalTexts.resetFilters}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ) : (
                <Text style={[styles.noFiltersText, { color: `${finalColors.text}80` }]}>
                  {finalTexts.noActiveFilters}
                </Text>
              )}
            </View>

            {/* Add Filter Section */}
            <View style={styles.addFilterSection}>
              <Text style={[styles.sectionTitle, { color: finalColors.text }]}>{finalTexts.addFilter}</Text>

              {/* Field Selector */}
              <Pressable
                style={[
                  styles.selectorButton,
                  { borderColor: finalColors.border },
                  selectedField ? { borderColor: finalColors.primary } : null
                ]}
                onPress={() => {
                  setShowFieldSelector(!showFieldSelector);
                }}
              >
                <Text style={[
                  styles.selectorButtonText,
                  { color: selectedField ? finalColors.text : `${finalColors.text}80` }
                ]}>
                  {selectedField ? selectedField.label : finalTexts.selectField}
                </Text>
                <Text style={styles.selectorButtonIcon}>▼</Text>
              </Pressable>

              {showFieldSelector && (
                <View style={[styles.dropdownMenu, { backgroundColor: finalColors.background, borderColor: finalColors.border }]}>
                  <FlatList
                    data={fields}
                    keyExtractor={(item) => item.name}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[
                          styles.dropdownItem,
                          selectedField?.name === item.name && { backgroundColor: `${finalColors.primary}20` }
                        ]}
                        onPress={() => {
                          setSelectedField(item);
                          setShowFieldSelector(false);
                        }}
                      >
                        <Text style={[
                          styles.dropdownItemText,
                          { color: finalColors.text },
                          selectedField?.name === item.name && { fontWeight: 'bold' }
                        ]}>
                          {item.label}
                        </Text>
                      </TouchableOpacity>
                    )}
                  />
                </View>
              )}

              {/* No operator selector - using the predefined operator */}

              {/* Value Input - Only show if field is selected */}
              {selectedField && selectedOperator &&
               !['null', 'nnull'].includes(selectedOperator) && (
                <View style={styles.valueInputContainer}>
                  {selectedField.type === 'select' && selectedField.options ? (
                    // Select input
                    <>
                      <Pressable
                        style={[styles.selectorButton, { borderColor: finalColors.border, marginTop: 10 }]}
                        onPress={() => {
                          setShowFieldSelector(false);
                          setShowOptionsSelector(!showOptionsSelector);
                        }}
                      >
                        <Text style={[
                          styles.selectorButtonText,
                          { color: filterValue ? finalColors.text : `${finalColors.text}80` }
                        ]}>
                          {filterValue ?
                            selectedField.options.find(o => o.value === filterValue)?.label || filterValue :
                            finalTexts.enterValue}
                        </Text>
                        <Text style={styles.selectorButtonIcon}>▼</Text>
                      </Pressable>

                      {/* Dropdown para opciones de selección */}
                      {showOptionsSelector && (
                        <View style={[
                          styles.dropdownMenu,
                          {
                            backgroundColor: finalColors.background,
                            borderColor: finalColors.border,
                            top: 50 // Posición ajustada para que aparezca debajo del selector
                          }
                        ]}>
                          <FlatList
                            data={selectedField.options}
                            keyExtractor={(item) => item.value}
                            renderItem={({ item }) => (
                              <TouchableOpacity
                                style={[
                                  styles.dropdownItem,
                                  filterValue === item.value && { backgroundColor: `${finalColors.primary}20` }
                                ]}
                                onPress={() => {
                                  setFilterValue(item.value);
                                  setShowOptionsSelector(false);
                                }}
                              >
                                <Text style={[
                                  styles.dropdownItemText,
                                  { color: finalColors.text },
                                  filterValue === item.value && { fontWeight: 'bold' }
                                ]}>
                                  {item.label}
                                </Text>
                              </TouchableOpacity>
                            )}
                          />
                        </View>
                      )}
                    </>
                  ) : (
                    // Text/number input
                    <TextInput
                      style={[
                        styles.valueInput,
                        {
                          borderColor: finalColors.border,
                          color: finalColors.text,
                          backgroundColor: `${finalColors.background}80`
                        }
                      ]}
                      value={filterValue}
                      onChangeText={setFilterValue}
                      placeholder={finalTexts.enterValue}
                      placeholderTextColor={`${finalColors.text}80`}
                      keyboardType={selectedField.type === 'number' ? 'numeric' : 'default'}
                    />
                  )}
                </View>
              )}

              {/* Apply Button */}
              <TouchableOpacity
                style={[
                  styles.applyButton,
                  { backgroundColor: finalColors.primary },
                  (!selectedField ||
                   (!['null', 'nnull'].includes(selectedOperator) &&
                    !filterValue)) &&
                  { opacity: 0.5 }
                ]}
                onPress={() => {
                  if (selectedField &&
                      ((['null', 'nnull'].includes(selectedOperator)) ||
                       filterValue)) {
                    onAddFilter(selectedField.name, selectedOperator, filterValue);
                    // Reset form
                    setSelectedField(null);
                    setSelectedOperator(FilterOperator.EQUALS);
                    setFilterValue('');
                    setShowFieldSelector(false);
                    setShowOptionsSelector(false);
                  }
                }}
                disabled={!selectedField ||
                         (!['null', 'nnull'].includes(selectedOperator) &&
                          !filterValue)}
              >
                <Text style={styles.applyButtonText}>{finalTexts.apply}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>


    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    backgroundColor: '#007AFF',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  filterBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  filterBadgeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#333',
    fontWeight: 'bold',
  },
  activeFiltersSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  activeFiltersList: {
    marginBottom: 10,
  },
  activeFilterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    borderRadius: 6,
    marginBottom: 8,
  },
  activeFilterInfo: {
    flex: 1,
  },
  activeFilterField: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  activeFilterDetails: {
    fontSize: 12,
    marginTop: 2,
  },
  removeFilterButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  removeFilterButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetFiltersButton: {
    alignSelf: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    marginTop: 10,
  },
  resetFiltersButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  noFiltersText: {
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  addFilterSection: {
    marginTop: 10,
  },
  selectorButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  selectorButtonText: {
    fontSize: 14,
  },
  selectorButtonIcon: {
    fontSize: 12,
    color: '#999',
  },
  dropdownMenu: {
    position: 'absolute',
    top: 80, // Position below the selector button
    left: 0,
    right: 0,
    maxHeight: 200,
    borderWidth: 1,
    borderRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  dropdownItemText: {
    fontSize: 14,
  },
  valueInputContainer: {
    marginTop: 10,
  },
  valueInput: {
    height: 40,
    borderWidth: 1,
    borderRadius: 4,
    paddingHorizontal: 10,
  },
  applyButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 4,
    marginTop: 20,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});
