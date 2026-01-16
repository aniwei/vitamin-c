
const fs = require('fs');

const wasmPath = process.argv[2];
if (!wasmPath) {
  console.error('Usage: node list-wasm-exports.js <path-to-wasm>');
  process.exit(1);
}

const buffer = fs.readFileSync(wasmPath);
const bytes = new Uint8Array(buffer);

// Helpers
let pos = 0;
function readU8() { return bytes[pos++]; }
function readU32LEB() {
  let result = 0;
  let shift = 0;
  while (true) {
    const byte = bytes[pos++];
    result |= (byte & 0x7f) << shift;
    if ((byte & 0x80) === 0) return result >>> 0;
    shift += 7;
  }
}
function readStr() {
  const len = readU32LEB();
  const start = pos;
  pos += len;
  return buffer.subarray(start, start + len).toString('utf8');
}

// Magic & Version
pos = 8;

while (pos < bytes.length) {
  const sectionId = readU8();
  const sectionSize = readU32LEB();
  const sectionEnd = pos + sectionSize;

  if (sectionId === 7) { // Export Section
    console.log('--- Exports ---');
    const count = readU32LEB();
    for (let i = 0; i < count; i++) {
      const field = readStr();
      const kind = readU8(); // 0: func, 1: table, 2: mem, 3: global
      const index = readU32LEB();
      console.log(`Export: ${field} (kind: ${kind}, index: ${index})`);
    }
  } else {
    // Skip
    pos = sectionEnd;
  }
}
