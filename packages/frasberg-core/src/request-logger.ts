import { redactObject } from './redact';

interface Req {
  requestId?: string;
  ownerId?: string;
  workspaceId?: string;
  method?: string;
  path?: string;
  headers?: Record<string, unknown>;
}

interface Res {
  statusCode: number;
  on(event: string, callback: () => void): unknown;
}

// Logs one redacted JSON line per request when the response finishes.
export function requestLogger(
  req: Req,
  res: Res,
  next: (err?: unknown) => void,
) {
  const started = Date.now();

  res.on('finish', () => {
    const payload = redactObject({
      requestId: req.requestId,
      ownerId: req.ownerId,
      workspaceId: req.workspaceId,
      method: req.method,
      path: req.path,
      headers: req.headers,
      statusCode: res.statusCode,
      durationMs: Date.now() - started,
    });
    console.log(JSON.stringify(payload));
  });

  next();
}
