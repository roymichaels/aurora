import { createHmac } from 'crypto';

function base64url(input: Buffer): string {
  return input
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

export function signJWT(payload: any, secret: Uint8Array, exp: number): string {
  const header = base64url(Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = base64url(Buffer.from(JSON.stringify({ ...payload, exp })));
  const data = `${header}.${body}`;
  const signature = base64url(createHmac('sha256', Buffer.from(secret)).update(data).digest());
  return `${data}.${signature}`;
}

export function verifyJWT(token: string, secret: Uint8Array): { payload: any } {
  const parts = token.split('.');
  if (parts.length !== 3) {
    throw new Error('invalid_token');
  }
  const [header, body, signature] = parts;
  const data = `${header}.${body}`;
  const expected = base64url(createHmac('sha256', Buffer.from(secret)).update(data).digest());
  if (signature !== expected) {
    throw new Error('invalid_signature');
  }
  const payload = JSON.parse(
    Buffer.from(body.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
  );
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
    throw new Error('token_expired');
  }
  return { payload };
}

