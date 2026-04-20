# Docker Infrastructure Guide - ProjectMeet

## Overview

ProjectMeet uses Docker Compose to orchestrate a multi-service architecture for scalable video conferencing. This guide covers setup, configuration, and management.

---

## Services Architecture

### 1. **PostgreSQL 16-alpine** (Database)
**Image:** `postgres:16-alpine`  
**Container:** `projectmeet-postgres`  
**Port:** `5433:5432` (host:container)

**Purpose:**
- Persistent relational database for all application data
- Stores users, meetings, participants, chat messages, sessions
- Uses Prisma ORM for type-safe database access

**Configuration:**
```yaml
Environment Variables:
  POSTGRES_USER=projectmeet
  POSTGRES_PASSWORD=projectmeet_secret_2024
  POSTGRES_DB=projectmeet
```

**Volumes:**
- `postgres_data:/var/lib/postgresql/data` — Persistent data across container restarts

**Health Check:**
- Verifies database is ready before dependent services start
- Interval: 10s, Timeout: 5s, Retries: 5

**Connection String:**
```
DATABASE_URL=postgresql://projectmeet:projectmeet_secret_2024@postgres:5433/projectmeet?schema=public
```

---

### 2. **Redis 7-alpine** (Cache & Pub/Sub)
**Image:** `redis:7-alpine`  
**Container:** `projectmeet-redis`  
**Port:** `6379:6379`

**Purpose:**
- Horizontal scaling for WebSocket connections via Socket.IO adapter
- Real-time message broadcasting (user join/leave, media state changes)
- Session caching and temporary data storage
- Message queue for async operations

**Configuration:**
```yaml
Command: redis-server --appendonly yes  # AOF persistence enabled
```

**Volumes:**
- `redis_data:/data` — Persistent append-only file (AOF) for data durability

**Health Check:**
- Uses `PING` command to verify Redis is operational
- Interval: 10s, Timeout: 5s, Retries: 5

**Connection String:**
```
REDIS_URL=redis://redis:6379
```

**Use Cases:**
- Socket.IO adapter: scales WebSocket connections across multiple backend instances
- Real-time event distribution (user joined, media toggled, chat messages)
- JWT token blacklisting (logout functionality)
- Temporary meeting state

---

### 3. **Coturn Server** (TURN/STUN for WebRTC)
**Image:** `coturn/coturn:latest`  
**Container:** `projectmeet-coturn`  
**Ports:**
- `3478:3478/tcp` — TURN/STUN protocol
- `3478:3478/udp` — Media relay
- `49152-49200:49152-49200/udp` — RTP media ports

**Purpose:**
- NAT traversal for WebRTC peer connections
- STUN server: helps clients discover their public IP
- TURN server: relays media when P2P connection blocked by firewall

**Configuration:**
```yaml
Volume: ./coturn/turnserver.conf:/etc/coturn/turnserver.conf
```

**Key Settings in `turnserver.conf`:**
```ini
listening-port=3478
listening-ip=0.0.0.0
relay-ip=127.0.0.1  # Use container's IP for relaying
external-ip=localhost  # Public IP (update for production)
realm=projectmeet
username=turn_user
password=turn_password_123
```

**Typical WebRTC Flow:**
1. Browser gets ICE candidates (STUN server)
2. Attempts direct P2P connection
3. Falls back to TURN relay if P2P fails
4. ProjectMeet sends TURN servers to client: `/api/meetings/ice-servers`

---

### 4. **Backend API** (Node.js + Express)
**Image:** Built from `./backend/Dockerfile`  
**Container:** `projectmeet-backend`  
**Port:** `4000:4000`

**Purpose:**
- REST API for meetings, authentication, chat
- WebSocket server (Socket.IO) for real-time communication
- Prisma database migrations and operations
- JWT token management

