import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import db from '../lib/db';
import { sendMail } from '../lib/mailer';
import { otpEmailTemplate } from '../lib/templates';
import dotenv from "dotenv";

dotenv.config();
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
};

function ok(body: unknown, statusCode = 200): APIGatewayProxyResult {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(body) };
}

function bad(body: unknown, statusCode = 400): APIGatewayProxyResult {
  return { statusCode, headers: corsHeaders, body: JSON.stringify(body) };
}

export const register = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'OPTIONS') return ok('');
    if (!event.body) return bad({ error: 'Missing body' });
    const { email, password, first_name, last_name, phone_number } = JSON.parse(event.body);
    let type = "user"
    if (!email || !password) return bad({ error: 'Email and password required' });
    const normalizedEmail = String(email).trim().toLowerCase();

    const exists = await db.query('SELECT 1 FROM users WHERE lower(email)=$1', [normalizedEmail]);
    if (exists.rowCount && exists.rowCount > 0) return bad({ error: 'Email already registered' }, 409);

    const userId = uuidv4();
    const now = new Date();
    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      'INSERT INTO public.users(user_id, email, first_name, last_name, phone_number, type, password, created_at, updated_at, otp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',
      [userId, normalizedEmail, first_name || null, last_name || null, phone_number || null, type || 'user', hashed, now, now, null]
    );

    return ok({ user_id: userId, email: normalizedEmail });
  } catch (err: any) {
    return bad({ error: err?.message || 'Internal Server Error' }, 500);
  }
};

export const resetPasswordMail = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'OPTIONS') return ok('');
    if (!event.body) return bad({ error: 'Missing body' });
    const { email } = JSON.parse(event.body);
    if (!email) return bad({ error: 'Email required' });
    const normalizedEmail = String(email).trim().toLowerCase();

    const { rows } = await db.query<{ user_id: string }>('SELECT user_id FROM users WHERE lower(email) = $1 LIMIT 1', [normalizedEmail]);
    if (!rows[0]) return ok({ message: 'If account exists, OTP has been sent' });

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await db.query('UPDATE users SET otp=$1, updated_at=$2 WHERE user_id=$3', [otp, new Date(), rows[0].user_id]);

    const name = (await db.query<{ first_name: string | null }>('SELECT first_name FROM users WHERE user_id=$1', [rows[0].user_id])).rows[0]?.first_name || null;
    const tpl = otpEmailTemplate({ name, otp });
    await sendMail({ to: normalizedEmail, subject: tpl.subject, html: tpl.html, text: tpl.text });

    return ok({ message: 'OTP sent' });
  } catch (err: any) {
    return bad({ error: err?.message || 'Internal Server Error' }, 500);
  }
};

export const verifyOtp = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'OPTIONS') return ok('');
    if (!event.body) return bad({ error: 'Missing body' });
    const { email, otp } = JSON.parse(event.body);
    if (!email || !otp) return bad({ error: 'Email and otp required' });
    const normalizedEmail = String(email).trim().toLowerCase();

    const { rows } = await db.query<{ user_id: string; otp: string | null }>(
      'SELECT user_id, otp FROM users WHERE lower(email)=$1 LIMIT 1',
      [normalizedEmail]
    );
    const user = rows[0];
    if (!user || !user.otp || user.otp !== String(otp)) return bad({ error: 'Invalid OTP' }, 401);

    return ok({ message: 'OTP verified', user_id: user.user_id });
  } catch (err: any) {
    return bad({ error: err?.message || 'Internal Server Error' }, 500);
  }
};

export const changePassword = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'OPTIONS') return ok('');
    if (!event.body) return bad({ error: 'Missing body' });
    const { email, otp, old_password, new_password } = JSON.parse(event.body);
    if (!email || !otp || !old_password || !new_password) return bad({ error: 'Email, otp, old_password and new_password required' });
    const normalizedEmail = String(email).trim().toLowerCase();

    const { rows } = await db.query<{ user_id: string; otp: string | null; password: string }>(
      'SELECT user_id, otp, password FROM users WHERE lower(email)=$1 LIMIT 1',
      [normalizedEmail]
    );
    const user = rows[0];
    if (!user || !user.otp || user.otp !== String(otp)) return bad({ error: 'Invalid OTP' }, 401);

    const matchesOld = await bcrypt.compare(String(old_password), user.password);
    if (!matchesOld) return bad({ error: 'Old password is incorrect' }, 401);

    const hashed = await bcrypt.hash(String(new_password), 10);
    await db.query('UPDATE users SET password=$1, otp=$2, updated_at=$3 WHERE user_id=$4', [hashed, null, new Date(), user.user_id]);

    return ok({ message: 'Password updated' });
  } catch (err: any) {
    return bad({ error: err?.message || 'Internal Server Error' }, 500);
  }
};


