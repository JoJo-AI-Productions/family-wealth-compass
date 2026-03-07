#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const DEFAULT_ORIGIN = 'https://family-wealth-compass-001.netlify.app';

function parseArgs(argv) {
  const args = {
    origin: DEFAULT_ORIGIN,
    browser: 'chrome',
    profile: '',
    output: './localstorage-export.json',
    debug: false,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === '--origin') args.origin = argv[++i] ?? args.origin;
    else if (token === '--browser') args.browser = argv[++i] ?? args.browser;
    else if (token === '--profile') args.profile = argv[++i] ?? args.profile;
    else if (token === '--output') args.output = argv[++i] ?? args.output;
    else if (token === '--debug') args.debug = true;
    else if (token === '--help' || token === '-h') {
      printHelp();
      process.exit(0);
    }
  }

  return args;
}

function printHelp() {
  console.log(`\nExtract localStorage payloads for an origin from Chromium LevelDB files.\n\nUsage:\n  node scripts/export-netlify-localstorage.mjs [options]\n\nOptions:\n  --origin <url>      Origin to recover. Default: ${DEFAULT_ORIGIN}\n  --browser <name>    chrome | edge | brave. Default: chrome\n  --profile <path>    Browser profile root path (contains Local Storage/leveldb)\n  --output <path>     Output JSON file. Default: ./localstorage-export.json\n  --debug             Print detailed debug logs\n  -h, --help          Show help\n\nExamples:\n  node scripts/export-netlify-localstorage.mjs --debug\n  node scripts/export-netlify-localstorage.mjs --browser edge --output ./debug/export.json\n  node scripts/export-netlify-localstorage.mjs --profile "C:\\Users\\me\\AppData\\Local\\Google\\Chrome\\User Data\\Default" --debug\n`);
}

function log(debug, ...msg) {
  if (debug) console.log('[debug]', ...msg);
}

function resolveDefaultProfile(browser) {
  const home = os.homedir();
  const platform = process.platform;
  const b = browser.toLowerCase();

  if (platform === 'darwin') {
    if (b === 'edge') return path.join(home, 'Library/Application Support/Microsoft Edge/Default');
    if (b === 'brave') return path.join(home, 'Library/Application Support/BraveSoftware/Brave-Browser/Default');
    return path.join(home, 'Library/Application Support/Google/Chrome/Default');
  }

  if (platform === 'win32') {
    const local = process.env.LOCALAPPDATA || path.join(home, 'AppData/Local');
    if (b === 'edge') return path.join(local, 'Microsoft/Edge/User Data/Default');
    if (b === 'brave') return path.join(local, 'BraveSoftware/Brave-Browser/User Data/Default');
    return path.join(local, 'Google/Chrome/User Data/Default');
  }

  // linux
  if (b === 'edge') return path.join(home, '.config/microsoft-edge/Default');
  if (b === 'brave') return path.join(home, '.config/BraveSoftware/Brave-Browser/Default');
  return path.join(home, '.config/google-chrome/Default');
}

function readLevelDbFiles(leveldbDir, debug) {
  const entries = fs.readdirSync(leveldbDir, { withFileTypes: true });
  const files = entries
    .filter((e) => e.isFile() && /\.(log|ldb|sst)$/i.test(e.name))
    .map((e) => path.join(leveldbDir, e.name));

  log(debug, `Found ${files.length} LevelDB files.`);

  const chunks = [];
  for (const file of files) {
    try {
      const buf = fs.readFileSync(file);
      log(debug, `Read ${file} (${buf.length} bytes)`);
      chunks.push({ file, text: buf.toString('latin1') });
    } catch (err) {
      log(debug, `Skip unreadable file ${file}:`, err.message);
    }
  }
  return chunks;
}

function extractBalancedJson(text, startIndex) {
  const start = text.indexOf('{', startIndex);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const ch = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === '{') depth += 1;
    else if (ch === '}') {
      depth -= 1;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}

function recoverData(chunks, origin, debug) {
  const keyHints = [
    'family-finance-data',
    'family-finance-auth',
    'family-finance-users',
    'family-finance-legacy-migrated',
  ];

  const findings = [];

  for (const chunk of chunks) {
    if (!chunk.text.includes(origin) && !chunk.text.includes('family-finance-')) continue;

    for (const key of keyHints) {
      let idx = chunk.text.indexOf(key);
      while (idx !== -1) {
        const candidateJson = extractBalancedJson(chunk.text, idx);
        let parsed = null;
        if (candidateJson) {
          try {
            parsed = JSON.parse(candidateJson);
          } catch {
            // ignore
          }
        }

        findings.push({
          file: chunk.file,
          keyHint: key,
          index: idx,
          hasOriginHint: chunk.text.slice(Math.max(0, idx - 400), idx + 400).includes(origin),
          parsed,
          rawSnippet: chunk.text.slice(Math.max(0, idx - 80), idx + 240),
        });

        idx = chunk.text.indexOf(key, idx + key.length);
      }
    }
  }

  // Deduplicate parsed JSON by content
  const parsedMap = new Map();
  for (const f of findings) {
    if (!f.parsed) continue;
    const s = JSON.stringify(f.parsed);
    if (!parsedMap.has(s)) parsedMap.set(s, f.parsed);
  }

  const parsedCandidates = [...parsedMap.values()];
  const financeStates = parsedCandidates.filter((obj) => Array.isArray(obj?.transactions));

  log(debug, `Total findings=${findings.length}, parsedCandidates=${parsedCandidates.length}, financeStates=${financeStates.length}`);

  return {
    summary: {
      origin,
      findings: findings.length,
      parsedCandidates: parsedCandidates.length,
      financeStates: financeStates.length,
      generatedAt: new Date().toISOString(),
    },
    bestGuess: {
      financeData: financeStates[0] ?? null,
      allFinanceCandidates: financeStates,
    },
    findings,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const profileRoot = args.profile || resolveDefaultProfile(args.browser);
  const leveldbDir = path.join(profileRoot, 'Local Storage', 'leveldb');

  console.log('[info] origin:', args.origin);
  console.log('[info] browser:', args.browser);
  console.log('[info] profileRoot:', profileRoot);
  console.log('[info] leveldbDir:', leveldbDir);

  if (!fs.existsSync(leveldbDir)) {
    console.error('[error] LevelDB directory does not exist. Please pass --profile explicitly.');
    process.exit(1);
  }

  const chunks = readLevelDbFiles(leveldbDir, args.debug);
  if (chunks.length === 0) {
    console.error('[error] No LevelDB files found.');
    process.exit(1);
  }

  const recovered = recoverData(chunks, args.origin, args.debug);

  fs.mkdirSync(path.dirname(args.output), { recursive: true });
  fs.writeFileSync(args.output, JSON.stringify(recovered, null, 2), 'utf8');

  console.log('[info] export saved to:', path.resolve(args.output));
  console.log('[info] summary:', recovered.summary);

  if (args.debug) {
    console.log('[debug] First 5 findings:');
    recovered.findings.slice(0, 5).forEach((f, i) => {
      console.log(`  #${i + 1}`, {
        file: f.file,
        keyHint: f.keyHint,
        hasOriginHint: f.hasOriginHint,
        parsed: Boolean(f.parsed),
      });
    });
    console.log('[debug] financeDataDetected:', Boolean(recovered.bestGuess.financeData));
  }
}

main();
