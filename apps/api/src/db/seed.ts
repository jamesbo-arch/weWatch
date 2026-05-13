import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as schema from '../infra/db/schema/index.js';

const pool = new Pool({
  connectionString:
    process.env['DATABASE_URL'] ?? 'postgresql://wewatch:wewatch@localhost:5432/wewatch_dev',
});
const db = drizzle(pool, { schema });

const BCRYPT_ROUNDS = 12;

const designers = [
  {
    email: 'alice@wewatch.dev',
    password: 'password123',
    brandName: 'PixelTime Studio',
    bio: 'Minimal designs for active lifestyles.',
  },
  {
    email: 'bob@wewatch.dev',
    password: 'password123',
    brandName: 'NatureWatch',
    bio: 'Nature-inspired Garmin watch faces.',
  },
  {
    email: 'carlos@wewatch.dev',
    password: 'password123',
    brandName: 'TechDial Labs',
    bio: 'Data-driven and tech-themed watch faces.',
  },
  {
    email: 'diana@wewatch.dev',
    password: 'password123',
    brandName: 'Luxe Faces',
    bio: 'Premium luxury and lifestyle watch face designs.',
  },
];

const watchfaceSeed = [
  {
    id: '24669676-c951-4dac-8c6e-052d57c0dfd3',
    designerIdx: 0,
    title: 'Midnight Minimal',
    description: 'Clean dark face with bold time display. Perfect for night runners.',
    thumbnailUrl: '/watch-seeds/midnight-minimal.svg',
    price: 0,
    deviceTargets: ['fenix7', 'fenix7s', 'fr965'],
    downloadCount: 1240,
    renderSpec: {
      v: 2,
      bg: '000000',
      elements: [
        { t: 'time', x: 50, y: 42, c: 'FFFFFF', f: 'hot' },
        { t: 'date', x: 50, y: 72, c: '888888', f: 'small' },
        { t: 'battery', x: 75, y: 82, c: '00FF44', f: 'xtiny' },
        { t: 'heart', x: 25, y: 82, c: 'FF4444', f: 'xtiny' },
      ],
    },
  },
  {
    designerIdx: 0,
    title: 'Arctic Sport',
    description: 'High-contrast design optimized for outdoor activities in bright conditions.',
    thumbnailUrl: '/watch-seeds/arctic-sport.svg',
    price: 299,
    deviceTargets: ['fenix7', 'epix2'],
    downloadCount: 874,
  },
  {
    designerIdx: 0,
    title: 'Neon Pulse',
    description: 'Vivid neon accents on a deep black background. Show your training data in style.',
    thumbnailUrl: '/watch-seeds/neon-pulse.svg',
    price: 199,
    deviceTargets: ['fr965', 'fr265'],
    downloadCount: 2105,
  },
  {
    designerIdx: 0,
    title: 'Grid Runner',
    description: 'Data-dense layout with pace, HR, and battery on a single glance.',
    thumbnailUrl: '/watch-seeds/grid-runner.svg',
    price: 0,
    deviceTargets: ['fr265', 'fr265s', 'fr165'],
    downloadCount: 3412,
  },
  {
    designerIdx: 1,
    title: 'Forest Dawn',
    description: 'Warm earthy tones inspired by morning hikes. Analog hands with sunrise indicator.',
    thumbnailUrl: '/watch-seeds/forest-dawn.svg',
    price: 349,
    deviceTargets: ['fenix7', 'fenix7s', 'fenix7x'],
    downloadCount: 567,
  },
  {
    designerIdx: 1,
    title: 'Ocean Depth',
    description: 'Deep blue palette with tide and moon phase complications.',
    thumbnailUrl: '/watch-seeds/ocean-depth.svg',
    price: 299,
    deviceTargets: ['fenix7', 'epix2'],
    downloadCount: 921,
  },
  {
    designerIdx: 1,
    title: 'Summit',
    description: 'Altitude, pressure trend, and weather at a glance. Built for mountaineers.',
    thumbnailUrl: '/watch-seeds/summit.svg',
    price: 0,
    deviceTargets: ['fenix7x', 'fenix8solar'],
    downloadCount: 1893,
  },
  {
    designerIdx: 1,
    title: 'Zen Circle',
    description: 'Minimalist analog face with a single activity ring. Less is more.',
    thumbnailUrl: '/watch-seeds/zen-circle.svg',
    price: 149,
    deviceTargets: ['fr265', 'fr965', 'vivoactive5'],
    downloadCount: 4201,
  },
  {
    designerIdx: 2,
    title: 'Solar Flare',
    description: 'Tracks solar energy harvesting with UV index and temperature. Built for epix Solar.',
    thumbnailUrl: '/watch-seeds/solar-flare.svg',
    price: 249,
    deviceTargets: ['fenix7solar', 'fenix8solar', 'epix2pro'],
    downloadCount: 763,
  },
  {
    designerIdx: 2,
    title: 'Tactical Ops',
    description: 'Military-grade display with bearing, grid coordinates, and stopwatch.',
    thumbnailUrl: '/watch-seeds/tactical-ops.svg',
    price: 0,
    deviceTargets: ['instinct2', 'instinct2s', 'tactix7'],
    downloadCount: 2891,
  },
  {
    designerIdx: 2,
    title: 'Retro Digital',
    description: '7-segment LCD aesthetic straight out of the 80s. Retro gaming vibes.',
    thumbnailUrl: '/watch-seeds/retro-digital.svg',
    price: 99,
    deviceTargets: ['fr265', 'fr165', 'vivoactive5'],
    downloadCount: 5034,
  },
  {
    designerIdx: 2,
    title: 'Aurora',
    description: 'Northern lights shimmer across your wrist. Ethereal and calming.',
    thumbnailUrl: '/watch-seeds/aurora.svg',
    price: 299,
    deviceTargets: ['fenix7', 'epix2', 'fr965'],
    downloadCount: 1122,
  },
  {
    designerIdx: 2,
    title: 'Binary Clock',
    description: 'Tell time in binary. For those who speak the language of machines.',
    thumbnailUrl: '/watch-seeds/binary-clock.svg',
    price: 0,
    deviceTargets: ['fr265', 'fr965', 'fenix7'],
    downloadCount: 3307,
  },
  {
    designerIdx: 3,
    title: 'Carbon Fiber',
    description: 'Motorsport-inspired carbon weave with lap timer and tachometer arc.',
    thumbnailUrl: '/watch-seeds/carbon-fiber.svg',
    price: 349,
    deviceTargets: ['fenix7', 'epix2', 'fenix7x'],
    downloadCount: 988,
  },
  {
    designerIdx: 3,
    title: 'Rose Gold',
    description: 'Luxury analog face with rose gold hands and elegant date window.',
    thumbnailUrl: '/watch-seeds/rose-gold.svg',
    price: 449,
    deviceTargets: ['fenix7s', 'fr265s', 'vivoactive5'],
    downloadCount: 674,
  },
  {
    designerIdx: 3,
    title: 'Deep Space',
    description: 'Journey through the cosmos. Saturn rings, galaxies, and star fields.',
    thumbnailUrl: '/watch-seeds/deep-space.svg',
    price: 199,
    deviceTargets: ['fenix7', 'epix2', 'fr965'],
    downloadCount: 2456,
  },
  {
    designerIdx: 3,
    title: 'Health Plus',
    description: 'Activity rings for steps, calories, and exercise minutes at a glance.',
    thumbnailUrl: '/watch-seeds/health-plus.svg',
    price: 0,
    deviceTargets: ['vivoactive5', 'fr265', 'fr165'],
    downloadCount: 6821,
  },
  {
    designerIdx: 3,
    title: 'Trail Runner',
    description: 'Elevation profile, topographic lines, and real-time pace for trail running.',
    thumbnailUrl: '/watch-seeds/trail-runner.svg',
    price: 299,
    deviceTargets: ['fenix7', 'fenix7x', 'fr965'],
    downloadCount: 1543,
  },
  {
    id: 'a1b2c3d4-e5f6-4789-abcd-ef1234567890',
    designerIdx: 2,
    title: 'Aurora Wave',
    description: 'Animated aurora borealis flows across your wrist. Hypnotic and alive.',
    thumbnailUrl: '/watch-seeds/aurora.svg',
    price: 399,
    deviceTargets: ['fr265', 'fr965', 'fenix7', 'epix2'],
    downloadCount: 0,
    renderSpec: {
      v: 2,
      bg_anim: 'aurora_wave',
      elements: [
        { t: 'time', x: 50, y: 42, c: 'FFFFFF', f: 'hot' },
        { t: 'text', x: 50, y: 62, v: 'AURORA', c: '00FFCC', f: 'tiny' },
        { t: 'date', x: 50, y: 72, c: '66CCAA', f: 'small' },
        { t: 'heart', x: 25, y: 82, c: 'FF6688', f: 'xtiny' },
        { t: 'steps', x: 50, y: 82, c: '00FFCC', f: 'xtiny' },
        { t: 'battery', x: 75, y: 82, c: '88DDFF', f: 'xtiny' },
      ],
    },
  },
];