**Environment Variables:**
```yaml
DATABASE_URL=postgresql://projectmeet:projectmeet_secret_2024@postgres:5432/projectmeet?schema=public
REDIS_URL=redis://redis:6379
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
TURN_SERVER_URL=coturn:3478
STUN_SERVER_URL=stun:stun.l.google.com:19302
BACKEND_PORT=4000
NODE_ENV=development
```

**Depends On:**
- postgres (health check)
- redis (health check)

**Key Endpoints:**
- `POST /api/auth/register` — User registration
- `POST /api/auth/login` — User login
- `GET /api/auth/profile` — Get user profile
- `POST /api/meetings` — Create meeting
- `GET /api/meetings` — List user's meetings
- `POST /api/meetings/join` — Join meeting
- `WS /` — WebSocket for real-time signaling

---

### 5. **Frontend** (Next.js 14)
**Image:** Built from `./frontend/Dockerfile`  
**Container:** `projectmeet-frontend`  
**Port:** `3000:3000`

**Purpose:**
- Server-side rendered React application
- Real-time UI updates via Socket.IO client
- WebRTC video/audio streaming
- Meeting dashboard and video room UI

**Environment Variables:**
```yaml
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=ProjectMeet
```

**Depends On:**
- backend (indirect via API calls)

---

## Docker Compose Networking

### Network: `projectmeet-network`
All services connected to a shared Docker network enabling:
- Service-to-service communication using container names
- Example: Backend connects to `postgres:5432`, not `localhost:5432`

### Port Mapping
```
Host Machine          Docker Container
3001 (or 3000)   →    Frontend:3000
4000             →    Backend:4000
5433             →    PostgreSQL:5432
6379             →    Redis:6379
3478/tcp, /udp   →    Coturn:3478
49152-49200/udp  →    Coturn:49152-49200
```

---

## Getting Started

### Prerequisites
- Docker Engine 20.10+
- Docker Compose 2.0+
- Linux/macOS or WSL2 on Windows

### Usage

**Start all services:**
```bash
cd /home/vishnu/Documents/projectMeet
docker compose up -d
```

**View logs:**
```bash
docker compose logs -f backend        # Follow backend logs
docker compose logs postgres redis    # View specific services
```

**Stop all services:**
```bash
docker compose down
```

**Stop and remove data (WARNING: deletes databases):**
```bash
docker compose down -v   # -v removes named volumes
```

**Restart a single service:**
```bash
docker compose restart backend
```

---

## Database Management

### Run Prisma Migrations

**Inside backend container:**
```bash
docker compose exec backend npx prisma migrate dev --name init
```

**View database:**
```bash
docker compose exec backend npx prisma studio
```

**From host machine (requires DATABASE_URL in shell):**
```bash
export DATABASE_URL="postgresql://projectmeet:projectmeet_secret_2024@localhost:5433/projectmeet?schema=public"
npx prisma migrate deploy
npx prisma db seed
```

### Connect to PostgreSQL Directly

```bash
# Via psql (if installed)
psql postgresql://projectmeet:projectmeet_secret_2024@localhost:5433/projectmeet

# Via docker
docker compose exec postgres psql -U projectmeet -d projectmeet
```

---

## Environment Configuration

### .env File (Root Directory)

```dotenv
# Database
POSTGRES_USER=projectmeet
POSTGRES_PASSWORD=projectmeet_secret_2024
POSTGRES_DB=projectmeet
DATABASE_URL=postgresql://projectmeet:projectmeet_secret_2024@postgres:5432/projectmeet?schema=public

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production-2024
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Backend
BACKEND_PORT=4000
NODE_ENV=development

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_WS_URL=http://localhost:4000
NEXT_PUBLIC_APP_NAME=ProjectMeet

# TURN/STUN (optional, defaults used if not set)
TURN_SERVER_URL=coturn:3478
STUN_SERVER_URL=stun:stun.l.google.com:19302
```

### Modifying Configuration

