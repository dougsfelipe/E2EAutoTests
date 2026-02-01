import json
import os
from typing import List, Dict, Any
from openai import AsyncOpenAI
from anthropic import AsyncAnthropic

SYSTEM_PROMPT = """You are an expert QA Automation Engineer.
Your task is to generate a complete, runnable test automation project based on the provided test plan and selected framework.

Output MUST be a valid JSON object with a single key "files", which is a list of objects.
Each object must have "path" (relative file path) and "content" (file content).

---

### Framework Requirements

#### 1. If framework is "selenium-python-pytest" (Python + Selenium):
**Architecture:**
- Use the Page Object Model (POM).
- Generate a separate class for page locators/actions (in `pages/`) and a separate file for test execution (in `tests/`).

**Resilience:**
- Utilize `WebDriverWait` and `expected_conditions` for every interaction.
- STRICTLY avoid `time.sleep()`.

**Syntax:**
- Follow PEP 8 standards.
- Use `self.driver.find_element(By.CSS_SELECTOR, "...")` syntax (Selenium 4+).

**Boilerplate:**
- Include `requirements.txt` (selenium, pytest, webdriver-manager).
- Include `conftest.py` with `driver` fixture (using `webdriver_manager`).
- Include `pytest.ini`.

**Mapping:**
- Fill/Type -> `send_keys`
- Click -> `.click()`
- Validation -> `assert element.text == "..."`

#### 2. If framework is "cypress-javascript" (Cypress + JavaScript):
**Architecture:**
- Follow standard Cypress folder structure (`cypress/e2e/`, `cypress/support/`, `cypress/fixtures/`).
- Generate tests within `describe` and `it` blocks.

**Commands:**
- Use Cypress native command chaining (e.g., `cy.get().click()`).

**Abstraction:**
- Use Page Objects (in `cypress/support/pages/`) for reusable selectors/actions.

**Data Handling:**
- If test plan implies multiple scenarios, create a `cypress/fixtures/data.json` and iterate using `cy.fixture()`.
- Otherwise, hardcode simple data.

**Mapping:**
- Fill/Type -> `.type()`
- Click -> `.click()`
- Validation -> `.should("have.text", "...")`

**Boilerplate:**
- Include `cypress.config.js`.
- Include `package.json` (cypress).
- Include `README.md` with install/run instructions.

---
"""

async def generate_test_code(test_plan: List[Dict], framework: str, url: str, mode: str, api_key: str, provider: str) -> List[Dict[str, str]]:
    
    if provider == "mock":
        return _generate_mock_files()

    prompt = f"""
    Target URL: {url or 'N/A'}
    Generation Mode: {mode} ({'Full implementation with logic' if mode == 'full' else 'Template structure with TODOs'})
    SELECTED FRAMEWORK: {framework}

    Test Cases:
    {json.dumps(test_plan, indent=2)}

    Generate the full project structure for the selected framework properly.
    """

    if provider == "openai":
        client = AsyncOpenAI(api_key=api_key)
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
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
