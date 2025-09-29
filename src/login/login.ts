import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import bcrypt from 'bcryptjs';
import jwt, { Algorithm, SignOptions } from 'jsonwebtoken';
import db from '../lib/db';
import dotenv from 'dotenv';
import { createJwtToken } from '../lib/jwt';

dotenv.config();

type LoginRequest = {
  email: string;
  password: string;
};

type UserRecord = {
  id: string | number;
  email: string;
  password_hash: string;
  name?: string | null;
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
};

export const login = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'OPTIONS') {
      return { statusCode: 200, headers: corsHeaders, body: '' };
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Missing request body' }),
      };
    }

    const payload: LoginRequest = JSON.parse(event.body);
    const email = (payload.email || '').trim().toLowerCase();
    const password = payload.password || '';

    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Email and password are required' }),
      };
    }

    const { rows } = await db.query<UserRecord>(
      'SELECT user_id as id, email, password as password_hash, first_name as name FROM users WHERE lower(email) = $1 LIMIT 1',
      [email]
    );
    const user = rows[0];

    if (!user) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Account does not exist. Please register first.' }),
      };
    }

    const passwordOk = await bcrypt.compare(password, user.password_hash);
    if (!passwordOk) {
      return {
        statusCode: 401,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'Invalid email or password' }),
      };
    }

    const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
    if (!secret) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: 'JWT secret not configured' }),
      };
    }

    const token = createJwtToken(
      { sub: user.id, email: user.email },
      (process.env.JWT_EXPIRES_IN || '1d') as SignOptions['expiresIn']
    );

    const responseBody = {
      token,
      email: user.email,
      id: user.id,
      name: user.name || undefined,
    };

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify(responseBody),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ error: err?.message || 'Internal Server Error' }),
    };
  }
};


