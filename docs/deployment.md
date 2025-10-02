# Deployment Notes

## Magic Link Base URL Configuration

Magic link emails now rely on a dedicated `MAGIC_LINK_BASE_URL` environment variable to determine the host that should appear in links. The resolver automatically falls back to provider-specific defaults (`RENDER_EXTERNAL_URL`, `VERCEL_URL`, etc.) and finally to `http://localhost:5000` during local development, but explicitly setting `MAGIC_LINK_BASE_URL` avoids guessing the correct hostname.

### Render

1. Navigate to your Render service dashboard.
2. Open the **Environment** tab and add a new environment variable:
   - **Key**: `MAGIC_LINK_BASE_URL`
   - **Value**: The full public URL of your service (for example, `https://tasksafe.au`).
3. Deploy or restart the service so the new value is picked up.

With this configuration, generated magic links will always reference the deployed hostname instead of defaulting to `localhost`.
