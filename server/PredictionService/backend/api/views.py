from django.http import JsonResponse
from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.conf import settings

from mongoengine import connect

from .models import UserPrediction
from .ml_model.PredictSuperCode import predict

from .kafka_producer import send_to_kafka


# Connect to MongoDB
# connect(
#     host=settings.CONNECTION_STRING,
# )

class PredictionPriceView(APIView):
    def get(self, request):
        ticker = request.query_params.get('ticker', None)
        if ticker is None:
            return Response({"error": "Ticker parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Check if the prediction is already cached
            cache_key = f"prediction_{ticker}"
            cached_result = cache.get(cache_key)
            if cached_result:
                print("Cache hit")
                return JsonResponse(cached_result, safe=True)
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
            # Return the result as a JSON response
            return JsonResponse(result, safe=True)
        except Exception as e:
            print(f"Error occurred: {e}")
            return Response({"error": f"An error occurred while processing the request: {str(e)}"}, 
                           status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class TestView(APIView):
    def get(self, request):
        user_id = request.query_params.get('user_id', None)
        if user_id is None:
            return Response({"error": "User ID parameter is required"}, status=status.HTTP_400_BAD_REQUEST)
        temp = UserPrediction.objects(user_id=user_id).first()
        print(temp)

        return JsonResponse({"message": "Test successful", "user_id": user_id})

class UserPredictionView(APIView):
    def post(self, request):
        try:
            data = request.data
            user_id = data.get('user_id')
            ticker = data.get('ticker')

            if not user_id or not ticker:
                return Response({"error": "user_id and ticker are required"}, status=status.HTTP_400_BAD_REQUEST)
            
            kafka_data = {
                "user_id": user_id,
                "ticker": ticker
            }
            # Send data to Kafka
            send_to_kafka('user_predictions', kafka_data)
            return Response({"message": "Data sent to Kafka successfully"}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)