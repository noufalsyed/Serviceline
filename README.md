# Serviceline — QR-Based Equipment & Service Management System

A working demonstration of a centralised platform for managing fire-safety and
industrial equipment across multiple customers and sites. Every item carries a
unique QR code; scanning it with a phone opens that item's record — after sign-in
and a customer/site permission check.

**Live demo:** _(add your GitHub Pages URL here once deployed)_

---

## What it demonstrates

| Area | What works in this build |
| --- | --- |
| **Add equipment** | Full registration form. The identifier is generated automatically from the category series (`FE-000202`, `GN-000009`) and its QR code appears the moment the item is saved, ready to print. |
| **QR generation** | A real QR code per item, resolving to `…/#/e/<ID>`. Single label preview with PNG download, plus a batch label sheet you can print per site. |
| **QR scanning** | The phone camera decodes the label and opens the record. Manual ID entry and a demo picker cover desktops and blocked cameras. |
| **Deep-link security** | Scanning while signed out lands on sign-in, which remembers the target and continues to it after authentication. |
| **Customers and sites** | Add, edit and delete customers, and multiple sites under each. Equipment is filed against a customer *and* a site; the three record types stay separate but linked. Deleting is refused while anything still depends on the record. |
| **Login** | Individual accounts with a user ID and password. Passwords are stored as PBKDF2-SHA256 hashes with a per-account 128-bit salt — never as text. Failed attempts are recorded. |
| **Permissions** | Eleven named permissions. A role carries defaults; an administrator can override any of them per account, so two engineers can hold different rights. Blocked pages say so rather than vanishing silently. |
| **Data scope** | Separate from permissions: all customers, one customer, or a chosen set of sites. Out-of-scope equipment returns *Access restricted*, not the record. |
| **User administration** | Create, edit, disable, re-enable and delete accounts; reset a password. Deleting your own account, or the last active administrator, is refused. |
| **Password management** | Users change their own password from their account page; a banner nags anyone still using an administrator-issued one. |
| **Service history** | Full timeline per item with type, engineer, result, remarks, checklist outcome and photographs. |
| **Inspection** | Category-specific checklists — 9 points for extinguishers, 7 for fire pumps, 6 for alarm panels, and so on. Failing any point marks the whole visit failed and tags the equipment out of service. |
| **Photos** | Captured from the phone camera, downscaled in the browser, stored with the record. |
| **Reminders** | Buckets for overdue, due today, 7 / 30 / 90 days, and cylinder expiry within 30 days. |
| **Reports** | Six reports, each scoped to the signed-in user, exported as CSV. |
| **Backup and restore** | Manual snapshots and a daily or weekly schedule, downloadable as JSON files and restorable from either. Each backup records its date, time and the account that made it. Restricted to accounts holding the backup permission. |
| **Audit trail** | Sign-ins and failures, equipment added, edited and deleted, customer and site changes, service records, QR scans, label generation, report exports, account changes, password resets, backups and restores — all against the individual account, filterable by user. |

Equipment status is derived from dates rather than stored, so it can never go
stale. Two states are set by hand and override the dates: *Under maintenance*
and *Failed inspection*.

## Documentation

| File | Covers |
| --- | --- |
| [DEMO.md](DEMO.md) | Running the client demonstration, and the questions to expect |
| [DEPLOY-LOWCOST.md](DEPLOY-LOWCOST.md) | Going live cheaply — Supabase, Cloud Run, Oracle free tier, small VPS |
| [DEPLOY-HOSTINGER.md](DEPLOY-HOSTINGER.md) | Hostinger specifically: static on shared hosting, or the full stack on a VPS |
| [DEPLOY-PRIVATE.md](DEPLOY-PRIVATE.md) | Keeping a client instance off Google and closed to everyone but them |

## Demo accounts

Sign-in needs a user ID and password. The sign-in screen has a **Show demo
accounts** button that lists and fills them; they are also here:

| User ID | Password | Role | Sees |
| --- | --- | --- | --- |
| `admin` | `Admin2026` | Administrator | Everything, including users and backups |
| `sara.i` | `Manager2026` | Manager | All customers; no user administration or backups |
| `ahmed.a` | `Engineer2026` | Service Engineer | 3 sites at Al-Rajhi Industrial |
| `mohammed.f` | `Farooq2026` | Service Engineer | 4 sites across Gulf Petrochem and Nesma |
| `khalid.r` | `Client2026` | Client User | Al-Rajhi Industrial only; can raise service requests |
| `layla.n` | `Viewer2026` | Viewer | Gulf Petrochem, read-only |

