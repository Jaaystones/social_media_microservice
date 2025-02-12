require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const Redis = require("ioredis");
const cors = require("cors");
const helmet = require("helmet");
const errorHandler = require("./middleware/errorHandler");
const logger = require("./utils/logger");
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const routes = require("./routes/searchRoute");
const {
  handlePostCreated,
  handlePostDeleted,
} = require("./events/search-event-handler");

const app = express();
const PORT = process.env.PORT || 3004;

//connect to mongodb
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error", e));

const redisClient = new Redis(process.env.REDIS_URL);

//middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request to ${req.url}`);
  logger.info(`Request body, ${req.body}`);
  next();
});

//DDos Protection and rate limiting
const rateLimiter = new RateLimiterRedis({
    storeClient : redisClient,
    keyPrefix : 'middleware',
    points : 10,
    duration : 1
})

//apply rate limitter
app.use((req, res, next)=> {
    rateLimiter
      .consume(req.ip)
      .then(()=> next())
      .catch(()=> {
        logger.warn(`Rate limit has exceeded for IP: ${req.ip}`)
        res.status(429).json({
          success : false,
          message : 'Too many requests'
        });
    });  
});

//Ip based rate limiting for sensitive endpoints
const sensitiveEndpointsLimiter = rateLimit({
    windowMs: 30 * 60 * 1000,
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`🚨Endpoint rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
});

//Rate limit on search end point
app.use("/api/search", sensitiveEndpointsLimiter);


//routes -> pass redisclient to routes
app.use(
    "/api/search",
    (req, res, next) => {
      req.redisClient = redisClient;
      next();
    },
    routes
);

app.use(errorHandler);

async function startServer() {
    try {
      await connectToRabbitMQ();
  
      //consume {subscribe} to the events
      await consumeEvent("post.created", handlePostCreated);
      await consumeEvent("post.deleted", handlePostDeleted);
  
      app.listen(PORT, () => {
        logger.info(`Search service is running on port: ${PORT}`);
      });
    } catch (e) {
      logger.error(e, "Failed to start search service");
      process.exit(1);
    }
  }
  
startServer();