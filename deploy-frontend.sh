#!/bin/bash
set -e

# Load environment variables if .env exists
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  export $(cat .env | grep -v '^#' | xargs)
fi

# Ensure required env vars are set
AWS_REGION=${AWS_REGION:-ca-central-1}
S3_BUCKET_NAME=${S3_BUCKET_NAME:-newtype-webgame-frontend}

echo "=========================================="
echo " Building & Deploying Frontend to S3"
echo " Region: $AWS_REGION"
echo " Bucket: $S3_BUCKET_NAME"
echo "=========================================="

cd frontend

echo "Installing frontend dependencies..."
npm install

echo "Building Angular frontend..."
npm run build

echo "Syncing built frontend bundle to S3 website bucket..."
aws s3 sync dist/frontend/browser "s3://$S3_BUCKET_NAME" --delete --region "$AWS_REGION"

echo "=========================================="
echo " Frontend Deployment Complete!"
echo " URL: http://$S3_BUCKET_NAME.s3-website.$AWS_REGION.amazonaws.com"
echo "=========================================="
