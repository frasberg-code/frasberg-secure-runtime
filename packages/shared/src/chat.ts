export type ChatRole = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessage[];
  tenantId?: string;
  metadata?: Record<string, string>;
}

export function validateChatRequest(payload: unknown): ChatCompletionRequest {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Chat payload must be an object.');
  }

  const request = payload as Partial<ChatCompletionRequest>;
  if (!Array.isArray(request.messages) || request.messages.length === 0) {
    throw new Error('messages must be a non-empty array.');
  }

  for (const message of request.messages) {
    if (!message || typeof message !== 'object') {
      throw new Error('Each message must be an object.');
    }

    if (!['system', 'user', 'assistant', 'tool'].includes(message.role)) {
      throw new Error('Unsupported message role.');
    }

    if (
      typeof message.content !== 'string' ||
      message.content.trim().length === 0
    ) {
      throw new Error('Message content must be a non-empty string.');
    }

    if (message.content.length > 8000) {
      throw new Error(
        'Message content exceeds the 8000 character safety limit.',
      );
    }
  }

  return {
    model: request.model ?? 'frasberg-default',
    messages: request.messages,
    tenantId: request.tenantId,
    metadata: request.metadata,
  };
}
