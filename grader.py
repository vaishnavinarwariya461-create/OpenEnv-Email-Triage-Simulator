from models import Action, Category, Priority, Reward, EmailData

def grade_action(action: Action, ground_truth: EmailData) -> Reward:
    score = 0.0
    feedback_parts = []

    # Category check (0.5 points)
    if action.category == ground_truth.ground_truth_category:
        score += 0.5
        feedback_parts.append(f"Correct category: {action.category}.")
    else:
        feedback_parts.append(f"Incorrect category. Expected {ground_truth.ground_truth_category}, got {action.category}.")

    # Priority check (0.5 points)
    if action.priority == ground_truth.ground_truth_priority:
        score += 0.5
        feedback_parts.append(f"Correct priority: {action.priority}.")
    else:
        feedback_parts.append(f"Incorrect priority. Expected {ground_truth.ground_truth_priority}, got {action.priority}.")

    return Reward(score=score, feedback=" ".join(feedback_parts))
