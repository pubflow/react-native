/**
 * Operadores para filtros avanzados
 * 
 * Estos operadores se pueden usar directamente sin comillas en los campos de filtro
 */

// Operadores de igualdad
export const equals = 'eq';
export const notEquals = 'neq';

// Operadores de texto
export const contains = 'contains';
export const notContains = 'ncontains';
export const startsWith = 'sw';
export const endsWith = 'ew';

// Operadores numéricos
export const greaterThan = 'gt';
export const greaterThanOrEquals = 'gte';
export const lessThan = 'lt';
export const lessThanOrEquals = 'lte';

// Operadores de lista
export const inList = 'in';
export const notInList = 'nin';

// Operadores de nulidad
export const isNull = 'null';
export const isNotNull = 'nnull';

// Exportar todos los operadores como un objeto
export const operators = {
  equals,
  notEquals,
  contains,
  notContains,
  startsWith,
  endsWith,
  greaterThan,
  greaterThanOrEquals,
  lessThan,
  lessThanOrEquals,
  inList,
  notInList,
  isNull,
  isNotNull
};

export default operators;
