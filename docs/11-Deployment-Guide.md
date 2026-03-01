# 🚀 11: Deployment Guide

> How to run CardPulse locally, build for production, manage your database, and deploy to a self-hosted server. CardPulse is designed as a **local-first** app — no cloud services, no external APIs, no data leaving your machine.

---

## 📑 Table of Contents

- 💻 [Local Development](#-local-development)
- 🏗️ [Production Build](#️-production-build)
- 🔐 [Environment Variables](#-environment-variables)
- 🗄️ [Database Management](#️-database-management)
- 🌐 [Deploying to a VPS/Server](#-deploying-to-a-vpsserver)
- ⚠️ [SQLite Considerations](#️-sqlite-considerations)

---

## 💻 Local Development

### 📋 Prerequisites

| Requirement | Version | Notes |
|:-----------:|:-------:|:------|
| **Node.js** | 18+ | [Download here](https://nodejs.org/) |
| **npm** | 9+ | Included with Node.js |
| **Git** | Any | To clone the repository |

### 🚀 Quick Start

```bash
# 1️⃣ Clone the repository
git clone https://github.com/CmdShiftExecute/Personal-Projects.git
cd Personal-Projects/cardpulse

# 2️⃣ Install dependencies
npm install

# 3️⃣ Start the development server
npm run dev
```

🌐 Open **http://localhost:3000** in your browser.

> 🔥 **Hot Module Replacement (HMR):** The dev server supports HMR — most changes appear instantly without a full page reload. A dark loading state (`src/app/loading.tsx`) prevents white flash during recompilation.

### 📦 What Happens on First Start

On the very first run, CardPulse automatically:

| Step | Action | Details |
|:----:|:-------|:--------|
| 1️⃣ | 🗄️ Creates SQLite database | Single file at `data/cardpulse.db` |
| 2️⃣ | 🌱 Seeds reference data | 11 categories, 68 subcategories, 29 labels, 91+ keyword rules |
| 3️⃣ | ⚙️ Applies default settings | AED currency, DD/MM dates, Sage theme, dark mode |

> ✅ **Zero configuration required.** No `.env` file editing, no database migrations, no manual setup steps.

---

## 🏗️ Production Build

```bash
# 1️⃣ Build optimized production bundle
npm run build

# 2️⃣ Start the production server
npm start
```

### 📊 Build Output

| What | Detail |
|:-----|:-------|
| ⚡ **Static pages** | Pre-rendered at build time for instant loading |
| 🔄 **Dynamic pages** | Server-rendered on demand (dashboard, analytics, etc.) |
| 📦 **API routes** | Compiled as serverless-compatible handlers |
| 🎨 **CSS** | Tailwind purged and minified |
| 📜 **JS** | Tree-shaken, code-split, and minified |

> 🖥️ The production server runs on **http://localhost:3000** by default. Use the `PORT` environment variable or a reverse proxy to change this.

---

## 🔐 Environment Variables

CardPulse uses a **single environment variable**. No API keys, no cloud credentials, no external service configuration.

| Variable | Default | Description |
|:---------|:--------|:------------|
| 🗄️ `DB_PATH` | `./data/cardpulse.db` | Path to the SQLite database file |

### 📄 Setting Up `.env.local`

```bash
# .env.local (create in project root)
DB_PATH=./data/cardpulse.db
```

> 💡 **That's it.** No other environment variables exist. CardPulse is fully self-contained.

### 🔧 Custom Database Location

You can point `DB_PATH` to any writable location:

```bash
# Store in a specific directory
DB_PATH=/home/user/data/cardpulse.db

# Store on an external drive
DB_PATH=/mnt/data/cardpulse.db
```

> ⚠️ Ensure the directory exists and is writable by the Node.js process.

---

## 🗄️ Database Management

### 📍 Location

The SQLite database is stored at the path specified by `DB_PATH`. By default, this is `data/cardpulse.db` relative to the project root.

| Fact | Detail |
|:-----|:-------|
| 📁 **Default path** | `data/cardpulse.db` |
| 🚫 **Git status** | Gitignored — never committed to version control |
| 📊 **File size** | Typically 1–5 MB depending on transaction volume |
| 🔒 **Permissions** | Readable/writable by the Node.js process |

### 🌱 Auto-Creation

On first run, the database is automatically created and seeded with:

| Data | Count |
|:-----|:-----:|
| 📂 Categories | 11 |
| 📁 Subcategories | 68 |
| 🏷️ System labels | 29 |
| 🧠 Keyword rules | 91+ |
| ⚙️ Default settings | ~8 entries |

### 💾 Backup Strategies

#### Option 1: In-App Backup (Recommended)

1. ⚙️ Go to **Settings > Data Management**
2. 📥 Click **Export Backup**
3. 💾 A complete `.db` file is downloaded

This is the safest method — it checkpoints the WAL (Write-Ahead Log) before exporting, ensuring data integrity.

#### Option 2: File Copy

```bash
# Stop the server first (or ensure no writes are in progress)
cp data/cardpulse.db "data/cardpulse-backup-$(date +%Y-%m-%d).db"
```

#### Option 3: Automated Cron Backup

```bash
# Add to crontab (runs daily at 2 AM)
0 2 * * * cp /path/to/cardpulse/data/cardpulse.db \
  /path/to/backups/cardpulse-$(date +\%Y-\%m-\%d).db
```

> ⚠️ **Important:** If copying the `.db` file directly while the server is running, also copy the `.db-wal` and `.db-shm` files (if they exist) to ensure a consistent snapshot.

### 🔄 Restoring from Backup

#### Option 1: In-App Restore

1. ⚙️ Go to **Settings > Data Management**
2. 📤 Click **Import Backup**
3. 📁 Select a `.db` file to upload
4. ✅ The app restarts with the restored database

#### Option 2: File Replace

```bash
# 1️⃣ Stop the server
# 2️⃣ Replace the database file
cp data/cardpulse-backup.db data/cardpulse.db

# 3️⃣ Remove WAL files (if present)
rm -f data/cardpulse.db-wal data/cardpulse.db-shm

# 4️⃣ Restart the server
npm start
```

### 🗑️ Factory Reset

Use **Settings > Data Management > Reset Database** to clear all transactional data while keeping:
- ✅ Categories and subcategories
- ✅ System labels
- ✅ Keyword rules
- ✅ Application settings
- ❌ Transactions, EMIs, budgets, cycle payments are deleted

---

## 🌐 Deploying to a VPS/Server

CardPulse runs well on any Linux server with **Node.js 18+**. It serves well as a personal finance dashboard accessible from any device on your network.

### 🔧 Basic Deployment

```bash
# 1️⃣ Clone on the server
git clone https://github.com/CmdShiftExecute/Personal-Projects.git
cd Personal-Projects/cardpulse

# 2️⃣ Install and build
npm install
npm run build

# 3️⃣ Start with pm2 (process manager)
npx pm2 start npm --name "cardpulse" -- start

# 4️⃣ Set pm2 to auto-start on reboot
npx pm2 save
npx pm2 startup
```

### 📊 pm2 Management Commands

| Command | Description |
|:--------|:------------|
| `npx pm2 status` | Check running status |
| `npx pm2 logs cardpulse` | View live logs |
| `npx pm2 restart cardpulse` | Restart the app |
| `npx pm2 stop cardpulse` | Stop the app |
| `npx pm2 monit` | Real-time monitoring dashboard |

### 🔀 Nginx Reverse Proxy

Set up nginx to serve CardPulse on a domain or subdomain with SSL:

```nginx
server {
    listen 80;
    server_name cardpulse.example.com;

    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name cardpulse.example.com;

    # SSL certificates (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/cardpulse.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/cardpulse.example.com/privkey.pem;

    # Proxy to Next.js
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 🔒 SSL with Let's Encrypt

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate (auto-configures nginx)
sudo certbot --nginx -d cardpulse.example.com

# Auto-renewal is set up automatically
sudo certbot renew --dry-run   # Test renewal
```

### 🛡️ Security Considerations

| Area | Recommendation |
|:-----|:---------------|
| 🔐 **HTTPS** | Always use SSL/TLS — Let's Encrypt provides free certificates |
| 🔑 **PIN** | The PIN system provides basic access control but is not enterprise-grade auth |
| 🧱 **Firewall** | Use `ufw` or `iptables` to restrict access to trusted IPs if needed |
| 📁 **File permissions** | Ensure the `data/` directory is only readable by the Node.js user |
| 🔄 **Updates** | `git pull && npm install && npm run build && npx pm2 restart cardpulse` |

```bash
# Example: Restrict to local network only (UFW)
sudo ufw allow from 192.168.1.0/24 to any port 443
sudo ufw deny 443
```

---

## ⚠️ SQLite Considerations

CardPulse is designed as a **local-first** application. SQLite is the entire backend — no separate database server is needed.

### ✅ Strengths

| Strength | Detail |
|:---------|:-------|
| 🔧 **Zero configuration** | Database is a single file — no setup, no server, no connections |
| ⚡ **Excellent read performance** | More than adequate for the expected data volume (hundreds to thousands of transactions) |
| 🔒 **ACID transactions** | Full transactional integrity with atomic commits |
| 💾 **Easy to backup** | Copy one file and you have a complete backup |
| 📦 **Portable** | Move the `.db` file to any machine and it just works |
| 🌐 **No network dependency** | Works offline, on planes, in cafes — anywhere |

### ⚠️ Limitations

| Limitation | Impact | Mitigation |
|:-----------|:-------|:-----------|
| ✍️ **Single writer** | One write at a time. Fine for single-user, bottleneck under concurrent load | WAL mode improves concurrent reads |
| 🚫 **No remote access** | Database is local to the server. No direct mobile app connectivity | Deploy to VPS and access via mobile browser |
| 📏 **File size** | Practical limit ~1 GB for good performance | Years of personal expense data stays well under this |

### ☁️ Vercel / Serverless Caveats

> ⚠️ **Vercel's serverless architecture does not persist files between invocations.** SQLite on Vercel works for read-only data, but **transactions would be lost** between cold starts.

| Approach | Works? | Notes |
|:---------|:------:|:------|
| 🚫 Vercel (standard) | No | File system is ephemeral — data loss on cold starts |
| ⚠️ Vercel + Turso | Partial | Requires code changes to use Turso's libSQL client |
| ⚠️ Vercel + LiteFS | Partial | Requires Fly.io for persistent volume |
| ✅ VPS (Recommended) | Yes | Full control, persistent filesystem, best for SQLite |
| ✅ Docker | Yes | Mount a volume for `/data` directory |
| ✅ Local machine | Yes | The intended deployment model |

### 📝 WAL Mode

`better-sqlite3` uses **WAL (Write-Ahead Logging)** mode by default for better concurrent read performance.

| File | Purpose |
|:-----|:--------|
| 📄 `cardpulse.db` | Main database file |
| 📄 `cardpulse.db-wal` | Write-Ahead Log (pending writes) |
| 📄 `cardpulse.db-shm` | Shared memory index for WAL |

> 💡 The `-wal` and `-shm` files are **normal** and expected. They are automatically managed by SQLite. When backing up by file copy, include all three files for a consistent snapshot — or use the in-app backup, which checkpoints the WAL first.

### 🐳 Docker Deployment (Optional)

If you prefer containerization, here is a minimal `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --production

COPY . .
RUN npm run build

# Create data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

ENV DB_PATH=/app/data/cardpulse.db
CMD ["npm", "start"]
```

Run with a persistent volume for the database:

```bash
# Build the image
docker build -t cardpulse .

# Run with persistent data volume
docker run -d \
  --name cardpulse \
  -p 3000:3000 \
  -v cardpulse-data:/app/data \
  cardpulse
```

> 🔑 **Key:** The `-v cardpulse-data:/app/data` flag ensures your database persists across container restarts and updates.

---

← Previous: [Architecture Overview](./10-Architecture-Overview.md) | → Back to: [README](../README.md)
