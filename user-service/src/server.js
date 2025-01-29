require('dotenv').config();
const mongoose = require('mongoose');
const logger = require('./utils/logger');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { RateLimiterRedis } = require('rate-limiter-flexible');

const app = express()

// connect to DB
mongoose
  .connect(process.env.MONGODB_URI)
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