#!/bin/sh
set -e

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === Deploy started ==="

cd /project

echo "[$(date '+%Y-%m-%d %H:%M:%S')] git pull..."
git pull origin main

echo "[$(date '+%Y-%m-%d %H:%M:%S')] docker compose up --build..."
docker compose up -d --build --remove-orphans

echo "[$(date '+%Y-%m-%d %H:%M:%S')] === Deploy complete ==="
