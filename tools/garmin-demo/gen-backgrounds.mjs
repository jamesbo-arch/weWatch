// Generates background PNG images for Garmin watch face without external dependencies
import { deflateSync } from 'zlib';
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, 'resources/drawables');
const W = 416, H = 416;

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
    // pixels: Uint8Array of width * height * 3 (RGB)
    const rows = [];
    for (let y = 0; y < H; y++) {
        const row = Buffer.alloc(1 + W * 3);
        row[0] = 0; // filter: None
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
    ihdr[8] = 8;  // bit depth
    ihdr[9] = 2;  // color type: RGB
    ihdr[10] = ihdr[11] = ihdr[12] = 0;

    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), // PNG signature
        chunk('IHDR', ihdr),
        chunk('IDAT', compressed),
        chunk('IEND', Buffer.alloc(0)),
    ]);
}

function lerp(a, b, t) { return Math.round(a + (b - a) * t); }

// ── Aurora: dark blue center → blue-purple outer ring + green aurora streaks ──
function makeAurora() {
    const pixels = new Uint8Array(W * H * 3);
    const cx = W / 2, cy = H / 2, maxR = Math.min(cx, cy);
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const dx = x - cx, dy = y - cy;
            const r = Math.sqrt(dx * dx + dy * dy) / maxR; // 0..1+
            const t = Math.min(r, 1);
            // base: deep navy → dark purple
            let R = lerp(0, 30, t);
            let G = lerp(8, 0, t);
            let B = lerp(35, 60, t);
            // green aurora wave at 60% radius (y-based shimmer)
            const wave = Math.sin((y / H) * Math.PI * 3) * 0.5 + 0.5;
            const auroraMask = Math.max(0, 1 - Math.abs(r - 0.6) / 0.25);
            R += Math.round(auroraMask * wave * 0);
            G += Math.round(auroraMask * wave * 80);
            B += Math.round(auroraMask * wave * 40);
            // cyan core glow
            const glow = Math.max(0, 1 - r / 0.4);
            R += Math.round(glow * glow * 20);
            G += Math.round(glow * glow * 40);
            B += Math.round(glow * glow * 120);
            const i = (y * W + x) * 3;
            pixels[i]   = Math.min(255, R);
            pixels[i+1] = Math.min(255, G);
            pixels[i+2] = Math.min(255, B);
        }
    }
    return pixels;
}

// ── Nebula: deep purple core → dark edges + scattered color clouds ───────────
function makeNebula() {
    const pixels = new Uint8Array(W * H * 3);
    const cx = W / 2, cy = H / 2, maxR = Math.min(cx, cy);
    // cloud centers
    const clouds = [
        { x: 0.25, y: 0.25, r: 0.22, R: 160, G: 20, B: 200, a: 0.5 },
        { x: 0.72, y: 0.20, r: 0.18, R: 180, G: 0,  B: 80,  a: 0.45 },
        { x: 0.20, y: 0.72, r: 0.20, R: 0,   G: 60, B: 200, a: 0.4 },
        { x: 0.75, y: 0.70, r: 0.22, R: 120, G: 0,  B: 160, a: 0.45 },
    ];
    for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
            const dx = x - cx, dy = y - cy;
            const dist = Math.sqrt(dx * dx + dy * dy) / maxR;
            const t = Math.min(dist, 1);
            // base: deep purple vignette
            let R = lerp(55, 5, t);
            let G = lerp(0, 0, t);
            let B = lerp(90, 10, t);
            // overlay clouds
            for (const c of clouds) {
                const cdx = x / W - c.x, cdy = y / H - c.y;
                const cr = Math.sqrt(cdx * cdx + cdy * cdy) / c.r;
                const mask = Math.max(0, 1 - cr) * c.a;
                R += Math.round(mask * c.R);
                G += Math.round(mask * c.G);
                B += Math.round(mask * c.B);
            }
            const i = (y * W + x) * 3;
            pixels[i]   = Math.min(255, R);
            pixels[i+1] = Math.min(255, G);
            pixels[i+2] = Math.min(255, B);
        }
    }
    return pixels;
}

writeFileSync(join(OUT_DIR, 'bg_aurora.png'), makePNG(makeAurora()));
console.log('bg_aurora.png written');
writeFileSync(join(OUT_DIR, 'bg_nebula.png'), makePNG(makeNebula()));
console.log('bg_nebula.png written');
