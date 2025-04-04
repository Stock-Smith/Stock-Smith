from django.http import JsonResponse
from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .ml_model.PredictSuperCode import predict

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
            predictions, dates = predict(ticker)
            
            # Convert the NumPy array to a Python list
            predictions_list = predictions.tolist()
            
            # Convert DatetimeIndex to string list
            dates_list = dates.strftime('%Y-%m-%d').tolist()
            
            # Create a properly formatted, serializable response
            result = {
                "predictions": predictions_list,
                "dates": dates_list
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