1. **Edit `.env`** in root directory
2. **For backend changes:** Restart backend container
   ```bash
   docker compose restart backend
   ```
3. **For frontend changes:** Restart frontend container
   ```bash
   docker compose restart frontend
   ```

---

## Health Checks

Each service includes health checks to ensure reliability:

```yaml
healthcheck:
  test: [command]      # Periodically runs this test
  interval: 10s        # Check every 10 seconds
  timeout: 5s          # Fail if exceeds 5 seconds
  retries: 5           # Fail after 5 consecutive failures
```

**Check service health:**
```bash
docker compose ps  # Shows health status in STATUS column
```

---

## Scaling & Production Deployment

### Horizontal Scaling (Multiple Backend Instances)

Use Redis adapter for Socket.IO to scale horizontally:

```yaml
# docker-compose.prod.yml
services:
  backend_1:
    # ... (same as backend)
    ports:
      - "4001:4000"
  
  backend_2:
    # ... (same as backend)
    ports:
      - "4002:4000"
  
  nginx:
    image: nginx:alpine
    ports:
      - "4000:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
```

All backend instances connect to the same Redis, allowing them to share Socket.IO events.

### Cloud Deployment (AWS Example)

**Replace Docker services with managed services:**

1. **PostgreSQL** → AWS RDS
   ```
   DATABASE_URL=postgresql://user:pass@mydb.xxxxx.rds.amazonaws.com:5432/projectmeet
   ```

2. **Redis** → AWS ElastiCache
   ```
   REDIS_URL=redis://cache-xxxxx.ng.0001.usw2.cache.amazonaws.com:6379
   ```

3. **Coturn** → AWS EC2 instance or 3rd-party TURN service
   ```
   TURN_SERVER_URL=turn.myapp.com:3478
   ```

4. **Backend** → AWS ECS Fargate or EC2
5. **Frontend** → AWS Amplify, CloudFront + S3, or ECS

**Only change environment variables in `.env` or configuration management system.**

---

## Troubleshooting

### Service Won't Start

**Check logs:**
```bash
docker compose logs backend
docker compose logs postgres
```

**Common Issues:**
- Port already in use: Change port mapping in `docker-compose.yml`
- Database not ready: Check `postgres` health with `docker compose ps`
- Network issue: Verify network with `docker network inspect projectmeet_projectmeet-network`

### Database Connection Error

**Verify DATABASE_URL format:**
```bash
# Inside backend container - should connect successfully
docker compose exec backend psql $DATABASE_URL -c "SELECT version();"
```

### WebRTC Not Working (No Video/Audio)

1. **Check Coturn is running:**
   ```bash
   docker compose logs coturn
   ```

2. **Verify TURN server is reachable:**
   ```bash
   # From host, test TURN server availability
   nc -vzu localhost 3478
   ```

3. **Check ICE servers endpoint:**
   ```bash
   curl http://localhost:4000/api/meetings/ice-servers
   ```

4. **Browser console:** Inspect WebRTC connection state and ICE candidates

---

## Backup & Recovery

### Backup PostgreSQL

```bash
# Dump database
docker compose exec postgres pg_dump -U projectmeet projectmeet > backup.sql

# Restore from dump
docker compose exec -T postgres psql -U projectmeet projectmeet < backup.sql
```

### Backup Redis

```bash
# Redis automatically saves to ./redis_data/appendonly.aof
# Copy the volume directory for backup
cp -r /var/lib/docker/volumes/projectmeet_redis_data/_data ./redis_backup
```

### Restore Volumes

```bash
# Stop containers
docker compose down

# Restore volume data
cp -r ./redis_backup /var/lib/docker/volumes/projectmeet_redis_data/_data

# Restart
docker compose up -d
```

---

## Performance Tuning

### PostgreSQL

**Connection pooling (update `docker-compose.yml`):**
```yaml
postgres:
  ...
  environment:
    POSTGRES_INIT_ARGS: -c max_connections=200 -c shared_buffers=256MB
```

