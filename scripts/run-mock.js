#!/usr/bin/env node
/**
 * Cross-platform helper to run Prism mock in Docker.
 *
 * Usage (via npm scripts):
 *  npm run mock           -> foreground (--rm)
 *  npm run mock:detached  -> detached (named container prism-mock)
 *  npm run mock:rm        -> detached + --rm (ephemeral)
 *  npm run mock:stop      -> stop + remove prism-mock
 *
 * This script resolves an absolute path to openapi/statement-api.yaml and runs docker appropriately.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const args = process.argv.slice(2);
const isDetached = args.includes('--detached');
const isStop = args.includes('--stop');
const isEphemeral = args.includes('--ephemeral');

const SPEC_REL = 'openapi/statement-api.yaml';
const SPEC_ABS = path.resolve(process.cwd(), SPEC_REL);

if (isStop) {
  const stop = spawn('docker', ['stop', 'prism-mock'], { stdio: 'inherit' });
  stop.on('close', (code) => {
    const rm = spawn('docker', ['rm', 'prism-mock'], { stdio: 'inherit' });
    rm.on('close', (c2) => process.exit(code || c2));
  });
  return;
}

if (!fs.existsSync(SPEC_ABS)) {
  console.error(`Spec not found at ${SPEC_ABS}`);
  console.error('If you prefer to run Prism from a remote raw URL, use: npm run mock:raw');
  process.exit(1);
}

// mountArg is hostAbsolute:/tmp/api.yaml
const mountArg = `${SPEC_ABS}:/tmp/api.yaml`;

if (isDetached) {
  // detached, keep container (no --rm)
  const detachedArgs = ['run', '-d', '--name', 'prism-mock', '-p', '4010:4010', '-v', mountArg, 'stoplight/prism:4', 'mock', '-h', '0.0.0.0', '/tmp/api.yaml'];
  console.log('Starting Prism mock (detached) -> container name: prism-mock');
  const p = spawn('docker', detachedArgs, { stdio: 'inherit' });
  p.on('close', (code) => process.exit(code));
} else if (isEphemeral) {
  // detached ephemeral: -d + --rm
  const ephemeralArgs = ['run', '-d', '--rm', '--name', 'prism-mock', '-p', '4010:4010', '-v', mountArg, 'stoplight/prism:4', 'mock', '-h', '0.0.0.0', '/tmp/api.yaml'];
  console.log('Starting Prism mock (detached + ephemeral) -> container will be auto-removed on stop');
  const p = spawn('docker', ephemeralArgs, { stdio: 'inherit' });
  p.on('close', (code) => process.exit(code));
} else {
  // foreground with --rm (similar to Makefile foreground expectation)
  const baseArgs = ['run', '--rm', '-p', '4010:4010', '-v', mountArg, 'stoplight/prism:4', 'mock', '-h', '0.0.0.0', '/tmp/api.yaml'];
  console.log('Starting Prism mock (foreground). Press Ctrl+C to stop.');
  const p = spawn('docker', baseArgs, { stdio: 'inherit' });
  p.on('close', (code) => process.exit(code));
}