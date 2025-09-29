import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function createJwtToken(
  payload: Record<string, any>,
  expiresIn: SignOptions['expiresIn'] = '365d'
): string {
  try {
    const secretKey = process.env.JWT_SECRET_KEY || '';
    const options: SignOptions = { expiresIn };
    const token = jwt.sign(payload, secretKey as Secret, options);
    return token;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Error creating JWT token:', error);
    throw new Error('Failed to create JWT token');
  }
}


