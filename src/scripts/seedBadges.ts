// src/scripts/seedBadges.ts
// Usage: npm run seed:badges

import { loadEnvConfig } from '@next/env';
import mongoose from 'mongoose';
import { BADGE_DEFINITIONS } from '../lib/badge-definitions';
import { BadgeDefinition } from '../models/BadgeDefinition';

loadEnvConfig(process.cwd());

const MONGODB_URI = process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? '';

async function seed() {
  if (!MONGODB_URI) {
    console.error('MONGODB_URI is not set. Add it to your .env.local or .env file.');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI);
  console.log('Connected.');

  console.log(`Upserting ${BADGE_DEFINITIONS.length} badge definitions...`);

  for (const badge of BADGE_DEFINITIONS) {
    await BadgeDefinition.findOneAndUpdate({ badgeSlug: badge.badgeSlug }, badge, {
      upsert: true,
      returnDocument: 'after',
    });
    console.log(`  - ${badge.name} (${badge.badgeSlug})`);
  }

  console.log('\nAll badge definitions seeded successfully.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});
