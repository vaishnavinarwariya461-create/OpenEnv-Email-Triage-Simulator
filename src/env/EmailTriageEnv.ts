import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

// OpenEnv Specification Models (using Zod for validation)
export const ActionSchema = z.object({
  category: z.enum(['Support', 'Billing', 'Technical', 'Spam', 'Feature Request', 'Multilingual']),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  sentiment: z.enum(['Positive', 'Neutral', 'Negative']).optional(),
  action_taken: z.string().optional(),
  response_draft: z.string().optional(),
});

export type Action = z.infer<typeof ActionSchema>;

export interface Observation {
  email_id: string;
  sender: string;
  subject: string;
  body: string;
  timestamp: string;
  history: string[];
}

export interface Reward {
  value: number;
  reason: string;
}

export interface State {
  current_task_id: string;
  step_count: number;
  max_steps: number;
  is_done: boolean;
  history: Action[];
  total_reward: number;
}

export interface Task {
  id: string;
  name: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  email: {
    sender: string;
    subject: string;
    body: string;
  };
  grader: (action: Action) => number;
}

export class EmailTriageEnv {
  private state: State;
  private tasks: Task[];
  private currentTask: Task;

  constructor() {
    this.tasks = [
      {
        id: 'task_1',
        name: 'Simple Support Request',
        difficulty: 'easy',
        description: 'Categorize and prioritize a basic password reset request.',
        email: {
          sender: 'user123@example.com',
          subject: 'Help with login',
          body: 'Hi, I forgot my password and cannot log in to my account. Can you help?',
        },
        grader: (action) => {
          let score = 0;
          if (action.category === 'Support') score += 0.5;
          if (action.priority === 'Medium') score += 0.5;
          return score;
        },
      },
      {
        id: 'task_2',
        name: 'Billing Dispute',
        difficulty: 'medium',
        description: 'Handle a double-charge billing issue.',
        email: {
          sender: 'customer_a@gmail.com',
          subject: 'Double charge on my statement',
          body: 'I noticed two charges for the same subscription on my credit card statement this month. Please refund one of them immediately.',
        },
        grader: (action) => {
          let score = 0;
          if (action.category === 'Billing') score += 0.4;
          if (action.priority === 'High' || action.priority === 'Urgent') score += 0.4;
          if (action.action_taken?.toLowerCase().includes('refund')) score += 0.2;
          return score;
        },
      },
      {
        id: 'task_4',
        name: 'Hinglish Support Query',
        difficulty: 'medium',
        description: 'Handle a support request written in Hinglish (Hindi + English).',
        email: {
          sender: 'rahul_kumar@outlook.in',
          subject: 'Mera account login nahi ho raha',
          body: 'Hi team, mera account login nahi ho raha hai. Password reset link bhi nahi aaya abhi tak. Please jaldi help karo, urgent hai.',
        },
        grader: (action) => {
          let score = 0;
          if (action.category === 'Support' || action.category === 'Multilingual') score += 0.4;
          if (action.priority === 'High' || action.priority === 'Urgent') score += 0.4;
          // Check if agent understood the "urgent" part in Hinglish
          if (action.response_draft?.toLowerCase().includes('jaldi') || action.response_draft?.toLowerCase().includes('soon')) score += 0.2;
          return score;
        },
      },
      {
        id: 'task_5',
        name: 'Angry Billing Complaint (Hinglish)',
        difficulty: 'hard',
        description: 'A frustrated customer complaining about extra charges in Hinglish.',
        email: {
          sender: 'priya_s@yahoo.com',
          subject: 'Faltu ke charges kyun lagaye?',
          body: 'Listen, mere bill mein extra 500 rupees kyun dikha raha hai? Maine koi extra service nahi li. Yeh bilkul galat hai. Refund chahiye mujhe abhi ke abhi. Don\'t test my patience.',
        },
        grader: (action) => {
          let score = 0;
          if (action.category === 'Billing') score += 0.3;
          if (action.priority === 'Urgent') score += 0.3;
          if (action.sentiment === 'Negative') score += 0.2;
          if (action.response_draft?.toLowerCase().includes('sorry') || action.response_draft?.toLowerCase().includes('maafi')) score += 0.2;
          return score;
        },
      },
      {
        id: 'task_6',
        name: 'Technical Glitch (Hinglish)',
        difficulty: 'hard',
        description: 'A complex technical issue reported in mixed Hinglish.',
        email: {
          sender: 'amit_v@techcorp.com',
          subject: 'Dashboard load nahi ho raha, blank screen aa rahi hai',
          body: 'Bhai, subah se dashboard load karne ki koshish kar raha hoon par sirf blank screen dikh rahi hai. Console mein "404 Not Found" errors aa rahe hain. Production environment mein yeh issue bohot critical hai. Please check karke escalate karo ASAP.',
        },
        grader: (action) => {
          let score = 0;
          if (action.category === 'Technical') score += 0.3;
          if (action.priority === 'Urgent') score += 0.3;
          if (action.action_taken?.toLowerCase().includes('escalate')) score += 0.2;
          if (action.response_draft?.toLowerCase().includes('asap') || action.response_draft?.toLowerCase().includes('turant')) score += 0.2;
          return score;
        },
      },
      {
        id: 'task_7',
        name: 'Urgent Security Alert (Phishing?)',
        difficulty: 'hard',
        description: 'Analyze a suspicious security alert that might be a phishing attempt.',
        email: {
          sender: 'security-noreply@amaz0n-verify.com',
          subject: 'Urgent: Your account has been locked',
          body: 'Dear Customer, We detected unusual activity on your account. To prevent unauthorized access, we have temporarily locked it. Please click the link below to verify your identity and restore access: http://amaz0n-verify.com/login?ref=security_alert. Failure to do so within 24 hours will result in permanent suspension.',
        },
        grader: (action) => {
          let score = 0;
          if (action.category === 'Spam') score += 0.5;
          if (action.priority === 'Urgent') score += 0.3;
          if (action.action_taken?.toLowerCase().includes('phishing') || action.action_taken?.toLowerCase().includes('block')) score += 0.2;
          return score;
        },
      },
      {
        id: 'task_8',
        name: 'Complex Feature Request',
        difficulty: 'medium',
        description: 'A detailed request for a new integration feature.',
        email: {
          sender: 'product_lead@partner.co',
          subject: 'Integration Request: Slack + Salesforce',
          body: 'We are looking to streamline our workflow by integrating our Slack notifications directly with Salesforce lead updates. Is this something your platform currently supports or has on the roadmap? We have about 500 users who would benefit from this.',
        },
        grader: (action) => {
          let score = 0;
          if (action.category === 'Feature Request') score += 0.5;
          if (action.priority === 'Medium') score += 0.3;
          if (action.action_taken?.toLowerCase().includes('roadmap') || action.action_taken?.toLowerCase().includes('product')) score += 0.2;
          return score;
        },
      },
    ];

    this.currentTask = this.tasks[0];
    this.state = this.getInitialState();
  }

