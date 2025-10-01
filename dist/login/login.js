"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../lib/db"));
const dotenv_1 = __importDefault(require("dotenv"));
const jwt_1 = require("../lib/jwt");
dotenv_1.default.config();
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
};
const login = async (event) => {
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
        const payload = JSON.parse(event.body);
        const email = (payload.email || '').trim().toLowerCase();
        const password = payload.password || '';
        if (!email || !password) {
            return {
                statusCode: 400,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Email and password are required' }),
            };
        }
        const { rows } = await db_1.default.query('SELECT user_id as id, email, password as password_hash, first_name as name FROM users WHERE lower(email) = $1 LIMIT 1', [email]);
        const user = rows[0];
        if (!user) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Account does not exist. Please register first.' }),
            };
        }
        const passwordOk = await bcryptjs_1.default.compare(password, user.password_hash);
        if (!passwordOk) {
            return {
                statusCode: 401,
                headers: corsHeaders,
                body: JSON.stringify({ error: 'Invalid email or password' }),
            };
        }
        const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
        // if (!secret) {
        //   return {
        //     statusCode: 500,
        //     headers: corsHeaders,
        //     body: JSON.stringify({ error: 'JWT secret not configured' }),
        //   };
        // }
        const token = (0, jwt_1.createJwtToken)({ sub: user.id, email: user.email }, (process.env.JWT_EXPIRES_IN || '1d'));
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
    }
    catch (err) {
        return {
            statusCode: 500,
            headers: corsHeaders,
            body: JSON.stringify({ error: err?.message || 'Internal Server Error' }),
        };
    }
};
exports.login = login;
