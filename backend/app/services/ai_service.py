import json
import os
from typing import List, Dict, Any
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

SYSTEM_PROMPT = """You are an expert QA Automation Engineer specializing in Selenium, Python, and Pytest.
Your task is to generate a complete, runnable test automation project based on the provided test plan.
You must generate a Page Object Model (POM) structure.

Output MUST be a valid JSON object with a single key "files", which is a list of objects.
Each object must have "path" (relative file path) and "content" (file content).

Example Output:
{
  "files": [
    {
      "path": "pages/login_page.py",
      "content": "class LoginPage:..."
    },
    {
      "path": "tests/test_login.py",
      "content": "def test_login():..."
    }
  ]
}

Include:
1. `requirements.txt` (MUST include: pytest, selenium, webdriver-manager)
2. `pytest.ini`
3. `README.md`
4. Page Object files in `pages/`
5. Test files in `tests/`
6. `conftest.py` for fixtures

Follow best practices:
- Use `webdriver_manager` to automatically manage drivers.
- Use explicit waits (WebDriverWait).
- Use type hinting.
- specific selectors (ID, Name, CSS).
"""

async def generate_test_code(test_plan: List[Dict], framework: str, url: str, mode: str, api_key: str, provider: str) -> List[Dict[str, str]]:
    
    if provider == "mock":
        return _generate_mock_files()

    prompt = f"""
    Target URL: {url or 'N/A'}
    Generation Mode: {mode} ({'Full implementation with logic' if mode == 'full' else 'Template structure with TODOs'})
    Framework: {framework} (Selenium + Python + Pytest)

    Test Cases:
    {json.dumps(test_plan, indent=2)}

    Generate the full project structure.
    """

    if provider == "openai":
        client = AsyncOpenAI(api_key=api_key)
        response = await client.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        content = response.choices[0].message.content
        return json.loads(content)["files"]

    elif provider == "anthropic":
        client = AsyncAnthropic(api_key=api_key)
        response = await client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=8000,
            system=SYSTEM_PROMPT,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        # Extract JSON from response (Claude doesn't have strict json_mode enforcement like OpenAI yet, but usually complies)
        # We might need to find the JSON block if it includes text.
        content = response.content[0].text
        # Simple heuristic to find JSON start/end if extra text exists
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "{" in content:
            start = content.find("{")
            end = content.rfind("}") + 1
            content = content[start:end]
            
        return json.loads(content)["files"]
    
    else:
        raise ValueError("Invalid provider")

def _generate_mock_files():
    return [
        {
            "path": "README.md",
            "content": "# Mock Project\nThis is a generated mock project."
        },
        {
            "path": "requirements.txt",
            "content": "pytest\nselenium"
        },
        {
            "path": "tests/test_mock.py",
            "content": "def test_example():\n    assert True"
        }
    ]
