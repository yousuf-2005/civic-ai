# Civic AI Setup Guide for Windows & PowerShell

This guide provides clear step-by-step instructions for getting Civic AI running locally on Windows with VS Code and PowerShell.

---

## 1. Prerequisites
- **Python**: 3.11+ (Python 3.14+ supported)
- **Node.js**: v18+ (Node v20+ recommended)
- **PowerShell**: Windows PowerShell 5.1 or PowerShell 7+
- **Google Gemini API Key** *(Optional for local dev, mock mode is supported by default)*: Get one free at [Google AI Studio](https://aistudio.google.com/).

---

## 2. Quick Start

### Step 2.1 — Backend Setup

1. Open PowerShell in the project directory:
   ```powershell
   cd "d:\Projects\Civic AI\backend"
   ```

2. Create and activate a Python virtual environment:
   ```powershell
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   ```
   *(If PowerShell gives an execution policy error, run `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` once)*.

3. Install required Python packages:
   ```powershell
   pip install -r requirements.txt
   ```

4. Create your `.env` configuration file from the template:
   ```powershell
   Copy-Item .env.example .env
   ```

5. (Optional) Edit `backend/.env` with VS Code to set your real `GEMINI_API_KEY`:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-3.8-flash
   AI_MOCK_MODE=false
   ```
   *If you do not have a Gemini key right now, keep `AI_MOCK_MODE=true` to test the full application immediately with realistic simulated AI analysis.*

6. Initialize database and seed demo data:
   ```powershell
   python -m app.cli seed-demo
   ```
   *Creates initial sample complaints and an administrator user.*

7. Start the FastAPI backend server:
   ```powershell
   python -m uvicorn app.main:app --reload --port 8000
   ```
   Verify at `http://localhost:8000/api/health` and open Swagger docs at `http://localhost:8000/docs`.

---

### Step 2.2 — Frontend Setup

1. Open a new PowerShell terminal tab in the frontend directory:
   ```powershell
   cd "d:\Projects\Civic AI\frontend"
   ```

2. Install dependencies:
   ```powershell
   npm install
   ```

3. Copy the frontend environment file:
   ```powershell
   Copy-Item .env.example .env
   ```

4. Start the Vite development server:
   ```powershell
   npm run dev
   ```

5. Open your web browser and navigate to:
   ```
   http://localhost:5173
   ```

---

## 3. Creating an Administrator Account

To manage complaints and update their statuses, create an admin account via CLI:

```powershell
cd "d:\Projects\Civic AI\backend"
.\venv\Scripts\Activate.ps1
python -m app.cli create-admin --email admin@civicai.local --password "AdminSecurePass2026!" --name "Civic Administrator"
```

You can now log in at `http://localhost:5173/login` with these credentials and access the `/admin` portal.

---

## 4. Running Automated Tests

To run the backend test suite:
```powershell
cd "d:\Projects\Civic AI\backend"
.\venv\Scripts\Activate.ps1
pytest -v
```

To run the frontend production build and type check:
```powershell
cd "d:\Projects\Civic AI\frontend"
npm run build
```
