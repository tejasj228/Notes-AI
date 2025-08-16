const NodeCache = require('node-cache');

// Create cache instances with different TTL
const notesCache = new NodeCache({ 
  stdTTL: 300, // 5 minutes for notes
  checkperiod: 60 // Check for expired keys every minute
});

const chatCache = new NodeCache({ 
  stdTTL: 180, // 3 minutes for chat sessions
  checkperiod: 30 
});

const quickCache = new NodeCache({ 
  stdTTL: 30, // 30 seconds for frequent requests
  checkperiod: 10 
});

// Cache middleware factory
const createCacheMiddleware = (cache, keyGenerator, ttl = null) => {
  return (req, res, next) => {
    const key = keyGenerator(req);
    const cached = cache.get(key);
    
    if (cached) {
      console.log(`🚀 Cache hit for key: ${key}`);
      return res.json(cached);
    }
    
    // Store original json method
    const originalJson = res.json;
    
    // Override json method to cache the response
    res.json = function(data) {
      if (data.success && data.data) {
        const cacheTTL = ttl || cache.options.stdTTL;
        cache.set(key, data, cacheTTL);
        console.log(`📦 Cached response for key: ${key} (TTL: ${cacheTTL}s)`);
      }
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Key generators for different endpoints
const keyGenerators = {
  notes: (req) => `notes:${req.user._id}:${JSON.stringify(req.query)}`,
  chatHistory: (req) => `chat:${req.params.noteId}:${req.user._id}:${JSON.stringify(req.query)}`,
  chatSession: (req) => `session:${req.params.noteId}:${req.query.sessionId}:${req.user._id}`,
  folders: (req) => `folders:${req.user._id}:${JSON.stringify(req.query)}`,
  trash: (req) => `trash:${req.user._id}:${JSON.stringify(req.query)}`
};

// Cache invalidation helpers
const invalidateUserCache = (userId, pattern = null) => {
  const keys = notesCache.keys();
  keys.forEach(key => {
    if (key.includes(userId) && (!pattern || key.includes(pattern))) {
      notesCache.del(key);
      console.log(`🗑️  Invalidated cache key: ${key}`);
    }
  });
};

const invalidateChatCache = (noteId, userId, sessionId = null) => {
  const keys = chatCache.keys();
  keys.forEach(key => {
    if (key.includes(noteId) && key.includes(userId) && (!sessionId || key.includes(sessionId))) {
      chatCache.del(key);
      console.log(`🗑️  Invalidated chat cache key: ${key}`);
    }
  });
};

module.exports = {
  notesCache,
  chatCache,
  quickCache,
  createCacheMiddleware,
  keyGenerators,
  invalidateUserCache,
  invalidateChatCache
};
