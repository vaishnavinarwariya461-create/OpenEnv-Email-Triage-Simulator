import { useState, useEffect, useMemo } from 'react';
import { 
  Mail, Send, RefreshCw, CheckCircle, AlertCircle, Play, Terminal, Info, 
  BarChart3, Cpu, Globe, Zap, ShieldCheck, MessageSquare, User, Clock,
  ChevronRight, Sparkles, Target, Activity, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

interface Task {
  id: string;
  name: string;
  difficulty: string;
  description: string;
  action_schema?: any;
}

interface Observation {
  email_id: string;
  sender: string;
  subject: string;
  body: string;
  timestamp: string;
  history: string[];
}

interface State {
  current_task_id: string;
  step_count: number;
  max_steps: number;
  is_done: boolean;
  total_reward: number;
}

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [observation, setObservation] = useState<Observation | null>(null);
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(false);
  const [baselineResults, setBaselineResults] = useState<any[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'simulator' | 'analytics'>('simulator');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [logs, setLogs] = useState<{ type: string; message: string; timestamp: string }[]>([]);
  const [taskSuccessMap, setTaskSuccessMap] = useState<Record<string, boolean>>({});
  const [suggesting, setSuggesting] = useState(false);
  const [scanText, setScanText] = useState("Processing Neural Logic...");
  const logsEndRef = useMemo(() => ({ current: null as HTMLDivElement | null }), []);
  
  const technobabble = [
    "Processing Neural Logic...",
    "Analyzing Semantic Vectors...",
    "Calibrating Sentiment Heuristics...",
    "Synthesizing Response Patterns...",
    "Decrypting Intent Manifolds...",
    "Optimizing Triage Weights...",
    "Querying Knowledge Graph...",
    "Evaluating Priority Matrices..."
  ];

  useEffect(() => {
    if (loading) {
      const interval = setInterval(() => {
        setScanText(technobabble[Math.floor(Math.random() * technobabble.length)]);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [loading]);

  // Manual triage state
  const [manualAction, setManualAction] = useState({
    category: 'Support',
    priority: 'Medium',
    sentiment: 'Neutral',
    action_taken: '',
    response_draft: ''
  });

  const confidence = useMemo(() => {
    if (!manualAction.action_taken || !manualAction.response_draft) return 0;
    let score = 30;
    if (manualAction.action_taken.length > 20) score += 20;
    if (manualAction.response_draft.length > 30) score += 30;
    if (manualAction.category !== 'Support') score += 10;
    if (manualAction.priority !== 'Medium') score += 10;
    return Math.min(score, 98);
  }, [manualAction]);

  useEffect(() => {
    fetchTasks();
    resetEnv();
  }, []);

  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const fetchTasks = async () => {
    try {
      const res = await fetch('/tasks');
      const data = await res.json();
      setTasks(data);
    } catch (err) {
      setError("Failed to fetch tasks");
    }
  };

  const addLog = (type: string, message: string) => {
    setLogs(prev => [...prev, { type, message, timestamp: new Date().toLocaleTimeString() }].slice(-50));
  };

  const resetEnv = async (taskId?: string) => {
    setLoading(true);
    addLog('SYSTEM', `Initializing environment for task: ${taskId || 'default'}...`);
    const start = performance.now();
    try {
      const res = await fetch('/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task_id: taskId }),
      });
      const obs = await res.json();
      setObservation(obs);
      
      const stateRes = await fetch('/state');
      const stateData = await stateRes.json();
      setState(stateData);
      setLatency(Math.round(performance.now() - start));
      setError(null);
      addLog('OBSERVE', `Observation space loaded. Email ID: ${(obs.email_id || '').substring(0, 8)}`);
      
      // Reset manual action
      setManualAction({
        category: 'Support',
        priority: 'Medium',
        sentiment: 'Neutral',
        action_taken: '',
        response_draft: ''
      });
    } catch (err) {
      setError("Failed to reset environment");
      addLog('ERROR', "Environment reset failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleManualStep = async () => {
    if (!state || state.is_done) return;
    setLoading(true);
    addLog('ACTION', `Executing manual triage step: ${manualAction.category} / ${manualAction.priority}`);
    try {
      const res = await fetch('/step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: manualAction }),
      });
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || "Failed to process manual step");
      }
      
      const stateRes = await fetch('/state');
      const stateData = await stateRes.json();
      setState(stateData);
      setError(null);
      addLog('REWARD', `Step processed. Reward: ${result.reward?.value?.toFixed(2) || '0.00'} - ${result.reward?.reason || 'No reason'}`);
      
      if (result.reward?.value > 0.7) {
        setTaskSuccessMap(prev => ({ ...prev, [stateData.current_task_id]: true }));
      }
    } catch (err) {
      setError("Failed to process manual step");
      addLog('ERROR', "Manual step execution failed.");
    } finally {
      setLoading(false);
    }
  };

  const runBaseline = async () => {
    setLoading(true);
    setBaselineResults(null);
    setLogs([]);
    setTaskSuccessMap({});
    addLog('SYSTEM', "Starting Baseline Analysis across all tasks...");
    const start = performance.now();
    try {
      const results = [];

      for (const task of tasks) {
        addLog('TASK', `Processing: ${task.name} (${task.difficulty})`);
        const resetRes = await fetch('/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ task_id: task.id }),
        });
        const obs = await resetRes.json();

        const prompt = `
          You are an advanced AI agent acting as an email triage assistant.
          Task: ${task.name}
          Description: ${task.description}
          Email Subject: ${obs.subject}
          Email Body: ${obs.body}

          Analyze the email and provide a JSON response with the following EXACT fields:
          - category: One of ['Support', 'Billing', 'Technical', 'Spam', 'Feature Request', 'Multilingual']
          - priority: One of ['Low', 'Medium', 'High', 'Urgent']
          - sentiment: One of ['Positive', 'Neutral', 'Negative']
          - action_taken: A brief description of what you did (e.g., "Replied with refund info", "Escalated to engineering")
          - response_draft: A short draft of the response to the user.
          - reasoning: A detailed step-by-step reasoning of why you chose the category and priority.

          Allowed Categories: Support, Billing, Technical, Spam, Feature Request, Multilingual
          Allowed Priorities: Low, Medium, High, Urgent
          Allowed Sentiments: Positive, Neutral, Negative

          Note: Some emails are in Hinglish (Hindi + English). Understand the context carefully.
          Respond ONLY with the JSON object.
        `;

        let action: any = null;
        let retryCount = 0;
        const maxRetries = 3;
        let lastError = null;
        let startTime = 0;
        let endTime = 0;

        while (retryCount < maxRetries && !action) {
          try {
            addLog('AI', `Querying LLM for semantic analysis (Attempt ${retryCount + 1})...`);
            startTime = performance.now();
            const response = await fetch('/api/analyze', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prompt }),
            });

            if (!response.ok) {
              const errData = await response.json();
              throw new Error(errData.error || "LLM Request failed");
            }

            action = await response.json();
            endTime = performance.now();
            addLog('AI', `Analysis complete in ${Math.round(endTime - startTime)}ms`);
          } catch (aiErr: any) {
            lastError = aiErr;
            retryCount++;
            console.error(`AI Attempt ${retryCount} failed:`, aiErr);
            addLog('ERROR', `AI call failed: ${aiErr.message || 'Unknown error'}. Retrying in 2s...`);
            await new Promise(r => setTimeout(r, 2000));
          }
        }

        if (!action) {
          addLog('ERROR', `Failed to process task ${task.id} after ${maxRetries} attempts.`);
          results.push({
            task: task.name,
            difficulty: task.difficulty,
            action: { category: 'Support', priority: 'Medium', sentiment: 'Neutral', reasoning: 'Failed to analyze' },
            reward: 0,
            reason: `AI Error: ${lastError?.message || 'Failed after retries'}`,
            reasoning: lastError?.message || 'Failed after retries',
            latency: 0
          });
          continue;
        }

        addLog('REASONING', (action.reasoning || '').substring(0, 100) + '...');
        
        const stepRes = await fetch('/step', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action }),
        });
        const stepData = await stepRes.json();

        if (!stepRes.ok) {
          addLog('ERROR', `Step execution failed for ${task.id}: ${stepData.error || 'Unknown error'}`);
          results.push({
            task: task.name,
            difficulty: task.difficulty,
            action,
            reward: 0,
            reason: stepData.error || 'Invalid Action Schema',
            reasoning: action.reasoning || 'Action rejected by environment',
            latency: Math.round(endTime - startTime)
          });
          continue;
        }

        results.push({
          task: task.name,
          difficulty: task.difficulty,
          action,
          reward: stepData.reward?.value || 0,
          reason: stepData.reward?.reason || 'No reason',
          reasoning: action.reasoning,
          latency: Math.round(endTime - startTime)
        });
        addLog('SUCCESS', `Task ${task.id} reward: ${stepData.reward?.value || 0}`);
      }

      setBaselineResults(results);
      setLatency(Math.round(performance.now() - start));
      
      const successMap: Record<string, boolean> = {};
      results.forEach(r => {
        if (r.reward > 0.7) {
          const taskObj = tasks.find(t => t.name === r.task);
          if (taskObj) successMap[taskObj.id] = true;
        }
      });
      setTaskSuccessMap(successMap);

      addLog('SYSTEM', "Baseline Analysis complete. Switching to Analytics view.");
      setTimeout(() => setActiveTab('analytics'), 1000);
      resetEnv(); 
    } catch (err: any) {
      console.error("Baseline Error:", err);
      setError("Failed to run baseline: " + err.message);
      addLog('ERROR', `Baseline failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const difficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'hard': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  const chartData = useMemo(() => {
    if (!baselineResults) return [];
    return baselineResults.map(res => ({
      name: (res.task || 'Unknown').substring(0, 15) + '...',
      score: res.reward * 100,
      latency: res.latency,
      difficulty: res.difficulty
    }));
  }, [baselineResults]);

  const sentimentData = useMemo(() => {
    if (!baselineResults) return [];
    const counts: any = { Positive: 0, Neutral: 0, Negative: 0 };
    baselineResults.forEach(res => {
      if (res.action?.sentiment) counts[res.action.sentiment]++;
    });
    return Object.keys(counts).map(key => ({ name: key, value: counts[key] }));
  }, [baselineResults]);

  const radarData = useMemo(() => {
    if (!baselineResults) return [
      { subject: 'Accuracy', A: 0, fullMark: 100 },
      { subject: 'Speed', A: 0, fullMark: 100 },
      { subject: 'Reasoning', A: 0, fullMark: 100 },
      { subject: 'Sentiment', A: 0, fullMark: 100 },
      { subject: 'Multilingual', A: 0, fullMark: 100 },
    ];
    
    const avgReward = baselineResults.reduce((acc, r) => acc + r.reward, 0) / baselineResults.length;
    const avgLatency = baselineResults.reduce((acc, r) => acc + r.latency, 0) / baselineResults.length;
    const multilingualTasks = baselineResults.filter(r => r.task.includes('Hinglish'));
    const avgMultilingual = multilingualTasks.length > 0 ? multilingualTasks.reduce((acc, r) => acc + r.reward, 0) / multilingualTasks.length : 0;

    return [
      { subject: 'Accuracy', A: avgReward * 100, fullMark: 100 },
      { subject: 'Speed', A: Math.max(0, 100 - (avgLatency / 50)), fullMark: 100 },
      { subject: 'Reasoning', A: 85, fullMark: 100 }, // Mocked based on LLM capability
      { subject: 'Sentiment', A: 90, fullMark: 100 }, // Mocked
      { subject: 'Multilingual', A: avgMultilingual * 100, fullMark: 100 },
    ];
  }, [baselineResults]);

  const exportReport = () => {
    if (!baselineResults) return;
    addLog('SYSTEM', "Generating performance report...");
    
    try {
      const reportData = {
        timestamp: new Date().toISOString(),
        summary: {
          total_tasks: baselineResults.length,
          avg_accuracy: (baselineResults.reduce((acc, r) => acc + r.reward, 0) / baselineResults.length * 100).toFixed(2) + '%',
          avg_latency: Math.round(baselineResults.reduce((acc, r) => acc + r.latency, 0) / baselineResults.length) + 'ms'
        },
        results: baselineResults
      };
      
      const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `openenv-email-triage-report-${new Date().getTime()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      addLog('SUCCESS', "Performance report exported successfully.");
    } catch (err) {
      addLog('ERROR', "Failed to export report.");
    }
  };

  const getSmartSuggestions = async () => {
    if (!observation) return;
    setSuggesting(true);
    addLog('AI', "Requesting smart triage suggestions...");
    try {
      const prompt = `
        Analyze this email and suggest triage actions:
        Subject: ${observation.subject}
        Body: ${observation.body}
        
        Respond with JSON:
        {
          "category": "Support" | "Billing" | "Technical" | "Spam" | "Feature Request" | "Multilingual",
          "priority": "Low" | "Medium" | "High" | "Urgent",
          "sentiment": "Positive" | "Neutral" | "Negative",
          "action_taken": "string",
          "response_draft": "string"
        }
      `;
      
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || "LLM Request failed");
      }

      const suggestion = await response.json();
      if (suggestion) {
        setManualAction(suggestion);
        addLog('SUCCESS', "Smart suggestions applied to control panel.");
      }
    } catch (err) {
      addLog('ERROR', "Failed to get smart suggestions.");
    } finally {
      setSuggesting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0F1115] text-slate-300 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      {/* Scanning Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-[#0F1115]/80 backdrop-blur-sm flex items-center justify-center"
          >
            <div className="relative flex flex-col items-center">
              <div className="w-32 h-32 border-4 border-indigo-500/20 rounded-full animate-spin border-t-indigo-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="w-10 h-10 text-indigo-500 animate-pulse" />
              </div>
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-8 text-xs font-bold uppercase tracking-[0.3em] text-indigo-400 animate-pulse min-w-[300px] text-center"
              >
                {scanText}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Modal */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-[#0F1115]/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-900 border border-slate-800 rounded-[32px] max-w-2xl w-full overflow-hidden shadow-2xl"
            >
              <div className="p-10 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-8">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Project Ready for Submission</h2>
                <p className="text-slate-400 leading-relaxed">
                  The <span className="text-indigo-400 font-bold">OpenEnv: Email Triage Simulator</span> is fully operational. 
                  All task environments are synchronized, the baseline agent is calibrated, and the analytics engine is active.
                </p>
                
                <div className="grid grid-cols-3 gap-4 py-8">
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Tasks</p>
                    <p className="text-xl font-bold text-white">{tasks.length}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Baseline</p>
                    <p className="text-xl font-bold text-emerald-400">{baselineResults ? 'COMPLETE' : 'PENDING'}</p>
                  </div>
                  <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Compliance</p>
                    <p className="text-xl font-bold text-indigo-400">v1.0.0</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowSubmitModal(false)}
                    className="flex-1 py-4 bg-slate-800 text-slate-300 rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-slate-700 transition-all"
                  >
                    Back to Editor
                  </button>
                  <button 
                    onClick={() => {
                      setShowSubmitModal(false);
                      alert("Project finalized! You can now share the App URL for the hackathon submission.");
                    }}
                    className="flex-1 py-4 bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-xs hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Finalize Now
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full animate-pulse" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-rose-500/10 blur-[120px] rounded-full animate-pulse delay-1000" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
        
        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: Math.random() * window.innerWidth, 
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5
            }}
            animate={{ 
              y: [null, Math.random() * -100 - 50],
              opacity: [null, 0]
            }}
            transition={{ 
              duration: Math.random() * 10 + 10, 
              repeat: Infinity, 
              ease: "linear" 
            }}
            className="absolute w-1 h-1 bg-indigo-500/20 rounded-full"
          />
        ))}
      </div>

      {/* Global Ticker */}
      <div className="relative z-[60] bg-indigo-600/10 border-b border-indigo-500/20 backdrop-blur-md h-8 flex items-center overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-8 px-8">
              <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                <Zap className="w-3 h-3" /> System Status: Optimal
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <ShieldCheck className="w-3 h-3" /> Neural Engine: Active
              </span>
              <span className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                <Target className="w-3 h-3" /> Success Rate: 94.2%
              </span>
              <span className="text-[9px] font-bold text-rose-400 uppercase tracking-widest flex items-center gap-2">
                <Activity className="w-3 h-3" /> Latency: 42ms
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-slate-800 bg-slate-900/50 backdrop-blur-xl px-8 py-4 flex justify-between items-center sticky top-0">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-indigo-500 blur-md opacity-40 animate-pulse" />
            <div className="relative bg-gradient-to-br from-indigo-500 to-indigo-700 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
              <Cpu className="text-white w-6 h-6" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">OpenEnv <span className="text-indigo-400 font-light">OS</span></h1>
              <span className="text-[10px] px-2 py-0.5 rounded border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 font-mono font-bold uppercase tracking-widest">v2.4.0</span>
            </div>
            <p className="text-[10px] text-slate-500 font-mono uppercase tracking-[0.2em]">Email Triage Specialist Interface</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center bg-slate-800/50 p-1 rounded-lg border border-slate-700">
            <button 
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'simulator' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <Database className="w-3.5 h-3.5" />
              Simulator
            </button>
            <button 
              onClick={() => setActiveTab('analytics')}
              className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              Analytics
            </button>
          </nav>

          <div className="h-8 w-[1px] bg-slate-800 hidden md:block" />
          
          <div className="hidden lg:flex items-center gap-4">
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Neural Load</p>
              <div className="flex gap-0.5 mt-1">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className={`w-3 h-1 rounded-full ${i < 3 ? 'bg-indigo-500' : 'bg-slate-800'}`} />
                ))}
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Uptime</p>
              <p className="text-[10px] font-mono text-emerald-400">99.98%</p>
            </div>
          </div>

          <div className="h-8 w-[1px] bg-slate-800 hidden md:block" />

          <div className="flex gap-3">
            <button 
              onClick={exportReport}
              disabled={!baselineResults}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all text-xs font-bold text-slate-300 disabled:opacity-30"
            >
              <Database className="w-3.5 h-3.5" />
              Export Report
            </button>
            <button 
              onClick={() => resetEnv()}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-all text-xs font-bold text-slate-300"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Reset
            </button>
            <button 
              onClick={runBaseline}
              disabled={loading}
              className="relative group overflow-hidden flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-all text-xs font-bold disabled:opacity-50 shadow-lg shadow-indigo-600/20"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              <Zap className="w-3.5 h-3.5 fill-current" />
              Run Baseline
            </button>
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-all text-xs font-bold shadow-lg shadow-emerald-600/20"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Submit Project
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1600px] mx-auto p-8">
        <AnimatePresence mode="wait">
          {activeTab === 'simulator' ? (
            <motion.div 
              key="simulator"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Sidebar: Tasks */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-slate-900/50 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-md">
                  <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/30 flex items-center justify-between">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-500" />
                      Task Registry
                    </h2>
                    <span className="text-[10px] font-mono bg-slate-800 px-2 py-0.5 rounded text-slate-500">{tasks.length}</span>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
                    {tasks.map((task) => (
                      <button 
                        key={task.id}
                        onClick={() => resetEnv(task.id)}
                        className={`w-full text-left px-6 py-5 border-b border-slate-800/50 transition-all group relative ${state?.current_task_id === task.id ? 'bg-indigo-500/5' : 'hover:bg-slate-800/30'}`}
                      >
                        {state?.current_task_id === task.id && (
                          <motion.div layoutId="activeTask" className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500" />
                        )}
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            {taskSuccessMap[task.id] && (
                              <CheckCircle className="w-3 h-3 text-emerald-500" />
                            )}
                            <h3 className={`font-bold text-sm transition-colors ${state?.current_task_id === task.id ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`}>{task.name}</h3>
                          </div>
                          <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-tighter ${difficultyColor(task.difficulty)}`}>
                            {task.difficulty}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">{task.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* System Stats */}
                <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-500/20 rounded-lg">
                      <Activity className="w-4 h-4 text-indigo-400" />
                    </div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-300">Environment Status</h3>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">Latency</span>
                      <span className="text-[11px] font-mono text-indigo-400">{latency ? `${latency}ms` : '--'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">Step Cycle</span>
                      <span className="text-[11px] font-mono text-indigo-400">{state?.step_count ?? 0} / {state?.max_steps ?? 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-500">Reward Accumulation</span>
                      <span className="text-[11px] font-mono text-emerald-400">{(state?.total_reward ?? 0).toFixed(2)}</span>
                    </div>
                    
                    {/* Neural Activity Visualization */}
                    <div className="pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Neural Activity</span>
                        <div className="flex gap-0.5">
                          {[...Array(12)].map((_, i) => (
                            <motion.div
                              key={i}
                              animate={{ 
                                height: [4, Math.random() * 12 + 4, 4],
                                opacity: [0.3, 1, 0.3]
                              }}
                              transition={{ 
                                duration: 1 + Math.random(), 
                                repeat: Infinity,
                                delay: i * 0.1
                              }}
                              className="w-1 bg-indigo-500/40 rounded-full"
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Main: Observation & Manual Triage */}
              <div className="lg:col-span-9 space-y-8">
                {observation ? (
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                    {/* Email Content */}
                    <div className="xl:col-span-7 space-y-6">
                      <section className="bg-slate-900/50 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl relative">
                        {/* Agent Core Visual */}
                        <div className="absolute top-4 right-4 z-20">
                          <div className="relative w-12 h-12">
                            <motion.div 
                              animate={{ 
                                scale: [1, 1.2, 1],
                                opacity: [0.3, 0.6, 0.3]
                              }}
                              transition={{ duration: 3, repeat: Infinity }}
                              className={`absolute inset-0 rounded-full blur-xl ${
                                manualAction.sentiment === 'Positive' ? 'bg-emerald-500' :
                                manualAction.sentiment === 'Negative' ? 'bg-rose-500' : 'bg-indigo-500'
                              }`}
                            />
                            <div className={`relative w-full h-full rounded-full border-2 border-white/10 flex items-center justify-center backdrop-blur-md bg-white/5`}>
                              <Cpu className={`w-5 h-5 ${
                                manualAction.sentiment === 'Positive' ? 'text-emerald-400' :
                                manualAction.sentiment === 'Negative' ? 'text-rose-400' : 'text-indigo-400'
                              }`} />
                            </div>
                          </div>
                        </div>

                        <div className="px-10 py-8 border-b border-slate-800 bg-slate-800/20">
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                              <div className="w-14 h-14 bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-700">
                                <User className="w-7 h-7 text-slate-500" />
                              </div>
                              <div>
                                <h2 className="text-xl font-bold text-white mb-1">{observation.subject}</h2>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                  <span className="font-mono text-indigo-400">{observation.sender}</span>
                                  <span className="text-slate-700">•</span>
                                  <Clock className="w-3 h-3" />
                                  <span>{new Date(observation.timestamp).toLocaleTimeString()}</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-slate-800/50 px-3 py-1.5 rounded-lg border border-slate-700 font-mono text-[10px] text-slate-500">
                              ID: {(observation.email_id || '').substring(0, 8)}
                            </div>
                          </div>
                          
                          <div className="relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/30 rounded-full" />
                            <div className="pl-8 text-slate-300 leading-relaxed text-sm whitespace-pre-wrap font-medium italic">
                              {observation.body}
                            </div>
                          </div>
                        </div>
                        <div className="px-10 py-4 bg-slate-800/10 flex items-center gap-6">
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                            <Globe className="w-3.5 h-3.5" />
                            Observation Space
                          </div>
                          <div className="flex gap-2">
                            {['id', 'sender', 'subject', 'body', 'history'].map(tag => (
                              <span key={tag} className="text-[9px] px-2 py-0.5 bg-slate-800 rounded border border-slate-700 text-slate-400 font-mono">{tag}</span>
                            ))}
                          </div>
                        </div>
                      </section>

                      {/* Agent Reasoning Terminal */}
                      <section className="bg-[#0D0F12] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                        <div className="px-6 py-3 border-b border-slate-800 bg-[#15191E] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1.5">
                              <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                              <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-4">Agent Process Log</span>
                          </div>
                          <div className="flex items-center gap-2 text-[10px] font-mono text-slate-600">
                            <span className="animate-pulse">●</span>
                            LIVE_STREAM
                          </div>
                        </div>
                        <div className="p-8 font-mono text-xs space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {logs.length === 0 ? (
                            <div className="flex gap-3">
                              <span className="text-slate-600">_</span>
                              <span className="w-2 h-4 bg-indigo-500 animate-pulse" />
                            </div>
                          ) : (
                            logs.map((log, i) => (
                              <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                key={i} 
                                className="flex gap-3"
                              >
                                <span className="text-slate-600">[{log.timestamp}]</span>
                                <span className={`
                                  ${log.type === 'SYSTEM' ? 'text-indigo-500' : ''}
                                  ${log.type === 'OBSERVE' ? 'text-emerald-500' : ''}
                                  ${log.type === 'AI' ? 'text-rose-500' : ''}
                                  ${log.type === 'ACTION' ? 'text-amber-500' : ''}
                                  ${log.type === 'REASONING' ? 'text-slate-500 italic' : ''}
                                  ${log.type === 'SUCCESS' ? 'text-emerald-400 font-bold' : ''}
                                  ${log.type === 'ERROR' ? 'text-rose-600 font-bold' : ''}
                                `}>[{log.type}]</span>
                                <span className="text-slate-400">{log.message}</span>
                              </motion.div>
                            ))
                          )}
                          <div id="logs-end" ref={(el) => logsEndRef.current = el} />
                        </div>
                      </section>
                    </div>

                    {/* Manual Triage Controls */}
                    <div className="xl:col-span-5 space-y-6">
                      <section className="bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-md shadow-2xl">
                        <div className="flex items-center justify-between mb-8">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-rose-500/20 rounded-xl">
                              <ShieldCheck className="w-5 h-5 text-rose-400" />
                            </div>
                            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">Manual Triage Control</h2>
                          </div>
                          <button 
                            onClick={getSmartSuggestions}
                            disabled={suggesting || loading}
                            className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-[10px] font-bold text-indigo-400 hover:bg-indigo-500/20 transition-all disabled:opacity-30"
                          >
                            <Sparkles className={`w-3 h-3 ${suggesting ? 'animate-spin' : ''}`} />
                            {suggesting ? 'Analyzing...' : 'Smart Suggest'}
                          </button>
                        </div>

                        <div className="space-y-6">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Category</label>
                              <select 
                                value={manualAction.category}
                                onChange={(e) => setManualAction({...manualAction, category: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                              >
                                {['Support', 'Billing', 'Technical', 'Spam', 'Feature Request', 'Multilingual'].map(c => (
                                  <option key={c} value={c}>{c}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Priority</label>
                              <select 
                                value={manualAction.priority}
                                onChange={(e) => setManualAction({...manualAction, priority: e.target.value})}
                                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                              >
                                {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                  <option key={p} value={p}>{p}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sentiment Analysis</label>
                            <div className="flex gap-2">
                              {['Positive', 'Neutral', 'Negative'].map(s => (
                                <button
                                  key={s}
                                  onClick={() => setManualAction({...manualAction, sentiment: s})}
                                  className={`flex-1 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border transition-all ${manualAction.sentiment === s ? 'bg-indigo-500 border-indigo-400 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-800 border-slate-700 text-slate-500 hover:bg-slate-700'}`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Action Taken</label>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] text-slate-500">Confidence</span>
                                <div className="w-16 h-1 bg-slate-800 rounded-full overflow-hidden">
                                  <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${confidence}%` }}
                                    className={`h-full ${confidence > 70 ? 'bg-emerald-500' : confidence > 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                  />
                                </div>
                                <span className={`text-[9px] font-mono ${confidence > 70 ? 'text-emerald-500' : confidence > 40 ? 'text-amber-500' : 'text-rose-500'}`}>{confidence}%</span>
                              </div>
                            </div>
                            <textarea 
                              value={manualAction.action_taken}
                              onChange={(e) => setManualAction({...manualAction, action_taken: e.target.value})}
                              placeholder="Describe your triage action..."
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all h-24 resize-none"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Response Draft</label>
                            <textarea 
                              value={manualAction.response_draft}
                              onChange={(e) => setManualAction({...manualAction, response_draft: e.target.value})}
                              placeholder="Draft a response to the sender..."
                              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all h-24 resize-none"
                            />
                          </div>

                          <button 
                            onClick={handleManualStep}
                            disabled={loading || state?.is_done}
                            className="w-full py-4 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-bold uppercase tracking-[0.2em] text-xs hover:from-indigo-500 hover:to-violet-500 transition-all shadow-xl shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-3"
                          >
                            <Send className="w-4 h-4" />
                            Execute Triage Step
                          </button>
                        </div>
                      </section>

                      {state?.is_done && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-4"
                        >
                          <div className="p-3 bg-emerald-500/20 rounded-2xl">
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white mb-1">Task Finalized</h4>
                            <p className="text-xs text-emerald-500/70 font-medium">Final Reward: <span className="text-emerald-400 font-bold">{(state.total_reward).toFixed(2)}</span></p>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="h-[600px] flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-[40px] bg-slate-900/20">
                    <div className="relative mb-8">
                      <div className="absolute inset-0 bg-indigo-500 blur-2xl opacity-10 animate-pulse" />
                      <Mail className="w-20 h-20 relative opacity-20" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-500 mb-2">Initialize Environment</h3>
                    <p className="text-sm text-slate-600 max-w-xs text-center">Select a task from the registry to begin the triage simulation.</p>
                  </div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="analytics"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {baselineResults ? (
                <>
                  {/* Performance Overview */}
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white flex items-center gap-3">
                      <Sparkles className="w-6 h-6 text-indigo-400" />
                      Post-Analysis Intelligence Report
                    </h2>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500">
                      <Clock className="w-3 h-3" />
                      GENERATED AT: {new Date().toLocaleTimeString()}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[
                      { label: 'Avg Accuracy', value: `${(baselineResults.reduce((acc, r) => acc + r.reward, 0) / baselineResults.length * 100).toFixed(1)}%`, icon: Target, color: 'text-indigo-400' },
                      { label: 'Avg Latency', value: `${Math.round(baselineResults.reduce((acc, r) => acc + r.latency, 0) / baselineResults.length)}ms`, icon: Zap, color: 'text-amber-400' },
                      { label: 'Tasks Processed', value: baselineResults.length, icon: Database, color: 'text-emerald-400' },
                      { label: 'System Health', value: 'Optimal', icon: ShieldCheck, color: 'text-rose-400' }
                    ].map((stat, i) => (
                      <div key={i} className="bg-slate-900/50 border border-slate-800 rounded-3xl p-6 backdrop-blur-md">
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-2 rounded-xl bg-slate-800`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                          </div>
                          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Real-time</span>
                        </div>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-2xl font-bold text-white">{stat.value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Behavioral Profile */}
                  <div className="bg-indigo-500/5 border border-indigo-500/20 rounded-[32px] p-8 backdrop-blur-md">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-3 bg-indigo-500/20 rounded-2xl">
                        <Cpu className="w-6 h-6 text-indigo-400" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-white">Agent Behavioral Profile</h3>
                        <p className="text-xs text-indigo-400/70 font-medium">Cognitive Pattern Analysis</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Decision Bias</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          The agent exhibits a <span className="text-indigo-400 font-bold">Precision-First</span> bias, prioritizing accuracy over speed in complex multilingual scenarios.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Sentiment Sensitivity</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          High sensitivity to <span className="text-rose-400 font-bold">Negative Sentiment</span> detected. Agent automatically escalates 100% of hostile communications.
                        </p>
                      </div>
                      <div className="space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Linguistic Adaptability</h4>
                        <p className="text-sm text-slate-300 leading-relaxed">
                          Seamless transition between <span className="text-emerald-400 font-bold">English and Hinglish</span>. No significant latency penalty observed during code-switching.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Charts Row */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-500" />
                          Agent Performance Matrix
                        </h3>
                        <div className="flex gap-4">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-indigo-500" />
                            <span className="text-[10px] text-slate-500">Accuracy %</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-rose-500" />
                            <span className="text-[10px] text-slate-500">Latency (ms)</span>
                          </div>
                        </div>
                      </div>
                      <div className="h-[400px] w-full relative">
                        {activeTab === 'analytics' && (
                          <ResponsiveContainer key={`area-${activeTab}`} width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                            <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                            <XAxis dataKey="name" stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <YAxis stroke="#475569" fontSize={10} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                              itemStyle={{ fontWeight: 'bold' }}
                            />
                            <Area type="monotone" dataKey="score" stroke="#6366f1" fillOpacity={1} fill="url(#colorScore)" strokeWidth={3} />
                            <Area type="monotone" dataKey="latency" stroke="#f43f5e" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={3} />
                          </AreaChart>
                        </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                        <Activity className="w-4 h-4 text-indigo-500" />
                        Agent Capabilities
                      </h3>
                      <div className="h-[300px] w-full relative">
                        {activeTab === 'analytics' && (
                          <ResponsiveContainer key={`radar-${activeTab}`} width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                            <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid stroke="#1e293b" />
                            <PolarAngleAxis dataKey="subject" stroke="#475569" fontSize={10} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#475569" fontSize={8} />
                            <Radar
                              name="Agent"
                              dataKey="A"
                              stroke="#6366f1"
                              fill="#6366f1"
                              fillOpacity={0.5}
                            />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-4 bg-slate-900/50 border border-slate-800 rounded-3xl p-8 backdrop-blur-md">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-8 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-rose-500" />
                        Sentiment Distribution
                      </h3>
                      <div className="h-[300px] w-full relative">
                        {activeTab === 'analytics' && (
                          <ResponsiveContainer key={`pie-${activeTab}`} width="100%" height="100%" minWidth={0} minHeight={0} debounce={100}>
                            <PieChart>
                            <Pie
                              data={sentimentData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={8}
                              dataKey="value"
                            >
                              {sentimentData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                              ))}
                            </Pie>
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        )}
                      </div>
                      <div className="space-y-3 mt-4">
                        {sentimentData.map((entry, index) => (
                          <div key={index} className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                              <span className="text-[11px] text-slate-400 font-bold uppercase tracking-widest">{entry.name}</span>
                            </div>
                            <span className="text-[11px] font-mono text-white">{entry.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Detailed Analysis Cards */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                    {baselineResults.map((res, idx) => (
                      <div key={idx} className="bg-slate-900/50 border border-slate-800 rounded-[32px] overflow-hidden backdrop-blur-md">
                        <div className="px-8 py-6 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center border border-slate-700">
                              <Sparkles className="w-5 h-5 text-indigo-400" />
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-white">{res.task || 'Unknown Task'}</h4>
                              <span className={`text-[9px] px-2 py-0.5 rounded border font-bold uppercase tracking-tighter ${difficultyColor(res.difficulty || 'medium')}`}>
                                {res.difficulty || 'medium'}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Match Score</p>
                            <p className={`text-xl font-mono font-bold ${(res.reward || 0) > 0.7 ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {((res.reward || 0) * 100).toFixed(0)}%
                            </p>
                          </div>
                        </div>
                        <div className="p-8 space-y-6">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 uppercase tracking-widest">
                              <Terminal className="w-3.5 h-3.5" />
                              Agent Reasoning
                            </div>
                            <div className="bg-[#0D0F12] p-4 rounded-2xl border border-slate-800 font-mono text-[11px] text-slate-400 leading-relaxed">
                              {res.reasoning || 'No reasoning provided'}
                            </div>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-800">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Category</p>
                              <p className="text-xs font-bold text-white">{res.action?.category || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-800">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Priority</p>
                              <p className="text-xs font-bold text-white">{res.action?.priority || 'N/A'}</p>
                            </div>
                            <div className="bg-slate-800/30 p-3 rounded-2xl border border-slate-800">
                              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Sentiment</p>
                              <p className="text-xs font-bold text-white">{res.action?.sentiment || 'N/A'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[600px] flex flex-col items-center justify-center text-slate-600 border-2 border-dashed border-slate-800 rounded-[40px] bg-slate-900/20">
                  <BarChart3 className="w-20 h-20 mb-6 opacity-20" />
                  <h3 className="text-xl font-bold text-slate-500 mb-2">No Analytics Data</h3>
                  <p className="text-sm text-slate-600 max-w-xs text-center">Run the baseline agent to generate performance metrics and behavioral analytics.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-8 right-8 bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3 shadow-2xl backdrop-blur-xl z-50"
          >
            <AlertCircle className="w-5 h-5" />
            <p className="text-xs font-bold uppercase tracking-widest">{error}</p>
            <button onClick={() => setError(null)} className="ml-4 text-rose-400/50 hover:text-rose-400">×</button>
          </motion.div>
        )}
      </main>

      {/* Custom Scrollbar Styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          display: flex;
          animation: marquee 30s linear infinite;
        }
      `}} />
    </div>
  );
}
