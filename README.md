# 📧 OpenEnv Email Triage Simulator

🚀 **A production-grade AI environment for intelligent email classification, prioritization, and automated support routing.**
🎯 Designed for evaluating AI agents on real-world customer support decision-making under multilingual and ambiguous conditions.

**🌐 Live Demo:** https://eric-bhu-openenv-email-triage-simulator.hf.space

---

## 🧠 Overview

This project implements a **fully interactive, OpenEnv-compliant environment** that simulates a real-world customer support inbox.

An AI agent must:

* Classify incoming emails
* Assign priority levels
* Interpret multilingual and emotional content
* Generate reasoning-backed decisions

The system includes a rich, interactive web UI featuring real-time analytics, behavioral insights, and performance evaluation, making it suitable for both **training and benchmarking intelligent agents**.

---

## 🌍 Real-World Motivation

Modern customer support systems face:

* 📥 **High email volume**
* 🌐 **Multilingual users** (e.g., seamless transitions between English and Hinglish)
* 😠 **Emotionally charged complaints**
* ⚠️ **Security threats** (phishing, fraud)

This environment simulates these challenges to enable automated triage systems, faster response pipelines, and scalable AI-driven support.

---

## 🧩 Why This Problem Is Challenging

This environment goes beyond standard classification tasks:

* 🔀 Multi-intent reasoning (e.g., billing + login issues)
* 🌐 Code-switching between languages (Hinglish)
* 😠 Emotion-aware prioritization
* ⚠️ Security threat detection (phishing vs legitimate emails)
* ⚖️ Trade-offs between urgency and correctness

These challenges make it a realistic benchmark for modern AI systems.

---

## 🖥️ Interactive Dashboard Features

The project features a comprehensive, dual-tab web interface:

### 1. Simulator Tab (Real-Time Execution)

* **Live Observation Space:** Displays incoming email (sender, subject, body, time)
* **Agent Process Log:** Streams internal reasoning states (`SYSTEM`, `TASK`, `REASONING`, `ACTION`, `OBSERVE`)
* **Manual Triage Control:**

  * Smart Suggest (AI-assisted decisions)
  * Category & Priority selectors
  * Live Sentiment indicators (Positive / Neutral / Negative)
  * Response draft generator
* **Environment Status:** Latency, cycle count, and neural activity indicators

---

### 2. Analytics Tab (Post-Analysis Intelligence Report)

* **Top-Level Metrics:**

  * Average Accuracy (~97%+)
  * Average Latency (~1300–1500 ms)
  * Tasks Processed
  * System Health

* **Agent Behavioral Profile:**

  * Decision Bias (precision-first vs speed-first)
  * Sentiment Sensitivity
  * Linguistic Adaptability

* **Advanced Visualizations:**

  * Agent Performance Matrix (accuracy vs latency per task)
  * Capability Radar Chart (reasoning, sentiment, multilingual ability)
  * Sentiment Distribution

* **Agent Reasoning Cards:**
  Detailed explanations of each decision including category, priority, and sentiment justification

---

## ⚙️ Agent Interaction Loop

1. `POST /reset` → Receive a new email
2. Agent analyzes subject + body
3. Predict:

   * `category ∈ {Support, Billing, Complaint, General, Spam, Technical, Feature Request}`
   * `priority ∈ {Low, Medium, High, Urgent}`
4. `POST /step` → Submit action
5. Receive reward (0–1) and feedback
6. Repeat until episode ends

---

## 📦 Observation Space

Each state includes:

* `email_id` — Unique identifier
* `sender` — Email address
* `subject` — Subject line
* `body` — Email content
* `history` — Previous actions
* `step_count` — Current step

---

## 🎯 Action Space

Agent must output:

### Category

* Support
* Billing
* Complaint
* Technical
* Spam
* Feature Request
* General

### Priority

* Low
* Medium
* High
* Urgent

---

## 📊 Task Registry

The environment includes 7 diverse real-world tasks.
The baseline agent achieves **near-perfect performance (~97–100%) on deterministic scenarios**, validating correctness of environment design.

| Task                    | Difficulty | Description                         |
| ----------------------- | ---------- | ----------------------------------- |
| Simple Support Request  | Easy       | Password reset / login issue        |
| Billing Dispute         | Medium     | Double charge scenario              |
| Hinglish Support Query  | Medium     | Mixed Hindi-English input           |
| Angry Billing Complaint | Hard       | Emotional + multilingual (Hinglish) |
| Technical Glitch        | Hard       | Debugging + urgency (Hinglish)      |
| Urgent Security Alert   | Hard       | Fraud/Phishing detection            |
| Complex Feature Request | Medium     | Product-level reasoning             |

---

## 🧠 Advanced Capabilities

* 🔹 **Multilingual Understanding:** Handles English + Hinglish seamlessly
* 🔹 **Sentiment Awareness:** Detects tone and escalates hostile communication
* 🔹 **Reasoning Transparency:** Generates explanations for every decision

---

## 🏆 Reward Design

* ✅ +0.5 → Correct category
* ✅ +0.5 → Correct priority

**Total Reward:** 0.0 – 1.0

Supports:

* partial credit
* interpretable scoring
* stable learning

---

## 🏗️ Project Structure

```
├── environment.py      # OpenEnv core logic
├── tasks.py            # Task definitions
├── grader.py           # Reward + evaluation logic
├── inference.py        # Baseline agent
├── openenv.yaml        # Environment config
│
├── server/             # Backend API
├── src/                # Frontend UI
│
├── Dockerfile
├── requirements.txt
├── package.json
```

---

## 🔌 API Endpoints

* `POST /reset` → Start new episode
* `POST /step` → Submit action
* `GET /state` → Current environment state

---

## 🛠️ Setup

### Local

```bash
pip install -r requirements.txt
python inference.py
```

---

### Docker

```bash
docker build -t email-triage-env .
docker run email-triage-env
```

---

## 🧪 Validation

* ✔ OpenEnv compliant
* ✔ Deterministic
* ✔ Dockerized
* ✔ Successfully tested with `openenv validate`

---

## 🎯 Use Cases

* Training reinforcement learning agents for decision-making
* Benchmarking LLM reasoning in structured environments
* Simulating real-world customer support pipelines
* Evaluating multilingual and sentiment-aware AI systems

---

## 🚀 Conclusion

This project goes beyond simple text classification. It models how intelligent agents behave in real customer support systems by combining:

* language understanding
* sentiment awareness
* reasoning transparency
* real-world complexity

making it a powerful benchmark for next-generation AI systems.

---
