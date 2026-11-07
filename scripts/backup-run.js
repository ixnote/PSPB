#!/usr/bin/env node
/**
 * Wrapper to run backup.sh with env from backend/.env
 */
import { readFileSync, existsSync } from 'fs';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');
const envPath = join(rootDir, 'backend', '.env');

// Load backend/.env into process.env
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
        if (key && process.env[key] === undefined) process.env[key] = val;
      }
    }
  }
}

const result = spawnSync('bash', [join(__dirname, 'backup.sh')], {
  stdio: 'inherit',
  env: process.env,
  cwd: rootDir,
});

process.exit(result.status ?? 1);
