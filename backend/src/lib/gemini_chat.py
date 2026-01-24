import requests
# from config import GEMINI_API_KEY, GEMINI_API_URL
from utils.api_config_helper import (
    get_gemini_api_key,
    get_gemini_api_url
)


class GeminiClient:
    def __init__(self):
        api_key=get_gemini_api_key()
        api_url=get_gemini_api_url()
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required")
        if not api_url:
            raise ValueError("GEMINI_API_URL is required")

        self.headers = {
            "Content-Type": "application/json"
        }

    def generate(
        self,
        prompt: str,
        temperature: float = 0.1,
        max_tokens: int = 1024
    ) -> str:
        """
        Gemini text generation
        """
        payload = {
            "contents": [
                {
                    "parts": [
                        {"text": prompt}
                    ]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_tokens
            }
        }

        response = requests.post(
            f"{self.api_url}?key={self.api_key}",
            headers=self.headers,
            json=payload
        )
        response.raise_for_status()

        data = response.json()
        return data["candidates"][0]["content"]["parts"][0]["text"].strip()

    def check_health(self) -> bool:
        """
        Simple health check
        """
        try:
            self.generate("ping", max_tokens=5)
            return True
        except Exception as e:
            print(f"❌ Gemini health check failed: {e}")
            return False


gemini = GeminiClient()
