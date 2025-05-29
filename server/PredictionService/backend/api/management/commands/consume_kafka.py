from django.core.management.base import BaseCommand
from confluent_kafka import Consumer, KafkaError
import json

from django.conf import settings

class Command(BaseCommand):
    help = 'Consume Kafka messages from prediction topic'
    
    def handle(self, *args, **kwargs):
        conf = {
            'bootstrap.servers': settings.KAFKA_BOOTSTRAP_SERVERS,
            'group.id': settings.KAFKA_CONSUMER_GROUP_ID,
            'auto.offset.reset': 'earliest'
        }

        consumer = Consumer(conf)
        topic = settings.KAFKA_PREDICTION_TOPIC

        consumer.subscribe([topic])
        
        self.stdout.write(f'Started consuming topic: {topic}')

        try:
            while True:
                msg = consumer.poll(1.0)  
                if msg is None:
                    continue
                if msg.error():
                    if msg.error().code() == KafkaError._PARTITION_EOF:
                        # End of partition event
                        continue
                    else:
                        self.stderr.write(f"Error: {msg.error()}")
                        break
                
                message_value = msg.value().decode('utf-8')
                data = json.loads(message_value)

                user_id = data.get('userId')
                subscription_plan_id = data.get('subscriptionPlanId')
                start_date = data.get('startDate')
                end_date = data.get('endDate')
                subscription_plan_type = data.get('subscriptionPlanType')

                # Process the data - e.g., create or update a Django model
                self.stdout.write(f"Received message: {data}")

        except KeyboardInterrupt:
            self.stdout.write("Stopping consumer...")
        finally:
            consumer.close()
            self.stdout.write("Consumer closed.")
        
