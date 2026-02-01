# AI Test Automation Generator

An AI-powered tool that converts CSV test plans into production-ready test automation code. This project supports generating code for **Python + Selenium** and **Cypress + JavaScript** frameworks.

![Project Preview](https://via.placeholder.com/800x400?text=AI+Test+Automation+Generator)

## Features

- **Multi-Framework Support**:
    - **Python + Selenium**: Uses Page Object Model (POM), `webdriver_manager`, and `pytest`.
    - **Cypress + JavaScript**: Follows Cypress best practices with native commands and folder structure.
- **AI-Driven generation**: Powered by OpenAI's GPT-4o-mini for efficient and accurate code generation.
- **CSV Parsing**: Upload your test plans in a simple CSV format.
- **Smart Architecture**: Enforces industry standards like explicit waits, POM, and clean coding practices.
- **Immediate Download**: Get a ZIP file containing the full project structure ready to run.

## Tech Stack

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: FastAPI (Python), Pandas, OpenAI API

## Prerequisites

- Node.js (v18+)
- Python (v3.9+)
- OpenAI API Key

## Setup & Running

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # Windows
   .\venv\Scripts\activate
   # Mac/Linux
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure Environment:
   - Create a `.env` file in the `backend` directory.
   - Add your OpenAI API Key:
     ```env
     OPENAI_API_KEY=your_api_key_here
     ```
5. Start the server:
   ```bash
   uvicorn app.main:app --reload
   ```
   Server runs at `http://localhost:8000`.

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:5173`.

## Usage

1. Open the frontend in your browser.
2. (Optional) Configure settings (Provider, URL).
3. Select your target framework (Selenium or Cypress).
4. Upload a CSV file containing your test cases.
   - *Tip: Download the template CSV from the UI to see the required format.*
5. Click **Generate Code**.
6. Extract the downloaded ZIP and run your new test project!

## License

MIT
