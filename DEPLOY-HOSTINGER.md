# Deploying Serviceline on Hostinger

There are two deployments, and they are not the same job. Read this section
before choosing.

| | Path A — Static on shared hosting | Path B — Full stack on a VPS |
| --- | --- | --- |
| What runs | The React app only | React app + FastAPI + MySQL |
| Where data lives | Each visitor's own browser | One central database |
| Cross-device | **No** — a phone and a laptop hold separate data | Yes |
| Hostinger plan | Premium or Business shared | KVM 1 VPS or larger |
| Cost | ~SAR 400–900 / year | ~SAR 900–2,400 / year |
| Ready today | **Yes** | Needs the backend built first |
| Good for | Demonstrations, client review | Live operation |

**Path A is what the current code supports.** It is genuinely useful — it is how
you show the system to a client from a real domain — but every browser seeds its
own copy of the sample data. Equipment you add on a laptop will not appear on a
phone, and a QR label for it will resolve to "not found on this device".

**Path B is the system described in the proposal.** It needs the FastAPI backend
and MySQL schema, which are part of the development scope, not of this
repository. The server preparation below is real and can be done in advance.

---

# Path A — Static hosting on Hostinger shared

About 20 minutes.

## A1 · Decide the address

A subdomain of a domain you already own is cleanest:

```
equipment.yourcompany.com
```

In **hPanel → Domains → Subdomains**, create `equipment`. Note the folder it
creates, usually `/home/uXXXXXXX/domains/equipment.yourcompany.com/public_html`.

To use the main domain instead, skip this and deploy into `public_html`.

## A2 · Build with the right base path

This is the step people get wrong. Vite needs to know the path the app is served
from. At a domain or subdomain root, that is `/`.

```bash
cd D:\serviceline
npm run build
```

The default `VITE_BASE` is `/`, which is correct for a subdomain root. Only set
it if you are deploying into a subfolder — for example `https://yourcompany.com/equipment/`:

```bash
# Windows PowerShell
$env:VITE_BASE = "/equipment/"; npm run build
```

The finished site is everything **inside** `D:\serviceline\dist`.

## A3 · Upload

**Via hPanel File Manager**

1. **hPanel → Files → File Manager**
2. Open the `public_html` for your subdomain
3. Delete any placeholder `index.html` or `default.php`
4. Upload the **contents** of `dist` — the `index.html` and the `assets` folder,
   not the `dist` folder itself
5. Confirm `index.html` sits directly in `public_html`

**Via FTP (better for repeat deployments)**

Get the FTP host, username and password from **hPanel → Files → FTP Accounts**,
then in FileZilla connect and drag the contents of `dist` into `public_html`.

## A4 · Add the .htaccess

Create a file named `.htaccess` in the same folder, containing:

```apache
# Serve index.html for any unmatched path
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>

# Cache fingerprinted assets hard, never cache the entry point
<IfModule mod_expires.c>
  ExpiresActive On
  ExpiresByType text/css "access plus 1 year"
  ExpiresByType application/javascript "access plus 1 year"
  ExpiresByType image/svg+xml "access plus 1 month"
</IfModule>
<IfModule mod_headers.c>
  <FilesMatch "index\.html$">
    Header set Cache-Control "no-cache, must-revalidate"
  </FilesMatch>
  Header always set X-Content-Type-Options "nosniff"
  Header always set X-Frame-Options "SAMEORIGIN"
  Header always set Referrer-Policy "strict-origin-when-cross-origin"
</IfModule>
```

The app uses `HashRouter`, so the rewrite is a safety net rather than a
requirement — but it prevents an ugly 404 if anyone trims the `#`.

## A5 · Turn on SSL — not optional

