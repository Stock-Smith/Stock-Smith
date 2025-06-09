from django.core.management.base import BaseCommand
from confluent_kafka import Consumer, KafkaError
import json
from datetime import datetime

from django.conf import settings

from api.models import UserPrediction, SubscriptionDetails

user_prediction_collection = settings.DB['user_prediction']

class Command(BaseCommand):
    help = 'Consume Kafka messages from prediction topic'

    
    def handle(self, *args, **kwargs):
        self.stdout.write("Starting Kafka consumer...")
        self.stdout.write(f"Using Kafka bootstrap servers: {settings.KAFKA_BOOTSTRAP_SERVERS}")
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

                self.stdout.write(f"Received message for user_id: {user_id}, subscription_plan_id: {subscription_plan_id}")
                # Validate required fields
                if not all([user_id, subscription_plan_id, start_date, end_date, subscription_plan_type]):
                    self.stderr.write("Missing required fields in the message")
                    continue
                # Convert dates from string to datetime if necessary
                try:
                    start_date = datetime.fromisoformat(start_date)
                    end_date = datetime.fromisoformat(end_date)
                except ValueError as e:
                    self.stderr.write(f"Invalid date format: {e}")
                    continue
                # Ensure subscription_plan_type is valid
                if subscription_plan_type not in ['free', 'premium']:
                    self.stderr.write(f"Invalid subscription plan type: {subscription_plan_type}")
                    continue

                self.stdout.write(f"Processing user_id: {user_id}, subscription_plan_id: {subscription_plan_id}, start_date: {start_date}, end_date: {end_date}, subscription_plan_type: {subscription_plan_type}")

                # Store the data in the UserPrediction model
                subscription_details_instance = SubscriptionDetails(
                    subscription_plan_id = subscription_plan_id,
                    subscription_plan_type = subscription_plan_type,
                    start_date = start_date,
                    end_date = end_date,
                    daily_limit = -1 if subscription_plan_type == 'premium' else 5
                )

                user_prediction = user_prediction_collection.find_one({'user_id': user_id})

                self.stdout.write(f"UserPrediction found: {user_prediction}")
                if user_prediction:
                    # Update existing UserPrediction
                    self.stdout.write(f"Updating UserPrediction for user_id: {user_id}")
                    user_prediction_collection.update_one(
                        {'user_id': user_id},
                        {'$set': {
                            'subscription_details': subscription_details_instance.to_mongo(),
                            'updated_at': datetime.now()
                        }}
                    )
                else:
                    # Create new UserPrediction
                    self.stdout.write(f"Creating new UserPrediction for user_id: {user_id}")
                    user_prediction_collection.insert_one({
                        'user_id': user_id,
                        'subscription_details': subscription_details_instance.to_mongo(),
                        'created_at': datetime.now(),
                        'updated_at': datetime.now()
                    })

                
                # Log the creation or update of the UserPrediction
                self.stdout.write(f"UserPrediction created or updated for user_id: {user_id}")

                # Process the data - e.g., create or update a Django model
                self.stdout.write(f"Received message: {data}")

        except KeyboardInterrupt:
            self.stdout.write("Stopping consumer...")
        finally:
            consumer.close()
            self.stdout.write("Consumer closed.")
        
