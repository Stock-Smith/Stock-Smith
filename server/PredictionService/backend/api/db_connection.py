import pymongo
from django.conf import settings

client = pymongo.MongoClient(settings.CONNECTION_STRING)
db = client["test"]