  private getInitialState(): State {
    return {
      current_task_id: this.currentTask.id,
      step_count: 0,
      max_steps: 5,
      is_done: false,
      history: [],
      total_reward: 0,
    };
  }

  public reset(taskId?: string): Observation {
    if (taskId) {
      const task = this.tasks.find((t) => t.id === taskId);
      if (task) this.currentTask = task;
    } else {
      // Default to first task or random
      this.currentTask = this.tasks[0];
    }

    this.state = this.getInitialState();
    return this.getObservation();
  }

  public step(action: Action): { observation: Observation; reward: Reward; done: boolean; info: any } {
    if (this.state.is_done) {
      throw new Error('Environment is already done. Call reset().');
    }

    this.state.step_count++;
    this.state.history.push(action);

    const stepReward = this.currentTask.grader(action);
    this.state.total_reward += stepReward;

    // In this simple triage env, one step usually finishes the task
    this.state.is_done = true;

    return {
      observation: this.getObservation(),
      reward: {
        value: stepReward,
        reason: stepReward > 0.8 ? 'Perfect triage' : stepReward > 0.4 ? 'Partial success' : 'Incorrect triage',
      },
      done: this.state.is_done,
      info: {
        task_name: this.currentTask.name,
        difficulty: this.currentTask.difficulty,
      },
    };
  }

  public getObservation(): Observation {
    return {
      email_id: uuidv4(),
      sender: this.currentTask.email.sender,
      subject: this.currentTask.email.subject,
      body: this.currentTask.email.body,
      timestamp: new Date().toISOString(),
      history: this.state.history.map(h => JSON.stringify(h)),
    };
  }

  public getState(): State {
    return { ...this.state };
  }

  public getTasks(): Task[] {
    return this.tasks;
  }
}