Two things worth trying to see the access model working:

- Sign in as `ahmed.a` and open a Gulf Petrochem item. The record is refused,
  not merely hidden from the list.
- Sign in as `admin`, create an account, untick *Export reports*, then sign in
  as that account. Reports disappears from the navigation, and reaching
  `#/reports` directly says the permission is missing.

## Running it on your own machine

**Double-click `start-demo.cmd`.** It installs dependencies on first run, then
starts the server over HTTPS and opens your browser. Press Ctrl+C twice in that
window to stop it.

Or from a terminal:

```bash
npm install
npm run dev         # http://localhost:5173 — desktop work
npm run dev:phone   # https, reachable from your phone
npm run build       # production bundle into dist/
npm run preview     # serve that bundle locally
```

### Scanning with your phone against this machine

Browsers only give a page the camera on a *secure origin*. `localhost` counts as
secure; `192.168.x.x` does not — so `npm run dev:phone` serves HTTPS with a
self-signed certificate.

1. Start it. Vite prints two addresses — use the **Network** one on the phone.
2. Both devices must be on the same Wi-Fi.
3. The phone will warn that the certificate is not trusted. That is expected for
   a local demo: tap **Advanced → Proceed** (Android) or **Show Details → visit
   this website** (iOS). The camera works once you are through.
4. Sign in, tap **Scan**, and point it at a label from the **QR labels** page.

If the phone cannot reach the address at all, Windows Firewall is usually
blocking Node — allow it on private networks, or run the demo on the deployed
site instead.

> **Labels printed locally only work locally.** A QR generated while running on
> your machine encodes `https://192.168.x.x:5173/…`, which is dead outside your
> Wi-Fi and once the server stops. Print labels a client will actually use from
> the deployed GitHub Pages address.

On a desktop with no camera, the Scan page's manual ID field and demo picker do
the same job.

## Deploying to GitHub Pages

1. Push this repository to GitHub.
2. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` builds and
   publishes automatically.

The workflow passes `VITE_BASE=/<repo-name>/` so asset paths match a project
site. Routing uses `HashRouter` because GitHub Pages cannot rewrite
`/e/FE-000125` back to `index.html` — deep links live after the `#`.

Renaming the repository changes the URL, and therefore the URL encoded into any
label already printed. Print labels from the final address.

## Technology

React 18 · Vite 6 · React Router 6 · `qrcode.react` for generation ·
`html5-qrcode` for camera decoding. No CSS framework — the design system is
about 700 lines of hand-written CSS driven by custom properties, with light and
dark themes and a mobile-first layout.

The scanner is code-split, so the camera decoder (~100 kB gzipped) downloads
only when someone taps Scan. The rest of the app is ~81 kB gzipped.

## How the demo stores data

Everything lives in the browser's `localStorage`, so the demo needs no server and
each visitor gets their own private copy. Anything you add stays on your device.
**Backup and restore → Reset demo data** restores the original dataset.

Backups are kept two ways: up to five snapshots inside the browser, and JSON
files you download. A scheduled backup runs when the app is next opened and one
is overdue — the browser stand-in for a nightly job on the server.

Seed dates are rebased against the current date on first load, so the dashboard
always opens with a realistic spread of overdue and upcoming work rather than a
dataset that ages out.

## What production would add

This build is the front end and the interaction model, and it is honest about
where the line sits. **Every check here runs in the browser.** The password
hashing is real PBKDF2 and no plaintext is ever stored, but anyone can read the
sample data straight out of `localStorage`. That is the correct shape for a
demonstration with no server; it is not a security boundary.

A production deployment per the proposal replaces browser storage with:

- **FastAPI** backend and **MySQL** database
- The same login and permission model enforced server-side, with sessions and
  per-request authorisation — so the checks bind rather than merely guide the UI
- Server-side scheduled reminders with email delivery
- File storage for photographs and documents
- Historical data import from Excel/CSV
- Server-side audit logging, append-only
- Database-level backups on the host, rather than browser snapshots

---

Sample data only. Customers, sites, engineers and service records in this demo
are fictional and contain no real customer information.
