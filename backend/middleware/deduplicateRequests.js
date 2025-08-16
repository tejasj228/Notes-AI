const requestCache = new Map();
const CACHE_DURATION = 200; // Reduced to 200ms - only prevent rapid duplicate clicks

/**
 * Middleware to prevent duplicate requests within a very short time window
 */
const deduplicateRequests = (req, res, next) => {
  // Only apply to specific heavy operations, not all requests
  const shouldCache = req.path.includes('/history') || 
                     (req.method === 'DELETE' && req.path.includes('/chat/')) ||
                     (req.method === 'POST' && req.path.includes('/chat/'));
  
  if (!shouldCache) {
    return next();
  }
  
  // Create a unique key for this request
  const key = `${req.method}:${req.path}:${req.user?._id || 'anonymous'}:${JSON.stringify(req.query)}`;
  
  const now = Date.now();
  const cached = requestCache.get(key);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    // Only block if it's really rapid fire (same request within 200ms)
    return res.status(429).json({
      success: false,
      message: 'Request too frequent. Please wait a moment.',
      retryAfter: 1
    });
  }
  
  // Store this request
  requestCache.set(key, { timestamp: now });
  
  // Clean up old entries periodically
  if (requestCache.size > 1000) {
    const expiredKeys = [];
    for (const [k, v] of requestCache.entries()) {
      if (now - v.timestamp > CACHE_DURATION * 50) { // Keep entries longer for cleanup
        expiredKeys.push(k);
      }
    }
    expiredKeys.forEach(k => requestCache.delete(k));
  }
  
  next();
};

module.exports = deduplicateRequests;
