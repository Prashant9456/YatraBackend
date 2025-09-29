"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createJwtToken = createJwtToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function createJwtToken(payload, expiresIn = '365d') {
    try {
        const secretKey = process.env.JWT_SECRET_KEY || '';
        const options = { expiresIn };
        const token = jsonwebtoken_1.default.sign(payload, secretKey, options);
        return token;
    }
    catch (error) {
        // eslint-disable-next-line no-console
        console.error('Error creating JWT token:', error);
        throw new Error('Failed to create JWT token');
    }
}
