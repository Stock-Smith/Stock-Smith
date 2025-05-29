from django.urls import path
from .views import PredictionPriceView, TestView, UserPredictionView

urlpatterns = [
    path('prediction_price/', PredictionPriceView.as_view(), name='prediction_price'),
    path('test/', TestView.as_view(), name='test'),
    path('test/prediction/', UserPredictionView.as_view(), name='user_prediction')

]