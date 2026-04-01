import os
import json
from openai import OpenAI
from environment import make
from models import Action, Category, Priority, Observation
from tasks import TASKS
from typing import List, Dict, Any

# Environment variables
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "your-api-key")

# Initialize OpenAI client
client = OpenAI(api_key=OPENAI_API_KEY, base_url=API_BASE_URL)

def get_action_from_llm(obs: Observation) -> Action:
    """Sends observation to model and gets action."""
    prompt = f"""
    You are an intelligent email triage assistant. Your task is to classify and prioritize incoming customer emails.
    
    Email Details:
    Sender: {obs.sender}
    Subject: {obs.subject}
    Body: {obs.body}
    
    Categories: Support, Billing, Technical, Spam, Feature Request, Multilingual
    Priorities: Low, Medium, High, Urgent
    
    Return your response as a JSON object with keys 'category' and 'priority'.
    Example: {{"category": "Support", "priority": "Medium"}}
    """
    
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "You are a helpful assistant that outputs JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        content = response.choices[0].message.content
        data = json.loads(content)
        
        # Map to enum values to ensure validity
        category_str = data.get("category", "Support")
        priority_str = data.get("priority", "Low")
        
        # Ensure the strings match the enum values (case-sensitive)
        try:
            category = Category(category_str)
        except ValueError:
            category = Category.SUPPORT
            
        try:
            priority = Priority(priority_str)
        except ValueError:
            priority = Priority.LOW
            
        return Action(category=category, priority=priority)
    except Exception as e:
        print(f"Error calling LLM: {e}")
        # Default fallback action
        return Action(category=Category.SUPPORT, priority=Priority.LOW)

def run_baseline():
    """Loop through all tasks and evaluate."""
    print(f"--- Starting Baseline Evaluation ---")
    print(f"API Base URL: {API_BASE_URL}")
    print(f"Model Name: {MODEL_NAME}")
    
    total_score = 0.0
    task_count = 0
    
    for task_name, emails in TASKS.items():
        print(f"\nEvaluating Task: {task_name}")
        task_score = 0.0
        
        # Create environment for this task
        env = make(task_name=task_name)
        
        # Evaluate each email in the task dataset
        for i in range(len(emails)):
            # Reset to get the specific email deterministically for evaluation
            obs = env.reset(index=i)
            
            print(f"  Email ID: {obs.email_id}")
            
            # Get action from LLM
            action = get_action_from_llm(obs)
            print(f"    Action: Category={action.category}, Priority={action.priority}")
            
            # Step in environment
            _, reward, _, info = env.step(action)
            print(f"    Reward: {reward.score:.2f} - {reward.feedback}")
            
            task_score += reward.score
            task_count += 1
            
        avg_task_score = task_score / len(emails)
        print(f"  Average Score for {task_name}: {avg_task_score:.2f}")
        total_score += task_score
        
    final_avg_score = total_score / task_count
    print(f"\n--- Evaluation Complete ---")
    print(f"Final Average Score: {final_avg_score:.2f}")

if __name__ == "__main__":
    run_baseline()
