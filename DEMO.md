# Client demo runbook

A 12–15 minute walkthrough. Run it in this order — each step sets up the next.

**Before you start**

- Open the deployed GitHub Pages URL on your laptop, and the same URL on your phone.
- Print one QR label (Step 2) or have it on a second screen to scan.
- Sign out of both devices so the demo starts at the sign-in screen.
- If you have run the demo before: **Backup and restore → Reset demo data**.

---

## 1. The problem, in one screen (1 min)

Sign in as `admin` / `Admin2026`.

The dashboard opens on real numbers from the sample fleet: total equipment, due
in 30 days, overdue, inspections due, expiring, under maintenance. Point at
**Overdue** and say: *this is the number that gets a company fined, and today it
lives in a spreadsheet nobody updates.*

Open **Reminders** to show the same fleet bucketed by urgency — overdue, due
today, next 7 days, expiring cylinders.

## 2. QR code generation (2 min)

**Equipment → Add equipment.**

- Name it, choose category *Fire Extinguisher*, pick a customer and site.
- Before saving, point at the banner: the identifier is allocated automatically
  from the category's own series.
- Save. **The QR code appears immediately** — generated from the identifier, not
  drawn by hand.
- Open the record, then **Label and print → Download PNG** to show the printable
  label.

For a whole site at once: **QR labels**, filter to one site, **Print sheet**.

Say: *the identifier never gets reused, so a label stays bound to that one piece
of equipment for its whole life.*

## 3. The scan — the centrepiece (3 min)

Hand the phone to the client, or use it yourself.

- **Sign out on the phone first.** This matters.
- Scan the printed label with the phone camera, or use **Scan** inside the app.
- The scan lands on the sign-in screen showing *"Scanned FE-000125 — sign in to
  continue to that equipment."*
- Sign in as `ahmed.a` / `Engineer2026`.
- It goes **straight to that equipment record.**

Say: *the QR code identifies the equipment. It does not grant access to it. The
engineer still signs in, and the system still checks whether that engineer is
authorised for this customer and site.*

On the record, walk through what the engineer sees without scrolling: status,
last service, next service due with days remaining, install date. Then scroll to
the full service history — every past visit, engineer name, result, remarks,
checklist outcome, photographs.

## 4. Recording a service (2 min)

Still on the phone as `ahmed.a`:

- **Record service.**
- Choose *Inspection*. The 9-point extinguisher checklist appears.
- Mark **Pressure gauge → Fail.** The visit result flips to *Failed*
  automatically.
- Add a remark, tap **Take or choose a photo** and use the phone camera.
- Set the next service date, save.

The record now shows *Failed inspection*, the timeline has the new entry with
the failed checklist point named and the photo attached, and the dashboard count
has moved.

## 5. Access control — the part clients care about (3 min)

This is the strongest part of the demo. Do it on the laptop.

- Sign out, sign in as `khalid.r` / `Client2026` (the customer's own manager).
  He sees only Al-Rajhi Industrial equipment. On a record he can **Request
  service** but there is no way to record one.
- Sign in as `layla.n` / `Viewer2026`. She can read Gulf Petrochem records and
  has **no action buttons at all.**
- Still as Layla, paste an Al-Rajhi equipment URL. The system answers **Access
  restricted** — not a blank page, and not a hidden row in a list.

Say: *scanning someone else's label gets you nothing.*

Then show where that comes from: sign back in as `admin` → **User accounts**.
Create an account, choose *Selected sites*, untick **Export reports**, save.
Sign in as that account: Reports has gone from the menu, and going to the
address directly says the permission is missing.

## 6. Customers and sites (1 min)

**Customers & sites → Add customer**, then **Add site** under it. Then try to
delete a customer that still holds equipment — the system refuses and says how
many items are in the way.

Say: *customer, site and equipment are separate records that stay linked, so you
can re-organise sites without touching equipment history.*

## 7. Accountability (1 min)

**Audit trail.** Filter by user. Every action in this demo is there: the
sign-ins, the failed sign-in if you mistyped, the equipment you added, the QR
label you generated, the service record, the account you created.

Say: *this is why every engineer gets their own login rather than one shared
account.*

## 8. Backup and restore (2 min)

**Backup and restore.**

- **Back up now** — a snapshot appears with the date, time and your account name.
- Delete a piece of equipment.
- Restore the snapshot. It comes back.
- Show **Download file** for an off-site copy, and the daily/weekly schedule.

Say: *the data is the client's, and they can take a copy of it whenever they
want.*

## 9. Close

Return to the dashboard. Recap the loop: **label the equipment once → any
authorised person scans it → the full history is there → the engineer updates it
on the spot → the reminders and reports update themselves.**

---

## Questions you should expect

**"Is this secure? It's just a web page."**
Be straight: this demonstration runs entirely in the browser so it can be shown
without a server. Passwords are already hashed properly and never stored as
text, but the checks run client-side. The production build enforces the same
login, permissions and scope rules on the server, in FastAPI, against MySQL —
that is what makes them binding rather than advisory. Do not claim the demo is
production-secure; the honesty lands better than the bluff.

**"What if we lose the phone / the internet is down on site?"**
Anyone authorised can open a record from any device. Offline capture is not in
this build; it is a scoping conversation.

**"Can we use our own asset tag numbers?"**
Yes — there is a customer asset tag field alongside the system identifier.

**"What happens if a label is damaged?"**
Reprint it from the record or the QR labels sheet. The identifier is unchanged,
so the history is unaffected.

**"Can it handle equipment other than fire extinguishers?"**
Show the category list, and the fact that inspection checklists differ by
category — 9 points for an extinguisher, 7 for a fire pump, 6 for an alarm
panel.

---

## Demo accounts

| User ID | Password | Role |
| --- | --- | --- |
| `admin` | `Admin2026` | Administrator |
| `sara.i` | `Manager2026` | Manager |
| `ahmed.a` | `Engineer2026` | Service Engineer — 3 Al-Rajhi sites |
| `mohammed.f` | `Farooq2026` | Service Engineer — Gulf Petrochem and Nesma |
| `khalid.r` | `Client2026` | Client User — Al-Rajhi only |
| `layla.n` | `Viewer2026` | Viewer — Gulf Petrochem, read-only |

## If something goes wrong

- **Camera will not start** — the page must be on `https`. On a phone this means
  the deployed site, not a local address.
- **Data looks wrong from an earlier run** — Backup and restore → Reset demo data.
- **Scan opens nothing** — check the label was printed from the same deployment
  you are demonstrating. A label printed from a local server points at that
  machine.
