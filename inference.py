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
    default="local",
)
args = parser.parse_args()
MODE = args.mode

# -------------------------------
# Environment Variables (STRICT BUT SAFE)
# -------------------------------
API_KEY = os.environ.get("API_KEY")
API_BASE_URL = os.environ.get("API_BASE_URL")
MODEL_NAME = os.environ.get("MODEL_NAME", "gpt-3.5-turbo")

client = None

# -------------------------------
# Setup OpenAI (NO CRASH)
# -------------------------------
if MODE == "local":
    try:
        from openai import OpenAI

        if API_KEY and API_BASE_URL:
            client = OpenAI(
                api_key=API_KEY,
                base_url=API_BASE_URL
            )
            print("✅ LLM Client initialized", flush=True)
            print(f"🚨 USING BASE URL: {API_BASE_URL}", flush=True)
            print(f"🚨 USING MODEL: {MODEL_NAME}", flush=True)
        else:
            print("⚠️ Missing API env vars, LLM may not work", flush=True)

    except Exception as e:
        print(f"❌ OpenAI init error: {e}", flush=True)
        client = None

# -------------------------------
# Get action from LLM
# -------------------------------
def get_action_from_llm(obs: Observation) -> Action:
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

    # Try LLM call if client exists
    if client is not None:
        try:
            response = client.chat.completions.create(
                model=MODEL_NAME,
                messages=[
                    {"role": "system", "content": "Return only valid JSON."},
                    {"role": "user", "content": prompt}
                ],
                response_format={"type": "json_object"}
            )

            content = response.choices[0].message.content
            data = json.loads(content)

            category = Category(data.get("category", "Support"))
            priority = Priority(data.get("priority", "Low"))

            return Action(category=category, priority=priority)

        except Exception as e:
            print(f"⚠️ LLM error: {e}", flush=True)

    # Safe fallback (AFTER attempt)
    return Action(category=Category.SUPPORT, priority=Priority.LOW)

# -------------------------------
# MAIN EVALUATION
# -------------------------------
def run_evaluation():
    total_score = 0.0
    total_steps = 0

    print("🚀 Starting Evaluation...", flush=True)

    for task_name, emails in TASKS.items():
        env = make(task_name=task_name)

        print(f"[START] task={task_name}", flush=True)

        task_score = 0.0
        step_count = 0

        for i in range(len(emails)):
            obs = env.reset(index=i)

            # 🔥 Always tries LLM first
            action = get_action_from_llm(obs)

            _, reward, _, _ = env.step(action)

            step_count += 1
            task_score += reward.score

            print(f"[STEP] step={step_count} reward={reward.score}", flush=True)

        avg_score = task_score / len(emails) if len(emails) > 0 else 0.0

        print(f"[END] task={task_name} score={avg_score} steps={step_count}", flush=True)

        total_score += task_score
        total_steps += step_count

    final_score = total_score / total_steps if total_steps > 0 else 0.0

    print(f"FINAL_SCORE={final_score}", flush=True)

# -------------------------------
# ENTRY POINT
# -------------------------------
if __name__ == "__main__":
    try:
        run_evaluation()
    except Exception as e:
        print(f"💥 Fatal error: {e}", flush=True)
        exit(1)
