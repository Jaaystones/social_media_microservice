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
const routes = require("./routes/userRoute");
const errorHandler = require("./middleware/errorHandler");

const app = express()
const PORT = process.env.PORT || 3001

// connect to DB
mongoose
  .connect(process.env.MONGODB_URL)
  .then(()=> logger.info("Connected to mongoDB"))
  .catch((e)=> logger.error('MongoDB connection error', e));

const redisClient = new Redis(process.env.REDIS_URL); 

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
  
  //apply this sensitiveEndpointsLimiter to our routes
  app.use("/api/auth/register", sensitiveEndpointsLimiter);
  
  //Routes
  app.use("/api/auth", routes);
  
  //error handler
  app.use(errorHandler);
  
  app.listen(PORT, () => {
    logger.info(`User service running on port ${PORT}`);
  });
  
  //unhandled promise rejection
  process.on("unhandledRejection", (reason, promise) => {
    logger.error("Unhandled Rejection at", promise, "reason:", reason);
  });