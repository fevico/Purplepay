/**
 * Helper functions for the PurplePay application
 */

/**
 * Generate a unique transaction reference
 * Format: PP-YYYYMMDD-XXXXXXXX (e.g., PP-20230615-A1B2C3D4)
 * @returns {string} Transaction reference
 */
export const generateTransactionReference = (): string => {
  const prefix = 'PP';
  
  // Get current date in YYYYMMDD format
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateStr = `${year}${month}${day}`;
  
  // Generate random alphanumeric string (8 characters)
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let randomStr = '';
  for (let i = 0; i < 8; i++) {
    randomStr += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return `${prefix}-${dateStr}-${randomStr}`;
};

/**
 * Format amount with currency symbol
 * @param {number} amount Amount to format
 * @param {string} currency Currency code (default: NGN)
 * @returns {string} Formatted amount with currency symbol
 */
export const formatAmount = (amount: number, currency: string = 'NGN'): string => {
  const formatter = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  });
  
  return formatter.format(amount);
};

/**
 * Mask sensitive information (e.g., card numbers, account numbers)
 * @param {string} value Value to mask
 * @param {number} visibleStart Number of characters to show at the start
 * @param {number} visibleEnd Number of characters to show at the end
 * @returns {string} Masked value
 */
export const maskSensitiveInfo = (
  value: string,
  visibleStart: number = 4,
  visibleEnd: number = 4
): string => {
  if (!value) return '';
  
  const valueLength = value.length;
  
  if (valueLength <= visibleStart + visibleEnd) {
    return value;
  }
  
  const start = value.substring(0, visibleStart);
  const end = value.substring(valueLength - visibleEnd);
  const masked = '*'.repeat(valueLength - visibleStart - visibleEnd);
  
  return `${start}${masked}${end}`;
};

/**
 * Generate a random string of specified length
 * @param {number} length Length of the string to generate
 * @param {boolean} alphanumeric Whether to include only alphanumeric characters
 * @returns {string} Random string
 */
export const generateRandomString = (length: number = 10, alphanumeric: boolean = true): string => {
  const characters = alphanumeric
    ? 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    : 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  
  let result = '';
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  
  return result;
};

/**
 * Calculate the next date based on frequency
 * @param {Date} startDate Start date
 * @param {string} frequency Frequency (daily, weekly, biweekly, monthly)
 * @param {number} cycles Number of cycles to add
 * @returns {Date} Next date
 */
export const calculateNextDate = (
  startDate: Date,
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly',
  cycles: number = 1
): Date => {
  const nextDate = new Date(startDate);
  
  switch (frequency) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + cycles);
      break;
    case 'weekly':
      nextDate.setDate(nextDate.getDate() + (7 * cycles));
      break;
    case 'biweekly':
      nextDate.setDate(nextDate.getDate() + (14 * cycles));
      break;
    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + cycles);
      break;
  }
  
  return nextDate;
};
