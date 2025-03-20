/**
 * StrollWallet API Client
 * 
 * This service provides methods to interact with the StrollWallet API for virtual card operations.
 */

import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { strollwalletConfig } from '../config/strollwallet';
import { logger } from '../utils/logger';

/**
 * StrollWallet API Client
 */
export class StrollWalletClient {
  private baseUrl: string;
  private publicKey: string;
  
  constructor() {
    this.baseUrl = strollwalletConfig.baseUrl;
    this.publicKey = strollwalletConfig.publicKey || '';
  }
  
  /**
   * Create a customer for virtual card issuance
   * @param customerData Customer data
   * @returns API response
   */
  async createCustomer(customerData: any) {
    try {
      // Mock implementation for testing
      return {
        success: true,
        customerId: `cust_${Math.random().toString(36).substring(2, 10)}`,
        customerEmail: customerData.customerEmail,
        message: 'Customer created successfully'
      };
    } catch (error) {
      logger.error('Error creating customer:', error);
      throw new Error('StrollWallet API Error');
    }
  }

  /**
   * Create a virtual card
   * @param cardData Card data
   * @returns API response
   */
  async createCard(cardData: any) {
    try {
      // Mock implementation for testing
      return {
        success: true,
        card_id: `card_${Math.random().toString(36).substring(2, 10)}`,
        card_number: `4111${Math.random().toString().substring(2, 14)}`,
        expiry_month: '12',
        expiry_year: '2030',
        cvv: '123',
        balance: cardData.amount || 0,
        status: 'active',
        message: 'Card created successfully'
      };
    } catch (error) {
      logger.error('Error creating card:', error);
      throw new Error('StrollWallet API Error');
    }
  }

  /**
   * Fund a virtual card
   * @param fundData Fund data
   * @returns API response
   */
  async fundCard(fundData: any) {
    try {
      // Mock implementation for testing
      return {
        success: true,
        card_id: fundData.card_id,
        amount: fundData.amount,
        new_balance: fundData.amount,
        message: 'Card funded successfully'
      };
    } catch (error) {
      logger.error('Error funding card:', error);
      throw new Error('StrollWallet API Error');
    }
  }

  /**
   * Get card details
   * @param cardData Card data
   * @returns API response
   */
  async cardDetails(cardData: any) {
    try {
      // Mock implementation for testing
      return {
        success: true,
        card_id: cardData.card_id,
        card_number: `4111${Math.random().toString().substring(2, 14)}`,
        expiry_month: '12',
        expiry_year: '2030',
        cvv: '123',
        balance: 1000, // Mock balance
        status: 'active',
        message: 'Card details retrieved successfully'
      };
    } catch (error) {
      logger.error('Error getting card details:', error);
      throw new Error('StrollWallet API Error');
    }
  }

  /**
   * Get virtual card transactions
   * @param params Card transaction parameters
   * @returns API response
   */
  async cardTransactions(params: { card_id: string }) {
    const endpoint = '/card-transactions/';
    
    const requestParams = {
      public_key: this.publicKey,
      card_id: params.card_id
    };
    
    return this.makeRequest('POST', endpoint, requestParams);
  }
  
  /**
   * Freeze or unfreeze a virtual card
   * @param params Freeze/unfreeze parameters
   * @returns API response
   */
  async freezeUnfreezeCard(params: { card_id: string, status: 'freeze' | 'unfreeze' }) {
    const endpoint = '/freeze-unfreeze-card/';
    
    const requestParams = {
      public_key: this.publicKey,
      card_id: params.card_id,
      status: params.status
    };
    
    return this.makeRequest('POST', endpoint, requestParams);
  }
  
  /**
   * Get virtual card history
   * @param params Card history parameters
   * @returns API response
   */
  async cardHistory(params: { card_id: string }) {
    const endpoint = '/card-history/';
    
    const requestParams = {
      public_key: this.publicKey,
      card_id: params.card_id
    };
    
    return this.makeRequest('GET', endpoint, requestParams);
  }
  
  /**
   * Withdraw from a virtual card
   * @param params Withdrawal parameters
   * @returns API response
   */
  async withdrawFromCard(params: { card_id: string, amount: number }) {
    const endpoint = '/withdraw-from-card/';
    
    const requestParams = {
      public_key: this.publicKey,
      card_id: params.card_id,
      amount: params.amount
    };
    
    return this.makeRequest('POST', endpoint, requestParams);
  }
  
  /**
   * Get virtual card status
   * @param params Card status parameters
   * @returns API response
   */
  async cardStatus(params: { card_id: string }) {
    const endpoint = '/card-status/';
    
    const requestParams = {
      public_key: this.publicKey,
      card_id: params.card_id
    };
    
    return this.makeRequest('POST', endpoint, requestParams);
  }
  
  /**
   * Make a request to the StrollWallet API
   * @param method HTTP method
   * @param endpoint API endpoint
   * @param params Request parameters
   * @returns API response
   */
  async makeRequest(method: string, endpoint: string, params: any) {
    try {
      const url = `${strollwalletConfig.baseUrl}${endpoint}`;
      let response;
      
      // Log the request
      logger.info('StrollWallet API request', { 
        method, 
        endpoint,
        url,
        params: JSON.stringify(params)
      });
      
      if (method === 'GET') {
        response = await axios.get(url, { params });
      } else {
        // For POST requests, send parameters in the request body
        response = await axios.post(url, params);
      }
      
      // Log the response
      logger.info('StrollWallet API response', { 
        endpoint,
        status: response.status,
        data: JSON.stringify(response.data)
      });
      
      return response.data;
    } catch (error: any) {
      // Log the error
      logger.error('StrollWallet API error', { 
        endpoint,
        error: error.response ? JSON.stringify(error.response.data) : error.message
      });
      
      // Throw a formatted error
      throw {
        status: error.response ? error.response.status : 500,
        message: 'StrollWallet API Error',
        error: error.response ? error.response.data : error
      };
    }
  }
}

// Export a singleton instance
export default new StrollWalletClient();
