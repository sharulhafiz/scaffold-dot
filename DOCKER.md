# Docker Deployment Guide for Scaffold-DOT

## Quick Start

### 1. Build and Start Services

```bash
# Build and start all services
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 2. Access Your Applications

With host domain `www6.utm.my`, you can access the services via:

| Service | Access URL | Description |
|---------|-------------|-------------|
| **Frontend** | `http://www6.utm.my:3000` | NextJS dApp interface |
| **ETH-RPC** | `http://www6.utm.my:8545` | Ethereum JSON-RPC endpoint for wallet connections |
| **WebSocket RPC** | `ws://www6.utm.my:9944` | Substrate node WebSocket RPC |
| **Substrate HTTP** | `http://www6.utm.my:9933` | Substrate node HTTP API |

### 3. Service Architecture

All services run within Docker containers:

1. **substrate-node**: Runs Polkadot substrate node (Parity image)
   - Container provides blockchain infrastructure
   - Exposes: 9944 (WebSocket), 9933 (HTTP), 30333 (P2P)

2. **eth-rpc**: Built from Dockerfile.substrate
   - Downloads pre-built Polkadot binaries (revive-dev-node, eth-rpc)
   - Exposes: 8545 (Ethereum JSON-RPC)
   - Connects to substrate-node container

3. **frontend**: Uses Dockerfile.txt (from repo)
   - Runs NextJS in development mode using yarn start
   - Mounts source code for hot reload during development
   - Exposes: 3000 (NextJS)

### 4. Deploying Contracts

Once services are running, deploy contracts to the containerized environment:

```bash
# The deploy command will use the containerized ETH-RPC endpoint automatically
# because scaffold.config.ts is already configured with NEXT_PUBLIC_RPC_URL
docker-compose exec frontend yarn deploy
```

### 5. Environment Configuration

