# NP Wedding — Landing Page & RSVP Dashboard

Standalone Next.js/TypeScript application for the 4 December 2026 wedding at Celebce Venue. It includes a public wedding experience, a shared invitation link with name-only RSVP, calendar files, a host dashboard, and table planning.

## Preview locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000`. With Supabase variables left empty, guest and host data use a local demo repository:

- `/` — public wedding experience without RSVP
- `/invitation/[token]` — legacy personalized invitations continue to work
- `/host` — host dashboard
- `/check-in` — redirects to the shared invitation; check-in APIs are retired (410)

In development, demo data is stored in the ignored file `.data/demo-repository.json`, so newly created guests, RSVP updates, and invitation-token hashes survive dev-server restarts. Raw invitation tokens are never written to that file. To reset only local demo data, stop the dev server, move `.data/demo-repository.json` to a backup location, and restart. Production must use Supabase rather than demo storage.

## Tests and checks

```bash
npm test
npm run lint
npm run build
```

## Connect Supabase

1. Create a Supabase project and run `supabase/migrations/202607170001_initial_schema.sql` in the SQL editor.
2. Copy `.env.example` to `.env.local` and set the Supabase URL, anon key, and service-role key.
3. Add the host email addresses to `HOST_EMAIL_ALLOWLIST`, separated by commas.
4. Set `HOST_PASSWORD` to the pilot dashboard password. The username is `admin`.
5. In Supabase Auth, enable email magic links and add `http://localhost:3000/auth/callback` plus the Vercel preview/production callback URLs to the redirect allowlist.
6. Sign in at `/host`. The first allowlisted email is provisioned into `host_users`, enabling the dashboard's realtime subscriptions.

The service-role key is server-only. Never expose it through a `NEXT_PUBLIC_` variable or commit `.env.local`.

## Import guests

Use `public/guest-import-template.csv` or upload a CSV from the dashboard with these exact columns:

```text
display_name,contact_name,phone,email,host_notes
```

Use **คัดลอกลิงก์กลาง** in the host dashboard to share `/` with every guest. Guests enter their name and RSVP without verification or check-in. Each submission creates a separate guest record, including names that match existing guests; it never overwrites a record by name. Retrying a failed request within the same form is idempotent. Reloading the page starts a new response. CSV import and manual guest creation remain available for host planning, but no longer return individual invitation links. Public RSVP creates the name and response together in one insert. Apply `supabase/migrations/202609050001_public_rsvp_history.sql` before deploying so the initial response history is recorded atomically with the guest.

## Deploy to Vercel

1. Push this standalone directory to a private Git repository and import it into Vercel.
2. Add all variables from `.env.example` in Vercel project settings. Set `NEXT_PUBLIC_SITE_URL` to the deployment origin.
3. Deploy, add the Vercel preview callback URL in Supabase Auth, and run staging checks with mock guests.
4. Confirm the production branch and connect the custom domain.

There is no third-party analytics on invitation routes. The payment QR is outside `public/` and is returned with `no-store` only after invitation-token validation.

See [docs/production-checklist.md](docs/production-checklist.md), [docs/audio-license.md](docs/audio-license.md), and [docs/asset-sources.md](docs/asset-sources.md) before launch.
