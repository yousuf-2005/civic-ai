import os
import shutil
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings
from app.core.database import Base
from app.api.deps import get_db
from app.main import app
from app.models.user import User
from app.core.security import get_password_hash, create_access_token

# In-memory SQLite database for test isolation
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="session", autouse=True)
def setup_test_environment():
    """Create isolated temp directory for test uploads."""
    temp_dir = tempfile.mkdtemp(prefix="civic_test_uploads_")
    original_upload_dir = settings.UPLOAD_DIR
    
    # Patch upload dir
    settings.UPLOAD_DIR = temp_dir
    settings.AI_MOCK_MODE = True
    
    yield
    
    # Teardown
    settings.UPLOAD_DIR = original_upload_dir
    shutil.rmtree(temp_dir, ignore_errors=True)


@pytest.fixture(scope="function")
def db_session():
    """Create fresh database tables for every test."""
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """FastAPI TestClient with overridden get_db dependency."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db_session) -> User:
    user = User(
        email="citizen@test.com",
        hashed_password=get_password_hash("TestPassword123!"),
        full_name="John Citizen",
        role="citizen",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def test_admin(db_session) -> User:
    admin = User(
        email="admin@test.com",
        hashed_password=get_password_hash("AdminPassword123!"),
        full_name="Officer Admin",
        role="admin",
        is_active=True,
    )
    db_session.add(admin)
    db_session.commit()
    db_session.refresh(admin)
    return admin


@pytest.fixture(scope="function")
def user_auth_headers(test_user) -> dict:
    token = create_access_token({"sub": test_user.id, "email": test_user.email, "role": test_user.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def admin_auth_headers(test_admin) -> dict:
    token = create_access_token({"sub": test_admin.id, "email": test_admin.email, "role": test_admin.role})
    return {"Authorization": f"Bearer {token}"}


@pytest.fixture(scope="function")
def test_user_b(db_session) -> User:
    user = User(
        email="citizen_b@test.com",
        hashed_password=get_password_hash("TestPassword456!"),
        full_name="Sarah Citizen",
        role="citizen",
        is_active=True,
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def user_b_auth_headers(test_user_b) -> dict:
    token = create_access_token({"sub": test_user_b.id, "email": test_user_b.email, "role": test_user_b.role})
    return {"Authorization": f"Bearer {token}"}