async function seed() {
  console.log('Seeding database...');

  // Clear existing data
  await db.delete(schema.watchfaces);
  await db.delete(schema.designers);
  await db.delete(schema.users);
  console.log('  Cleared existing data');

  // Create designer users
  const userIds: string[] = [];
  for (const d of designers) {
    const passwordHash = await bcrypt.hash(d.password, BCRYPT_ROUNDS);
    const [user] = await db
      .insert(schema.users)
      .values({ email: d.email, passwordHash, role: 'designer' })
      .returning({ id: schema.users.id });

    if (!user) throw new Error(`Failed to insert user ${d.email}`);
    userIds.push(user.id);

    await db.insert(schema.designers).values({
      userId: user.id,
      brandName: d.brandName,
      bio: d.bio,
      kycStatus: 'approved',
    });
    console.log(`  Created designer: ${d.brandName} (${d.email})`);
  }

  // Create watchfaces
  for (const wf of watchfaceSeed) {
    const userId = userIds[wf.designerIdx];
    if (!userId) throw new Error(`No userId for designerIdx ${wf.designerIdx}`);

    await db.insert(schema.watchfaces).values({
      ...('id' in wf && wf.id ? { id: wf.id } : {}),
      designerId: userId,
      title: wf.title,
      description: wf.description,
      thumbnailUrl: wf.thumbnailUrl,
      prgUrl: `https://placeholder.r2.dev/${wf.title.toLowerCase().replace(/\s+/g, '-')}.prg`,
      fileSizeBytes: Math.floor(Math.random() * 50000) + 10000,
      prgOriginalName: `${wf.title.toLowerCase().replace(/\s+/g, '_')}.prg`,
      price: wf.price,
      deviceTargets: wf.deviceTargets,
      downloadCount: wf.downloadCount,
      status: 'published',
      ...('renderSpec' in wf && wf.renderSpec ? { renderSpec: wf.renderSpec } : {}),
    });
    console.log(`  Created watchface: ${wf.title}`);
  }

  console.log('\nSeed complete.');
  console.log('Designer accounts:');
  for (const d of designers) {
    console.log(`  ${d.email} / password123`);
  }

  await pool.end();
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
