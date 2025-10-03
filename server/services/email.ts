import { Resend } from 'resend';

// Initialize Resend
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FALLBACK_LOCAL_HOST = 'localhost:5000';

const DEPLOYMENT_ENV_KEYS = [
  'MAGIC_LINK_BASE_URL',
  'RENDER_EXTERNAL_URL',
  'VERCEL_URL',
  'DEPLOYMENT_URL',
  'SITE_URL',
  'URL',
] as const;

function normalizeBaseUrl(
  candidate: string | undefined | null,
  { protocol = 'https' }: { protocol?: 'http' | 'https' } = {},
): string | null {
  if (!candidate) {
    return null;
  }

  let trimmed = candidate.trim();
  if (!trimmed) {
    return null;
  }

  // Remove trailing slashes to avoid duplicate separators when composing URLs.
  trimmed = trimmed.replace(/\/+$/, '');

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  return `${protocol}://${trimmed}`;
}

function resolveMagicLinkBaseUrl(): string {
  for (const key of DEPLOYMENT_ENV_KEYS) {
    const normalized = normalizeBaseUrl(process.env[key]);
    if (normalized) {
      return normalized;
    }
  }

  const replitDomain = process.env.REPLIT_DOMAINS?.split(',')
    .map((domain) => domain.trim())
    .find(Boolean);

  const normalizedReplitDomain = normalizeBaseUrl(replitDomain);
  if (normalizedReplitDomain) {
    return normalizedReplitDomain;
  }

  return normalizeBaseUrl(FALLBACK_LOCAL_HOST, { protocol: 'http' })!;
}

export interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!resend || !process.env.RESEND_API_KEY) {
      // Fallback to console logging if no API key is configured
      console.log('\n🔗 MAGIC LINK EMAIL (Console Mode - No RESEND_API_KEY)');
      console.log('=====================================');
      console.log(`To: ${params.to}`);
      console.log(`From: ${params.from}`);
      console.log(`Subject: ${params.subject}`);
      console.log('-------------------------------------');
      console.log(params.text);
      console.log('=====================================\n');
      return true;
    }

    // Send email using Resend
    console.log(`📧 Attempting to send email from: ${params.from} to: ${params.to}`);
    
    const { data, error } = await resend.emails.send({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
      react: null,
    });

    if (error) {
      console.error('Resend email error:', error);
      return false;
    }

    console.log(`✅ Email sent successfully via Resend! Email ID: ${data?.id}`);
    return true;
  } catch (error) {
    console.error('Email service error:', error);
    return false;
  }
}

