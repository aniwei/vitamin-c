
const fs = require('fs');
const path = require('path');

const wasmPath = process.argv[2];
if (!wasmPath) {
  console.error('Usage: node list-wasm-imports.js <path-to-wasm>');
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

  if (sectionId === 2) { // Import Section
    console.log('--- Imports ---');
    const count = readU32LEB();
    for (let i = 0; i < count; i++) {
      const module = readStr();
      const field = readStr();
      const kind = readU8(); // 0: func, 1: table, 2: mem, 3: global
      console.log(`Import: ${module}.${field} (kind: ${kind})`);
      
      if (kind === 0) {
        const typeIdx = readU32LEB();
      } else if (kind === 1) {
        // TableType
        readU8(); // elemtype
        const flags = readU32LEB();
        readU32LEB(); // min
        if (flags & 1) readU32LEB(); // max
      } else if (kind === 2) {
        // MemType
        const flags = readU32LEB();
        readU32LEB(); // min
        if (flags & 1) readU32LEB(); // max
      } else if (kind === 3) {
        // GlobalType
        readU8(); // valtype
        readU8(); // mut
      }
    }
  } else {
    // Skip
    pos = sectionEnd;
  }
}
