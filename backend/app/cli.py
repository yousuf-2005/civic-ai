import argparse
import sys
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from app.core.database import SessionLocal, Base, engine
from app.core.security import get_password_hash
from app.models.user import User
from app.models.complaint import Complaint
from app.models.status_history import StatusHistory


def init_db():
    """Ensure database tables exist."""
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")


def create_admin(email: str, password: str, name: str):
    """Creates a new administrative user."""
    init_db()
    db: Session = SessionLocal()
    try:
        existing = db.query(User).filter(User.email == email.lower().strip()).first()
        if existing:
            print(f"Error: User with email '{email}' already exists.")
            sys.exit(1)

        admin = User(
            email=email.lower().strip(),
            hashed_password=get_password_hash(password),
            full_name=name.strip(),
            role="admin",
            is_active=True,
        )
        db.add(admin)
        db.commit()
        print(f"Administrator account '{email}' created successfully.")
    finally:
        db.close()


def seed_demo_data():
    """Seeds the database with representative demo complaints and a demo admin."""
    init_db()
    db: Session = SessionLocal()
    try:
        # Check if already seeded
        if db.query(Complaint).count() > 0:
            print("Database already contains complaint records. Skipping demo seed.")
            return

        # 1. Create Demo Admin if not exists
        admin = db.query(User).filter(User.email == "admin@civicai.local").first()
        if not admin:
            admin = User(
                email="admin@civicai.local",
                hashed_password=get_password_hash("AdminPass2026!"),
                full_name="Municipal Administrator (Demo)",
                role="admin",
                is_active=True,
            )
            db.add(admin)
            db.flush()
            print("Demo admin created: admin@civicai.local / AdminPass2026!")

        # 2. Seed realistic demo complaints
        now = datetime.now(timezone.utc)
        demo_items = [
            {
                "ref": "CIV-20261025-A101",
                "title": "[DEMO DATA] Hazardous crater pothole on 4th Main Road",
                "category": "Potholes and Damaged Roads",
                "desc": "A severe 2-foot wide pothole in the left carriage lane causing recurring vehicle suspension damage and two-wheeler skidding risk.",
                "status": "In Progress",
                "lat": 12.9716,
                "lng": 77.5946,
                "addr": "4th Main Road, Indiranagar, Ward 112",
                "created_offset": 3,
                "ai_desc": "[DEMO DATA] Large asphalt cavity with loose aggregate near road curb.",
            },
            {
                "ref": "CIV-20261025-B202",
                "title": "[DEMO DATA] Overflowing communal trash bins at vegetable market",
                "category": "Overflowing Garbage and Illegal Dumping",
                "desc": "Garbage has not been collected for over four days. Organic waste is spilling onto the pedestrian footpath creating foul odor and health hazard.",
                "status": "Under Review",
                "lat": 12.9352,
                "lng": 77.6245,
                "addr": "Near Weekly Market Gate, Koramangala 5th Block",
                "created_offset": 2,
                "ai_desc": "[DEMO DATA] Uncontained municipal solid waste accumulating around dual metal dumpsters.",
            },
            {
                "ref": "CIV-20261025-C303",
                "title": "[DEMO DATA] Non-operational streetlights along school corridor",
                "category": "Broken Streetlights",
                "desc": "Four consecutive streetlight poles have been dark for two weeks. Creates significant safety concerns for evening commuters and students.",
                "status": "Resolved",
                "lat": 12.9915,
                "lng": 77.5712,
                "addr": "Government High School Lane, Malleshwaram 15th Cross",
                "created_offset": 7,
                "ai_desc": "[DEMO DATA] Public utility pole with fractured luminaire housing.",
            },
            {
                "ref": "CIV-20261025-D404",
                "title": "[DEMO DATA] Burst municipal potable water supply pipe",
                "category": "Water Leakage and Drainage",
                "desc": "Underground main water line leakage resulting in gallons of treated water flowing onto the street and flooding neighboring basements.",
                "status": "Submitted",
                "lat": 12.9141,
                "lng": 77.6322,
                "addr": "27th Main, Sector 1, HSR Layout",
                "created_offset": 1,
                "ai_desc": "[DEMO DATA] Continuous water eruption through pavement joint forming stagnant pool.",
            },
            {
                "ref": "CIV-20261025-E505",
                "title": "[DEMO DATA] Collapsed safety railing on pedestrian footbridge",
                "category": "Damaged Public Infrastructure",
                "desc": "Rust and impact have detached a 10-foot section of safety railing over the stormwater canal, posing acute falling danger.",
                "status": "In Progress",
                "lat": 12.9856,
                "lng": 77.6057,
                "addr": "Canal Footbridge, Ulsoor Lake Perimeter",
                "created_offset": 5,
                "ai_desc": "[DEMO DATA] Severed structural metal railing overlooking 12-foot concrete drop.",
            },
        ]

        for item in demo_items:
            created_at = now - timedelta(days=item["created_offset"])
            complaint = Complaint(
                reference_number=item["ref"],
                title=item["title"],
                description=item["desc"],
                category=item["category"],
                latitude=item["lat"],
                longitude=item["lng"],
                location_address=item["addr"],
                status=item["status"],
                citizen_name="Demo Citizen",
                citizen_contact="citizen.demo@civicai.local",
                ai_valid_image=True,
                ai_relevance="relevant",
                ai_confidence=0.95,
                ai_detected_category=item["category"],
                ai_description=item["ai_desc"],
                is_mock_ai=True,
                complaint_letter=(
                    f"Date: {created_at.strftime('%B %d, %Y')}\n\n"
                    f"To,\nThe Municipal Commissioner,\nCivic Authority\n\n"
                    f"Subject: Formal Grievance: {item['title']}\n\n"
                    f"Respected Authority,\n\n"
                    f"{item['desc']}\n\n"
                    f"Location: {item['addr']}\n\n"
                    f"Kindly expedite inspection and repair.\n\n"
                    f"Sincerely,\nDemo Citizen"
                ),
                created_at=created_at,
                updated_at=created_at,
            )
            db.add(complaint)
            db.flush()

            # Add timeline
            h1 = StatusHistory(
                complaint_id=complaint.id,
                old_status=None,
                new_status="Submitted",
                remarks="[DEMO DATA] Initial grievance recorded.",
                created_at=created_at,
            )
            db.add(h1)

            if item["status"] in ["Under Review", "In Progress", "Resolved"]:
                h2 = StatusHistory(
                    complaint_id=complaint.id,
                    old_status="Submitted",
                    new_status="Under Review",
                    changed_by_user_id=admin.id,
                    remarks="[DEMO DATA] Assigned to Ward Field Engineer.",
                    created_at=created_at + timedelta(hours=12),
                )
                db.add(h2)

            if item["status"] in ["In Progress", "Resolved"]:
                h3 = StatusHistory(
                    complaint_id=complaint.id,
                    old_status="Under Review",
                    new_status="In Progress",
                    changed_by_user_id=admin.id,
                    remarks="[DEMO DATA] Repair crew dispatched on-site.",
                    created_at=created_at + timedelta(days=1),
                )
                db.add(h3)

            if item["status"] == "Resolved":
                h4 = StatusHistory(
                    complaint_id=complaint.id,
                    old_status="In Progress",
                    new_status="Resolved",
                    changed_by_user_id=admin.id,
                    remarks="[DEMO DATA] Corrective maintenance completed and verified by civic inspector.",
                    created_at=created_at + timedelta(days=2),
                )
                db.add(h4)

        db.commit()
        print("Demo complaints seeded successfully (5 realistic records added).")
    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Civic AI Administrative CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # init-db
    subparsers.add_parser("init-db", help="Initialize database tables")

    # seed-demo
    subparsers.add_parser("seed-demo", help="Seed database with sample demo complaints and demo admin")

    # create-admin
    admin_parser = subparsers.add_parser("create-admin", help="Create an administrator account")
    admin_parser.add_argument("--email", required=True, help="Admin email address")
    admin_parser.add_argument("--password", required=True, help="Admin password")
    admin_parser.add_argument("--name", default="Administrator", help="Admin full name")

    args = parser.parse_args()

    if args.command == "init-db":
        init_db()
    elif args.command == "seed-demo":
        seed_demo_data()
    elif args.command == "create-admin":
        create_admin(args.email, args.password, args.name)


if __name__ == "__main__":
    main()
