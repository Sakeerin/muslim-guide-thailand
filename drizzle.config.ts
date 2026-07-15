import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/server/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // PostGIS/system tables are managed outside drizzle
  extensionsFilters: ['postgis'],
  tablesFilter: ['!spatial_ref_sys'],
  verbose: true,
  strict: true,
});
