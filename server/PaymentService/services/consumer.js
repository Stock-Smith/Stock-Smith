const {Kafka} = require('kafkajs');

async function consume() {

    const kafka = new Kafka({
        clientId: 'payment-service-consumer',
        brokers: ['localhost:29092']
    });

    const consumer = kafka.consumer({
        groupId: 'test-group'
    });
    await consumer.connect();
    console.log('consumer connected');
    const topic = 'payment_topic';
    consumer.subscribe({
        topic: topic,
        fromBeginning: true
    });
    await consumer.run({
        eachMessage: async ({topic, partition, message}) => {
            // Modify the console log to pring everythinh in order to see the message value include partition and topic and message value
            console.log(`Received message ${message.value} at: ${topic}:${partition}`);
        }
    })
}

consume();