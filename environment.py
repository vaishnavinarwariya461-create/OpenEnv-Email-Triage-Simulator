import random
from typing import Tuple, Dict, Any, List
from models import Observation, Action, Reward, EmailData, Category, Priority
from tasks import TASKS
from grader import grade_action

class EmailTriageEnv:
    def __init__(self, task_name: str = "EASY"):
        self.task_name = task_name
        self.dataset = TASKS.get(task_name, TASKS["EASY"])
        self.current_index = 0
        self.step_count = 0
        self.done = False
        self.current_email: EmailData = None

    def reset(self, seed: int = None, index: int = None) -> Observation:
        """Initializes a new episode."""
        if seed is not None:
            random.seed(seed)
        
        if index is not None and 0 <= index < len(self.dataset):
            self.current_index = index
        else:
            self.current_index = random.randint(0, len(self.dataset) - 1)
            
        self.current_email = self.dataset[self.current_index]
        self.step_count = 0
        self.done = False
        
        return Observation(
            email_id=self.current_email.email_id,
            sender=self.current_email.sender,
            subject=self.current_email.subject,
            body=self.current_email.body,
            step_count=self.step_count
        )

    def step(self, action: Action) -> Tuple[Observation, Reward, bool, Dict[str, Any]]:
        """Validates action, compares with ground truth, computes reward."""
        if self.done:
            raise Exception("Episode already finished. Call reset() to start a new one.")

        # Compute reward using deterministic grader
        reward = grade_action(action, self.current_email)
        
        self.step_count += 1
        self.done = True # Each email is a single-step triage task for this environment

        # In this simple env, observation doesn't change after step, but we return it as per spec
        obs = Observation(
            email_id=self.current_email.email_id,
            sender=self.current_email.sender,
            subject=self.current_email.subject,
            body=self.current_email.body,
            step_count=self.step_count
        )
        
        info = {
            "ground_truth_category": self.current_email.ground_truth_category,
            "ground_truth_priority": self.current_email.ground_truth_priority,
            "task": self.task_name
        }

        return obs, reward, self.done, info

    def state(self) -> Dict[str, Any]:
        """Returns internal state."""
        return {
            "task_name": self.task_name,
            "current_index": self.current_index,
            "step_count": self.step_count,
            "done": self.done,
            "current_email_id": self.current_email.email_id if self.current_email else None
        }

# Factory function for OpenEnv
def make(task_name: str = "EASY") -> EmailTriageEnv:
    return EmailTriageEnv(task_name=task_name)
