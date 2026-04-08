import os
import json
import argparse
from environment import make
from models import Action, Category, Priority, Observation
from tasks import TASKS

# -------------------------------
# Parse arguments
# -------------------------------
parser = argparse.ArgumentParser(description="Email Triage Evaluation")
parser.add_argument(
    "--mode",
    choices=["local", "baseline"],
    default="baseline",
    help="Mode: 'local' uses OpenAI GPT, 'baseline' uses default actions"
)
args = parser.parse_args()
MODE = args.mode

# -------------------------------
# Setup OpenAI (only if local)
# -------------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", None)
API_BASE_URL = os.getenv("API_BASE_URL", "https://api.openai.com/v1")
MODEL_NAME = os.getenv("MODEL_NAME", "gpt-3.5-turbo")

client = None

if MODE == "local":
    if not OPENAI_API_KEY:
        print("No API key found. Switching to baseline mode.", flush=True)
        MODE = "baseline"
    else:
        try:
            from openai import OpenAI
            client = OpenAI(api_key=OPENAI_API_KEY, base_url=API_BASE_URL)
        except Exception as e:
            print(f"OpenAI init error: {e}", flush=True)
            MODE = "baseline"

# -------------------------------
# Get action
# -------------------------------
def get_action_from_llm(obs: Observation) -> Action:
    if MODE == "baseline" or client is None:
        return Action(category=Category.SUPPORT, priority=Priority.LOW)

    prompt = f"""
You are an intelligent email triage assistant.

Email:
Sender: {obs.sender}
Subject: {obs.subject}
Body: {obs.body}

Categories: Support, Billing, Technical, Spam, Feature Request, Multilingual
Priorities: Low, Medium, High, Urgent

Return ONLY JSON:
{{"category": "Support", "priority": "Medium"}}
"""

    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "system", "content": "Return only valid JSON."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )

        data = json.loads(response.choices[0].message.content)

        category = Category(data.get("category", "Support"))
        priority = Priority(data.get("priority", "Low"))

        return Action(category=category, priority=priority)

    except Exception as e:
        print(f"LLM error: {e}", flush=True)
        return Action(category=Category.SUPPORT, priority=Priority.LOW)

# -------------------------------
# MAIN EVALUATION (FIXED)
# -------------------------------
def run_evaluation():
    total_score = 0.0
    total_steps = 0

    for task_name, emails in TASKS.items():
        env = make(task_name=task_name)

        # ✅ REQUIRED
        print(f"[START] task={task_name}", flush=True)

        task_score = 0.0
        step_count = 0

        for i in range(len(emails)):
            obs = env.reset(index=i)

            action = get_action_from_llm(obs)

            _, reward, _, _ = env.step(action)

            step_count += 1
            task_score += reward.score

            # ✅ REQUIRED
            print(f"[STEP] step={step_count} reward={reward.score}", flush=True)

        avg_score = task_score / len(emails) if len(emails) > 0 else 0.0

        # ✅ REQUIRED
        print(f"[END] task={task_name} score={avg_score} steps={step_count}", flush=True)

        total_score += task_score
        total_steps += step_count

    final_score = total_score / total_steps if total_steps > 0 else 0.0

    # Optional (safe)
    print(f"FINAL_SCORE={final_score}", flush=True)

# -------------------------------
# ENTRY POINT
# -------------------------------
if __name__ == "__main__":
    try:
        run_evaluation()
    except Exception as e:
        print(f"Fatal error: {e}", flush=True)
        exit(1)
