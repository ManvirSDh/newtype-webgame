#!/bin/bash
set -e

echo "Starting full deployment (Frontend + Backend)..."

./deploy-frontend.sh
./deploy-backend.sh

echo "Full deployment completed successfully!"
