const {Kafka} = require('kafkajs');
const { v4: uuidv4 } = require('uuid');
const config = require('../config/env');

class KafkaProducer {
    constructor() {
        this.kafka = new Kafka({
            clientId: 'payment-service-producer',
            brokers: [config.kafkaBrokers]
        });

        this.producer = this.kafka.producer();
        console.log('KafkaProducer created');
    }

    async connect() {
        try {
            await this.producer.connect();
            console.log('KafkaProducer successfully connected');
        } catch (error) {
            console.error('Failed to connect Kafka Producer:', error);
            throw error;
        }
    }

    async sendMessage(topic, message) {
        if(!topic || !message) {
            throw new Error('Topic and message are required');
        }
        try {
            console.log(`Sending message to topic ${topic}: ${JSON.stringify(message)}`);
            const key = uuidv4();
            const result = await this.producer.send({
                topic: topic,
                messages: [{
                    key: key,
                    value: JSON.stringify(message),
                    headers: {
                        'service-origin': 'payment-service',
                        'timestamp': Date.now().toString(),
                        'message-id': key
                    }
                }]
            });
            console.log(`Message sent successfully: ${JSON.stringify(result)}`);
            return result;
        } catch (error) {
            
        }
    }
    
}

module.exports = new KafkaProducer();