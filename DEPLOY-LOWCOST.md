# Going live cheaply, without Hostinger

A live system needs three things. Priced separately, most of them are free.

| Piece | What it does | Cheapest credible option |
| --- | --- | --- |
| Static hosting | Serves the React app | Free — several good options |
| Database | Holds equipment, history, users | Free tier up to a few hundred MB |
| API / auth | Enforces login, permissions and scope | Free tier, or replaced entirely |

The third row is the one that decides the architecture, so read that section
before choosing anything else.

> Free tiers change often, and some providers have removed them outright.
> Confirm current terms before committing a client to one.

---

## Option 1 — Supabase + Cloudflare Pages · **≈ SAR 0/year**

**The recommendation for going live cheaply.**

Supabase gives you a Postgres database, real server-side authentication, file
storage and an auto-generated API in one free project. Crucially it enforces
access with **Row Level Security** — rules that live in the database itself, so
"this engineer may only see their assigned sites" is checked by Postgres on every
query, not by the browser.

That matters more than the price. It is the difference between the demo's
advisory checks and a real security boundary, and it removes the need to build
and host a separate API at all.

| Component | Provider | Cost |
| --- | --- | --- |
| React app | Cloudflare Pages or GitHub Pages | Free |
| Database | Supabase Postgres, 500 MB | Free |
| Authentication | Supabase Auth | Free to 50,000 users |
| Photo storage | Supabase Storage, 1 GB | Free |
| TLS certificate | Included | Free |
| Domain | Namecheap, Cloudflare or similar | ~SAR 45–60/year |

**What you outgrow first:** photo storage, not records. 500 MB of Postgres holds
a very large equipment fleet; 1 GB of images is roughly 8,000–10,000 inspection
photographs at the size this app produces. The paid tier is about USD 25/month
when you get there.

**The catch:** a free Supabase project **pauses after a week with no activity**.
Any real usage keeps it awake, but a project sitting idle between client meetings
will need waking from the dashboard. Do not discover this ten minutes before a
demonstration.

**Work involved:** this replaces the FastAPI backend in the proposal. The React
app talks to Supabase directly. It is less work than building an API, but it is
still a real migration from browser storage — schema, RLS policies, auth wiring
and data access throughout the app.

---

## Option 2 — Keep FastAPI, host it free · **≈ SAR 0–250/year**

If you want the stack exactly as the proposal describes it:

| Component | Provider | Cost | Note |
| --- | --- | --- | --- |
| React app | Cloudflare Pages | Free | |
| FastAPI | Google Cloud Run | Free to 2M requests/month | Scales to zero; first request after idle is slow |
| FastAPI (alt) | Fly.io | ~USD 2–3/month | Stays warm, no cold start |
| Database | Neon Postgres | Free, 0.5 GB | Serverless, scales to zero |
| Database (alt) | Supabase Postgres | Free, 500 MB | |
| Domain | Any registrar | ~SAR 45–60/year | |

Cloud Run's cold start is the thing to watch — an idle service can take several
seconds to answer its first request. Fine for internal use, poor for a client
tapping a QR label for the first time that morning. Fly.io's small paid instance
avoids it for the price of a coffee.

**Avoid Render's free web services** for anything client-facing: they spin down
after 15 minutes idle and take roughly a minute to wake.

---

## Option 3 — Oracle Cloud Always Free VM · **≈ SAR 60/year**

Oracle's always-free tier includes ARM instances totalling 4 cores and 24 GB of
RAM, with 200 GB of storage. That is far more capable than a paid entry VPS
anywhere else, and it runs the full stack from `DEPLOY-HOSTINGER.md` — Nginx,
FastAPI, MySQL — on one machine for nothing but the domain.

**The catch is real:** account approval is inconsistent, free ARM capacity in a
given region is frequently unavailable, and the free tier's terms allow
reclamation of idle resources. You also own all the system administration —
patching, certificates, backups, monitoring.

Good for your own infrastructure. Harder to justify putting a paying client on it.

---

## Option 4 — A small VPS anywhere · **≈ SAR 250–450/year**

Hetzner, DigitalOcean, Vultr and Contabo all sell a 1–2 vCPU instance with
2–4 GB RAM for roughly USD 5/month. `DEPLOY-HOSTINGER.md` Path B applies
unchanged — it is a plain Ubuntu server.

This is the cheapest option with **no free-tier caveats at all**: nothing pauses,
nothing cold-starts, nothing gets reclaimed, and you can put a client's real data
on it without an asterisk.

---

## Recommendation

**For a client's live system, pick Option 1 or Option 4.**

Option 1 costs nothing and gives you genuine database-enforced security, which is
worth more than the saving. Option 4 costs about SAR 300 a year and removes every
free-tier caveat.

**Do not** put a paying client on a service that sleeps, cold-starts or may
reclaim your instance, and then discover it in front of them.

### On what to charge

Infrastructure being nearly free improves your margin; it should not become a
promise. Quote hosting as a pass-through cost at a realistic figure — the
proposal uses SAR 900–2,400/year — and let the client hold the accounts in their
own name. If you later run it on a free tier, that is your operational choice,
not a discount you have committed to forever. Free tiers get withdrawn; a
commitment made on one does not.

---

## A note on Vercel

Vercel's free Hobby plan is excellent, and its terms **prohibit commercial use**.
A system you are selling to a client is commercial. Use Cloudflare Pages or
Netlify instead, or Vercel's paid plan.

---

## What any of these still requires

All four options assume the data moves out of the browser and into a shared
database. That work is the same regardless of who hosts it:

- A schema for customers, sites, equipment, service records, users and audit
- Server-side authentication replacing the in-browser password check
- Server-enforced permissions and data scope
- The React app reading and writing through the API instead of `localStorage`
- Migration of any data already entered

Choosing a cheaper host does not avoid it. It only changes the monthly bill once
it is done.
