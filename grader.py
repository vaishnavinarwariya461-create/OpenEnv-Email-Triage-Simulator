from models import Action, Category, Priority, Reward, EmailData

def grade_action(action: Action, ground_truth: EmailData) -> Reward:
    score = 0.0
    feedback_parts = []

    epsilon = 1e-6  # ensures score never hits 0 or 1

    # -------------------------------
    # Category check
    # -------------------------------
    if action.category == ground_truth.ground_truth_category:
        score += 0.499
        feedback_parts.append(f"Correct category: {action.category}.")
    else:
        score += 0.001
        feedback_parts.append(
            f"Incorrect category. Expected {ground_truth.ground_truth_category}, got {action.category}."
        )

    # -------------------------------
    # Priority check
    # -------------------------------
    if action.priority == ground_truth.ground_truth_priority:
        score += 0.499
        feedback_parts.append(f"Correct priority: {action.priority}.")
    else:
        score += 0.001
        feedback_parts.append(
            f"Incorrect priority. Expected {ground_truth.ground_truth_priority}, got {action.priority}."
        )

    score = max(epsilon, min(1 - epsilon, score))

    return Reward(score=score, feedback=" ".join(feedback_parts))
