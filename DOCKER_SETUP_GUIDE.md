# ProjectMeet Docker Setup - Complete Developer Guide

## Table of Contents
1. [Quick Start Commands](#quick-start-commands)
2. [Understanding the Architecture](#understanding-the-architecture)
3. [Services Overview](#services-overview)
4. [Volume Management](#volume-management)
5. [Dockerfile Breakdown](#dockerfile-breakdown)
6. [Configuration & Environment](#configuration--environment)
7. [Image Types: Pulled vs Built](#image-types-pulled-vs-built)
8. [How Services Communicate](#how-services-communicate)
9. [Troubleshooting & Debugging](#troubleshooting--debugging)

---

## Quick Start Commands

### START THE APPLICATION

**Option 1: Start everything together**
```bash
cd /home/vishnu/Documents/projectMeet
docker compose up -d
```
This command:
- `-d` flag = detached mode (runs in background)
- Starts all services defined in `docker-compose.yml`
- Creates volumes automatically
- Creates network for inter-service communication

**Option 2: View logs while starting**
```bash
docker compose up
# Without -d flag, you'll see real-time logs
# Press Ctrl+C to stop viewing (services keep running)
```

**Option 3: Start specific services only**
```bash
# Start only backend
docker compose up -d backend

# Start only frontend
docker compose up -d frontend

# Start database only
docker compose up -d postgres redis
```

---

### STOP THE APPLICATION

**Option 1: Stop all services (keeps data)**
```bash
docker compose stop
```
Services stop but data persists in volumes.

**Option 2: Stop and remove containers (keeps data)**
```bash
docker compose down
```
Removes containers but volumes survive - **data is safe**.

**Option 3: Stop and remove everything including volumes**
```bash
docker compose down -v
```
⚠️ **WARNING**: This deletes all data in volumes! Use only if you want a clean slate.

---

### VIEW LOGS

**All services**
```bash
docker compose logs -f
```

**Specific service**
```bash
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

**Last 50 lines**
```bash
docker compose logs --tail=50 backend
```

---

### REBUILD IMAGES (if you change code)

**Rebuild all**
```bash
docker compose build
```

**Rebuild and start**
```bash
docker compose up -d --build
```

**Rebuild only backend**
```bash
docker compose build backend
docker compose up -d backend
```

---

### CHECK STATUS

**List all containers**
```bash
docker compose ps
```

**List all projectMeet images**
```bash
docker images | grep projectmeet
```

**Check volume size**
```bash
docker volume ls
docker volume inspect projectmeet_postgres_data
```

**Get container details**
```bash
docker compose exec postgres psql -U projectmeet -d projectmeet
```

---

## Understanding the Architecture

### System Diagram
```
┌─────────────────────────────────────────┐
│         Docker Compose Network          │
│     (projectmeet-network - bridge)      │
└──────────┬──────────────────────────────┘
           │
    ┌──────┴──────┬────────────┬──────────┬─────────┐
    │             │            │          │         │
┌───▼──┐      ┌──▼──┐      ┌──▼──┐    ┌─▼───┐   ┌──▼────┐
│ Web  │      │ API │      │  DB │    │Cache│   │TURN/  │
│Browser       │ND  │      │     │    │     │   │STUN   │
└──────┘      └─────┘      └─────┘    └─────┘   └───────┘
    │           │            │          │         │
    │Host       │Container   │Container │Container│Container
    3000        4000         5433/5432  6379      3478
```

### Port Mapping Explanation

| Service | Container Port | Host Port | Purpose |
|---------|---|---|---|
| Frontend | 3000 | 3000 | Next.js dev server (browser access) |
| Backend | 4000 | 4000 | Node.js API + WebSocket (REST/WS) |
| PostgreSQL | 5432 | 5433 | Database (external access for testing) |
| Redis | 6379 | 6379 | Cache & Socket.IO adapter |
| TURN | 3478 | 3478 | WebRTC NAT traversal |

**Why port 5433 not 5432?**
- Host uses 5433 to avoid conflicts if PostgreSQL is installed locally
- Container still uses 5432 internally
- Connection string: `postgresql://user:pass@postgres:5432/db` (inside network)

---

## Services Overview

### 1. PostgreSQL Database

**What it does**: Stores all application data (users, meetings, sessions)

**Configuration in docker-compose.yml**:
```yaml
postgres:
    image: postgres:16-alpine          # PULLED from Docker Hub
    container_name: projectmeet-postgres
    restart: unless-stopped           # Restart if crashes
    environment:
      POSTGRES_USER: projectmeet      # Database user
      POSTGRES_PASSWORD: projectmeet_secret_2024  # Database password
      POSTGRES_DB: projectmeet        # Initial database name
    ports:
      - "5433:5432"                   # Map ports
    volumes:
      - postgres_data:/var/lib/postgresql/data  # Persist data
    healthcheck:                       # Monitor health
      test: ["CMD-SHELL", "pg_isready -U projectmeet"]
      interval: 10s                   # Check every 10 seconds
      timeout: 5s
      retries: 5                      # Fail after 5 failed checks
    networks:
      - projectmeet-network           # Connect to app network
```

**Volume Location on Host Machine**:
```
/var/lib/docker/volumes/projectmeet_postgres_data/_data/
```
This directory persists even after container stops.

**Connect from host machine**:
```bash
psql -h localhost -p 5433 -U projectmeet -d projectmeet
# Password: projectmeet_secret_2024
```

**Connect from inside Docker**:
```bash
docker compose exec postgres psql -U projectmeet -d projectmeet
```

---

### 2. Redis Cache

**What it does**: 
- Caches data for fast access
- Bridges WebSockets across multiple backend instances
- Session storage

**Configuration**:
```yaml
redis:
    image: redis:7-alpine              # PULLED from Docker Hub
    container_name: projectmeet-redis
    restart: unless-stopped
    ports:
      - "6379:6379"                    # Redis default port
    volumes:
      - redis_data:/data               # Persist data
    command: redis-server --appendonly yes  # AOF persistence
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - projectmeet-network
```

**Volume Location**:
```
/var/lib/docker/volumes/projectmeet_redis_data/_data/
```

**Connect from CLI**:
```bash
docker compose exec redis redis-cli
# Then in redis CLI:
> ping
PONG
> keys *          # See all keys
> get key_name    # Get value
```

---

### 3. COTURN (TURN/STUN Server)

**What it does**: Helps WebRTC connections work through firewalls/NAT

**Configuration**:
```yaml
coturn:
    image: coturn/coturn:latest        # PULLED from Docker Hub
    container_name: projectmeet-coturn
    restart: unless-stopped
    ports:
      - "3478:3478"                    # TURN protocol
      - "3478:3478/udp"                # UDP variant
      - "49152-49200:49152-49200/udp"  # Media relay ports
    volumes:
      - ./coturn/turnserver.conf:/etc/coturn/turnserver.conf:ro
      # ^-- Mounts config file in READ-ONLY mode
    networks:
      - projectmeet-network
```

**No volume for data persistence** - it's a stateless relay server

**Check if working**:
```bash
docker compose exec coturn echo "TURN server is running"
```

---

### 4. Backend (Node.js API + WebSocket)

**What it does**: REST API + WebSocket server for real-time communication

**Dockerfile Location**: `./backend/Dockerfile`

**Configuration in docker-compose.yml**:
```yaml
backend:
    build:                             # BUILDS custom image
      context: ./backend
      dockerfile: Dockerfile
    container_name: projectmeet-backend
    restart: unless-stopped
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://projectmeet:projectmeet_secret_2024@postgres:5432/projectmeet
      # ^-- Uses service name "postgres", not "localhost"
      # Docker DNS resolves service names automatically
      REDIS_URL: redis://redis:6379
      JWT_SECRET: your-super-secret-jwt-key-change-in-production-2024
      NODE_ENV: development
      PORT: 4000
    depends_on:
      postgres:
        condition: service_healthy     # Wait for postgres health check
      redis:
        condition: service_healthy     # Wait for redis health check
    volumes:
      - ./backend:/app                 # Mount source code
      - /app/node_modules              # Keep node_modules in container
      # ^-- Anonymous volume prevents host node_modules from overwriting
    networks:
      - projectmeet-network
```

**Volume Strategy**:
- `./backend:/app` = Live code reload during development
- `/app/node_modules` = Don't use host's node_modules (use container's compiled ones)

---

### 5. Frontend (Next.js)

**What it does**: React UI served via Next.js dev server

**Dockerfile Location**: `./frontend/Dockerfile`

**Configuration**:
```yaml
frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: projectmeet-frontend
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:4000/api
      # ^-- Public variables accessible in browser
      NEXT_PUBLIC_WS_URL: http://localhost:4000
      NEXT_PUBLIC_APP_NAME: ProjectMeet
    depends_on:
      - backend                   # Wait for backend to start
    volumes:
      - ./frontend:/app           # Live code reload
      - /app/node_modules         # Container's node_modules
      - /app/.next                # Next.js build cache
    networks:
      - projectmeet-network
```

---

## Volume Management

### What are Volumes?

Volumes are persistent storage for Docker containers. When you stop a container, volume data survives.

### Named vs Anonymous Volumes

**Named Volumes** (persistent data):
```yaml
volumes:
  postgres_data:
    driver: local
  redis_data:
    driver: local
```
These survive `docker compose down`. Located at:
```
/var/lib/docker/volumes/projectmeet_postgres_data/
/var/lib/docker/volumes/projectmeet_redis_data/
```

**Anonymous Volumes** (temporary during dev):
```yaml
volumes:
  - /app/node_modules         # Lifetime = container lifetime
  - /app/.next                # Discarded when container stops
```

### Bind Mounts (Code Mounting)

```yaml
volumes:
  - ./backend:/app            # Bind mount for hot reload
  - ./frontend:/app
```

**How it works**:
- Code changes on host → instantly visible in container
- Perfect for development (no rebuild needed)
- ⚠️ Production should use COPY instead (in multi-stage Dockerfile)

### Check Volume Usage

```bash
# List all volumes
docker volume ls

# Inspect specific volume
docker volume inspect projectmeet_postgres_data

# See volume path
docker volume inspect projectmeet_postgres_data --format='{{.Mountpoint}}'

# Check disk usage
du -sh /var/lib/docker/volumes/projectmeet_postgres_data/_data/
```

### Backup Volumes

```bash
# Backup postgres data
docker run --rm \
  -v projectmeet_postgres_data:/data \
  -v $(pwd):/backup \
  -w / \
  alpine tar czf /backup/postgres_backup.tar.gz -C / data

# Restore
docker volume rm projectmeet_postgres_data
docker volume create projectmeet_postgres_data
docker run --rm \
  -v projectmeet_postgres_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/postgres_backup.tar.gz -C / data
```

---

## Dockerfile Breakdown

### Backend Dockerfile

**File**: `./backend/Dockerfile`

```dockerfile
FROM node:20-alpine
# ^-- Base image: Node.js 20 on Alpine Linux (tiny ~150MB)
# Alpine is lightweight Linux distro, great for dev/prod

WORKDIR /app
# ^-- Set working directory inside container
# All subsequent commands run in /app

COPY package*.json ./
# ^-- Copy package.json and package-lock.json (if exists)
# The * wildcard matches both files
# Copied to /app/ inside container

RUN npm install
# ^-- Install dependencies inside container
# Creates /app/node_modules

COPY prisma ./prisma
# ^-- Copy Prisma schema

RUN npx prisma generate
# ^-- Generate Prisma client (before copying entire app)
# Placed here to use Docker's layer caching efficiently

COPY . .
# ^-- Copy remaining application code

EXPOSE 4000
# ^-- Document that service uses port 4000
# Doesn't actually publish port (that's docker-compose's job)

CMD ["npm", "run", "dev"]
# ^-- Default command when container starts
# Equivalent to: docker compose exec backend npm run dev
```

**Why this order matters?** (Docker Layer Caching)

```
1. FROM node:20-alpine          [pulled from Docker Hub, layer 1 - cached]
2. WORKDIR /app                  [layer 2 - cached after first build]
3. COPY package*.json ./         [layer 3 - only rebuilds if package.json changes]
4. RUN npm install               [layer 4 - huge layer, rebuilds if package.json changes]
5. COPY prisma ./prisma          [layer 5 - rebuilds if prisma schema changes]
6. RUN npx prisma generate       [layer 6 - rebuilds if prisma changes]
7. COPY . .                      [layer 7 - rebuilds if ANY file changes]
8. EXPOSE 4000                   [layer 8 - rebuilds if this changes]
9. CMD ["npm", "run", "dev"]     [layer 9 - rebuilds if CMD changes]
```

**Optimization**: Dependencies (package.json) are early in the Dockerfile because they change less frequently than code. If code changes but package.json doesn't, layers 1-4 are reused from cache.

### Frontend Dockerfile

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
# ^-- Everything copied (including .env, config, etc.)

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

**Difference from Backend**: No `COPY prisma` because Next.js doesn't need Prisma client.

---

## Configuration & Environment

### .env File Structure

**Location**: `/home/vishnu/Documents/projectMeet/.env`

**Environment Variables Explained**:

```env
# ===== DATABASE =====
POSTGRES_USER=projectmeet
# ^-- Username to create in PostgreSQL

POSTGRES_PASSWORD=projectmeet_secret_2024
# ^-- Password for that user
# ⚠️ Change this in production!

POSTGRES_DB=projectmeet
# ^-- Initial database name created automatically

DATABASE_URL=postgresql://projectmeet:projectmeet_secret_2024@localhost:5433/projectmeet?schema=public
# ^-- Connection string for external tools
# Inside containers: postgresql://projectmeet...@postgres:5432/... (use service name)
# From host machine: postgresql://projectmeet...@localhost:5433/... (use mapped port)

# ===== REDIS =====
REDIS_URL=redis://localhost:6379
# ^-- From host: localhost:6379
# ^-- From backend container: redis://redis:6379 (use service name)

# ===== JWT TOKENS =====
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
# ^-- Signs access tokens (short-lived: 15m)
# ⚠️ CHANGE THIS! Use: openssl rand -base64 32

JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-2024
# ^-- Signs refresh tokens (long-lived: 7d)
# ⚠️ CHANGE THIS! Use: openssl rand -base64 32

JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# ===== BACKEND =====
BACKEND_PORT=4000
NODE_ENV=development
# ^-- When "production": Next.js optimizes, disables hot reload, etc.

# ===== FRONTEND =====
NEXT_PUBLIC_API_URL=http://localhost:4000/api
# ^-- NEXT_PUBLIC_ = accessible in browser JavaScript
# ^-- Frontend calls: fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/login')

NEXT_PUBLIC_WS_URL=http://localhost:4000
# ^-- WebSocket server URL

NEXT_PUBLIC_APP_NAME=ProjectMeet
# ^-- Shown in UI, can be customized

# ===== TURN/STUN =====
TURN_SERVER_URL=turn:localhost:3478
# ^-- TURN server for NAT traversal

TURN_USERNAME=projectmeet
TURN_PASSWORD=projectmeet_turn_2024

STUN_SERVER_URL=stun:stun.l.google.com:19302
# ^-- Google's free STUN server
```

### How Services Access Each Other

**Inside Docker Network**: Services use service names as hostnames

```javascript
// backend/src/config/database.ts
// Docker resolves "postgres" to the container IP automatically
const databaseUrl = process.env.DATABASE_URL;
// From .env: postgresql://user:pass@postgres:5432/db
// Docker DNS: postgres → 172.18.0.2 (example IP)
```

**From Host Machine**: Use localhost with mapped ports

```bash
# From your laptop
psql -h localhost -p 5433 -U projectmeet -d projectmeet
# 5433 is the mapped port on host
```

---

## Image Types: Pulled vs Built

### PULLED IMAGES (Official Images - No Build Needed)

Images are pre-built and available on Docker Hub:

```yaml
postgres:
  image: postgres:16-alpine        # ← PULLED, not built
  
redis:
  image: redis:7-alpine            # ← PULLED, not built
  
coturn:
  image: coturn/coturn:latest      # ← PULLED, not built
```

**How Docker handles pulled images**:
1. You run `docker compose up`
2. Docker checks if `postgres:16-alpine` exists locally
3. If not, it downloads from Docker Hub
4. If yes, it reuses the existing image
5. Container is created from that image

**Check pulled images**:
```bash
docker images | grep -E "postgres|redis|coturn"

# Output:
# postgres          16-alpine     108b27c919e6   2 weeks ago   100MB
# redis             7-alpine      13105d2858dd   2 weeks ago   45MB
# coturn/coturn     latest        2306d09f6b04   1 month ago   180MB
```

**Size comparison**:
- `postgres:16-alpine`: ~100MB (small)
- `postgres:16`: ~300MB (large, has extras)
- Why alpine? Lightweight, perfect for Docker

### BUILT IMAGES (Custom Code - Build Required)

Images are built from your Dockerfile:

```yaml
backend:
  build:
    context: ./backend
    dockerfile: Dockerfile           # ← BUILT (not pulled)
  
frontend:
  build:
    context: ./frontend
    dockerfile: Dockerfile           # ← BUILT (not pulled)
```

**Build process**:
```bash
docker compose build backend
# Step 1: FROM node:20-alpine (pulls base)
# Step 2: WORKDIR /app
# Step 3: COPY package*.json ./
# Step 4: RUN npm install (builds layer)
# ...
# Output: sha256:37515747386f364... [backend] 2.3s
```

**Check built images**:
```bash
docker images | grep projectmeet

# Output:
# projectmeet-backend      latest     37515747386f   2 minutes ago   850MB
# projectmeet-frontend     latest     bc0a7d334676   2 minutes ago   920MB
```

**Size of built images** (~850MB+) because they include:
- Base OS (node:20-alpine) ~150MB
- node_modules with 1000s of packages ~700MB
- Your application code ~10MB

### Rebuild Triggers

**Backend image rebuilds when**:
```
1. Dockerfile changes
2. package.json changes (because: RUN npm install)
3. backend/ code changes (because: COPY . .)
4. prisma/ schema changes (because: COPY prisma ...)
```

**Rebuild command**:
```bash
docker compose up -d --build backend
# Re-executes all 9 layers of Dockerfile
```

**Rebuild strategy - Smart Caching**:
```bash
# Only rebuild if needed
docker compose build --no-cache backend
# Skip cache, rebuild from scratch (slower but guaranteed fresh)
```

---

## How Services Communicate

### Docker Network Bridge

```yaml
# docker-compose.yml creates a network:
networks:
  projectmeet-network:
    driver: bridge
```

**Network diagram**:
```
┌──────────────────────┐
│ projectmeet-network  │ (isolated bridge network)
│  (172.18.0.0/16)    │
└──────────────────────┘
       │      │      │      │
    Host    Container1   Container2   Container3
    dns:    dns:postgres  dns:redis  dns:backend
    lookup  172.18.0.2    172.18.0.3  172.18.0.4
```

### Service Name Resolution

**When backend connects to postgres**:
```javascript
// backend code
const db = await postgres.connect({
  connectionString: 'postgresql://user:pass@postgres:5432/db'
  //                                        ^^^^^^^^
  //                                   service name
});

// Docker DNS:
// Step 1: Container queries 127.0.0.11:53 (Docker's embedded DNS)
// Step 2: DNS resolves "postgres" → 172.18.0.2 (postgres container IP)
// Step 3: TCP connection established to 172.18.0.2:5432
```

### No Network Access Between Containers (By Default)

```bash
# From frontend container
ping backend
# ERROR: no route to host

# Why? Not in same network!
# Solution: Both use projectmeet-network
# Now:
ping backend
# PONG (resolved to 172.18.0.4)
```

### External Access from Host

```bash
# From your laptop
curl http://localhost:4000/api/health
# ✓ Works (port 4000 is mapped)

curl http://postgres:5432
# ✗ Fails (postgres service is internal only)

curl http://localhost:5433
# ✓ Works (port 5433 is mapped to postgres:5432)
```

---

## Troubleshooting & Debugging

### Common Issues

#### 1. "Connection refused" Error

**Problem**: Backend can't connect to postgres

```
Error: Could not connect to server: hostname "postgres" not reached
```

**Solution**:
```bash
# Check if postgres container is running
docker compose ps

# Check if it's healthy
docker compose logs postgres
# Look for: "database system is ready to accept connections"

# Wait for health check to pass
docker compose wait postgres
```

#### 2. "Port already in use" Error

**Problem**: Port 3000 or 4000 already in use

```
Error: Port 3000 is already allocated
```

**Solution**:
```bash
# Find what's using port 3000
lsof -i :3000
# Kill it
kill -9 <PID>

# OR change port in docker-compose.yml
# FROM: - "3000:3000"
# TO:   - "3001:3000"
```

#### 3. "depends_on" Hanging

**Problem**: Frontend waits for backend forever

```yaml
depends_on:
  - backend       # Waits for container to START, not be READY
```

**Solution**: Use `condition: service_healthy`
```yaml
depends_on:
  backend:
    condition: service_healthy  # Waits for healthcheck
```

#### 4. Code Changes Not Reflecting

**Problem**: You modified `backend/src/app.ts`, but changes didn't appear

**Solution**:
```bash
# Check if volume is mounted
docker compose exec backend ls -la /app/src/
# If missing /app/src/app.ts, volume isn't mounted

# Option 1: Rebuild
docker compose up -d --build backend

# Option 2: Check .dockerignore isn't excluding files
cat backend/.dockerignore
```

#### 5. node_modules Corruption

**Problem**: `npm ERR! ERR!` or weird module errors

```bash
# The issue: host node_modules leaked into container

# Fix:
docker compose down -v
# Remove all volumes

docker image rm projectmeet-backend projectmeet-frontend
# Remove built images

docker compose up -d --build
# Clean rebuild with fresh node_modules
```

### Debugging Commands

**See what's inside a container**:
```bash
docker compose exec backend ls -la /app
docker compose exec backend cat package.json
docker compose exec backend env | sort
# See all environment variables
```

**Run a command in container**:
```bash
docker compose exec backend npm list
# List installed packages

docker compose exec backend node -e "console.log(process.env.DATABASE_URL)"
# Check actual connection string

docker compose exec postgres pg_dump -U projectmeet projectmeet > backup.sql
# Backup database
```

**Check network connectivity**:
```bash
docker compose exec backend ping postgres
# PING postgres (172.18.0.2) 56(84) bytes of data.

docker compose exec backend curl http://postgres:5432
# Shows connection is allowed

docker compose exec backend curl http://localhost:4000/api/health
# Test API from inside network
```

**View resource usage**:
```bash
docker stats
# CPU, Memory, Network, Block I/O usage

docker compose stats
# Same, but only for this project
```

---

## Development Workflow

### Making Code Changes

**1. Change backend code**:
```bash
# Edit: backend/src/app.ts
nano backend/src/app.ts

# Save: Ctrl+O, Ctrl+X

# Backend auto-reloads (volume mounted)
docker compose logs -f backend
# Watch for: "Restarting..."
```

**2. Change package dependencies**:
```bash
cd backend
npm install express-validator

# Update package.json automatically
# Then rebuild container
docker compose up -d --build backend
```

**3. Change environment variables**:
```bash
# Edit .env
nano .env

# Restart services to pick up new variables
docker compose restart backend frontend
```

### Full Rebuild Scenario

```bash
# 1. Stop everything
docker compose down

# 2. Remove old images (optional, if Dockerfile changed)
docker image rm projectmeet-backend projectmeet-frontend

# 3. Clean rebuild
docker compose up -d --build

# 4. Check logs
docker compose logs -f

# 5. Test
curl http://localhost:4000/api/health
```

---

## Production Considerations

### Differences from Development

**Development**:
```dockerfile
CMD ["npm", "run", "dev"]        # Hot reload, source maps
```

**Production**:
```dockerfile
RUN npm run build                # Pre-compile code
CMD ["npm", "run", "start"]      # Optimized, faster
```

**Multi-Stage Build** (for production):
```dockerfile
# Stage 1: Build
FROM node:20-alpine as builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build                # Compile TypeScript

# Stage 2: Runtime (only what's needed)
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --only=production
COPY --from=builder /app/dist ./dist
CMD ["node", "dist/server.js"]
# ^-- Final image is ~200MB, not 850MB!
```

### Environment-Specific .env Files

```bash
# .env.development (current)
NODE_ENV=development

# .env.production
NODE_ENV=production
DATABASE_URL=postgresql://prod_user:prod_pass@prod-db.aws.com:5432/meet
REDIS_URL=redis://prod-redis.aws.com:6379
JWT_SECRET=<generate with: openssl rand -base64 32>
```

### Secrets Management

**⚠️ Never commit .env to git!**
```bash
echo ".env" >> .gitignore
git add .gitignore
git commit -m "Ignore .env"
```

**Use environment variables in CI/CD**:
```bash
# GitHub Actions, GitLab CI, etc.
- name: Start services
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
    JWT_SECRET: ${{ secrets.JWT_SECRET }}
  run: docker compose up -d
```

---

## Summary: Key Takeaways

| Concept | Key Point |
|---------|-----------|
| **docker compose up** | Starts all services, creates volumes, creates network |
| **docker compose down** | Stops services, removes containers, **keeps data** |
| **Volumes** | Persistent storage that survives container restarts |
| **Bind mounts** | Mount source code for live reload during dev |
| **Pulled images** | Official images (postgres, redis) - no build needed |
| **Built images** | Custom images (backend, frontend) - built from Dockerfile |
| **Service names** | Inside network, use service names (postgres, redis, backend) |
| **Port mapping** | Host port:Container port (5433:5432) |
| **Healthchecks** | Tell Docker when service is ready (used by depends_on) |
| **Layers & caching** | Order of Dockerfile commands matters for build speed |

---

## Quick Reference Card

```bash
# ===== BASIC ===== 
docker compose up -d                  # Start everything
docker compose down                   # Stop everything (keep data)
docker compose logs -f backend        # View logs

# ===== REBUILD =====
docker compose build backend          # Build image
docker compose up -d --build backend  # Rebuild and start

# ===== DEBUG =====
docker compose ps                     # List containers
docker compose exec postgres psql ... # Run command in container
docker stats                          # Resource usage
docker volume ls                      # List volumes

# ===== CLEANUP =====
docker compose down -v                # Stop and remove volumes (⚠️ data loss!)
docker image rm projectmeet-backend   # Remove image
docker system prune                   # Clean unused resources
```

---

## Common Next Steps for Juniors

1. **Learn Docker CLI**: `docker run`, `docker build`, `docker push`
2. **Learn docker-compose**: Play with services in `docker-compose.yml`
3. **Learn volumes**: Understand persistent data vs ephemeral data
4. **Learn networking**: How containers discover each other
5. **Learn caching**: Why Dockerfile layer order matters
6. **Learn multi-stage builds**: For optimized production images
7. **Learn image registry**: Docker Hub, GitHub Packages, ECR, GCR
8. **Learn orchestration**: Kubernetes, Docker Swarm (for production)
9. **Learn CI/CD**: Automated builds and deployments
10. **Learn security**: Scanning images, secrets management, minimal images

