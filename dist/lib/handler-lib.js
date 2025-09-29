"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const decodeJwtToken_1 = require("./decodeJwtToken");
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
};
const handler = (lambda) => {
    return async (event, context) => {
        try {
            const bypassRoutes = [];
            const path = event.path;
            if (path && bypassRoutes.includes(path)) {
                const res = await (0, decodeJwtToken_1.decodeJwtToken)(event);
                if (res && res.error) {
                    return {
                        statusCode: 403,
                        headers: corsHeaders,
                        body: JSON.stringify({ error: res.error }),
                    };
                }
            }
            const result = await lambda(event, context);
            return {
                statusCode: 200,
                headers: corsHeaders,
                body: JSON.stringify(result),
            };
        }
        catch (e) {
            return {
                statusCode: 500,
                headers: corsHeaders,
                body: JSON.stringify({ error: e?.message ?? 'Internal Server Error' }),
            };
        }
    };
};
exports.default = handler;
