// Engangs-script: flyt Dialerens gamle data ind i ASA Industries' fælles database (schema dialer) som ASA El-Service.
// Kør KUN efter migration 20261023130000 er kørt, og KUN med Jonas' ja (skriver i prod).
//
//   EKSPORT=eksport.json SUPABASE_URL=https://fvzwrsopfgnpqvubrtsy.supabase.co SUPABASE_SERVICE_ROLE_KEY=... \
//     node scripts/flyt-data-til-faelles.mjs   (fra frontend/)            (tør-kørsel: viser kun antal)
//   ... node scripts/flyt-data-til-faelles.mjs   (fra frontend/) --skriv  (skriver)
//
// eksport.json = { "campaigns": [...], "campaign_users": [...], "leads": [...], "products": [...], "call_logs": [...],
//                  "tetris_scores": [...] } — rækker eksporteret fra det gamle Lovable-projekt (vxdttwajynwgcvnhhdaz).
// Bruger-id'er skal findes i den fælles auth.users (samme e-mail → map dem først, ellers springes rækken over).
// Filen indeholder kundedata: læg den aldrig i git.
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const ASA_EL_SERVICE = '00000000-0000-0000-0000-000000000001';
const RAEKKEFOELGE = ['campaigns', 'campaign_users', 'leads', 'products', 'call_logs', 'tetris_scores'];
const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, EKSPORT = 'eksport.json' } = process.env;
const skriv = process.argv.includes('--skriv');
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) { console.error('Mangler SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY'); process.exit(1); }

const data = JSON.parse(readFileSync(EKSPORT, 'utf8'));
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

for (const t of RAEKKEFOELGE) {
  const raekker = (data[t] ?? []).map((r) => ({ ...r, organisation_id: ASA_EL_SERVICE }));
  console.log(`${t}: ${raekker.length} rækker${skriv ? '' : ' (tør-kørsel)'}`);
  if (!skriv || raekker.length === 0) continue;
  for (let i = 0; i < raekker.length; i += 500) {
    const { error } = await db.from(`dialer_${t}`).upsert(raekker.slice(i, i + 500), { onConflict: 'id', ignoreDuplicates: true });
    if (error) { console.error(`${t}: ${error.message}`); process.exit(1); }
  }
}
console.log(skriv ? 'Færdig.' : 'Tør-kørsel færdig. Kør med --skriv for at skrive.');
