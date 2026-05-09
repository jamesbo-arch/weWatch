// Generates PNG frames for aurora wave animation, then uses FFmpeg to create GIF.
// Pure Node.js stdlib for PNG generation (same engine as gen-backgrounds.mjs).
import { deflateSync } from 'zlib';
import { writeFileSync, mkdirSync, existsSync, unlinkSync } from 'fs';
import { execSync } from 'child_process';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ANIM_DIR = join(__dirname, 'resources/animations');
const FRAMES_DIR = join(ANIM_DIR, 'frames');
const GIF_OUT = join(ANIM_DIR, 'aurora_wave.gif');

const W = 416, H = 416, FRAMES = 8;

if (!existsSync(ANIM_DIR)) mkdirSync(ANIM_DIR);
if (!existsSync(FRAMES_DIR)) mkdirSync(FRAMES_DIR);

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

function makeAuroraFrame(t) {
    const cx = W / 2, cy = H / 2, maxR = Math.min(cx, cy);
    const pixels = new Uint8Array(W * H * 3);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const dx = x - cx, dy = y - cy;
            const r = Math.sqrt(dx * dx + dy * dy) / maxR;
            const tr = Math.min(r, 1);
            let R = lerp(0, 20, tr);
            let G = lerp(6, 0, tr);
            let B = lerp(30, 40, tr);
            for (let b = 0; b < 3; b++) {
                const bandY = 0.25 + b * 0.22;
                const phase = (t + b * 0.33) % 1;
                const yNorm = (y / H - bandY + phase * 0.3) * 5;
                const wave = Math.sin(yNorm * Math.PI) * 0.5 + 0.5;
                const bandMask = Math.max(0, 1 - Math.abs(r - (0.4 + b * 0.2)) / 0.25) * wave;
                R += Math.round(bandMask * 10);
                G += Math.round(bandMask * 100);
                B += Math.round(bandMask * 80);
            }
            const glow = Math.max(0, 1 - r / 0.35);
            R += Math.round(glow * glow * 30);
            G += Math.round(glow * glow * 60);
            B += Math.round(glow * glow * 140);
            const i = (y * W + x) * 3;
            pixels[i]   = Math.min(255, R);
            pixels[i+1] = Math.min(255, G);
            pixels[i+2] = Math.min(255, B);
        }
    }
    return pixels;
}

// ---- PNG encoder (same as gen-backgrounds.mjs) ----------------------------

function crc32(buf) {
    let crc = 0xFFFFFFFF;
    const table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
        let c = i;
        for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
        table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
    const typeBuf = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4);
    lenBuf.writeUInt32BE(data.length, 0);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function makePNG(pixels) {
    const rows = [];
    for (let y = 0; y < H; y++) {
        const row = Buffer.alloc(1 + W * 3);
        row[0] = 0;
        for (let x = 0; x < W; x++) {
            const i = (y * W + x) * 3;
            row[1 + x * 3] = pixels[i];
            row[1 + x * 3 + 1] = pixels[i + 1];
            row[1 + x * 3 + 2] = pixels[i + 2];
        }
        rows.push(row);
    }
    const raw = Buffer.concat(rows);
    const compressed = deflateSync(raw, { level: 6 });
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(W, 0);
    ihdr.writeUInt32BE(H, 4);
    ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = ihdr[11] = ihdr[12] = 0;
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', ihdr),
        chunk('IDAT', compressed),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

// ---- Main ----------------------------------------------------------------

console.log(`Generating ${FRAMES} PNG frames...`);
for (let i = 0; i < FRAMES; i++) {
    const t = i / FRAMES;
    const pixels = makeAuroraFrame(t);
    const png = makePNG(pixels);
    const path = join(FRAMES_DIR, `frame_${String(i).padStart(3, '0')}.png`);
    writeFileSync(path, png);
    console.log(`  Frame ${i+1}/${FRAMES}: ${(png.length/1024).toFixed(1)} KB`);
}

// Combine with FFmpeg into GIF
console.log('Combining frames with FFmpeg...');
execSync(
    `ffmpeg -y -framerate 6 -i "${FRAMES_DIR}/frame_%03d.png" ` +
    `-vf "split[s0][s1];[s0]palettegen=max_colors=256:reserve_transparent=0[p];[s1][p]paletteuse" ` +
    `-loop 0 "${GIF_OUT}"`,
    { stdio: 'inherit' }
);

// Cleanup frame PNGs
for (let i = 0; i < FRAMES; i++) {
    unlinkSync(join(FRAMES_DIR, `frame_${String(i).padStart(3, '0')}.png`));
}

console.log(`Done: ${GIF_OUT}`);