export function generateMagicLinkEmail(email: string, magicLink: string, videoTitle: string): EmailParams {
  const baseUrl = resolveMagicLinkBaseUrl();
  const accessUrl = `${baseUrl}/access?token=${encodeURIComponent(magicLink)}`;

  return {
    to: email,
    from: 'noreply@tasksafe.au',
    subject: `TaskSafe: Access Link for "${videoTitle}"`,
    text: `
Your secure access link for "${videoTitle}" is ready.

Click here to access your training video: ${accessUrl}

Important:
- This link expires in 24 hours
- The link can only be used once
- Your viewing activity will be tracked for compliance

If you didn't request this access link, please ignore this email.

TaskSafe Security Team
    `,
    html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>TaskSafe Access Link</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
            <!-- Header -->
            <div style="background-color: #3b82f6; padding: 20px; text-align: center;">
                <div style="display: inline-flex; align-items: center; gap: 8px;">
                    <div style="width: 32px; height: 32px; background-color: rgba(255,255,255,0.2); border-radius: 6px; display: inline-flex; align-items: center; justify-content: center;">
                        🛡️
                    </div>
                    <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold;">TaskSafe</h1>
                </div>
                <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0; font-size: 14px;">Secure Training Platform</p>
            </div>

            <!-- Content -->
            <div style="padding: 32px 24px;">
                <h2 style="color: #1f2937; margin: 0 0 16px 0; font-size: 20px;">Your Training Video is Ready</h2>
                
                <p style="color: #6b7280; margin: 0 0 24px 0; line-height: 1.5;">
                    Your secure access link for <strong>"${videoTitle}"</strong> has been generated and is ready for viewing.
                </p>

                <!-- CTA Button -->
                <div style="text-align: center; margin: 32px 0;">
                    <a href="${accessUrl}" style="display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500;">
                        Access Training Video
                    </a>
                </div>

                <!-- Security Notice -->
                <div style="background-color: #f3f4f6; border-radius: 6px; padding: 16px; margin: 24px 0;">
                    <div style="display: flex; align-items: flex-start; gap: 12px;">
                        <div style="color: #3b82f6; font-size: 16px;">ℹ️</div>
                        <div>
                            <p style="color: #1f2937; margin: 0 0 8px 0; font-weight: 500;">Security Notice</p>
                            <ul style="color: #6b7280; margin: 0; padding-left: 16px; font-size: 14px;">
                                <li>This link expires in <strong>24 hours</strong></li>
                                <li>The link can only be used <strong>once</strong></li>
                                <li>Your viewing activity will be <strong>tracked for compliance</strong></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <p style="color: #9ca3af; font-size: 12px; margin: 24px 0 0 0;">
                    If you didn't request this access link, please ignore this email.
                </p>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 16px 24px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 12px; margin: 0; text-align: center;">
                    © 2024 TaskSafe. All rights reserved.
                </p>
            </div>
        </div>
    </div>
</body>
</html>
    `
  };
}

interface CompletionEmailParams {
  to: string;
  viewerName: string;
  viewerEmail: string;
  videoTitle: string;
  completedAt: Date;
}

function formatDate(date: Date): string {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function generateCompletionNotificationEmail({
  to,
  viewerName,
  viewerEmail,
  videoTitle,
  completedAt,
}: CompletionEmailParams): EmailParams {
  const completedAtText = formatDate(completedAt);

  const text = `
Training completion notification

Video: ${videoTitle}
Viewer: ${viewerName} (${viewerEmail})
Completed at: ${completedAtText}

The viewer has successfully completed the training video.
`;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Training Completion Notification</title>
</head>
<body style="margin:0;padding:0;font-family:Arial,sans-serif;background-color:#f8fafc;">
  <div style="max-width:600px;margin:0 auto;padding:20px;">
    <div style="background-color:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
      <div style="background-color:#2563eb;padding:20px;text-align:center;color:white;">
        <h1 style="margin:0;font-size:22px;font-weight:600;">Training Completion</h1>
      </div>
      <div style="padding:24px;">
        <p style="margin:0 0 16px 0;color:#1f2937;">Hello,</p>
        <p style="margin:0 0 16px 0;color:#4b5563;">
          The following training video has been completed:
        </p>
        <div style="background-color:#f3f4f6;border-radius:6px;padding:16px;margin-bottom:16px;">
          <p style="margin:0 0 8px 0;color:#1f2937;"><strong>Video:</strong> ${videoTitle}</p>
          <p style="margin:0 0 8px 0;color:#1f2937;"><strong>Viewer:</strong> ${viewerName} (${viewerEmail})</p>
          <p style="margin:0;color:#1f2937;"><strong>Completed at:</strong> ${completedAtText}</p>
        </div>
        <p style="margin:0;color:#6b7280;font-size:14px;">
          This notification was sent automatically by TaskSafe when the viewer reached 100% completion.
        </p>
      </div>
      <div style="background-color:#f9fafb;padding:16px;text-align:center;color:#9ca3af;font-size:12px;">
        © ${new Date().getFullYear()} TaskSafe. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;

  return {
    to,
    from: 'noreply@tasksafe.au',
    subject: `TaskSafe: ${videoTitle} completed`,
    text,
    html,
  };
}
