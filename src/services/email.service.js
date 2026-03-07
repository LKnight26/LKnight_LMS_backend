/**
 * Email service using Resend API.
 * Requires RESEND_API_KEY and FROM_EMAIL (e.g. "LKnight LMS <noreply@yourdomain.com>") in .env.
 */
let resend = null;

function getResend() {
  if (resend) return resend;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  try {
    const { Resend } = require('resend');
    resend = new Resend(apiKey);
    return resend;
  } catch (e) {
    return null;
  }
}

/**
 * Send an email via Resend. Returns { sent: true } or { sent: false, error }.
 * @param {string} to - Recipient email
 * @param {string} subject - Subject line
 * @param {string} html - HTML body
 * @returns {Promise<{ sent: boolean, error?: object }>}
 */
async function sendEmail(to, subject, html) {
  const client = getResend();
  if (!client) {
    console.warn('[EMAIL] RESEND_API_KEY not set; skipping send.');
    return { sent: false, error: { message: 'Email not configured' } };
  }

  const from = process.env.FROM_EMAIL || process.env.RESEND_FROM || 'LKnight LMS <onboarding@resend.dev>';
  const { data, error } = await client.emails.send({
    from,
    to: [to],
    subject,
    html,
  });

  if (error) {
    console.error('[EMAIL] Resend error:', error);
    return { sent: false, error };
  }
  return { sent: true, id: data?.id };
}

/**
 * Send team invitation email (existing user: access granted; new user: sign up to accept).
 * @param {object} opts
 * @param {string} opts.to - Invitee email
 * @param {string} opts.inviterName - e.g. "John Doe"
 * @param {string} opts.acceptUrl - Full URL to dashboard or accept-invite page
 * @param {boolean} opts.isExistingUser - If true, message says access is already granted
 */
async function sendTeamInvitationEmail({ to, inviterName, acceptUrl, isExistingUser }) {
  const subject = 'You have access to Knight LMS';
  const inviterText = inviterName ? `${inviterName} gave you access to Knight LMS.` : 'You have been given access to Knight LMS.';
  const ctaText = isExistingUser ? 'Go to Dashboard' : 'Accept & Go to Dashboard';
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; padding: 24px;">
  <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.06); overflow: hidden;">
    <div style="background: linear-gradient(135deg, #000E51 0%, #001570 100%); padding: 28px 32px; text-align: center;">
      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 700;">Knight LMS</h1>
      <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">You have access</p>
    </div>
    <div style="padding: 32px;">
      <p style="margin: 0 0 16px; color: #1f2937; font-size: 16px; line-height: 1.5;">
        ${inviterText}
      </p>
      <p style="margin: 0 0 24px; color: #4b5563; font-size: 15px; line-height: 1.5;">
        ${isExistingUser ? 'You can sign in and go to your dashboard to start learning.' : 'Click the button below to accept and go to your dashboard. If you don\'t have an account yet, you\'ll be able to create one.'}
      </p>
      <p style="margin: 0; text-align: center;">
        <a href="${acceptUrl}" style="display: inline-block; padding: 14px 28px; background: #FF6F00; color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 10px;">${ctaText}</a>
      </p>
    </div>
    <div style="padding: 16px 32px; background: #f9fafb; border-top: 1px solid #e5e7eb;">
      <p style="margin: 0; color: #6b7280; font-size: 12px; text-align: center;">
        This invitation was sent by Knight LMS. If you didn't expect this email, you can ignore it.
      </p>
    </div>
  </div>
</body>
</html>
`;
  return sendEmail(to, subject, html);
}

module.exports = {
  sendEmail,
  sendTeamInvitationEmail,
};
