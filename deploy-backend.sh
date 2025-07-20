#!/bin/bash

# Deploy to AWS Elastic Beanstalk
# Make sure you have AWS CLI configured and EB CLI installed

echo "🚀 Deploying Flask Backend to Elastic Beanstalk..."

# Navigate to server directory
cd server

# Initialize Elastic Beanstalk (run this only once)
# eb init -p python-3.11 video-game-list-api --region us-east-1

# Create environment (run this only once)
# eb create video-game-list-api-prod --instance-type t3.micro

# Deploy to existing environment
eb deploy

echo "✅ Backend deployment completed!"
echo "📝 Don't forget to:"
echo "   1. Set environment variables in EB console"
echo "   2. Update CORS_ORIGINS with your Amplify domain"
echo "   3. Configure RDS database if needed"