### Redis

**Memory limits (update `docker-compose.yml`):**
```yaml
redis:
  ...
  command: redis-server --maxmemory 512mb --maxmemory-policy allkeys-lru
```

### Backend

**Increase worker processes:**
```yaml
backend:
  environment:
    NODE_WORKER_THREADS_POOL_SIZE: 4
    UV_THREADPOOL_SIZE: 128
```

---

## Security Considerations

### ⚠️ Development vs. Production

**Current setup is for development only.** For production:

1. **Change all default passwords** in `.env`
2. **Use environment-specific configs** (not `.env` in git)
3. **Enable HTTPS** (nginx reverse proxy + Let's Encrypt)
4. **Rotate JWT secrets** regularly
5. **Use AWS Secrets Manager** or HashiCorp Vault
6. **Enable PostgreSQL SSL** connections
7. **Set Redis to non-public networks** (remove port mapping)
8. **Enable authentication** on Redis
9. **Use VPC security groups** in AWS

### Example Production `.env`

```dotenv
# Use strong, random values
POSTGRES_PASSWORD=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)
TURN_REALM=yourdomain.com
TURN_USERNAME=secure_user
TURN_PASSWORD=$(openssl rand -base64 32)
NODE_ENV=production
```

---

## Reference: Docker Commands

```bash
# Container Management
docker compose up -d                    # Start all services in background
docker compose down                     # Stop all services
docker compose logs -f [service]        # Follow logs
docker compose exec [service] [cmd]     # Execute command in service
docker compose ps                       # List running services
docker compose restart [service]        # Restart service

# Volume Management
docker volume ls                        # List volumes
docker volume inspect [volume_name]     # Inspect volume
docker compose down -v                  # Remove all volumes (destructive!)

# Network
docker network inspect [network_name]   # Inspect network
docker compose pause [service]          # Pause service
docker compose unpause [service]        # Unpause service

# Cleanup
docker system prune                     # Remove unused images/containers/networks
docker volume prune                     # Remove unused volumes
```

---

## File Structure

```
projectMeet/
├── docker-compose.yml          # Main orchestration file
├── .env                        # Environment variables (DO NOT COMMIT)
├── .env.example                # Template for environment variables
├── coturn/
│   └── turnserver.conf         # TURN server configuration
├── backend/
│   ├── Dockerfile              # Backend image definition
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   └── src/
│       ├── config/             # Database & Redis config
│       ├── sockets/            # WebSocket handlers
│       └── ...
└── frontend/
    ├── Dockerfile              # Frontend image definition
    └── src/
        ├── lib/services/       # API & Socket clients
        └── ...
```

---

## Quick Reference: Common Tasks

| Task | Command |
|------|---------|
| Start all services | `docker compose up -d` |
| View backend logs | `docker compose logs -f backend` |
| Stop all services | `docker compose down` |
| Restart backend | `docker compose restart backend` |
| Access PostgreSQL | `docker compose exec postgres psql -U projectmeet projectmeet` |
| Run Prisma migrations | `docker compose exec backend npx prisma migrate dev` |
| Check service health | `docker compose ps` |
| Rebuild backend image | `docker compose build backend` |
| Shell into backend | `docker compose exec backend sh` |
| Export database dump | `docker compose exec postgres pg_dump -U projectmeet projectmeet > backup.sql` |

---

## Support & Further Reading

- **Docker Compose Docs:** https://docs.docker.com/compose/
- **PostgreSQL Docker:** https://hub.docker.com/_/postgres
- **Redis Docker:** https://hub.docker.com/_/redis
- **Coturn Docs:** https://github.com/coturn/coturn
- **Socket.IO Adapter:** https://socket.io/docs/v4/redis-adapter/

---

**Document Version:** 1.0  
**Last Updated:** April 12, 2026  
**For:** ProjectMeet Video Conferencing Platform
