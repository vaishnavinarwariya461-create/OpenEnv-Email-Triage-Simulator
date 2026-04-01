from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum

class Category(str, Enum):
    SUPPORT = "Support"
    BILLING = "Billing"
    TECHNICAL = "Technical"
    SPAM = "Spam"
    FEATURE_REQUEST = "Feature Request"
    MULTILINGUAL = "Multilingual"

class Priority(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    URGENT = "Urgent"

class Observation(BaseModel):
    email_id: str
    sender: str
    subject: str
    body: str
    step_count: int

class Action(BaseModel):
    category: Category
    priority: Priority

class Reward(BaseModel):
    score: float = Field(ge=0.0, le=1.0)
    feedback: str

class EmailData(BaseModel):
    email_id: str
    sender: str
    subject: str
    body: str
    ground_truth_category: Category
    ground_truth_priority: Priority
