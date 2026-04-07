import os
import json
import argparse
from environment import make
from models import Action, Category, Priority, Observation
from tasks import TASKS
from typing import List, Dict, Any

# Parse command-line argument for mode
parser = argparse.ArgumentParser(description="Email Triage Evaluation")
parser.add_argument(
    "--mode",
    choices=["local", "baseline"],
    default="baseline",
    help="Mode: 'local' uses OpenAI GPT, 'baseline' uses default actions for hackathon"
)
args = parser.parse_args()

MODE = args.mode

# -------------------------------
# Setup OpenAI client only if mode=local and key exists
# -------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", None)
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")

if MODE == "local":
    if not OPENAI_API_KEY:
        print("Error: No OpenAI API key found. Falling back to baseline mode.")
        MODE = "baseline"

if MODE == "local":
    from openai import OpenAI
    client = OpenAI(api_key=OPENAI_API_KEY, base_url=API_BASE_URL)
else:
    client = None
    print("Running in baseline mode. No API calls will be made.")

# -------------------------------
# Function to get action
# -------------------------------
def get_action_from_llm(obs: Observation) -> Action:
    """Return action from LLM if local, else baseline action."""
    if MODE == "baseline" or client is None:
        return Action(category=Category.SUPPORT, priority=Priority.LOW)

    prompt = f"""
    You are an intelligent email triage assistant. Classify and prioritize emails.

    Email Details:
    Sender: {obs.sender}
    Subject: {obs.subject}
    Body: {obs.body}

    Categories: Support, Billing, Technical, Spam, Feature Request, Multilingual
    Priorities: Low, Medium, High, Urgent

    Return JSON with keys 'category' and 'priority'.
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

        category_str = data.get("category", "Support")
        priority_str = data.get("priority", "Low")

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
        return Action(category=Category.SUPPORT, priority=Priority.LOW)

# -------------------------------
# Run evaluation
# -------------------------------
def run_baseline():
    print(f"--- Starting Baseline Evaluation (Mode={MODE}) ---")
    total_score = 0.0
    task_count = 0

    for task_name, emails in TASKS.items():
        print(f"\nEvaluating Task: {task_name}")
        task_score = 0.0
        env = make(task_name=task_name)

        for i in range(len(emails)):
            obs = env.reset(index=i)
            print(f"  Email ID: {obs.email_id}")

            action = get_action_from_llm(obs)
            print(f"    Action: Category={action.category}, Priority={action.priority}")

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
    try:
        run_baseline()
    except Exception as e:
        print("Fatal error:", e)
        exit(1)
