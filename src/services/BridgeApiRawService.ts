/**
 * Bridge API Raw Service for React Native
 *
 * Provides a service for accessing Bridge API functionality using direct fetch
 */

import {
  EntityConfig,
  EntityData,
  PaginatedResponse,
  SearchParams,
  QueryParams,
  PaginationMeta
} from '@pubflow/core';
import { SecureStorageAdapter } from '../storage/secureStorage';

/**
 * Bridge API Raw Service
 */
export class BridgeApiRawService<T extends EntityData> {
  private baseUrl: string;
  private baseEndpoint: string;
  private storage: SecureStorageAdapter;
  private customEndpoints: Record<string, string> = {};

  /**
   * Constructor
   *
   * @param config Entity configuration
   * @param baseUrl API base URL
   */
  constructor(config: EntityConfig, baseUrl: string = 'https://api.pml.edu.do') {
    this.baseUrl = baseUrl;
    this.baseEndpoint = `/bridge/${config.endpoint}`;
    this.storage = new SecureStorageAdapter();
    this.customEndpoints = config.customEndpoints || {};
  }

  /**
   * Get a list of entities
   *
   * @param params Query parameters
   * @returns Paginated list of entities
   */
  async getList(params?: QueryParams): Promise<PaginatedResponse<T>> {
    const queryString = this.buildQueryString(params);
    const endpoint = `${this.baseEndpoint}${queryString}`;

    return this.fetchData(endpoint);
  }

  /**
   * Get an entity by ID
   *
   * @param id Entity ID
   * @param params Query parameters
   * @returns Entity
   */
  async getById(id: string, params?: QueryParams): Promise<T> {
    const queryString = this.buildQueryString(params);
    const endpoint = `${this.baseEndpoint}/${id}${queryString}`;

    const response = await this.fetchData(endpoint);

    if (!response.data || response.data.length === 0) {
      throw new Error(`Entity with ID ${id} not found`);
    }

    return Array.isArray(response.data) ? response.data[0] : response.data as T;
  }

  /**
   * Search for entities
   *
   * @param params Search parameters
   * @returns Paginated list of entities
   */
  async search(params: SearchParams): Promise<PaginatedResponse<T>> {
    // Build query string from search parameters
    const queryParams: Record<string, any> = {
      ...params
    };

    // Handle search term
    if (params.q) {
      queryParams.q = params.q;
    }

    // Handle filters
    if (params.filters && params.filters.length > 0) {
      // Convert filters to query parameters
      params.filters.forEach((filter) => {
        const { field, operator, value } = filter;

        if (operator === 'in' || operator === 'nin') {
          // Handle array values
          if (Array.isArray(value)) {
            queryParams[`${field}:${operator}`] = value.join(',');
          } else {
            queryParams[`${field}:${operator}`] = String(value);
          }
        } else if (operator === 'null' || operator === 'nnull') {
          // Handle null/not null operators
          queryParams[`${field}:${operator}`] = value === true || value === 'true' ? 'true' : 'false';
        } else {
          // Handle other operators
          queryParams[`${field}:${operator}`] = String(value);
        }
      });

      // Remove filters from query params to avoid duplication
      delete queryParams.filters;
    }

    const queryString = this.buildQueryString(queryParams);
    const endpoint = `${this.baseEndpoint}/search${queryString}`;

    console.log('BridgeApiRawService.search - endpoint:', endpoint);

    return this.fetchData(endpoint);
  }

  /**
   * Fetch data from the API
   *
   * @param endpoint API endpoint
   * @returns Response data
   */
  private async fetchData(endpoint: string): Promise<PaginatedResponse<T>> {
    console.log('BridgeApiRawService.fetchData - endpoint:', endpoint);

    try {
      // Get session ID
      const sessionId = await this.storage.getItem('session_id');
      console.log('BridgeApiRawService.fetchData - sessionId:', sessionId);

      // Build full URL
      const fullUrl = `${this.baseUrl}${endpoint}`;
      console.log('BridgeApiRawService.fetchData - fullUrl:', fullUrl);

      // Make request
      const response = await fetch(fullUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-Session-ID': sessionId || ''
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Parse response
      const rawData = await response.json();
      console.log('BridgeApiRawService.fetchData - rawData structure:', Object.keys(rawData));

      // Extract data and meta
      let data: T[] = [];
      let meta: PaginationMeta = {
        page: 1,
        limit: 10,
        total: 0,
        hasMore: false
      };

      // Process response based on format
      if (rawData.data?.data?.rows && Array.isArray(rawData.data.data.rows)) {
        console.log('BridgeApiRawService.fetchData - Found data.data.rows format');
        data = rawData.data.data.rows;

        // Convert meta to expected format
        if (rawData.data.meta) {
          meta = {
            page: rawData.data.meta.page || 1,
            limit: rawData.data.meta.limit || 10,
            total: rawData.data.meta.total || 0,
            hasMore: rawData.data.meta.hasMore || false
          };
        }
      } else if (rawData.data?.rows && Array.isArray(rawData.data.rows)) {
        console.log('BridgeApiRawService.fetchData - Found data.rows format');
        data = rawData.data.rows;

        // Convert meta to expected format
        if (rawData.meta) {
          meta = {
            page: rawData.meta.page || 1,
            limit: rawData.meta.limit || 10,
            total: rawData.meta.total || 0,
            hasMore: rawData.meta.hasMore || false
          };
        }
      } else if (rawData.data?.data && Array.isArray(rawData.data.data)) {
        console.log('BridgeApiRawService.fetchData - Found data.data format');
        data = rawData.data.data;

        // Convert meta to expected format
        if (rawData.meta) {
          meta = {
            page: rawData.meta.page || 1,
            limit: rawData.meta.limit || 10,
            total: rawData.meta.total || 0,
            hasMore: rawData.meta.hasMore || false
          };
        }
      } else if (Array.isArray(rawData.data)) {
        console.log('BridgeApiRawService.fetchData - Found data format');
        data = rawData.data;

        // Convert meta to expected format
        if (rawData.meta) {
          meta = {
            page: rawData.meta.page || 1,
            limit: rawData.meta.limit || 10,
            total: rawData.meta.total || 0,
            hasMore: rawData.meta.hasMore || false
          };
        }
      }

      console.log('BridgeApiRawService.fetchData - Extracted data length:', data.length);
      console.log('BridgeApiRawService.fetchData - Extracted meta:', meta);

      return {
        data,
        meta
      };
    } catch (error) {
      console.error('BridgeApiRawService.fetchData - Error:', error);
      throw error;
    }
  }

  /**
   * Build a query string from parameters
   *
   * @param params Query parameters
   * @returns Query string
   */
  private buildQueryString(params?: Record<string, any>): string {
    if (!params || Object.keys(params).length === 0) {
      return '';
    }

    const queryParams = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          // Handle array values
          value.forEach(item => {
            queryParams.append(`${key}[]`, String(item));
          });
        } else {
          queryParams.append(key, String(value));
        }
      }
    }

    return `?${queryParams.toString()}`;
  }
}
