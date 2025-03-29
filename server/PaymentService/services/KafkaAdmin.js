const {Kafka} = require('kafkajs');

class KafkaAdmin {

    constructor() {
        const kafka = new Kafka({
            clientId: 'payment-service',
            brokers: ['localhost:29092']
        });

        this.admin = kafka.admin();
        console.log('KafkaAdmin created');
    }

    async init() {
        await this.admin.connect();
        console.log('KafkaAdmin connected');
    }

    // async createTopics(topics) {
    //     await this.admin.createTopics({
    //         topics: topics,
    //         numPartitions: 1,
    //     });
    //     console.log(`Topics created - ${topics}`);
    // }

    async createTopics(topics) {
        // Convert single string to array of topic configs if needed
        const topicConfigs = Array.isArray(topics) 
            ? topics 
            : [{ topic: topics, numPartitions: 1, replicationFactor: 1 }];
        
        await this.admin.createTopics({
            topics: topicConfigs
        });
        console.log(`Topics created - ${Array.isArray(topics) ? topics.map(t => t.topic || t).join(', ') : topics}`);
    }

}

module.exports = new KafkaAdmin();