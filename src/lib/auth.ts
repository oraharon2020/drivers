import jwt from 'jsonwebtoken';
import { config } from './config';
import { JWTPayload } from '@/types';
import { NextRequest } from 'next/server';

export function generateToken(payload: Omit<JWTPayload, 'exp'>): string {
  return jwt.sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    },
    config.jwt.secret,
    { algorithm: 'HS256' }
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, {
      algorithms: ['HS256'],
    }) as JWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

export function getTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;

  const match = authHeader.match(/Bearer\s+(.*)$/i);
  return match ? match[1] : null;
}

export function authenticateRequest(request: NextRequest): JWTPayload | null {
  const token = getTokenFromRequest(request);
  if (!token) return null;

  return verifyToken(token);
}

// WordPress password hash verification using phpass algorithm
class PasswordHash {
  private itoa64: string;
  private iteration_count_log2: number;
  private portable_hashes: boolean;

  constructor(iteration_count_log2: number, portable_hashes: boolean) {
    this.itoa64 = './0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
    this.iteration_count_log2 = iteration_count_log2;
    this.portable_hashes = portable_hashes;
  }

  private encode64(input: Buffer, count: number): string {
    let output = '';
    let i = 0;

    do {
      let value = input[i++];
      output += this.itoa64[value & 0x3f];
      if (i < count) value |= input[i] << 8;
      output += this.itoa64[(value >> 6) & 0x3f];
      if (i++ >= count) break;
      if (i < count) value |= input[i] << 16;
      output += this.itoa64[(value >> 12) & 0x3f];
      if (i++ >= count) break;
      output += this.itoa64[(value >> 18) & 0x3f];
    } while (i < count);

    return output;
  }

  private crypt_private(password: string, setting: string): string {
    const crypto = require('crypto');
    let output = '*0';

    if (setting.substring(0, 2) === output) {
      output = '*1';
    }

    const id = setting.substring(0, 3);
    if (id !== '$P$' && id !== '$H$') {
      return output;
    }

    const count_log2 = this.itoa64.indexOf(setting[3]);
    if (count_log2 < 7 || count_log2 > 30) {
      return output;
    }

    const count = 1 << count_log2;
    const salt = setting.substring(4, 12);

    if (salt.length !== 8) {
      return output;
    }

    let hash = crypto.createHash('md5').update(salt + password).digest();

    for (let i = 0; i < count; i++) {
      hash = crypto.createHash('md5').update(Buffer.concat([hash, Buffer.from(password)])).digest();
    }

    output = setting.substring(0, 12);
    output += this.encode64(hash, 16);

    return output;
  }

  public checkPassword(password: string, storedHash: string): boolean {
    const hash = this.crypt_private(password, storedHash);
    if (hash[0] === '*') {
      return false;
    }
    return hash === storedHash;
  }
}

export function verifyWordPressPassword(password: string, hash: string): boolean {
  try {
    if (hash.startsWith('$P$') || hash.startsWith('$H$')) {
      const hasher = new PasswordHash(8, true);
      return hasher.checkPassword(password, hash);
    }
    return false;
  } catch {
    return false;
  }
}
