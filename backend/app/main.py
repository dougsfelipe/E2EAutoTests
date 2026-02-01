from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Optional, List
import pandas as pd
import io
import json
import os
from .services.ai_service import generate_test_code
from .services.generator import create_project_zip
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="AI Test Generator API")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class GenerationRequest(BaseModel):
    test_plan: List[dict]
    framework: str
    url: Optional[str] = None
    mode: str  # "template" or "full"
    mode: str  # "template" or "full"
    api_key: Optional[str] = None
    provider: str # "openai" or "anthropic"

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.post("/api/parse-csv")
async def parse_csv(file: UploadFile = File(...)):
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="File must be a CSV")
    
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Validate columns
        required_columns = ["Test Case ID", "Title", "Objective", "Preconditions", "Steps", "Expected Result"]
        missing = [col for col in required_columns if col not in df.columns]
        if missing:
            raise HTTPException(status_code=400, detail=f"Missing columns: {', '.join(missing)}")
        
        # Convert to list of dicts
        test_cases = df.to_dict(orient='records')
        return {"test_cases": test_cases}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/generate")
async def generate_tests(request: GenerationRequest):
    try:
        # 1. Generate Code via AI
        generated_files = await generate_test_code(
            test_plan=request.test_plan,
            framework=request.framework,
            url=request.url,
            mode=request.mode,
            api_key=request.api_key or os.getenv("OPENAI_API_KEY"),
            provider=request.provider
        )
        
        # 2. Create ZIP
        zip_buffer = create_project_zip(generated_files)
        
        return StreamingResponse(
            zip_buffer,
            media_type="application/zip",
            headers={"Content-Disposition": "attachment; filename=test_automation_project.zip"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
