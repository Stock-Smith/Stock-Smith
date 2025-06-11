from django.http import JsonResponse
from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings

from datetime import datetime, timedelta

from .models import UserPrediction
from .ml_model.PredictSuperCode import predict


class PredictionPriceView(APIView):

    user_prediction_collection = settings.DB['user_prediction']

    def get(self, request):
        ticker = request.query_params.get('ticker', None)
        user_id = request.META.get('HTTP_X_USER_ID', None)
        print(f"------------------###############Received request for ticker: {ticker} from user_id: {user_id}")

        # if user_id is None:
        #     return Response({"error": "Please login to access this resource"}, status=status.HTTP_401_UNAUTHORIZED)
        if ticker is None:
            return Response({"error": "Ticker parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        
        subscription_check_response = self._check_subscription_status(user_id)
    
    # If the check returned a Response (i.e., an error/limit reached), return it immediately.
        if isinstance(subscription_check_response, Response):
            return subscription_check_response
        try:
            prediction_result = self._get_price_prediction(ticker)
            print(f"Prediction result for ticker {ticker}: {prediction_result}")
            return JsonResponse(prediction_result, safe=True)
        except Exception as e:
            print(f"Error occurred: {e}")
            return Response({"error": f"An error occurred while processing the request: {str(e)}"}, 
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    

    # def _update_subscription_to_free(user_id):

    def _get_price_prediction(self, ticker):
        cache_key = f"prediction_{ticker}"
        cached_result = cache.get(cache_key)
        if cached_result:
            print("Cache hit")
            return cached_result
        # Get the prediction result (NumPy array and DatetimeIndex)
        predictions, dates, mape_values = predict(ticker)
            
        # Convert the NumPy array to a Python list
        predictions_list = predictions.tolist()
            
        # Convert DatetimeIndex to string list
        dates_list = dates.strftime('%Y-%m-%d').tolist()
            
            # Create a properly formatted, serializable response
        result = {
            "predictions": predictions_list,
            "dates": dates_list,
            "mape_values": min(mape_values) * 100
        }
            # Cache the result for future requests for 1 day
        print("Cache miss")
        cache.set(cache_key, result, timeout=60*60*24)  # Cache for 1 day
        return result
        
    

    def _check_subscription_status(self, user_id):
        print(f"Checking subscription status for user_id: {user_id}")

        user_prediction = self.user_prediction_collection.find_one({'user_id': user_id})
        
        if not user_prediction:
            print(f"No user prediction found for user_id: {user_id}")
            print(f"Creating new user prediction for user_id: {user_id}")
            # Create a new user prediction with default values
            self.user_prediction_collection.insert_one({
                'user_id': user_id,
                'prediction_usage': {
                    'daily_usage': 0,
                    'last_reset_date': datetime.now()
                },
                'subscription_details': {
                    'daily_limit': 5,
                    'subscription_plan_type': 'free',
                    'start_date': datetime.now(),
                    'end_date': datetime.now() + timedelta(days=30)  # Default to 30 days from now
                }
            })
            print(f"New user prediction created for user_id: {user_id}")
            user_prediction = self.user_prediction_collection.find_one({'user_id': user_id})

        prediction_usage = user_prediction.get('prediction_usage')
        subscription_details = user_prediction.get('subscription_details')

        daily_usage = prediction_usage.get('daily_usage', 0)
        last_reset_date = prediction_usage.get('last_reset_date')

        daily_limit = subscription_details.get('daily_limit')
        subscription_end_date = subscription_details.get('end_date')
        subscription_plan_type = subscription_details.get('subscription_plan_type')

        current_date = datetime.now()

        if subscription_plan_type == 'free':
            print(f"User {user_id} is on free plan")
            if current_date > last_reset_date + timedelta(hours = 24):
                self._update_last_reset_date(user_id)
                last_reset_date = datetime.now()
            
            if daily_usage >= daily_limit:
                print(f"User {user_id} has reached the daily limit for free plan")
                return Response({"error": "Daily limit reached for free plan"}, status=status.HTTP_403_FORBIDDEN)
            
            self._update_daily_usage(user_id)
        
        
        elif subscription_plan_type == 'premium':
            print(f"User {user_id} is on premium plan")
            if current_date > subscription_end_date:
                print(f"User {user_id} subscription has expired")
                self._update_subscription_to_free(user_id)
                return Response({"error": "Subscription has expired, switching to free plan"}, status=status.HTTP_403_FORBIDDEN)
    
    def _update_last_reset_date(self, user_id):
        print(f"Updating last reset date for user {user_id}")
        self.user_prediction_collection.update_one(
            {'user_id': user_id},
            {'$set': {'prediction_usage.last_reset_date': datetime.now()}}
        )
        print(f"Updated last reset date for user {user_id}")
    
    def _update_daily_usage(self, user_id):
        print(f"Updating daily usage for user {user_id}")
        self.user_prediction_collection.update_one(
            {'user_id': user_id},
            {'$inc': {'prediction_usage.daily_usage': 1}}
        )
        print(f"Updated daily usage for user {user_id}")

    def _update_subscription_to_free(self, user_id):
        print(f"Updating subscription to free plan for user {user_id}")
        self.user_prediction_collection.update_one(
            {'user_id': user_id},
            {'$set': {
                'subscription_details.subscription_plan_type': 'free',
                'subscription_details.daily_limit': 5,
                'prediction_usage.daily_usage': 1,
                'prediction_usage.last_reset_date': datetime.now()
            }}
        )
        print(f"Updated subscription to free plan for user {user_id}")