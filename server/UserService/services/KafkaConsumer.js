/**
 * @fileoverview KafkaConsumer class for handling Kafka message consumption
 * This module provides a wrapper around the kafkajs library to simplify
 * Kafka consumer operations within the UserService.
 */
const {Kafka} = require('kafkajs');
const config = require('../config/env');

/**
 * KafkaConsumer class for consuming messages from Kafka topics
 * @class
 */
class KafkaConsumer {
    /**
     * Creates a new KafkaConsumer instance
     * @param {string} groupId - The consumer group ID for this consumer
     */
    constructor(groupId) {
        console.log(`Is Array: ${Array.isArray(config.kafkaBrokers)}`);
        console.log(`Kafka Brokers: ${config.kafkaBrokers}`);
        
        this.kafka = new Kafka({
            clientId: 'user-service',
            brokers: [config.kafkaBrokers]
        });

        this.consumer = this.kafka.consumer({
            groupId: groupId
        });
        console.log(`Kafka consumer created with group ID: ${groupId}`);
    }

    /**
     * Establishes a connection to the Kafka broker
     * @async
     * @returns {Promise<void>}
     * @throws {Error} If connection fails
     */
    async connect() {
        try {
            console.log('Connecting to Kafka broker...');
            
            await this.consumer.connect();
            console.log('Connected to Kafka broker');
        } catch (error) {
            console.error('Error connecting to Kafka:', error);
            throw error;
        }
    }

    /**
     * Subscribes the consumer to a Kafka topic
     * @async
     * @param {string} topic - The Kafka topic to subscribe to
     * @returns {Promise<void>}
     */
    async subscribe(topic) {
        this.consumer.subscribe({
            topic: topic,
            fromBeginning: true
        });
    }

    // async run() {
    //     // await this.consumer.run(handler);
    //     await this.consumer.run({
    //         eachMessage: async ({topic, partition, message}) => {
    //             // Modify the console log to pring everythinh in order to see the message value include partition and topic and message value
    //             console.log(`Received message ${message.value} at: ${topic}:${partition}`);
    //         }
    //     })
    // }

    /**
     * Starts consuming messages from subscribed topics
     * @async
     * @param {Function} handler - Callback function to process each message
     *                             Expected signature: async ({topic, partition, message}) => {}
     * @returns {Promise<void>}
     */
    async run(handler) {
        await this.consumer.run({
            eachMessage: handler
        });
    }

    /**
     * Disconnects the consumer from the Kafka broker
     * @async
     * @returns {Promise<void>}
     * @throws {Error} If disconnection fails
     */
    async disconnect() {
        try {
            await this.consumer.disconnect();
        } catch (error) {
            console.error('Error disconnecting from Kafka:', error);
            throw error;
        }
    }
}

module.exports = KafkaConsumer;