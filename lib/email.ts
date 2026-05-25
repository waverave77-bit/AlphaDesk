import { Resend } from 'resend'

function getResend() { return new Resend(process.env.RESEND_API_KEY) }

const FROM = 'Mr. Guy Invests <noreply@mrguyinvests.com>'

// ─── Password Reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: 'Reset your Mr. Guy Invests password',
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
        <div style="margin-bottom:28px;">
          <span style="font-size:28px;">🧑‍💼</span>
          <span style="font-size:18px;font-weight:700;color:#111;margin-left:8px;vertical-align:middle;">Mr. Guy Invests</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 12px;color:#111;">Reset your password</h2>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 28px;">
          Someone requested a password reset for your account. If that was you, click below — this link expires in <strong>1 hour</strong>.
        </p>
        <a href="${resetUrl}" style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
          Reset Password
        </a>
        <p style="color:#999;font-size:13px;margin-top:32px;line-height:1.5;">
          If you didn't request this, you can safely ignore this email. Your password won't change.
        </p>
        <p style="color:#ccc;font-size:12px;margin-top:12px;">
          Or copy this link: <a href="${resetUrl}" style="color:#2563eb;">${resetUrl}</a>
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px;" />
        <p style="color:#ccc;font-size:11px;margin:0;">Mr. Guy Invests · mrguyinvests.com</p>
      </div>
    `,
  })
}

// ─── Welcome Email ────────────────────────────────────────────────────────────

export async function sendWelcomeEmail(email: string, username: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to Mr. Guy Invests 🧑‍💼",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
        <div style="margin-bottom:28px;">
          <span style="font-size:28px;">🧑‍💼</span>
          <span style="font-size:18px;font-weight:700;color:#111;margin-left:8px;vertical-align:middle;">Mr. Guy Invests</span>
        </div>
        <h2 style="font-size:22px;font-weight:700;margin:0 0 12px;color:#111;">Hey ${username}, you're in! 👋</h2>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Mr. Guy is ready to help you understand the stock market in plain English — no finance degree needed.
        </p>
        <p style="color:#555;font-size:14px;line-height:1.6;margin:0 0 20px;">Here's where to start:</p>
        <ul style="color:#555;font-size:14px;line-height:2;padding-left:20px;margin:0 0 28px;">
          <li>💬 <strong>Ask Mr. Guy</strong> — chat about any stock or finance question</li>
          <li>📊 <strong>Research stocks</strong> — see AI analysis, analyst ratings, earnings history</li>
          <li>👀 <strong>Smart Money</strong> — see what hedge funds and insiders are buying</li>
          <li>🏆 <strong>$100K Challenge</strong> — build a virtual portfolio and compete</li>
        </ul>
        <a href="https://mrguyinvests.com/dashboard" style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
          Go to Dashboard →
        </a>
        <p style="color:#999;font-size:13px;margin-top:32px;line-height:1.5;">
          Free forever. Upgrade to Pro for unlimited AI features at $4.99/month.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px;" />
        <p style="color:#ccc;font-size:11px;margin:0;">Mr. Guy Invests · mrguyinvests.com</p>
      </div>
    `,
  })
}

// ─── Pro Upgrade ──────────────────────────────────────────────────────────────

export async function sendProUpgradeEmail(email: string) {
  return getResend().emails.send({
    from: FROM,
    to: email,
    subject: "You're now a Pro member 🚀",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:480px;margin:0 auto;padding:40px 24px;background:#fff;">
        <div style="margin-bottom:28px;">
          <span style="font-size:28px;">🧑‍💼</span>
          <span style="font-size:18px;font-weight:700;color:#111;margin-left:8px;vertical-align:middle;">Mr. Guy Invests</span>
        </div>
        <div style="background:linear-gradient(135deg,#1e3a8a 0%,#2563eb 100%);border-radius:16px;padding:28px 24px;margin-bottom:28px;text-align:center;">
          <div style="font-size:40px;margin-bottom:8px;">👑</div>
          <h2 style="font-size:22px;font-weight:700;color:#fff;margin:0 0 8px;">Welcome to Pro!</h2>
          <p style="color:#bfdbfe;font-size:14px;margin:0;">You now have full access to everything Mr. Guy has to offer.</p>
        </div>
        <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 20px;">
          Here's what's unlocked for you:
        </p>
        <ul style="color:#555;font-size:14px;line-height:2;padding-left:20px;margin:0 0 28px;">
          <li>💬 <strong>Unlimited Mr. Guy chat</strong> — no more 3/day cap</li>
          <li>🤖 <strong>Unlimited AI stock analysis</strong> on every research page</li>
          <li>⚡ <strong>Unlimited Spike Summaries, Report Cards, Bull vs Bear</strong></li>
          <li>🔍 <strong>Unlimited Reality Check, Am I Dumb, BS Checker</strong></li>
          <li>👥 <strong>Full Smart Money access</strong> — all insider trades & top investors</li>
          <li>🏦 <strong>Full Hedge Fund tracker</strong> — all funds unlocked</li>
        </ul>
        <a href="https://mrguyinvests.com/dashboard" style="display:inline-block;background:#2563eb;color:#fff;font-weight:600;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
          Go to Dashboard →
        </a>
        <p style="color:#999;font-size:13px;margin-top:32px;line-height:1.5;">
          Questions? Just reply to this email. Mr. Guy's got your back.
        </p>
        <hr style="border:none;border-top:1px solid #eee;margin:32px 0 16px;" />
        <p style="color:#ccc;font-size:11px;margin:0;">Mr. Guy Invests · mrguyinvests.com · $4.99/month, cancel anytime</p>
      </div>
    `,
  })
}
