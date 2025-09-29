import type { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { decodeJwtToken } from './decodeJwtToken';

type Handler = (
  event: APIGatewayProxyEvent,
  context: Context,
  userInfo?: unknown
) => Promise<APIGatewayProxyResult>;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
  'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization, X-Requested-With',
  'Access-Control-Allow-Credentials': 'true',
};

const handler = (lambda: Handler) => {
  return async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
    try {
      const bypassRoutes: string[] = [];

      const path = (event as any).path as string | undefined;
      if (path && bypassRoutes.includes(path)) {
        const res = await decodeJwtToken(event);
        if (res && (res as any).error) {
          return {
            statusCode: 403,
            headers: corsHeaders,
            body: JSON.stringify({ error: (res as any).error }),
          };
        }
      }

      const result = await lambda(event, context);
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify(result),
      };
    } catch (e: any) {
      return {
        statusCode: 500,
        headers: corsHeaders,
        body: JSON.stringify({ error: e?.message ?? 'Internal Server Error' }),
      };
    }
  };
};

export default handler;
