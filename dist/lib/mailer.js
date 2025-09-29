"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
let transporter = null;
function getTransporter() {
    if (transporter)
        return transporter;
    const host = process.env.SMTP_HOST || 'localhost';
    const port = Number(process.env.SMTP_PORT || 1025);
    const user = process.env.SMTP_USER || undefined;
    const pass = process.env.SMTP_PASS || undefined;
    const secure = process.env.SMTP_SECURE === 'true';
    transporter = nodemailer_1.default.createTransport({
        host,
        port,
        secure,
        auth: user && pass ? { user, pass } : undefined,
    });
    return transporter;
}
async function sendMail(payload) {
    const tx = getTransporter();
    console.log('Sending email to:', payload.to, "process.env.MAIL_FROM", process.env.MAIL_FROM);
    const from = process.env.MAIL_FROM || 'no-reply@yatra.local';
    try {
        await tx.sendMail({ from, ...payload });
    }
    catch (e) {
        console.log(e);
        throw new Error('Error sending email');
    }
}
