require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");
const routes = require("./routes/mediaRoutes");
const { rateLimit } = require("express-rate-limit");
const errorHandler = require("./middleware/errorHandler");
const Redis = require("ioredis");
const logger = require("./utils/logger");
const { RedisStore } = require("rate-limit-redis");
const { RateLimiterRedis } = require('rate-limiter-flexible');
const { connectToRabbitMQ, consumeEvent } = require("./utils/rabbitmq");
const { handlePostDeleted } = require("./events/media-event-handlers");

const app = express();
const PORT = process.env.PORT || 3003;

//connect to mongodb
mongoose
  .connect(process.env.MONGODB_URL)
  .then(() => logger.info("Connected to mongodb"))
  .catch((e) => logger.error("Mongo connection error", e));

//Redis client
const redisClient = new Redis(process.env.REDIS_URl)

//middlewares
app.use(cors());
app.use(helmet());
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

//Implement Ip based rate limiting for sensitive endpoints
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

app.use("/api/media/upload", sensitiveEndpointsLimiter)
app.use("/api/media", routes);

app.use(errorHandler);

//connect to rabbitmq
async function startServer(){
  try{
    await connectToRabbitMQ();
    //consume all events
    await consumeEvent('post.deleted', handlePostDeleted)

    app.listen(PORT, () => {
      logger.info(`Media service running on port ${PORT}`);
    });

  }catch(error){
    logger.error('Failed to connect to server', error)
    process.exit(1)
  }
}
startServer();

//unhandled promise rejection
process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at", promise, "reason:", reason);
});