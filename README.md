---
title: OpenEnv Email Triage Simulator
emoji: 📧
colorFrom: indigo
colorTo: blue
sdk: docker
pinned: false
---

# 📧 Intelligent Email Triage & Customer Support Routing System

## 🚀 Project Overview
This project is a Meta PyTorch OpenEnv Hackathon submission that simulates a real-world task: **Intelligent Email Triage**. The environment is designed to train and evaluate AI agents on their ability to classify, prioritize, and handle incoming customer support emails.

## 🧠 Real-World Motivation
Customer support teams are often overwhelmed by a high volume of incoming emails. Manually triaging these emails is time-consuming and prone to human error. An intelligent triage system can automatically route emails to the correct department and prioritize urgent issues, significantly improving response times and customer satisfaction.

## 📦 Action & Observation Space

### Observation Space
- `email_id` (str): Unique identifier for the email.
- `sender` (str): Email address of the sender.
- `subject` (str): Subject line of the email.
- `body` (str): Full text content of the email.
- `step_count` (int): Number of steps taken in the current episode.

### Action Space
- `category` (Enum): One of `Support`, `Billing`, `Complaint`, or `General`.
- `priority` (Enum): One of `Low`, `Medium`, or `High`.

## 📊 Task Descriptions

### 1. EASY: Keyword-Based Triage
- **Description:** Emails with clear, unambiguous keywords.
- **Example:** "I forgot my password" -> Category: Support, Priority: Medium.
- **Goal:** Test basic classification capabilities.

### 2. MEDIUM: Multi-Intent Triage
- **Description:** Emails containing multiple intents or complex scenarios.
- **Example:** "I was charged twice and cannot login" -> Category: Billing, Priority: High.
- **Goal:** Test the agent's ability to prioritize the most critical intent.

### 3. HARD: Ambiguous & Emotional Triage
- **Description:** Emails with ambiguous language, emotional tone, or code-switching (e.g., Hinglish).
- **Example:** "bhai paise kat gaye aur login bhi nahi ho raha" -> Category: Billing, Priority: High.
- **Goal:** Test deep linguistic interpretation and sentiment analysis.

## 🏆 Reward Design
The reward function is deterministic and provides partial rewards:
- **0.5 points** for the correct category.
- **0.5 points** for the correct priority.
- **Total Score:** 0.0 to 1.0 per email.

This design ensures a meaningful gradient for learning, as the agent can receive partial credit for getting one of the two labels correct.

## 🛠️ Setup Instructions

### Local Setup
1. Clone the repository.
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Set environment variables:
   ```bash
   export OPENAI_API_KEY="your-api-key"
   export API_BASE_URL="https://api.openai.com/v1"
   export MODEL_NAME="gpt-3.5-turbo"
   ```

### Docker Setup
1. Build the Docker image:
   ```bash
   docker build -t email-triage-env .
   ```
2. Run the baseline evaluation:
   ```bash
   docker run -e OPENAI_API_KEY="your-api-key" email-triage-env
   ```

## 🤖 How to Run inference.py
The `inference.py` script runs a baseline evaluation using an OpenAI-compatible client. It loops through all tasks (EASY, MEDIUM, HARD) and evaluates the model's performance on the provided dataset.

```bash
python inference.py
```

## 📈 Expected Baseline Scores
- **EASY:** 0.90 - 1.00
- **MEDIUM:** 0.70 - 0.85
- **HARD:** 0.50 - 0.75

The hard tasks are designed to be challenging even for state-of-the-art LLMs, requiring nuanced understanding of context and tone.

## 🧪 Validation Ready
- `openenv.yaml` is fully compliant with the OpenEnv specification.
- The environment is deterministic and reproducible.
- The grader is robust and provides clear feedback.
- The project is ready for deployment on Hugging Face Spaces or any other OpenEnv-compatible platform.

“The Hugging Face Space runs fully offline. The baseline inference script requires OpenAI-compatible credentials, which are expected to be provided during evaluation.”
