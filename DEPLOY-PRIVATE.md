# Keeping the system private

"Not on Google" and "not accessible" are different things, and only one of them
protects a client's data. There are three levels, and they stack.

| Level | Stops | Does not stop |
| --- | --- | --- |
| 1 · Not indexed | Appearing in search results | Anyone who has the link |
| 2 · Gated at the door | Anyone without an approved email loading the page at all | Nothing, if the gate is configured correctly |
| 3 · Server-side auth | The database returning records to an unauthorised request | — |

Level 1 alone is not privacy. It is a request to search engines, which they
honour, and which does nothing about a link forwarded in a WhatsApp group.

---

## What your current deployment actually is

If the system is on GitHub Pages with a free account:

- **The site is public.** Anyone with the address can open it.
- **Google can index it.** Nothing currently prevents that.
- **The source code is public.** Free GitHub Pages requires a public repository.
- **The sign-in screen is not a barrier.** In the demo the check runs in the
  browser, and the sample data is inside the JavaScript bundle, which anyone can
  download and read.

For a demonstration with sample data that is all fine — it is a portfolio piece.
For a client's real equipment register it is not acceptable, and no amount of
configuration on GitHub Pages will fix it.

---

## The answer: two deployments, not one

These are different jobs and they fight each other if you try to make one address
do both.

| | Portfolio demo | Client system |
| --- | --- | --- |
| Address | `noufalsyed.github.io/serviceline` | `equipment.clientcompany.com` |
| Data | Sample only, no real customers | The client's real register |
| Visibility | Public, indexed, shareable | Gated, not indexed |
| Repository | Public | Private |
| Login | Demo accounts shown on screen | Issued individually |

Keep the public one exactly as it is — it is doing its job, and prospective
clients being able to click into it is the point. Build the private one
separately.

---

## Building the private one

### Step 1 · Move to Cloudflare Pages

Cloudflare Pages deploys from a **private** GitHub repository on the free plan,
which GitHub Pages will not.

1. Make a private copy of the repository for the client's deployment.
2. Sign in at **dash.cloudflare.com** → **Workers & Pages** → **Create** →
   **Pages** → **Connect to Git**.
3. Authorise Cloudflare and pick the private repository.
4. Build settings:
   - Framework preset: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
   - Environment variable: `VITE_BASE` = `/`
5. Deploy, then add the client's subdomain under **Custom domains**.

### Step 2 · Put Cloudflare Access in front of it

This is the part that actually closes the door. Access sits **in front of the
site**, so an unapproved visitor never receives the HTML, the JavaScript or
anything else — they get an identity prompt.

**Free for up to 50 users**, which is more than this system needs.

1. **Zero Trust** → **Access** → **Applications** → **Add an application** →
   **Self-hosted**
2. Application domain: `equipment.clientcompany.com`
3. Add a policy:
   - Name: `Authorised staff and client`
   - Action: **Allow**
   - Include: **Emails** — list each person's address
     (or **Emails ending in** `@clientcompany.com` to cover the whole company)
4. Choose a login method. **One-time PIN** needs no setup — the visitor enters
   their email and receives a code. Google or Microsoft sign-in also work if the
   client already uses them.
5. Save.

From then on, anyone opening the address must prove they are on the list before
the site loads. Remove someone from the policy and they lose access immediately,
on every device, without touching the application.

### Step 3 · Tell search engines to stay out

Belt and braces, and free. Create `public/robots.txt` in the repository:

```
User-agent: *
Disallow: /
```

And add this line inside `<head>` in `index.html`:

```html
<meta name="robots" content="noindex, nofollow, noarchive" />
```

With Access in front, crawlers cannot reach the page anyway — but if the gate is
ever removed or misconfigured, this is the second line.

**Do not add either of these to the public portfolio deployment.** You want that
one found.

### Step 4 · Protect the data itself

Everything above controls who reaches the *site*. Level 3 is who the *database*
answers, and it needs a real backend — Supabase with Row Level Security, or the
FastAPI application from the proposal. See `DEPLOY-LOWCOST.md`.

Until that is in place, the client instance should not hold real customer data,
however well gated the front door is.

---

## Things that look like privacy and are not

**An obscure URL.** Addresses leak through browser history, shared links, email
scanners and referrer headers. "Nobody will guess it" is not a control.

**The application's own login screen, on a static deployment.** The whole app
downloads before the login is drawn. Anyone can read the bundle. This is exactly
why Access sits in front rather than inside.

**`robots.txt` alone.** It asks well-behaved crawlers not to index. It is not
enforcement, and it is itself a public file listing what you wanted hidden.

**Blocking by IP address.** Tempting, but engineers scan labels on mobile data
from customer sites all over the country. You would be blocking the people who
need it most.

**Making the repository private and nothing else.** That hides the source. The
deployed site is unaffected.

---

## Summary

| Goal | Do this |
| --- | --- |
| Portfolio piece prospective clients can browse | GitHub Pages, public, sample data — what you have |
| Client instance nobody else can open | Cloudflare Pages + Cloudflare Access, private repo |
| Keep it out of search results | `robots.txt` and `noindex` on the client instance only |
| Protect real records | A backend with server-side authorisation |