scaffold.config.ts uses environment variables:
- `NEXT_PUBLIC_RPC_URL` - Points to containerized ETH-RPC (http://www6.utm.my:8545)
- `NEXT_PUBLIC_WS_URL` - Points to containerized WebSocket (ws://www6.utm.my:9944)
- `NEXT_PUBLIC_CHAIN_ID` - Chain ID 420420420

These are set in docker-compose.yml and passed into the frontend container.

### 6. Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears blockchain data)
docker-compose down -v

# Restart a specific service
docker-compose restart frontend

# View logs for specific service
docker-compose logs -f eth-rpc

# Execute command in container
docker-compose exec substrate-node /usr/bin/polkadot --version

# Update and rebuild
docker-compose up -d --build
```

### 7. Troubleshooting

**Services won't start:**
```bash
# Check resource constraints
docker stats

# View detailed logs
docker-compose logs substrate-node
```

**Can't connect from wallet:**
- Ensure port 8545 is accessible from your network
- Check firewall rules allow external access
- Verify ETH-RPC is healthy: `curl http://www6.utm.my:8545`

**Frontend can't connect to RPC:**
- Verify NextJS is running: `curl http://localhost:3000`
- Check logs: `docker-compose logs frontend`
- Ensure eth-rpc container is healthy

### 8. Production Considerations

For production deployment:
1. **Reverse Proxy**: Use Nginx/traefik with SSL for HTTPS
2. **Authentication**: Add authentication to RPC endpoints
3. **Monitoring**: Add health checks and logging aggregation
4. **Backup**: Regularly backup `substrate-data` volume
5. **Security**: Review exposed ports and firewall rules

Example Nginx configuration snippet for HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name www6.utm.my;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /rpc/ {
        proxy_pass http://localhost:8545;
    }

    location /ws/ {
        proxy_pass http://localhost:9944;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### 2. Access Your Applications

With host domain `www6.utm.my`, you can access the services via:

| Service | Access URL | Description |
|---------|-------------|-------------|
| **Frontend** | `http://www6.utm.my:3000` | NextJS dApp interface |
| **ETH-RPC** | `http://www6.utm.my:8545` | Ethereum JSON-RPC endpoint for wallet connections |
| **Substrate WebSocket** | `ws://www6.utm.my:9944` | Substrate node WebSocket RPC |
| **Substrate HTTP** | `http://www6.utm.my:9933` | Substrate node HTTP RPC |

### 3. Service Dependencies

Services start in this order:
1. **substrate-node** (substrate blockchain) - ~60s startup
2. **eth-rpc** (Ethereum adapter) - waits for substrate-node
3. **frontend** (NextJS app) - waits for eth-rpc

### 4. Deploying Contracts

Once services are running, deploy contracts to the containerized environment:

```bash
# Run Hardhat in the frontend container
docker-compose exec frontend yarn deploy

# Or deploy from your host (if you have dependencies installed)
# Update hardhat.config.ts to point to containerized RPC:
# defaultNetwork: 'localNode'
# networks: {
#   localNode: {
#     url: 'http://www6.utm.my:8545',
#     chainId: 420420420
#   }
# }
```

### 5. Environment Configuration

Customize settings in `.env.docker` before starting:

```bash
# Copy example file
cp .env.docker .env

# Edit with your values
nano .env
```

Key environment variables:
- `NEXT_PUBLIC_RPC_URL` - Your frontend RPC endpoint
- `NEXT_PUBLIC_WS_URL` - WebSocket connection URL
- `NEXT_PUBLIC_CHAIN_ID` - Chain ID (default: 420420420)
- `RUST_LOG` - Substrate log level (adjust verbosity as needed)

### 6. Useful Commands

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (clears blockchain data)
docker-compose down -v

# Restart a specific service
docker-compose restart frontend

# View logs for specific service
docker-compose logs -f eth-rpc

# Execute command in container
docker-compose exec substrate-node /app/packages/asset-hub-pvm/bin/revive-dev-node --version

# Update and rebuild
docker-compose up -d --build
```

### 7. Troubleshooting

**Services won't start:**
```bash
# Check resource constraints
docker stats

# View detailed logs
docker-compose logs substrate-node
```

**Can't connect from wallet:**
- Ensure port 8545 is accessible from your network
- Check firewall rules allow external access
- Verify ETH-RPC is healthy: `curl http://www6.utm.my:8545`

**Frontend can't connect to RPC:**
- Verify docker-compose environment variables
- Check `NEXT_PUBLIC_RPC_URL` and `NEXT_PUBLIC_WS_URL`
- Ensure all services are healthy: `docker-compose ps`

### 8. Production Considerations

For production deployment:
1. **Reverse Proxy**: Use Nginx/traefik with SSL for HTTPS
2. **Authentication**: Add authentication to RPC endpoints
3. **Monitoring**: Add health checks and logging aggregation
4. **Backup**: Regularly backup the `substrate-data` volume
5. **Security**: Review exposed ports and firewall rules

Example Nginx configuration snippet for HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name www6.utm.my;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }

    location /rpc/ {
        proxy_pass http://localhost:8545;
    }

    location /ws/ {
        proxy_pass http://localhost:9944;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
    }
}
```

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      www6.utm.my                        │
│                                                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │          Nginx/Reverse Proxy (Optional)          │  │
│  └──────────────────────────────────────────────────────┘  │
│                           │                               │
│  ┌─────────────────────────┼────────────────────────────┐  │
│  │         │              │              │             │  │
│  ▼         ▼              ▼              ▼             ▼  │
│  ┌─────┐  ┌─────┐    ┌─────┐    ┌──────────┐       │
│  │:3000│  │:8545│    │:9944│    │  :9933   │       │
│  └─────┘  └─────┘    └─────┘    └──────────┘       │
│  Frontend  ETH-RPC    WebSocket    Substrate HTTP        │
│            Adapter     RPC          RPC                 │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         Docker Network: scaffold-network            │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```
