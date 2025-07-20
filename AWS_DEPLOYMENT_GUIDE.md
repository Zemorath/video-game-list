# AWS Deployment Guide for Video Game List Application

This guide will help you deploy your Video Game List application to AWS using Amplify (frontend) and Elastic Beanstalk (backend).

## Prerequisites

1. **AWS Account** with AWSAmplifyFullAccess and AWSElasticBeanstalkFullAccess policies
2. **AWS CLI** installed and configured
3. **EB CLI** (Elastic Beanstalk CLI) installed
4. **Amplify CLI** installed
5. **Node.js** and **Python 3.11** installed locally

## Installation Commands

```bash
# Install AWS CLI
pip install awscli

# Install EB CLI
pip install awsebcli

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure AWS CLI
aws configure
```

## Step 1: Deploy Backend to Elastic Beanstalk

### 1.1 Navigate to Server Directory
```bash
cd server
```

### 1.2 Initialize Elastic Beanstalk Application
```bash
eb init -p python-3.11 video-game-list-api --region us-east-1
```

### 1.3 Create EB Environment
```bash
eb create video-game-list-api-prod --instance-type t3.micro
```

### 1.4 Set Environment Variables
Go to AWS Console → Elastic Beanstalk → Your Environment → Configuration → Software → Environment Properties

Add these variables:
- `SECRET_KEY`: A secure random string (generate with `python -c "import secrets; print(secrets.token_hex(32))"`)
- `JWT_SECRET_KEY`: Another secure random string
- `FLASK_ENV`: `production`
- `YOUTUBE_API_KEY`: Your YouTube Data API key
- `CORS_ORIGINS`: Your Amplify domain (will be added after frontend deployment)
- `DATABASE_URL`: `sqlite:///game_library.db` (or RDS URL if using RDS)

### 1.5 Deploy
```bash
eb deploy
```

### 1.6 Get Your EB URL
```bash
eb status
```
Note the "CNAME" - this is your backend URL.

## Step 2: Deploy Frontend to AWS Amplify

### 2.1 Navigate to Client Directory
```bash
cd ../client
```

### 2.2 Initialize Amplify
```bash
amplify init
```
Follow the prompts:
- Enter a name for the project: `video-game-list`
- Enter a name for the environment: `prod`
- Choose your default editor
- Choose the type of app: `javascript`
- Framework: `react`
- Source Directory Path: `src`
- Distribution Directory Path: `build`
- Build Command: `npm run build`
- Start Command: `npm start`

### 2.3 Add Hosting
```bash
amplify add hosting
```
Choose:
- Select the plugin module: `Hosting with Amplify Console`
- Choose a type: `Manual deployment`

### 2.4 Set Environment Variables in Amplify
Go to AWS Console → Amplify → Your App → Environment Variables

Add these variables:
- `REACT_APP_API_URL`: Your EB URL + `/api` (e.g., `https://your-env.elasticbeanstalk.com/api`)
- `REACT_APP_GIANT_BOMB_API_KEY`: Your Giant Bomb API key
- `REACT_APP_GIANT_BOMB_API_URL`: `https://www.giantbomb.com/api`
- `CI`: `true`
- `GENERATE_SOURCEMAP`: `false`

### 2.5 Deploy
```bash
amplify publish
```

### 2.6 Get Your Amplify URL
After deployment, note the "Hosting endpoint" URL.

## Step 3: Update CORS Configuration

### 3.1 Update Backend CORS
Go back to EB Console → Your Environment → Configuration → Software → Environment Properties

Update `CORS_ORIGINS` with your Amplify URL:
```
https://your-amplify-id.amplifyapp.com
```

### 3.2 Redeploy Backend
```bash
cd server
eb deploy
```

## Step 4: Database Setup (Optional - RDS)

If you want to use RDS instead of SQLite:

### 4.1 Create RDS Instance
```bash
aws rds create-db-instance \
  --db-instance-identifier video-game-list-db \
  --db-instance-class db.t3.micro \
  --engine postgres \
  --master-username admin \
  --master-user-password your-secure-password \
  --allocated-storage 20 \
  --vpc-security-group-ids sg-xxxxxxxx
```

### 4.2 Update Requirements
Add to `requirements.txt`:
```
psycopg2-binary==2.9.7
```

### 4.3 Update Environment Variable
Update `DATABASE_URL` in EB environment:
```
postgresql://admin:password@your-rds-endpoint:5432/video_game_list
```

## Step 5: Domain Setup (Optional)

### 5.1 Custom Domain for Amplify
1. Go to Amplify Console → Domain Management
2. Add your domain
3. Follow DNS verification steps

### 5.2 Custom Domain for EB
1. Go to EB Console → Configuration → Load Balancer
2. Add SSL certificate
3. Configure your domain's CNAME

## Step 6: Monitoring and Logging

### 6.1 Enable EB Logs
```bash
eb logs --all
```

### 6.2 CloudWatch Monitoring
- Both Amplify and EB automatically create CloudWatch logs
- Monitor in AWS Console → CloudWatch

## Deployment Scripts

Use the provided scripts for easier deployment:

```bash
# Deploy backend
./deploy-backend.sh

# Deploy frontend  
./deploy-frontend.sh
```

## Security Considerations

1. **Environment Variables**: Never commit `.env` files with real credentials
2. **HTTPS**: Both Amplify and EB provide HTTPS by default
3. **CORS**: Properly configure CORS origins
4. **Security Headers**: Already configured in the application
5. **Rate Limiting**: Already implemented in the backend

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check CORS_ORIGINS environment variable
2. **API Connection**: Verify REACT_APP_API_URL is correct
3. **EB Deployment Fails**: Check logs with `eb logs`
4. **Build Fails**: Check environment variables are set

### Useful Commands

```bash
# EB Commands
eb status          # Check environment status
eb logs           # View logs
eb ssh            # SSH into instance
eb terminate      # Terminate environment

# Amplify Commands
amplify status    # Check app status
amplify console   # Open Amplify console
amplify delete    # Delete the app
```

## Cost Estimation

**Monthly costs (approximate):**
- Elastic Beanstalk (t3.micro): ~$10-15
- Amplify Hosting: ~$1-5 (depending on traffic)
- Application Load Balancer: ~$20
- **Total: ~$30-40/month**

## Next Steps

1. Set up automated deployments via GitHub integration
2. Configure monitoring and alerts
3. Set up backup strategies for your database
4. Consider using AWS RDS for production database
5. Implement caching with ElastiCache if needed

---

**Important**: Replace all placeholder values (your-domain, API keys, etc.) with your actual values before deployment.