**hPanel → Security → SSL → Install SSL** (free Let's Encrypt), then enable
**Force HTTPS**.

Without HTTPS the phone camera will not start and password hashing will not run.
The app will tell the user so rather than failing silently, but the demo is dead
either way. Allow up to an hour for the certificate to issue.

## A6 · Verify

1. Open `https://equipment.yourcompany.com` — the sign-in screen appears
2. Sign in as `admin` / `Admin2026`
3. **QR labels → Print sheet**, print one label
4. Open the same address on your phone, sign out, tap **Scan**, scan the label
5. It should ask you to sign in, then open that equipment with its history

## A7 · Redeploying after a change

```bash
npm run build
```

Then re-upload the contents of `dist`, replacing what is there. Delete the old
`assets` folder first — filenames are content-hashed, so stale files accumulate.

---

# Path B — Full stack on a Hostinger VPS

This is the architecture in the proposal: React served by Nginx, FastAPI behind
it, MySQL underneath, with one central database that every device shares.

> **Before you start:** the FastAPI application and MySQL schema are development
> deliverables and are not in this repository. Steps B1–B6 prepare the server and
> can be done now; B7 onwards needs the backend to exist.

Hostinger **shared hosting cannot run Python**, so Path B requires a VPS. KVM 1
(1 vCPU, 4 GB RAM) comfortably handles several thousand equipment records.

## B1 · Order and access the VPS

1. **hPanel → VPS → order KVM 1**
2. Operating system: **Ubuntu 24.04 LTS**, clean, without a control panel
3. Set the root password and note the IP address
4. Connect:

```bash
ssh root@YOUR_SERVER_IP
```

## B2 · Secure it before anything else

```bash
adduser serviceline
usermod -aG sudo serviceline
rsync --archive --chown=serviceline:serviceline ~/.ssh /home/serviceline

ufw allow OpenSSH
ufw allow 80
ufw allow 443
ufw --force enable

apt update && apt upgrade -y
apt install -y fail2ban
systemctl enable --now fail2ban
```

Then disable root and password logins in `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
```

```bash
systemctl restart ssh
```

Reconnect as `serviceline` before closing your existing session, so you are not
locked out if something is wrong.

## B3 · Install the stack

```bash
sudo apt install -y python3.12 python3.12-venv python3-pip \
                    mysql-server nginx git curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

## B4 · Set up MySQL

```bash
sudo mysql_secure_installation
```

Answer yes to removing anonymous users, disallowing remote root, and dropping
the test database.

```bash
sudo mysql
```

```sql
CREATE DATABASE serviceline CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'serviceline'@'localhost' IDENTIFIED BY 'a-long-random-password';
GRANT ALL PRIVILEGES ON serviceline.* TO 'serviceline'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

MySQL listens on localhost only by default. **Leave it that way** — the database
must never be reachable from the internet. The API is the only thing that talks
to it.

## B5 · Point the domain

In your DNS (Hostinger or elsewhere), create an **A record**:

| Type | Name | Value |
| --- | --- | --- |
| A | `equipment` | your VPS IP address |

Wait for it to resolve — `nslookup equipment.yourcompany.com` should return the
VPS IP before you continue.

## B6 · Nginx and TLS

```bash
sudo nano /etc/nginx/sites-available/serviceline
```

```nginx
server {
    listen 80;
    server_name equipment.yourcompany.com;

    root /var/www/serviceline;
    index index.html;

    # The built React app
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Everything under /api goes to FastAPI
    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 12M;   # inspection photographs

    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
}
```

```bash
sudo ln -s /etc/nginx/sites-available/serviceline /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d equipment.yourcompany.com
```

Certbot rewrites the config for HTTPS and installs an auto-renewal timer. Confirm
with `sudo certbot renew --dry-run`.

## B7 · Deploy the front end

On your machine, build against the API path:

```bash
npm run build
```

Copy it up:

```bash
scp -r dist/* serviceline@YOUR_SERVER_IP:/var/www/serviceline/
```

Create the folder first if needed:

```bash
sudo mkdir -p /var/www/serviceline
sudo chown -R serviceline:serviceline /var/www/serviceline
```

## B8 · Run the API as a service

With the FastAPI application in `/home/serviceline/api`:

```bash
cd /home/serviceline/api
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

```bash
sudo nano /etc/systemd/system/serviceline-api.service
```

```ini
[Unit]
Description=Serviceline API
After=network.target mysql.service

[Service]
User=serviceline
WorkingDirectory=/home/serviceline/api
EnvironmentFile=/home/serviceline/api/.env
ExecStart=/home/serviceline/api/.venv/bin/uvicorn app.main:app \
          --host 127.0.0.1 --port 8000 --workers 2
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now serviceline-api
sudo systemctl status serviceline-api
```

The `.env` holds the database URL, the session secret and the SMTP credentials.
Keep it at `chmod 600` and never commit it.

## B9 · Scheduled reminders and backups

```bash
sudo crontab -e
```

```cron
# Reminder emails, 06:00 daily
0 6 * * * /home/serviceline/api/.venv/bin/python /home/serviceline/api/scripts/send_reminders.py

# Database backup, 02:00 daily, 30 days retained
0 2 * * * /usr/bin/mysqldump -u serviceline -p'PASSWORD' serviceline | gzip > /home/serviceline/backups/serviceline-$(date +\%F).sql.gz
30 2 * * * find /home/serviceline/backups -name '*.sql.gz' -mtime +30 -delete
```

```bash
mkdir -p /home/serviceline/backups
chmod 700 /home/serviceline/backups
```

Copy backups off the server as well — a backup on the same machine does not
survive losing the machine. Hostinger VPS snapshots cover the whole server;
schedule those in hPanel too.

## B10 · Go-live checks

- [ ] `https://equipment.yourcompany.com` loads and shows a padlock
- [ ] `http://` redirects to `https://`
- [ ] Sign-in works and a wrong password is rejected
- [ ] A phone can scan a printed label and reach the record
- [ ] A service record saved on a phone appears on a laptop — **the thing Path A
      cannot do**
- [ ] Reminder email arrives
- [ ] A backup file exists in `/home/serviceline/backups`
- [ ] Restoring that backup into a scratch database works
- [ ] `sudo certbot renew --dry-run` passes
- [ ] MySQL is not reachable from outside: `nmap -p 3306 YOUR_SERVER_IP` is closed

---

# Which to choose now

If the goal today is to show the client a working system on a real address,
**do Path A.** It takes twenty minutes and it demonstrates every feature, as long
as you demonstrate with the sample equipment rather than items you added on
another device.

Move to Path B when the system starts holding real customer data, because that is
the point at which one shared database stops being a nicety and becomes the whole
requirement.
