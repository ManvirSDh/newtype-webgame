#!/bin/bash
set -e

# Load environment variables if .env exists
if [ -f .env ]; then
  echo "Loading environment variables from .env..."
  export $(cat .env | grep -v '^#' | xargs)
fi

# Ensure required env vars are set
AWS_REGION=${AWS_REGION:-ca-central-1}

echo "=========================================="
echo " Packaging & Deploying Backend to AWS Lambda"
echo " Region: $AWS_REGION"
echo "=========================================="

cd backend

echo "Cleaning and packaging Java Lambda JAR with Maven..."
mvn clean package

echo "Deploying Serverless stack to AWS..."
serverless deploy --region "$AWS_REGION"

echo "=========================================="
echo " Backend Deployment Complete!"
echo "=========================================="
