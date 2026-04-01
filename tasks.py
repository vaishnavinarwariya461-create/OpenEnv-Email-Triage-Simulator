from models import EmailData, Category, Priority
from typing import List, Dict

TASKS: Dict[str, List[EmailData]] = {
    "EASY": [
        EmailData(
            email_id="EASY_001",
            sender="user1@example.com",
            subject="Forgot my password",
            body="I am unable to log in because I forgot my password. Please help me reset it.",
            ground_truth_category=Category.SUPPORT,
            ground_truth_priority=Priority.MEDIUM
        ),
        EmailData(
            email_id="EASY_002",
            sender="user2@example.com",
            subject="Question about features",
            body="Can you tell me if your product supports dark mode?",
            ground_truth_category=Category.SUPPORT,
            ground_truth_priority=Priority.LOW
        ),
        EmailData(
            email_id="EASY_003",
            sender="user3@example.com",
            subject="Billing issue",
            body="I was charged twice for my subscription this month.",
            ground_truth_category=Category.BILLING,
            ground_truth_priority=Priority.HIGH
        )
    ],
    "MEDIUM": [
        EmailData(
            email_id="MEDIUM_001",
            sender="user4@example.com",
            subject="Double charge and login failure",
            body="I noticed a double charge on my credit card statement today. Also, I can't seem to log in to my account to check my billing history. This is very frustrating.",
            ground_truth_category=Category.BILLING,
            ground_truth_priority=Priority.HIGH
        ),
        EmailData(
            email_id="MEDIUM_002",
            sender="user5@example.com",
            subject="Feature request and bug report",
            body="I love the new update, but I found a bug in the dashboard. Also, it would be great if we could export reports to PDF.",
            ground_truth_category=Category.TECHNICAL,
            ground_truth_priority=Priority.MEDIUM
        ),
        EmailData(
            email_id="MEDIUM_003",
            sender="user6@example.com",
            subject="Cancellation request",
            body="I want to cancel my subscription because the service is too expensive and I don't use it much.",
            ground_truth_category=Category.BILLING,
            ground_truth_priority=Priority.MEDIUM
        )
    ],
    "HARD": [
        EmailData(
            email_id="HARD_001",
            sender="user7@example.com",
            subject="Bhai paise kat gaye",
            body="Bhai mere account se paise kat gaye par login hi nahi ho raha. Jaldi check karo kya scene hai, bahut emergency hai.",
            ground_truth_category=Category.BILLING,
            ground_truth_priority=Priority.URGENT
        ),
        EmailData(
            email_id="HARD_002",
            sender="user8@example.com",
            subject="App not working properly",
            body="The app is acting weird. Sometimes it works, sometimes it doesn't. I'm losing customers because of this. Fix this immediately or I'm switching to a competitor.",
            ground_truth_category=Category.TECHNICAL,
            ground_truth_priority=Priority.URGENT
        ),
        EmailData(
            email_id="HARD_003",
            sender="user9@example.com",
            subject="Just checking in",
            body="I sent an email three days ago and haven't heard back. Is anyone even working there? My issue is still unresolved.",
            ground_truth_category=Category.SUPPORT,
            ground_truth_priority=Priority.HIGH
        )
    ]
}
