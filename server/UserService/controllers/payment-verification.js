const KafkaConsumer = require("../services/KafkaConsumer");
const config = require("../config/env");
const UserSubscription = require("../models/User");

class PaymentVerificationController {
  constructor() {
    this.kafkaConsumer = new KafkaConsumer("user-service-payment-group");
  }

  async init() {
    console.log("Initializing PaymentVerificationController");
    console.log(`Connecting to Kafka broker at ${config.kafkaBrokers}`);
    await this.kafkaConsumer.connect();
    await this.kafkaConsumer.subscribe(config.kafkaPaymentTopic);
    await this.kafkaConsumer.run(this.handleMessage);
    // await this.kafkaConsumer.run();
  }

  async handleMessage({topic, partition, message}) {
    console.log(`Received message from topic ${topic} partition ${partition} with value ${message.value}`);
    const data = JSON.parse(message.value.toString());
    const { userId, subscriptionPlanId, startDate, endDate, subscriptionPlanType } = data;
    const userSubcription = new UserSubscription({
      userId,
      subscriptionType: subscriptionPlanType,
      subscription: {
        status: "active",
        startDate,
        endDate,
        currentPlanId: subscriptionPlanId,
      }
    });
    await userSubcription.save();
    console.log("User subscription saved successfully:", userSubcription);
  }
}

module.exports = new PaymentVerificationController();