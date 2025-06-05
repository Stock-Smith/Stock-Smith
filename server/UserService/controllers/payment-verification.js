/**
 * Payment Verification Controller
 * Handles Kafka messages for payment verifications and creates user subscriptions
 * @module PaymentVerificationController
 */
const KafkaConsumer = require("../services/KafkaConsumer");
const config = require("../config/env");
const UserSubscription = require("../models/UserSubscription");
const KafkaProducer = require("../services/KafkaProducer");

/**
 * Controller class for payment verification processing
 * Consumes payment messages from Kafka and creates user subscriptions
 */
class PaymentVerificationController {
  /**
   * Creates a new PaymentVerificationController
   * Initializes a Kafka consumer with a specific consumer group
   */
  constructor() {
    this.kafkaConsumer = new KafkaConsumer("user-service-payment-group");
  }

  /**
   * Initializes the controller by connecting to Kafka, subscribing to the payment topic,
   * and setting up the message handler
   * @async
   * @returns {Promise<void>}
   */
  async init() {
    console.log("Initializing PaymentVerificationController");
    console.log(`Connecting to Kafka broker at ${config.kafkaBrokers}`);
    await this.kafkaConsumer.connect();
    await this.kafkaConsumer.subscribe(config.kafkaPaymentTopic);
    await this.kafkaConsumer.run(this.handleMessage);
    // await this.kafkaConsumer.run();
  }

  /**
   * Handles incoming Kafka messages about payments
   * Parses the message and creates a new UserSubscription record
   * @async
   * @param {Object} options - Message options
   * @param {string} options.topic - Kafka topic
   * @param {number} options.partition - Kafka partition
   * @param {Object} options.message - Kafka message
   * @param {Buffer} options.message.value - Message payload
   * @returns {Promise<void>}
   */
  async handleMessage({topic, partition, message}) {
    console.log(`Received message from topic ${topic} partition ${partition} with value ${message.value}`);
    const data = JSON.parse(message.value.toString());
    const { userId, subscriptionPlanId, startDate, endDate, subscriptionPlanType } = data;
    const userSubscription = await UserSubscription.findOne({
      userId
    });
    if (userSubscription) {
      console.log("User subscription already exists for user:", userId);
      // Update existing subscription
      userSubscription.subscription.status = "active";
      userSubscription.subscription.startDate = startDate;
      userSubscription.subscription.endDate = endDate;
      userSubscription.subscription.currentPlanId = subscriptionPlanId;
      await userSubscription.save();
      
      console.log("User subscription updated successfully:", userSubscription);
    }
    else {
      console.log("Creating new user subscription for user:", userId);
      // Create a new user subscription
      const userSubscription = new UserSubscription({
        userId,
        subscriptionType: subscriptionPlanType,
        subscription: {
          status: "active",
          startDate,
          endDate,
          currentPlanId: subscriptionPlanId,
        }
      });
      await userSubscription.save();
      console.log("User subscription saved successfully:", userSubscription);
    }
    console.log("User id ---------------------------------------------------------------------------------", userId);
    
    await KafkaProducer.connect();
    const messageToSend = {
      userId,
      subscriptionPlanId,
      startDate,
      endDate,
      subscriptionPlanType,
    }
    await KafkaProducer.sendMessage(config.kafkaPredictionTopic, messageToSend);
    console.log(`Message sent to topic ${config.kafkaPredictionTopic}: ${JSON.stringify(messageToSend)}`);
    // console.log("User subscription saved successfully:", userSubscription);
  }
}

module.exports = new PaymentVerificationController();