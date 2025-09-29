import type { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

export const hello = async (_event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Go Serverless v4! Your function executed successfully!',
    }),
  };
};


