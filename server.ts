import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import { EmailTriageEnv, ActionSchema } from "./src/env/EmailTriageEnv.ts";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 7860;
const env = new EmailTriageEnv();

app.use(express.json());

/* ================================
   🔥 SMART FALLBACK LOGIC
================================ */
function fallbackAnalysis(prompt: string) {
  const text = prompt.toLowerCase();

  if (text.includes("password") || text.includes("login")) {
    return { category: "Support", priority: "Medium" };
  }

  if (text.includes("refund") || text.includes("charge") || text.includes("bill")) {
    return { category: "Billing", priority: "High" };
  }

  if (text.includes("error") || text.includes("bug") || text.includes("404")) {
    return { category: "Technical", priority: "Urgent" };
  }

  if (text.includes("verify") || text.includes("click link")) {
    return { category: "Spam", priority: "Urgent" };
  }

  if (text.includes("integration") || text.includes("feature")) {
    return { category: "Feature Request", priority: "Medium" };
  }

  return { category: "Support", priority: "Low" };
}

/* ================================
   🤖 LLM ANALYSIS ENDPOINT
================================ */
app.post("/api/analyze", async (req, res) => {
  const { prompt } = req.body;

  const API_KEY =
    process.env.HF_TOKEN ||
    process.env.OPENAI_API_KEY ||
    process.env.GEMINI_API_KEY;

  let API_BASE_URL = process.env.API_BASE_URL;
  let MODEL_NAME = process.env.MODEL_NAME;

  // 🧠 SMART FALLBACK FUNCTION (NO AI NEEDED)
  const fallbackAgent = (text: string) => {
    const lower = text.toLowerCase();

    let category = "Support";
    let priority = "Medium";
    let sentiment = "Neutral";
    let action_taken = "Handled using rule-based fallback logic";
    let response_draft = "We have received your request and will assist you shortly.";

    // Category detection
    if (lower.includes("refund") || lower.includes("charge") || lower.includes("bill")) {
      category = "Billing";
    } else if (lower.includes("error") || lower.includes("bug") || lower.includes("404") || lower.includes("not working")) {
      category = "Technical";
    } else if (lower.includes("verify") || lower.includes("click link") || lower.includes("suspicious")) {
      category = "Spam";
    } else if (lower.includes("feature") || lower.includes("integration")) {
      category = "Feature Request";
    } else if (lower.includes("nahi") || lower.includes("jaldi") || lower.includes("kyun")) {
      category = "Multilingual";
    }

    // Priority detection
    if (lower.includes("urgent") || lower.includes("asap") || lower.includes("immediately")) {
      priority = "Urgent";
    } else if (lower.includes("soon") || lower.includes("quick")) {
      priority = "High";
    }

    // Sentiment detection
    if (lower.includes("angry") || lower.includes("faltu") || lower.includes("wrong") || lower.includes("not happy")) {
      sentiment = "Negative";
    } else if (lower.includes("thank") || lower.includes("great")) {
      sentiment = "Positive";
    }

    // Smarter responses
    if (category === "Billing") {
      action_taken = "Reviewed billing issue and initiated refund process";
      response_draft = "We’re sorry for the inconvenience. We are reviewing your billing issue and will process any valid refund soon.";
    }

    if (category === "Technical") {
      action_taken = "Escalated issue to engineering team";
      response_draft = "Our technical team is looking into this issue. We will resolve it ASAP.";
    }

    if (category === "Spam") {
      action_taken = "Marked as phishing and blocked sender";
      response_draft = "This appears to be a suspicious message. Please do not click on unknown links.";
      priority = "Urgent";
    }

    return {
      category,
      priority,
      sentiment,
      action_taken,
      response_draft,
      reasoning: "Generated using fallback rule-based logic",
    };
  };

  // 🚫 NO API KEY → USE FALLBACK
  if (!API_KEY) {
    console.log("[Fallback] No API key found. Using rule-based logic.");
    return res.json(fallbackAgent(prompt));
  }

  // 🔧 AUTO CONFIGURE PROVIDER
  const isDefaultOpenAI =
    !API_BASE_URL || API_BASE_URL === "https://api.openai.com/v1";

  if (isDefaultOpenAI) {
    if (API_KEY.startsWith("hf_")) {
      API_BASE_URL = "https://router.huggingface.co/v1";
      MODEL_NAME = MODEL_NAME || "meta-llama/Llama-3.3-70B-Instruct";
    } else if (API_KEY.startsWith("AIza")) {
      API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai/";
      MODEL_NAME = MODEL_NAME || "gemini-1.5-flash";
    } else {
      API_BASE_URL = "https://api.openai.com/v1";
      MODEL_NAME = MODEL_NAME || "gpt-4o-mini";
    }
  }

  console.log(`[LLM] Using ${MODEL_NAME} via ${API_BASE_URL}`);

  const client = new OpenAI({
    baseURL: API_BASE_URL,
    apiKey: API_KEY,
  });

  try {
    const completion = await client.chat.completions.create({
      model: MODEL_NAME,
      messages: [
        {
          role: "system",
          content: `
You are an intelligent email triage assistant.

Analyze emails carefully and return STRICT JSON:

{
  "category": "Support | Billing | Technical | Spam | Feature Request | Multilingual",
  "priority": "Low | Medium | High | Urgent",
  "sentiment": "Positive | Neutral | Negative",
  "action_taken": "string",
  "response_draft": "string",
  "reasoning": "step-by-step reasoning"
}

Rules:
- Detect Hinglish properly
- Detect urgency strongly
- Detect phishing links
- DO NOT default to Billing always
- Think before answering
          `,
        },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const text = completion.choices[0].message.content;

    if (!text) throw new Error("Empty response");

    return res.json(JSON.parse(text));
  } catch (error) {
    console.error("[LLM ERROR] Falling back:", error.message);

    // 🔁 FALLBACK IF API FAILS
    return res.json(fallbackAgent(prompt));
  }
});
/* ================================
   📦 OPENENV ENDPOINTS
================================ */

app.post("/reset", (req, res) => {
  const taskId = req.body.task_id;
  const observation = env.reset(taskId);
  res.json(observation);
});

app.post("/step", (req, res) => {
  try {
    const action = ActionSchema.parse(req.body.action);
    const result = env.step(action);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/state", (req, res) => {
  res.json(env.getState());
});

app.get("/tasks", (req, res) => {
  const tasks = env.getTasks().map((t) => ({
    id: t.id,
    name: t.name,
    difficulty: t.difficulty,
    description: t.description,
    action_schema: {
      category: [
        "Support",
        "Billing",
        "Technical",
        "Spam",
        "Feature Request",
        "Multilingual",
      ],
      priority: ["Low", "Medium", "High", "Urgent"],
      sentiment: ["Positive", "Neutral", "Negative"],
      action_taken: "string (optional)",
      response_draft: "string (optional)",
    },
  }));
  res.json(tasks);
});

app.get("/grader", (req, res) => {
  const state = env.getState();
  res.json({ score: state.total_reward });
});

/* ================================
   ⚡ VITE SERVER
================================ */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });
}

startServer();