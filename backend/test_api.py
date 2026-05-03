"""
Quick test script to verify authentication and training session endpoints.

Tests:
    1. Register a new user
    2. Login and get JWT token
    3. Create a training session with token
    4. List training sessions
    5. Get specific session
"""

import requests
import json
from typing import Optional

BASE_URL = "http://localhost:8000"

# Test data
TEST_USER = {
    "email": "test@example.com",
    "username": "testuser",
    "password": "TestPassword123!"
}

TEST_DATASET = [
    {"x": 1.0, "y": 2.5},
    {"x": 2.0, "y": 4.8},
    {"x": 3.0, "y": 6.9}
]

TEST_HYPERPARAMETERS = {
    "learning_rate": 0.01,
    "epochs": 50
}


def print_response(response: requests.Response, title: str) -> None:
    """Print formatted response."""
    print(f"\n{'='*60}")
    print(f"✓ {title}")
    print(f"{'='*60}")
    print(f"Status: {response.status_code}")
    try:
        print(json.dumps(response.json(), indent=2))
    except:
        print(response.text)


def test_authentication() -> Optional[str]:
    """Test user registration and login."""
    print("\n" + "="*60)
    print("TESTING AUTHENTICATION")
    print("="*60)

    # 1. Register
    response = requests.post(
        f"{BASE_URL}/register",
        json=TEST_USER
    )
    print_response(response, "Register User")

    if response.status_code != 200:
        print("❌ Registration failed!")
        return None

    # 2. Login
    response = requests.post(
        f"{BASE_URL}/login",
        json={
            "email": TEST_USER["email"],
            "password": TEST_USER["password"]
        }
    )
    print_response(response, "Login User")

    if response.status_code != 200:
        print("❌ Login failed!")
        return None

    token = response.json().get("access_token")
    print(f"\n✓ Got access token: {token[:50]}...")
    return token


def test_training_sessions(token: str) -> None:
    """Test training session CRUD operations."""
    print("\n" + "="*60)
    print("TESTING TRAINING SESSIONS")
    print("="*60)

    headers = {"Authorization": f"Bearer {token}"}

    # 1. Create session
    response = requests.post(
        f"{BASE_URL}/api/training-sessions",
        json={
            "algorithm_type": "linear_regression",
            "dataset": TEST_DATASET,
            "hyperparameters": TEST_HYPERPARAMETERS
        },
        headers=headers
    )
    print_response(response, "Create Training Session")

    if response.status_code != 200:
        print("❌ Session creation failed!")
        return

    session_id = response.json().get("id")
    print(f"✓ Session ID: {session_id}")

    # 2. List sessions
    response = requests.get(
        f"{BASE_URL}/api/training-sessions",
        headers=headers
    )
    print_response(response, "List Training Sessions")

    # 3. Get specific session
    response = requests.get(
        f"{BASE_URL}/api/training-sessions/{session_id}",
        headers=headers
    )
    print_response(response, f"Get Session {session_id}")

    # 4. Update session
    response = requests.put(
        f"{BASE_URL}/api/training-sessions/{session_id}",
        json={
            "model_parameters": {"weights": [1.2, 0.5], "bias": 0.3},
            "loss_history": [0.5, 0.45, 0.42],
            "metrics": {"mse": 0.02, "r2": 0.95}
        },
        headers=headers
    )
    print_response(response, f"Update Session {session_id}")


def main() -> None:
    """Run all tests."""
    print("\n" + "🚀 "*30)
    print("FASTAPI AUTH & TRAINING SESSIONS TEST")
    print("🚀 "*30)

    # Test registration & login
    token = test_authentication()

    if not token:
        print("\n❌ Authentication tests failed!")
        return

    # Test training sessions
    test_training_sessions(token)

    print("\n" + "✓ "*30)
    print("ALL TESTS COMPLETED")
    print("✓ "*30 + "\n")


if __name__ == "__main__":
    try:
        main()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Cannot connect to API")
        print("   Make sure the FastAPI server is running:")
        print("   uvicorn main:app --reload")
    except Exception as e:
        print(f"❌ Error: {e}")
