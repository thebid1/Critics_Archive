import dotenv from "dotenv";
import pg from "pg";

dotenv.config({ path: ".env.local" });

const SQL = `
create table if not exists site_settings (
  key text primary key,
  value text not null
);

alter table site_settings enable row level security;
-- No RLS policies: only service_role (RLS-bypassing) can read/write. The
-- password hash must never be readable by the anon/authenticated roles.

insert into site_settings (key, value) values
  ('password_enabled', 'false')
on conflict (key) do nothing;
`;

const { Client } = pg;
const client = new Client({ connectionString: process.env.DATABASE_URL });

try {
  await client.connect();
  await client.query(SQL);
  console.log("migrate-gate: site_settings created + seeded (password_enabled=false)");
} finally {
  await client.end();
}
