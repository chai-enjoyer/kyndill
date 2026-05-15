# Deployment

Kyndill is deployed as a static React frontend on Firebase Hosting plus one
Compute Engine VM that runs the API, socket.io, cron jobs, Caddy, and
PostgreSQL. This keeps the prototype cheap and simple while leaving a future
Cloud SQL migration path.

## 1. Local Prerequisites

Install and authenticate the Google tools:

```bash
gcloud auth login
gcloud auth application-default login
firebase login
```

If the commands are missing, install:

- Google Cloud CLI: <https://cloud.google.com/sdk/docs/install>
- Firebase CLI: <https://firebase.google.com/docs/cli>

Verify the local build before deploying:

```bash
npm install
npm run build
npm run test:unit
```

## 2. Required Values

Choose these before running cloud commands:

| Name | Example | Used by |
| --- | --- | --- |
| `PROJECT_ID` | `kyndill-prod` | Google Cloud and Firebase |
| `REGION` | `us-central1` | GCP resources |
| `ZONE` | `us-central1-a` | Compute Engine VM |
| `API_DOMAIN` | `api.example.com` | Caddy, DNS, frontend env |
| `FRONTEND_ORIGIN` | `https://kyndill-prod.web.app` | backend CORS |
| `BACKUP_BUCKET` | `gs://kyndill-db-backups` | database backups |

## No Purchased Domain Option

You can deploy without buying a domain by using:

- Firebase's free frontend domain: `https://PROJECT_ID.web.app`
- A wildcard DNS hostname for the VM API: `https://VM_IP.sslip.io`

For example, if the VM static IP is `34.118.10.25`, use:

```bash
API_DOMAIN=34.118.10.25.sslip.io
FRONTEND_ORIGIN=https://PROJECT_ID.web.app
```

The `sslip.io` hostname automatically resolves to the IP address embedded in
the hostname, so no DNS account is needed. This is good for demos and thesis
testing. A real purchased domain is still better for a polished public launch.

## 3. Firebase Hosting Config

`firebase.json` is committed and points Hosting at `frontend/dist`.

For a project-specific local config, copy the example:

```bash
cp .firebaserc.example .firebaserc
```

Then replace `your-firebase-project-id` with the real Firebase project ID.

Create `frontend/.env.production` from the example:

```bash
cp frontend/.env.production.example frontend/.env.production
```

Set:

```bash
VITE_API_URL=https://API_DOMAIN
VITE_GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
```

Build and deploy the frontend:

```bash
npm run build --workspace frontend
firebase deploy --only hosting
```

## 4. Create Google Cloud Resources

Set shell variables:

```bash
PROJECT_ID=kyndill-prod
REGION=us-central1
ZONE=us-central1-a
VM_NAME=kyndill-api
BACKUP_BUCKET=gs://kyndill-db-backups
```

Enable APIs:

```bash
gcloud config set project "$PROJECT_ID"
gcloud services enable compute.googleapis.com storage.googleapis.com secretmanager.googleapis.com
```

Create a Cloud Storage bucket for backups:

```bash
gcloud storage buckets create "$BACKUP_BUCKET" --location="$REGION"
```

Create the VM:

```bash
gcloud compute instances create "$VM_NAME" \
  --zone="$ZONE" \
  --machine-type=e2-micro \
  --image-family=debian-12 \
  --image-project=debian-cloud \
  --boot-disk-size=20GB \
  --tags=http-server,https-server \
  --scopes=cloud-platform
```

Reserve a static IP after the VM exists:

```bash
gcloud compute addresses create kyndill-api-ip --region="$REGION"
gcloud compute instances delete-access-config "$VM_NAME" --zone="$ZONE" --access-config-name="External NAT"
gcloud compute instances add-access-config "$VM_NAME" --zone="$ZONE" --address="$(gcloud compute addresses describe kyndill-api-ip --region="$REGION" --format='value(address)')"
```

Point `API_DOMAIN` DNS to that static IP before starting Caddy TLS.

## 5. Bootstrap The VM

SSH into the VM:

```bash
gcloud compute ssh "$VM_NAME" --zone="$ZONE"
```

Install runtime packages:

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl git postgresql postgresql-contrib
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
sudo apt-get update
sudo apt-get install -y caddy
```

Create the app user and directories:

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin kyndill
sudo mkdir -p /srv/kyndill /etc/kyndill
sudo chown -R kyndill:kyndill /srv/kyndill
sudo chmod 750 /etc/kyndill
```

