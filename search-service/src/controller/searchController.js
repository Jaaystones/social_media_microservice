const Search = require("../model/Search");
const logger = require("../utils/logger");
const redis = require("ioredis");

// Create Redis client
const redisClient = redis.createClient();

redisClient.connect().catch((err) => {
  logger.error("Redis connection error:", err);
});

const CACHE_EXPIRATION = 300; // Cache expiration time in seconds (5 minutes)

const searchPostController = async (req, res) => {
  logger.info("Search endpoint hit!");
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: "Query parameter is required",
      });
    }

    const cacheKey = `search:${query}`;

    // Check if cached data exists
    const cachedResults = await redisClient.get(cacheKey);
    if (cachedResults) {
      logger.info("Cache hit for query:", query);
      return res.json(JSON.parse(cachedResults));
    }

    logger.info("Cache missed. Fetching from database for query:", query);
    const results = await Search.find(
      {
        $text: { $search: query },
      },
      {
        score: { $meta: "textScore" },
      }
    )
      .sort({ score: { $meta: "textScore" } })
      .limit(10);

    // Cache the results
    await redisClient.setex(cacheKey, CACHE_EXPIRATION, JSON.stringify(results));

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
