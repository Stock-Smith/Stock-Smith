import json
from django.http import JsonResponse
from rest_framework.response import Response
from rest_framework.views import APIView


class PredictionPriceView(APIView):
    """"
    "A view to handle prediction price requests."
    """
    def get(self, request):
        """
        A test method that returns a JSON response with a message.
        """
        return Response({
            "message": "Hello, World!"
        })