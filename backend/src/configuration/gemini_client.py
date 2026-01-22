import requests
import time
from typing import List, Dict
from config import GEMINI_API_KEY, GEMINI_API_URL


class geminiClient:
    """
    Gemini-backed client that preserves Grok/OpenAI-style interface
    """

    def __init__(self, api_key: str = GEMINI_API_KEY, api_url: str = GEMINI_API_URL):
        if not api_key:
            raise ValueError("GEMINI_API_KEY is required")
        if not api_url:
            raise ValueError("GEMINI_API_URL is required")

        self.api_key = api_key
        self.api_url = api_url
        self.headers = {
            "Content-Type": "application/json"
        }

    def _messages_to_prompt(self, messages: List[Dict]) -> str:
        """
        Convert OpenAI-style messages to a single Gemini prompt
        """
        prompt_parts = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            prompt_parts.append(f"{role.upper()}:\n{content}")
        return "\n\n".join(prompt_parts)

    def chat_completion(
        self,
        messages: List[Dict],
        model: str = None,
        temperature: float = 0.1,
        max_tokens: int = 1024,
        top_p: float = 0.9,
        max_retries: int = 3
    ):
        prompt = self._messages_to_prompt(messages)

        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "topP": top_p,
                "maxOutputTokens": max_tokens
            }
        }

        last_exception = None
        
        for attempt in range(max_retries):
            try:
                response = requests.post(
                    f"{self.api_url}?key={self.api_key}",
                    headers=self.headers,
                    json=payload,
                    timeout=30
                )
                
                # Handle rate limiting (429) with exponential backoff
                if response.status_code == 429:
                    if attempt < max_retries - 1:
                        # Exponential backoff: 2^attempt seconds (2, 4, 8 seconds)
                        wait_time = 2 ** attempt
                        retry_after = response.headers.get('Retry-After')
                        if retry_after:
                            wait_time = int(retry_after)
                        
                        print(f"⚠️ Rate limit exceeded (429). Retrying in {wait_time} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise requests.exceptions.HTTPError(
                            f"429 Client Error: Too Many Requests - Rate limit exceeded after {max_retries} attempts. "
                            "Please wait a moment before trying again."
                        )
                
                response.raise_for_status()

                data = response.json()
                
                # Check if response has candidates
                if "candidates" not in data or not data["candidates"]:
                    raise ValueError("No candidates in Gemini API response")
                
                text = data["candidates"][0]["content"]["parts"][0]["text"]

                # Match OpenAI/Grok response shape
                return {
                    "choices": [
                        {
                            "message": {
                                "role": "assistant",
                                "content": text.strip()
                            }
                        }
                    ]
                }

            except requests.exceptions.HTTPError as e:
                # Don't retry on 4xx errors except 429 (already handled above)
                if e.response and e.response.status_code == 429:
                    last_exception = e
                    continue
                elif e.response and 400 <= e.response.status_code < 500:
                    # Client errors (except 429) shouldn't be retried
                    print(f"❌ Gemini API client error ({e.response.status_code}): {e}")
                    raise
                else:
                    # Server errors (5xx) can be retried
                    last_exception = e
                    if attempt < max_retries - 1:
                        wait_time = 2 ** attempt
                        print(f"⚠️ Server error. Retrying in {wait_time} seconds... (Attempt {attempt + 1}/{max_retries})")
                        time.sleep(wait_time)
                        continue
                    else:
                        raise
            except requests.exceptions.RequestException as e:
                last_exception = e
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt
                    print(f"⚠️ Request error. Retrying in {wait_time} seconds... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                    continue
                else:
                    print(f"❌ Gemini API request error after {max_retries} attempts: {e}")
                    raise
            except Exception as e:
                print(f"❌ Gemini chat completion error: {e}")
                raise
        
        # If we exhausted all retries
        if last_exception:
            raise last_exception
        else:
            raise Exception(f"Failed to get response from Gemini API after {max_retries} attempts")

    def chat_completion_stream(self, *args, **kwargs):
        """
        Streaming not supported in this client
        """
        raise NotImplementedError("Gemini streaming not implemented")

    def check_health(self) -> bool:
        try:
            self.chat_completion(
                messages=[{"role": "user", "content": "ping"}],
                max_tokens=5
            )
            return True
        except Exception as e:
            print(f"Gemini health check failed: {e}")
            return False


gemini = geminiClient()
