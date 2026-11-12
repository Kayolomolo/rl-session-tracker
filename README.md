# RL Session Tracker

Webapp (PWA) om je Rocket League-sessies bij te houden: wedstrijden (1v1/2v2/3v3, win/loss), warm-up en training met timers, en een overzicht na elke sessie. Gegevens staan in Supabase en worden gesynchroniseerd tussen je apparaten; zonder internet worden wijzigingen bewaard en later verstuurd.

## Starten

```bash
npm install
cp .env.example .env.local   # vul VITE_SUPABASE_URL en VITE_SUPABASE_ANON_KEY in
npm run dev
```

## Testen en bouwen

```bash
npm test        # Vitest: alle rekenlogica (statistieken, streaks, inactiviteit, wachtrij)
npm run build   # productiebuild in dist/
```

## Database

Het schema staat in `supabase/schema.sql`. Uitvoeren in Supabase → SQL Editor. Inloggen gaat met e-mail en wachtwoord (Supabase Auth, e-mailbevestiging aan).

## Opbouw

- `src/lib/` — pure logica zonder React, volledig getest
- `src/db/` — Supabase-client, inloggen, lokale wachtrij + synchronisatie (`sync.ts`), acties
- `src/components/` — UI-bouwstenen in RL-stijl
- `src/screens/` — één bestand per scherm