Clone or upload the repo into `/srv/kyndill`, then build it:

```bash
sudo -u kyndill git clone https://github.com/YOUR_ORG/YOUR_REPO.git /srv/kyndill
cd /srv/kyndill
sudo -u kyndill npm ci
sudo -u kyndill npm run build
```

## 6. Configure PostgreSQL

Create the production database and user:

```bash
sudo -u postgres psql
```

```sql
CREATE USER kyndill WITH PASSWORD 'change_this_password';
CREATE DATABASE kyndill OWNER kyndill;
\q
```

Create `/etc/kyndill/backend.env` from `backend/.env.production.example`:

```bash
sudo cp /srv/kyndill/backend/.env.production.example /etc/kyndill/backend.env
sudo nano /etc/kyndill/backend.env
sudo chmod 640 /etc/kyndill/backend.env
sudo chown root:kyndill /etc/kyndill/backend.env
```

Required production values:

```bash
PORT=3000
DATABASE_URL=postgresql://kyndill:change_this_password@127.0.0.1:5432/kyndill
JWT_SECRET=generate_a_long_random_secret
GOOGLE_CLIENT_ID=your-google-web-client-id.apps.googleusercontent.com
FRONTEND_URL=https://your-firebase-project-id.web.app
VAPID_PUBLIC_KEY=optional_public_key
VAPID_PRIVATE_KEY=optional_private_key
VAPID_SUBJECT=mailto:admin@example.com
PGPOOL_MAX=10
```

Apply migrations:

```bash
cd /srv/kyndill
sudo -u kyndill bash -lc 'set -a; source /etc/kyndill/backend.env; set +a; cd /srv/kyndill && npm run migrate --workspace backend'
```

## 7. Run The API

Install the systemd unit:

```bash
sudo cp /srv/kyndill/deploy/api/kyndill-api.service /etc/systemd/system/kyndill-api.service
sudo systemctl daemon-reload
sudo systemctl enable --now kyndill-api
sudo systemctl status kyndill-api
```

Test locally on the VM:

```bash
curl http://127.0.0.1:3000/health
```

Expected response:

```json
{ "status": "ok" }
```

## 8. Configure HTTPS Reverse Proxy

Edit `deploy/api/Caddyfile` so the first line is the real API domain:

```caddyfile
api.example.com {
  encode zstd gzip
  reverse_proxy 127.0.0.1:3000
}
```

Install it:

```bash
sudo cp /srv/kyndill/deploy/api/Caddyfile /etc/caddy/Caddyfile
sudo caddy validate --config /etc/caddy/Caddyfile
sudo systemctl reload caddy
```

Test externally:

```bash
curl https://API_DOMAIN/health
```

## 9. Configure Backups

Create `/etc/kyndill/backup.env`:

```bash
sudo cp /srv/kyndill/deploy/api/kyndill-backup.env.example /etc/kyndill/backup.env
sudo nano /etc/kyndill/backup.env
sudo chmod 640 /etc/kyndill/backup.env
sudo chown root:kyndill /etc/kyndill/backup.env
```

Install the backup timer:

```bash
sudo cp /srv/kyndill/deploy/api/kyndill-postgres-backup.service /etc/systemd/system/
sudo cp /srv/kyndill/deploy/api/kyndill-postgres-backup.timer /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now kyndill-postgres-backup.timer
```

Run one backup manually:

```bash
sudo systemctl start kyndill-postgres-backup.service
gcloud storage ls "$BACKUP_BUCKET"
```

## 10. Google OAuth And Push Notifications

In the Google OAuth Web client:

- Add the Firebase frontend origin to Authorized JavaScript origins.
- Add the custom frontend domain if one is used.
- Keep the same client ID in `frontend/.env.production` and `/etc/kyndill/backend.env`.

For push notifications, generate VAPID keys:

```bash
npx web-push generate-vapid-keys
```

Set the public/private keys in `/etc/kyndill/backend.env`, then restart:

```bash
sudo systemctl restart kyndill-api
```

## 11. Production Smoke Test

After both frontend and backend are deployed:

```bash
curl https://API_DOMAIN/health
```

Then verify in the browser:

- Firebase URL loads.
- Register/login works.
- Google sign-in works if configured.
- Dashboard loads authenticated data.
- Socket connection becomes active after login.
- Settings push notification test works if VAPID keys are configured.
