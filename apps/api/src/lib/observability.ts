import { randomUUID } from 'node:crypto';
import type { Request, Response } from 'express';

export function requestIdFor(req: Request): string {
  const inbound = req.header('x-request-id');
  if (inbound && /^[A-Za-z0-9._-]{8,128}$/.test(inbound)) return inbound;
  return randomUUID();
}

/** Attach the request id to a response so a user can quote it in a bug report. */
export function tagResponse(res: Response, requestId: string): void {
  res.setHeader('x-request-id', requestId);
}
