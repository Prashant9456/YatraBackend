"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePassword = exports.verifyOtp = exports.resetPasswordMail = exports.register = void 0;
const uuid_1 = require("uuid");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const db_1 = __importDefault(require("../lib/db"));
const mailer_1 = require("../lib/mailer");
const templates_1 = require("../lib/templates");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
    'Access-Control-Allow-Headers': 'Origin, Content-Type, Accept, Authorization, X-Requested-With',
    'Access-Control-Allow-Credentials': 'true',
};
function ok(body, statusCode = 200) {
    return { statusCode, headers: corsHeaders, body: JSON.stringify(body) };
}
function bad(body, statusCode = 400) {
    return { statusCode, headers: corsHeaders, body: JSON.stringify(body) };
}
const register = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS')
            return ok('');
        if (!event.body)
            return bad({ error: 'Missing body' });
        const { email, password, first_name, last_name, phone_number } = JSON.parse(event.body);
        let type = "user";
        if (!email || !password)
            return bad({ error: 'Email and password required' });
        const normalizedEmail = String(email).trim().toLowerCase();
        const exists = await db_1.default.query('SELECT 1 FROM users WHERE lower(email)=$1', [normalizedEmail]);
        if (exists.rowCount && exists.rowCount > 0)
            return bad({ error: 'Email already registered' }, 409);
        const userId = (0, uuid_1.v4)();
        const now = new Date();
        const hashed = await bcryptjs_1.default.hash(password, 10);
        await db_1.default.query('INSERT INTO public.users(user_id, email, first_name, last_name, phone_number, type, password, created_at, updated_at, otp) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)', [userId, normalizedEmail, first_name || null, last_name || null, phone_number || null, type || 'user', hashed, now, now, null]);
        return ok({ user_id: userId, email: normalizedEmail });
    }
    catch (err) {
        return bad({ error: err?.message || 'Internal Server Error' }, 500);
    }
};
exports.register = register;
const resetPasswordMail = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS')
            return ok('');
        if (!event.body)
            return bad({ error: 'Missing body' });
        const { email } = JSON.parse(event.body);
        if (!email)
            return bad({ error: 'Email required' });
        const normalizedEmail = String(email).trim().toLowerCase();
        const { rows } = await db_1.default.query('SELECT user_id FROM users WHERE lower(email) = $1 LIMIT 1', [normalizedEmail]);
        if (!rows[0])
            return ok({ message: 'If account exists, OTP has been sent' });
        const otp = String(Math.floor(100000 + Math.random() * 900000));
        await db_1.default.query('UPDATE users SET otp=$1, updated_at=$2 WHERE user_id=$3', [otp, new Date(), rows[0].user_id]);
        const name = (await db_1.default.query('SELECT first_name FROM users WHERE user_id=$1', [rows[0].user_id])).rows[0]?.first_name || null;
        const tpl = (0, templates_1.otpEmailTemplate)({ name, otp });
        await (0, mailer_1.sendMail)({ to: normalizedEmail, subject: tpl.subject, html: tpl.html, text: tpl.text });
        return ok({ message: 'OTP sent' });
    }
    catch (err) {
        return bad({ error: err?.message || 'Internal Server Error' }, 500);
    }
};
exports.resetPasswordMail = resetPasswordMail;
const verifyOtp = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS')
            return ok('');
        if (!event.body)
            return bad({ error: 'Missing body' });
        const { email, otp } = JSON.parse(event.body);
        if (!email || !otp)
            return bad({ error: 'Email and otp required' });
        const normalizedEmail = String(email).trim().toLowerCase();
        const { rows } = await db_1.default.query('SELECT user_id, otp FROM users WHERE lower(email)=$1 LIMIT 1', [normalizedEmail]);
        const user = rows[0];
        if (!user || !user.otp || user.otp !== String(otp))
            return bad({ error: 'Invalid OTP' }, 401);
        return ok({ message: 'OTP verified', user_id: user.user_id });
    }
    catch (err) {
        return bad({ error: err?.message || 'Internal Server Error' }, 500);
    }
};
exports.verifyOtp = verifyOtp;
const changePassword = async (event) => {
    try {
        if (event.httpMethod === 'OPTIONS')
            return ok('');
        if (!event.body)
            return bad({ error: 'Missing body' });
        const { email, otp, old_password, new_password } = JSON.parse(event.body);
        if (!email || !otp || !old_password || !new_password)
            return bad({ error: 'Email, otp, old_password and new_password required' });
        const normalizedEmail = String(email).trim().toLowerCase();
        const { rows } = await db_1.default.query('SELECT user_id, otp, password FROM users WHERE lower(email)=$1 LIMIT 1', [normalizedEmail]);
        const user = rows[0];
        if (!user || !user.otp || user.otp !== String(otp))
            return bad({ error: 'Invalid OTP' }, 401);
        const matchesOld = await bcryptjs_1.default.compare(String(old_password), user.password);
        if (!matchesOld)
            return bad({ error: 'Old password is incorrect' }, 401);
        const hashed = await bcryptjs_1.default.hash(String(new_password), 10);
        await db_1.default.query('UPDATE users SET password=$1, otp=$2, updated_at=$3 WHERE user_id=$4', [hashed, null, new Date(), user.user_id]);
        return ok({ message: 'Password updated' });
    }
    catch (err) {
        return bad({ error: err?.message || 'Internal Server Error' }, 500);
    }
};
exports.changePassword = changePassword;
