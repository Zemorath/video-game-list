#!/bin/bash

# Deploy React Frontend to AWS Amplify
# Make sure you have AWS CLI configured and Amplify CLI installed

echo "🚀 Deploying React Frontend to AWS Amplify..."

# Navigate to client directory
cd client

# Initialize Amplify (run this only once)
# amplify init

# Add hosting (run this only once)
# amplify add hosting

# Build and deploy
npm run build
amplify publish

echo "✅ Frontend deployment completed!"
echo "📝 Don't forget to:"
echo "   1. Update REACT_APP_API_URL with your EB domain"
echo "   2. Set up custom domain if needed"
echo "   3. Configure environment variables in Amplify console"
