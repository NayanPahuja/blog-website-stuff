#!/usr/bin/env node
/**
 * Quick diagnostic to check if environment variables are being read correctly
 */

import { config } from 'dotenv';
import { readFileSync } from 'fs';

console.log('=== Environment Variable Debug ===\n');

// Load .env.local
config({ path: '.env.local' });

console.log('From .env.local:');
console.log('  NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✓ Set' : '✗ Missing');
console.log('  NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing');
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✓ Set' : '✗ Missing');
console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✓ Set' : '✗ Missing');

console.log('\nFrom .dev.vars:');
try {
  const devVars = readFileSync('.dev.vars', 'utf-8');
  const lines = devVars.split('\n').filter(l => l.trim() && !l.startsWith('#'));
  lines.forEach(line => {
    const [key] = line.split('=');
    console.log(`  ${key}: ✓ Set`);
  });
} catch (err) {
  console.log('  Error reading .dev.vars:', err.message);
}

console.log('\n=== Database Connection Test ===\n');
if (process.env.DATABASE_URL) {
  console.log('DATABASE_URL format check:');
  const url = process.env.DATABASE_URL;
  console.log('  Protocol:', url.startsWith('postgresql://') ? '✓ postgresql://' : '✗ Invalid');
  console.log('  Has pooler:', url.includes('pooler.supabase.com') ? '✓ Pooled connection' : '⚠ Direct connection');
  console.log('  Port:', url.includes(':6543/') ? '✓ 6543 (transaction mode)' : '⚠ Check port');
} else {
  console.log('DATABASE_URL not set!');
}
