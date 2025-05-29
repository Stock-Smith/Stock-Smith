from django.db import models
from mongoengine import Document, fields, EmbeddedDocument
import datetime

class User(Document):
    """
    This is a stub model representing User documents that are managed
    by another service but exist in the same MongoDB database.
    We only need to tell MongoEngine which collection these users reside in.
    You do not need to define all (or any) fields from the other service's User model
    unless you intend to access them directly after dereferencing and want type hints/validation here.
    """

    meta = {
        'collection': 'users',  
        'allow_inheritance': True 
    }
# --- END OF STUB USER DOCUMENT DEFINITION ---

# Create your models here.
class PredictionUsage(EmbeddedDocument):
    daily_count = fields.IntField(default=0)
    last_reset_date = fields.DateTimeField(default=lambda: datetime.datetime.now())
    total_predictions_used = fields.IntField(default=0)

class UserPrediction(Document):
    user_id = fields.ReferenceField('User', required=True, unique=True)
    prediction_usage = fields.EmbeddedDocumentField(PredictionUsage, default=PredictionUsage)

    created_at = fields.DateTimeField(auto_now_add=True)
    updated_at = fields.DateTimeField(auto_now=True)