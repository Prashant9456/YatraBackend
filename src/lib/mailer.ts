import nodemailer from 'nodemailer';
import dotenv from "dotenv";

dotenv.config();

export type MailPayload = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;

  const host = process.env.SMTP_HOST || 'localhost';
  const port = Number(process.env.SMTP_PORT || 1025);
  const user = process.env.SMTP_USER || undefined;
  const pass = process.env.SMTP_PASS || undefined;
  const secure = process.env.SMTP_SECURE === 'true';

  transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user && pass ? { user, pass } : undefined,
  });

  return transporter;
}


export async function sendMail(payload: MailPayload): Promise<void> {
  const tx = getTransporter();
  console.log('Sending email to:', payload.to,"process.env.MAIL_FROM", process.env.MAIL_FROM);	
  const from = process.env.MAIL_FROM || 'no-reply@yatra.local';
  try{
  await tx.sendMail({ from, ...payload });
  }catch(e){
    console.log(e);
    throw new Error('Error sending email');
  }
}


