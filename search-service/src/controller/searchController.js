const Search = require('../model/Search');
const logger = require('../utils/logger');

const CACHE_EXPIRATION = 300; // 5 minutes cache expiration (in seconds)

// Function to invalidate cache
async function invalidatePostCache(req, input) {
  const cachedKey = `search:${input}`;
  await req.redisClient.del(cachedKey);

  // Delete all related search keys
  const keys = await req.redisClient.keys("search:*");
  if (keys.length > 0) {
    await req.redisClient.del(keys);
  }
}

// Search Controller with Redis Caching
const searchPostController = async (req, res) => {
  logger.info("Search endpoint hit!");
  
  try {
    const { query } = req.query;

    if (!query) {
      logger.info("Query parameter required");
      return res.status(400).json({
        success: false,
        message: "Query parameter is required",
      });
    }

    const cacheKey = `search:${query}`;

    // Check Redis cache
    const cachedResults = await req.redisClient.get(cacheKey);
    if (cachedResults) {
      logger.info(`Cache hit for query: ${query}`);
      return res.json(JSON.parse(cachedResults));
    }

    logger.info(`Cache missed. Fetching from database for query: ${query}`);
    const results = await Search.find(
      { $text: { $search: query } },
      { score: { $meta: "textScore" } }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    if (results.length > 0) {
      // Cache new search results
      await req.redisClient.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(results));
      
      // Invalidate old cache entries
      await invalidatePostCache(req, query);
    }

    res.json(results);
  } catch (error) {
    logger.error("Error while searching post", error);
    res.status(500).json({
      success: false,
      message: "Error while searching post",
    });
  }
};

module.exports = { searchPostController };
