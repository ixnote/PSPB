#!/usr/bin/env node
import http from 'http';

const base = process.env.API_URL || 'http://localhost:4000';
const url = base.replace(/\/$/, '') + '/api/health';

http
  .get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => (data += chunk));
    res.on('end', () => {
      try {
        const j = JSON.parse(data);
        process.exit(j.db === 'ok' ? 0 : 1);
      } catch {
        process.exit(1);
      }
    });
  })
  .on('error', () => process.exit(1));
