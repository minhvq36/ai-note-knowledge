# Docker Setup Guide

## Description

Docker Compose configuration for a Multi-Tenant Notes Application với:
- **Backend**: FastAPI server (Python 3.13)
- **Frontend**: Vue/React app served by Nginx (Node.js 20)
- **Supabase Cloud**: Dùng Supabase làm database & authentication
- **Adminer**: Web-based database management tool (optional, chỉ dùng khi có database local)

## Requirements

- Docker Desktop (v4.0+)
- Docker Compose (v2.0+)
- Supabase account & project

## Initial Setup

### 1. Clone Repository and Navigate

```bash
cd infra
```

### 2. Create .env File

Copy từ `.env.example` và chỉnh sửa:

```bash
cp .env.example .env
```

**Important Variables:**
- `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`: Thông tin Supabase cloud
- `BACKEND_PORT`: Port cho backend API (default: 8000)
- `FRONTEND_PORT`: Port cho frontend (default: 3000)
- `CORS_ORIGINS`: Domain được phép truy cập backend

### 3. Build & Run Services

#### Build Images

```bash
docker-compose build
```

#### Start Services

```bash
# Run in foreground (easy to debug)
docker-compose up

# Or run in background
docker-compose up -d
```

#### Stop Services

```bash
docker-compose down
```

## Access Services

| Service      | URL                      | Notes                                 |
|--------------|--------------------------|---------------------------------------|
| Frontend     | http://localhost:3000    | Or FRONTEND_PORT as set               |
| Backend API  | http://localhost:8000    | Or BACKEND_PORT as set                |
| API Docs     | http://localhost:8000/docs | Swagger UI                          |

## Useful Commands

```bash
# View logs of all services
docker-compose logs -f

# View logs of a specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Restart services
docker-compose restart

# Rebuild images after code changes
docker-compose build --no-cache
docker-compose up -d --force-recreate

# Execute command inside a container
docker-compose exec backend bash
docker-compose exec frontend sh

# View service status
docker-compose ps

# View resource usage
docker stats
```

## Development Workflow

### Backend Code Changes

1.  **Auto-reload**: Backend Dockerfile không include `--reload` flag
2.  Để enable hot-reload khi dev:
    -   Mount volume: Thêm vào service `backend` trong docker-compose.yml:
        ```yaml
        volumes:
          - ../services/backend:/app
        ```
    -   Rebuild: `docker-compose up --build`

### Frontend Code Changes

1.  **Rebuild**: `docker-compose build frontend`
2.  **Redeploy**: `docker-compose up -d frontend`

### Database Migrations

- Dùng Supabase cloud, migration thực hiện qua Supabase dashboard hoặc CLI
- Không cần connect tới container database local

## Troubleshooting

### Services not starting

```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend

# Check for port conflicts
netstat -ano | findstr :8000
```

### Supabase connection error

- Kiểm tra biến môi trường `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`
- Kiểm tra cấu hình CORS_ORIGINS

### Build failure

```bash
# Clean build
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Frontend not loading

- Check VITE_API_URL trong .env
- Check CORS_ORIGINS trong backend config
- Check browser console for errors

## Production Configuration

Trước khi deploy production:

1.  **Update .env**
    ```bash
    ENVIRONMENT=production
    VITE_API_URL=https://your-api-domain.com
    CORS_ORIGINS=https://your-domain.com
    SUPABASE_URL=https://your-supabase-project.supabase.co
    SUPABASE_PUBLISHABLE_KEY=your-publishable-key
    ```

2.  **Disable Debug Services**
    ```bash
    docker-compose --profile production up -d
    ```
    (Không cần Adminer nếu không có database local)

3.  **Use Supabase Cloud (Recommended)**
    -   Không dùng container PostgreSQL local
    -   Dùng Supabase cloud cho database & authentication

4.  **Setup SSL/TLS**
    -   Thêm Nginx reverse proxy với SSL certificates
    -   Hoặc dùng cloud provider (Cloudflare, AWS ALB)

5.  **Health Checks & Monitoring**
    -   Regularly check logs
    -   Set up monitoring (Prometheus, DataDog, etc.)

## File Structure

```
infra/
├── docker-compose.yml       # Main Docker Compose config
├── .env.example             # Environment variables template
└── README.md                # This file

services/
├── backend/
│   ├── Dockerfile           # Backend image definition
│   ├── app/                 # FastAPI application
│   ├── requirements.txt     # Python dependencies
│   └── ...
├── frontend/
│   ├── Dockerfile           # Frontend image definition
│   ├── nginx.conf           # Nginx configuration
│   ├── package.json         # Node dependencies
│   ├── src/                 # Frontend source code
│   └── ...
└── ...
```

## Network Architecture

```
┌─────────────────────────────────────────────┐
│         ai-note-network (bridge)            │
├─────────────────────────────────────────────┤
│                                             │
│  ┌──────────────┐    ┌──────────────┐      │
│  │   Frontend   │    │   Backend    │      │
│  │  :3000 (80)  │    │  :8000       │      │
│  └──────────────┘    └──────────────┘      │
│         │                   │               │
│         └──────────────────┤               │
│                            │               │
│        ┌─────────────────────────────┐     │
│        │     Supabase Cloud          │     │
│        │  (Database & Auth Service)  │     │
│        └─────────────────────────────┘     │
│                                             │
└─────────────────────────────────────────────┘
```

## Reference

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Nginx Configuration](https://nginx.org/en/docs/)
- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/concepts/)
- [Supabase Documentation](https://supabase.com/docs)
