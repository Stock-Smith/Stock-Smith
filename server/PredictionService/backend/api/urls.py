from django.urls import path
from .views import PredictionPriceView

urlpatterns = [
    path('prediction/', PredictionPriceView.as_view(), name='prediction_price'),
]