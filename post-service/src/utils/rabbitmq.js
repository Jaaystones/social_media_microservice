const amqp = require("amqplib");
const logger = require("./logger");

let connection = null;
let channel = null;

const EXCHANGE_NAME = "social-media-service";

// Connect to rabbitmq-server
async function connectToRabbitMQ() {
  try {
    connection = await amqp.connect(process.env.RABBITMQ_URL);
    channel = await connection.createChannel();

    await channel.assertExchange(EXCHANGE_NAME, "topic", { durable: false });
    logger.info("Connected to rabbit mq");
    return channel;
  } catch (e) {
    logger.error("Error connecting to rabbit mq", e);
  }
}

async function publishEvent(routingKey, message) {
  // check if channel is not present
  // Routing key is the identifier(Post.deleted and Post.created method)
  if (!channel) {
    await connectToRabbitMQ();
  }

  channel.publish(
    EXCHANGE_NAME,
    routingKey,
    Buffer.from(JSON.stringify(message))
  );
  logger.info(`Event published: ${routingKey}`);
}

module.exports = { connectToRabbitMQ, publishEvent };