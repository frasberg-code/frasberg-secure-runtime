import { sendBuiltError } from '@frasberg/core';

interface Req {
  headers: Record<string, string | string[] | undefined>;
  ownerId?: string;
  workspaceId?: string;
  requestId?: string;
}

interface Res {
  status(code: number): Res;
  json(body: unknown): unknown;
}

type Next = (err?: unknown) => void;

export const OWNER_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;
export const WORKSPACE_ID_PATTERN = /^[A-Za-z0-9_-]{4,64}$/;

function headerValue(value: string | string[] | undefined): string | undefined {
  const v = Array.isArray(value) ? value[0] : value;
  return v === undefined ? undefined : v.trim();
}

// Uses the owner set by the API key middleware, else x-owner-id.
export function ownerResolver(req: Req, res: Res, next: Next) {
  const owner = req.ownerId ?? headerValue(req.headers['x-owner-id']);
  if (owner === undefined) {
    return sendBuiltError(
      req,
      res,
      401,
      'OWNER_NOT_FOUND',
      'Owner could not be resolved.',
    );
  }
  if (!OWNER_ID_PATTERN.test(owner)) {
    return sendBuiltError(
      req,
      res,
      400,
      'INVALID_OWNER_ID',
      'Owner id is malformed.',
    );
  }
  req.ownerId = owner;
  return next();
}

// Missing header is 404; present but blank or malformed is 400.
export function workspaceResolver(req: Req, res: Res, next: Next) {
  const workspace =
    req.workspaceId ?? headerValue(req.headers['x-workspace-id']);
  if (workspace === undefined) {
    return sendBuiltError(
      req,
      res,
      404,
      'WORKSPACE_NOT_FOUND',
      'Workspace could not be resolved.',
    );
  }
  if (!WORKSPACE_ID_PATTERN.test(workspace)) {
    return sendBuiltError(
      req,
      res,
      400,
      'INVALID_WORKSPACE_ID',
      'Workspace id is malformed.',
    );
  }
  req.workspaceId = workspace;
  return next();
}
