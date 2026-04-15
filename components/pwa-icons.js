const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const outDir = path.join(process.cwd(), 'public');
fs.mkdirSync(outDir, { recursive: true });

function crc32(buf) {
  let crc = ~0;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return ~crc >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function png(size) {
  const signature = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0;
    for (let x = 0; x < size; x++) {
      const idx = 1 + x * 4;
      const t = x / Math.max(1, size - 1);
      row[idx] = Math.round(125 + (167 - 125) * t);
      row[idx + 1] = Math.round(211 + (139 - 211) * t);
      row[idx + 2] = Math.round(252 + (250 - 252) * t);
      row[idx + 3] = 255;
    }
    rows.push(row);
  }

  const raw = Buffer.concat(rows);
  const idat = zlib.deflateSync(raw);
  const file = Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0))
  ]);
  return file;
}

for (const size of [192, 512]) {
  fs.writeFileSync(path.join(outDir, `icon-${size}.png`), png(size));
}

console.log('PWA icons generated');
