require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { RateLimiterRedis } = require('rate-limiter-flexible');
const Redis = require("ioredis");
const { rateLimit } = require("express-rate-limit");
const { RedisStore } = require("rate-limit-redis");
const routes = require("./routes/postRoute");
const errorHandler = require("./middleware/errorHandler");

const app = express();
const PORT = process.env.PORT || 3002;

//connect to db
mongoose
    .connect(process.env.MONGODB_URL)
    .then(()=> logger.info('Connected to mongoDB'))
    .catch((e)=> logger.error('Mongo connection error', e));

//Redis client
const redisClient = new Redis(process.env.REDIS_URl)

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

app.use((req, res, next)=>{
    logger.info(`Received ${req.method}' request to ${req.url}`);
    logger.info(`Request Body ${req.body}`);
    next();
})

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
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Endpoint rate limit exceeded for IP: ${req.ip}`);
      res.status(429).json({ success: false, message: "Too many requests" });
    },
    store: new RedisStore({
      sendCommand: (...args) => redisClient.call(...args),
    }),
});

//apply this sensitiveEndpointsLimiter to our routes
app.use("/api/posts/create-post", sensitiveEndpointsLimiter);

//routes -> pass redisclient to routes
app.use(
    "/api/posts",
    (req, res, next) => {
      req.redisClient = redisClient;
      next();
    },
    routes
);
  
app.use(errorHandler);

app.listen(PORT, () => {
    logger.info(`Post service running on port ${PORT}`);
  });
  
  //unhandled promise rejection
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason);
  });