#!/bin/bash
# ─── Production Deployment Script ─────────────────────────
# Deploys gjej-pune.com to 167.235.154.72
#
# Usage:
#   ./deploy.sh          → Full deploy (sync + build + restart)
#   ./deploy.sh quick    → Quick deploy (sync + restart, no rebuild)
#   ./deploy.sh restart  → Restart containers only
#   ./deploy.sh status   → Show container status & logs
#   ./deploy.sh logs     → Show live logs
#
set -e

SERVER="redix@167.235.154.72"
REMOTE_DIR="/opt/gjej-pune"
PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE="docker compose -f docker-compose.prod.yml"
ACTION="${1:-full}"

# ─── Helper ───────────────────────────────────────────────
remote() {
  ssh "$SERVER" "cd $REMOTE_DIR && sg docker -c '$*'"
}

header() {
  echo ""
  echo "═══════════════════════════════════════════"
  echo "  $1"
  echo "═══════════════════════════════════════════"
}

# ─── Status ───────────────────────────────────────────────
if [ "$ACTION" = "status" ]; then
  header "Container Status"
  remote "$COMPOSE ps"
  echo ""
  echo "▸ Health check:"
  ssh "$SERVER" "curl -sf http://localhost/health && echo ' ✓' || echo ' ✗'"
  echo ""
  echo "▸ Frontend:"
  ssh "$SERVER" "curl -sf -o /dev/null -w 'HTTP %{http_code}' http://localhost/ && echo ' ✓' || echo ' ✗'"
  exit 0
fi

# ─── Logs ─────────────────────────────────────────────────
if [ "$ACTION" = "logs" ]; then
  ssh "$SERVER" "cd $REMOTE_DIR && sg docker -c '$COMPOSE logs -f --tail 50'"
  exit 0
fi

# ─── Restart ──────────────────────────────────────────────
if [ "$ACTION" = "restart" ]; then
  header "Restarting containers"
  remote "$COMPOSE restart"
  sleep 5
  remote "$COMPOSE ps"
  ssh "$SERVER" "curl -sf http://localhost/health && echo '✓ Health OK' || echo '✗ Health check failed'"
  exit 0
fi

# ─── Deploy ───────────────────────────────────────────────
header "Deploying gjej-pune.com"

# 1. Sync files
echo ""
echo "▸ Syncing project files..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'dist' \
  --exclude '.git' \
  --exclude '*.db' \
  --exclude 'uploads/*' \
  --exclude '.env' \
  --exclude '.env.local' \
  --exclude '.env.production' \
  "$PROJECT_DIR/" "$SERVER:$REMOTE_DIR/"

# 2. Copy production env (only if it exists and hasn't been deployed yet)
if [ -f "$PROJECT_DIR/.env.production" ]; then
  echo ""
  echo "▸ Deploying production environment..."
  scp "$PROJECT_DIR/.env.production" "$SERVER:$REMOTE_DIR/.env"
fi

# 3. Build
if [ "$ACTION" = "quick" ]; then
  echo ""
  echo "▸ Quick deploy — skipping build..."
else
  echo ""
  echo "▸ Building containers..."
  remote "$COMPOSE build"
fi

# 4. Start/restart
echo ""
echo "▸ Starting containers..."
remote "$COMPOSE up -d"

# 5. Wait & verify
echo ""
echo "▸ Waiting for startup..."
sleep 8

echo ""
echo "▸ Container status:"
remote "$COMPOSE ps"

echo ""
echo "▸ Health checks:"
ssh "$SERVER" bash -s <<'HEALTHCHECK'
echo -n "  Backend API: "
curl -sf http://localhost/health && echo " ✓" || echo " ✗"
echo -n "  Frontend:    "
curl -sf -o /dev/null -w "HTTP %{http_code}" http://localhost/ && echo " ✓" || echo " ✗"
HEALTHCHECK

header "✓ Deployment complete — https://gjej-pune.com"
