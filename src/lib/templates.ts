export function otpEmailTemplate(params: { name?: string | null; otp: string }): { subject: string; html: string; text: string } {
  const subject = 'Your YatraTravel OTP Code';
  const displayName = params.name ? String(params.name) : 'there';
  const otp = params.otp;
  const logoUrl = process.env.BRAND_LOGO_URL || 'https://dummyimage.com/80x80/0ea5e9/ffffff&text=YT';

  const html = `
<!doctype html>
<html>
  <head>
    <meta name="viewport" content="width=device-width" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <title>${subject}</title>
    <style>
      body { background-color: #0b1220; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', Arial, sans-serif; color: #e5e7eb; }
      .container { max-width: 560px; margin: 0 auto; padding: 24px; }
      .card { background: linear-gradient(180deg, #0f172a 0%, #0b1220 100%); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 28px; box-shadow: 0 10px 30px rgba(0,0,0,0.35); }
      .brand { display: flex; align-items: center; gap: 12px; }
      .badge { width: 40px; height: 40px; border-radius: 10px; background: linear-gradient(135deg, #2563eb 0%, #22d3ee 100%); display: flex; align-items: center; justify-content: center; }
      .badge span { color: white; font-weight: 800; font-size: 18px; letter-spacing: 0.5px; }
      .brand h1 { margin: 0; font-size: 20px; font-weight: 800; background: linear-gradient(90deg, #60a5fa, #22d3ee); -webkit-background-clip: text; background-clip: text; color: transparent; }
      .hero { text-align: center; margin-top: 22px; }
      .logo { width: 64px; height: 64px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); }
      .greeting { font-size: 16px; margin: 18px 0 8px; color: #cbd5e1; }
      .otp { font-size: 36px; font-weight: 800; letter-spacing: 8px; padding: 14px 18px; border-radius: 12px; color: #0b1220; background: linear-gradient(135deg, #93c5fd 0%, #99f6e4 100%); display: inline-block; border: 1px solid rgba(255,255,255,0.12); }
      .note { font-size: 13px; color: #94a3b8; margin-top: 12px; }
      .cta { margin-top: 24px; text-align: center; }
      .btn { background: linear-gradient(90deg, #2563eb, #22d3ee); color: white; padding: 12px 18px; text-decoration: none; border-radius: 10px; font-weight: 700; display: inline-block; }
      .footer { margin-top: 28px; font-size: 12px; color: #64748b; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="brand">
        <div class="badge"><span>YT</span></div>
        <h1>YatraTravel</h1>
      </div>
      <div class="card">
        <div class="hero">
          <img class="logo" src="${logoUrl}" alt="YatraTravel" />
          <p class="greeting">Hi ${displayName},</p>
          <p>Please use the following One-Time Password to continue:</p>
          <div class="otp">${otp}</div>
          <p class="note">This code will expire shortly. If you didn't request this, you can safely ignore this email.</p>
        </div>
        <div class="cta">
          <a class="btn" href="#" target="_blank" rel="noreferrer">Open YatraTravel</a>
        </div>
      </div>
      <div class="footer">© ${new Date().getFullYear()} YatraTravel. All rights reserved.</div>
    </div>
  </body>
</html>`;

  const text = `Hi ${displayName},\n\nYour YatraTravel OTP is ${otp}. It will expire shortly. If you didn't request this, please ignore this email.`;

  return { subject, html, text };
}


