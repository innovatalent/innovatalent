#!/bin/bash
# ====================================================================
# INNOVA TALENT SAAS — Deploy Script for Hostinger VPS (Ubuntu)
# Run this ON the VPS after initial setup
# ====================================================================

set -euo pipefail

echo "🚀 Deploying Innova Talent SaaS..."

# Pull latest code
git pull origin main

# Build and restart containers
docker compose down
docker compose up -d --build

# Wait for DB to be ready
echo "⏳ Waiting for database..."
sleep 10

# Initialize database (first time only — safe to rerun)
docker compose exec app node server/src/db/init.js

echo ""
echo "✅ Deploy complete!"
echo "   App: http://$(hostname -I | awk '{print $1}')"
echo "   Health: curl http://localhost:4000/api/health"
echo ""
