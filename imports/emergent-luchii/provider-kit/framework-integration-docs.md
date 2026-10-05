# Framework Integration Docs — FrasbergAI

## Vercel AI SDK
```ts
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

const frasberg = createOpenAI({
  baseURL: "https://api.frasberg.com/v1",
  apiKey: process.env.FRASBERG_LLM_KEY,
});

const { textStream } = await streamText({
  model: frasberg("luchii-6-plus"),
  prompt: "Stream this",
});
```

## LangChain (Python)
```python
from langchain_openai import ChatOpenAI

llm = ChatOpenAI(
    base_url="https://api.frasberg.com/v1",
    api_key="luchii-sk-...",
    model="luchii-6-plus",
    streaming=True,
)
print(llm.invoke("Hello").content)
```

## LlamaIndex (Python)
```python
from llama_index.llms.openai_like import OpenAILike

llm = OpenAILike(
    api_base="https://api.frasberg.com/v1",
    api_key="luchii-sk-...",
    model="luchii-6-plus",
    is_chat_model=True,
)
print(llm.complete("Hello"))
```

## Embeddings (any OpenAI SDK)
```python
from openai import OpenAI
client = OpenAI(base_url="https://api.frasberg.com/v1", api_key="luchii-sk-...")
vec = client.embeddings.create(model="luchii-6-embed", input="Intelligence, harmonized.")
print(len(vec.data[0].embedding))  # 384
```
