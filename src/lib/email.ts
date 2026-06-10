import { Resend } from "resend";
import { SUPPORT_EMAIL } from "@/lib/site";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

export async function sendVerificationEmail(email: string, otp: string) {
  const from = process.env.RESEND_FROM ?? "Ranked CS2 <onboarding@resend.dev>";

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:480px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:32px 32px 24px;text-align:center;border-bottom:1px solid #f3f4f6;">
              <div style="font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.02em;">Ranked CS2</div>
              <div style="font-size:14px;color:#6b7280;margin-top:4px;">Verify your email</div>
            </td>
          </tr>
          <tr>
            <td style="padding:32px;">
              <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#374151;">
                Enter this code to verify your account and start climbing the leaderboard.
              </p>
              <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:20px;text-align:center;margin:24px 0;">
                <span style="font-size:32px;font-weight:700;letter-spacing:8px;color:#111827;font-family:monospace;">${otp}</span>
              </div>
              <p style="margin:0;font-size:13px;color:#9ca3af;line-height:1.5;">
                This code expires in 15 minutes. If you didn't create an account, you can ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:20px 32px;background:#f9fafb;text-align:center;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">ranked.sushii.dev</p>
              <p style="margin:8px 0 0;font-size:12px;color:#9ca3af;">Help: ${SUPPORT_EMAIL}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  if (!resend) {
    console.log(`[dev] OTP for ${email}: ${otp}`);
    return { id: "dev" };
  }

  const result = await resend.emails.send({
    from,
    to: email,
    subject: "Your Ranked CS2 verification code",
    html,
  });

  if (result.error) throw new Error(result.error.message);
  return result.data;
}
