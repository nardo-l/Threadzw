import { timingSafeEqual } from 'node:crypto';
import { Request } from 'express';

export function isValidCronSecret(req: Request): boolean {
  const expected = process.env.THREADZW_CRON_SECRET?.trim();
  if (!expected) return false;

  const supplied = (req.header('x-threadzw-cron-secret') ||
    (req.header('authorization') || '').replace(/^Bearer\s+/i, '')).trim();
  if (!supplied) return false;

  const expectedBuffer = Buffer.from(expected, 'utf8');
  const suppliedBuffer = Buffer.from(supplied, 'utf8');
  return expectedBuffer.length === suppliedBuffer.length && timingSafeEqual(expectedBuffer, suppliedBuffer);
}
