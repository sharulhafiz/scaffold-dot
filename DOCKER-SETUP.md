# Hybrid Docker Setup for Scaffold-DOT

This setup runs Substrate and ETH-RPC in Docker containers while running NextJS frontend on the host machine for development.

## Prerequisites

1. Install project dependencies on host:
   ```bash
   cd /home/Sysadm1n/scaffold-dot
   yarn install
   ```

2. Update scaffold.config.ts to use containerized RPC:
   The file is already configured with NEXT_PUBLIC_RPC_URL and NEXT_PUBLIC_WS_URL
   pointing to www6.utm.my

## Services

### Docker Services (Substrate + ETH-RPC)
```bash
cd /home/Sysadm1n/scaffold-dot
sudo docker compose up -d
```

This starts:
- **substrate-node** on port 9944 (WebSocket), 9933 (HTTP), 30333 (P2P)
- **eth-rpc** on port 8545 (Ethereum JSON-RPC)

### NextJS Frontend (Development Mode)
```bash
cd /home/Sysadm1n/scaffold-dot
yarn workspace @se-2/nextjs dev
```

This runs NextJS in development mode on port 3000.

## Access URLs (www6.utm.my)

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | `http://www6.utm.my:3000` | NextJS dApp interface |
| **ETH-RPC** | `http://www6.utm.my:8545` | Ethereum JSON-RPC endpoint for wallet connections |
| **WebSocket RPC** | `ws://www6.utm.my:9944` | Substrate node WebSocket RPC |
| **Substrate HTTP RPC** | `http://www6.utm.my:9933` | Substrate node HTTP API |

## Deploying Contracts

Once services are running, deploy contracts from host:

```bash
# Make sure NEXT_PUBLIC_RPC_URL points to http://www6.utm.my:8545
cd /home/Sysadm1n/scaffold-dot
yarn deploy
```

The deploy command will use the containerized ETH-RPC endpoint.

## Troubleshooting

**Can't connect from wallet?**
- Verify eth-rpc container is running: `sudo docker compose logs eth-rpc`
- Check port 8545 is accessible: `curl http://localhost:8545`
- Verify external access works: `curl http://www6.utm.my:8545`

**Frontend connection issues:**
- Check browser console for connection errors
- Verify NEXT_PUBLIC_RPC_URL is set correctly
- Ensure eth-rpc container is healthy

**Substrate node not syncing:**
- Check logs: `sudo docker compose logs substrate-node`
- May need to clear data volume: `sudo docker compose down -v`
