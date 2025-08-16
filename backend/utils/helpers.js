// Backend utility functions

// Track last sizes for randomization
let lastSizes = [];

/**
 * Get random note size with weights and avoid repetition
 */
const getRandomSize = () => {
  const SIZES = ['small', 'medium', 'large'];
  const SIZE_WEIGHTS = [0.45, 0.45, 0.1];
  
  let filteredSizes = SIZES.filter(size => !lastSizes.includes(size));
  if (filteredSizes.length === 0) filteredSizes = SIZES;
  
  let sum = 0, random = Math.random();
  for (let i = 0; i < filteredSizes.length; i++) {
    sum += SIZE_WEIGHTS[SIZES.indexOf(filteredSizes[i])];
    if (random <= sum) {
      lastSizes.push(filteredSizes[i]);
      if (lastSizes.length > 2) lastSizes.shift();
      return filteredSizes[i];
    }
  }
  
  const choice = filteredSizes[Math.floor(Math.random() * filteredSizes.length)];
  lastSizes.push(choice);
  if (lastSizes.length > 2) lastSizes.shift();
  return choice;
};

/**
 * Get random note color
 */
const getRandomColor = () => {
  const COLORS = ['purple', 'teal', 'blue', 'green', 'orange', 'red', 'yellow', 'brown', 'indigo'];
  return COLORS[Math.floor(Math.random() * COLORS.length)];
};

/**
 * Validate email format
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Sanitize HTML content (basic XSS protection)
 */
const sanitizeHTML = (html) => {
  if (!html) return '';
  
  // Remove potentially dangerous tags and attributes
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

/**
 * Generate slug from text
 */
const generateSlug = (text) => {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Calculate reading time in minutes
 */
const calculateReadingTime = (content) => {
  if (!content) return 0;
  
  const wordsPerMinute = 200; // Average reading speed
  const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
  
  return Math.ceil(wordCount / wordsPerMinute) || 1;
};

/**
 * Extract text from HTML content
 */
const extractTextFromHTML = (html) => {
  if (!html) return '';
  
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
    .replace(/&[a-z]+;/gi, '') // Remove other HTML entities
    .trim();
};

/**
 * Truncate text to specified length
 */
const truncateText = (text, maxLength = 100) => {
  if (!text || text.length <= maxLength) return text;
  
  return text.substring(0, maxLength).trim() + '...';
};

/**
 * Generate random string for IDs
 */
const generateRandomString = (length = 10) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

/**
 * Format file size in human readable format
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Validate MongoDB ObjectId
 */
const isValidObjectId = (id) => {
  return /^[0-9a-fA-F]{24}$/.test(id);
};

/**
 * Create API response object
 */
const createResponse = (success, message, data = null, meta = null) => {
  const response = {
    success,
    message
  };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (meta !== null) {
    response.meta = meta;
  }
  
  return response;
};

/**
 * Create pagination metadata
 */
const createPagination = (total, limit, skip) => {
  const currentPage = Math.floor(skip / limit) + 1;
  const totalPages = Math.ceil(total / limit);
  
  return {
    total,
    limit,
    skip,
    currentPage,
    totalPages,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
};

/**
 * Escape regex special characters
 */
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * Parse search query into terms
 */
const parseSearchQuery = (query) => {
  if (!query) return [];
  
  // Split by spaces but keep quoted phrases together
  const regex = /[^\s"']+|"([^"]*)"|'([^']*)'/g;
  const terms = [];
  let match;
  
  while ((match = regex.exec(query)) !== null) {
    terms.push(match[1] || match[2] || match[0]);
  }
  
  return terms.filter(term => term.length > 0);
};

/**
 * Debounce function for API rate limiting
 */
const debounce = (func, delay) => {
  let timeoutId;
  
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Convert snake_case to camelCase
 */
const toCamelCase = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  }
  
  const camelObj = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      camelObj[camelKey] = toCamelCase(obj[key]);
    }
  }
  
  return camelObj;
};

/**
 * Remove undefined properties from object
 */
const removeUndefined = (obj) => {
  const clean = {};
  
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      clean[key] = obj[key];
    }
  }
  
  return clean;
};

module.exports = {
  getRandomSize,
  getRandomColor,
  isValidEmail,
  sanitizeHTML,
  generateSlug,
  calculateReadingTime,
  extractTextFromHTML,
  truncateText,
  generateRandomString,
  formatFileSize,
  isValidObjectId,
  createResponse,
  createPagination,
  escapeRegex,
  parseSearchQuery,
  debounce,
  toCamelCase,
  removeUndefined
};
