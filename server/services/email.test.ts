import assert from 'node:assert/strict';
import type { EmailParams } from './email';
import { generateMagicLinkEmail } from './email';

const ENV_KEYS_TO_RESET = [
  'MAGIC_LINK_BASE_URL',
  'RENDER_EXTERNAL_URL',
  'VERCEL_URL',
  'DEPLOYMENT_URL',
  'SITE_URL',
  'URL',
  'REPLIT_DOMAINS',
] as const;

interface EnvMap {
  [key: string]: string | undefined;
}

function withEnv(env: EnvMap, fn: () => void) {
  const originalValues = new Map<string, string | undefined>();

  for (const key of ENV_KEYS_TO_RESET) {
    originalValues.set(key, process.env[key]);
    delete process.env[key];
  }

  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    fn();
  } finally {
    for (const [key, value] of originalValues.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function extractMagicLink(params: EmailParams): string {
  const text = params.text ?? '';
  const match = text.match(/https?:\/\/\S+/);
  if (!match) {
    throw new Error('Magic link URL not found in email text.');
  }
  return match[0];
}

interface TestCase {
  name: string;
  env: EnvMap;
  expectedBase: string;
}

const TOKEN = 'test-token';
const EMAIL = 'user@example.com';
const VIDEO_TITLE = 'Demo Training';

const cases: TestCase[] = [
  {
    name: 'uses MAGIC_LINK_BASE_URL when defined with scheme',
    env: { MAGIC_LINK_BASE_URL: 'https://custom.example' },
    expectedBase: 'https://custom.example',
  },
  {
    name: 'prefers TaskSafe domain over Render default host',
    env: { RENDER_EXTERNAL_URL: 'https://tasksafe.onrender.com' },
    expectedBase: 'https://tasksafe.au',
  },
  {
    name: 'normalizes provider URL without protocol',
    env: { VERCEL_URL: 'tasksafe.vercel.app' },
    expectedBase: 'https://tasksafe.vercel.app',
  },
  {
    name: 'supports Replit provided domains',
    env: { REPLIT_DOMAINS: 'preview.tasksafe.repl.co' },
    expectedBase: 'https://preview.tasksafe.repl.co',
  },
  {
    name: 'uses localhost as a final fallback',
    env: {},
    expectedBase: 'http://localhost:5000',
  },
];

let failures = 0;

for (const testCase of cases) {
  try {
    withEnv(testCase.env, () => {
      const emailParams = generateMagicLinkEmail(EMAIL, TOKEN, VIDEO_TITLE);
      const link = extractMagicLink(emailParams);
      const expectedLink = `${testCase.expectedBase}/access?token=${encodeURIComponent(TOKEN)}`;
      assert.equal(link, expectedLink);
    });
    console.log(`✓ ${testCase.name}`);
  } catch (error) {
    failures += 1;
    console.error(`✗ ${testCase.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log('All email URL tests passed.');
}
