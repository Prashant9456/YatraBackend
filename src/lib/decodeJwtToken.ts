import jwt, { JwtPayload } from 'jsonwebtoken';
import type { APIGatewayProxyEvent } from 'aws-lambda';
import db from './db';
import dotenv from "dotenv";

dotenv.config();

function extractBearerToken(event: APIGatewayProxyEvent): string | null {
  const headers = (event && (event.headers || {})) as Record<string, string | undefined>;
  const authHeader = headers.Authorization || headers.authorization || '';
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  const parts = authHeader.split(' ');
  if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
    return parts[1];
  }
  return null;
}

export async function decodeJwtToken(event: APIGatewayProxyEvent): Promise<{ visitorId?: string; decoded?: string | JwtPayload; error?: string }> {
  const token = extractBearerToken(event);
  if (!token) {
    return { error: 'Unauthorized: Missing Bearer token' };
  }

  const secretKey = process.env.JWT_SECRET_KEY || '';
  if (!secretKey) {
    return { error: 'JWT secret not configured' };
  }

  let decodedToken: any;
  try {
    decodedToken = jwt.verify(token, secretKey);
  } catch (error) {
    return { error: 'Unauthorized: Invalid token' };
  }

  const visitorIdFromToken = decodedToken.visitor_id as string | undefined;
  if (!visitorIdFromToken) {
    return { error: 'Invalid token: Missing visitor_id' };
  }

  try {
    const { rowCount } = await db.query('SELECT visitor_id FROM visitor WHERE visitor_id = $1', [visitorIdFromToken]);
    if (!rowCount) {
      return { error: 'Unauthorized: visitor_id not found in the database' };
    }
  } catch (_dbErr) {
    return { error: 'Internal server error: Unable to verify visitor_id' };
  }

  return { visitorId: visitorIdFromToken, decoded: decodedToken };
}


