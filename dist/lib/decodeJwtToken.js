"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decodeJwtToken = decodeJwtToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("./db"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function extractBearerToken(event) {
    const headers = (event && (event.headers || {}));
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
async function decodeJwtToken(event) {
    const token = extractBearerToken(event);
    if (!token) {
        return { error: 'Unauthorized: Missing Bearer token' };
    }
    const secretKey = process.env.JWT_SECRET_KEY || '';
    if (!secretKey) {
        return { error: 'JWT secret not configured' };
    }
    let decodedToken;
    try {
        decodedToken = jsonwebtoken_1.default.verify(token, secretKey);
    }
    catch (error) {
        return { error: 'Unauthorized: Invalid token' };
    }
    const visitorIdFromToken = decodedToken.visitor_id;
    if (!visitorIdFromToken) {
        return { error: 'Invalid token: Missing visitor_id' };
    }
    try {
        const { rowCount } = await db_1.default.query('SELECT visitor_id FROM visitor WHERE visitor_id = $1', [visitorIdFromToken]);
        if (!rowCount) {
            return { error: 'Unauthorized: visitor_id not found in the database' };
        }
    }
    catch (_dbErr) {
        return { error: 'Internal server error: Unable to verify visitor_id' };
    }
    return { visitorId: visitorIdFromToken, decoded: decodedToken };
}
