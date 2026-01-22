from configuration.gemini_client import geminiClient

class LLMClient:
    def __init__(self, provider="gemini"):
        self.provider = provider

        if provider == "gemini":
            self.client = geminiClient()
        else:
            raise ValueError(f"Unsupported provider: {provider}")
    
    def chat_completion(self, *args, **kwargs):
        return self.client.chat_completion(*args, **kwargs)
    
    def chat_completion_stream(self, *args, **kwargs):
        return self.client.chat_completion_stream(*args, **kwargs)


llm = LLMClient(provider="gemini")
