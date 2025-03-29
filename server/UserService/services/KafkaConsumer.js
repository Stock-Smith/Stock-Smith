const {Kafka} = require('kafkajs');
const config = require('../config/env');

class KafkaConsumer {
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

    async subscribe(topic) {
        this.consumer.subscribe({
            topic: topic,
            fromBeginning: true
        });
    }

    async run() {
        // await this.consumer.run(handler);
        await this.consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                // Modify the console log to pring everythinh in order to see the message value include partition and topic and message value
                console.log(`Received message ${message.value} at: ${topic}:${partition}`);
            }
        })
    }

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