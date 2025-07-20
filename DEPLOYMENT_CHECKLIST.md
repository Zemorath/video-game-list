# AWS Deployment Checklist

## Pre-Deployment Checklist

### ✅ Backend (Flask/Elastic Beanstalk) Preparation
- [ ] `application.py` created for EB entry point
- [ ] `.ebextensions/` configuration files created
- [ ] `requirements.txt` is up to date
- [ ] Environment variables identified and documented
- [ ] Security headers implemented
- [ ] Rate limiting configured
- [ ] CORS configured for production
- [ ] Database migration script ready
- [ ] SSL/HTTPS configuration ready

### ✅ Frontend (React/Amplify) Preparation  
- [ ] `amplify.yml` build configuration created
- [ ] Environment variables for production documented
- [ ] API endpoints configured with environment variables
- [ ] Build process tested locally (`npm run build`)
- [ ] Custom headers for security configured
- [ ] Source maps disabled for production

### ✅ Security Configuration
- [ ] Secure secret keys generated
- [ ] API keys secured and not in code
- [ ] CORS origins properly configured
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Input validation in place
- [ ] Rate limiting active
- [ ] Bot protection enabled

### ✅ AWS Prerequisites
- [ ] AWS CLI installed and configured
- [ ] EB CLI installed
- [ ] Amplify CLI installed
- [ ] AWS IAM user with proper permissions
- [ ] AWS account billing alerts set up

## Deployment Steps

### Step 1: Backend Deployment
- [ ] Navigate to `/server` directory
- [ ] Run `eb init` to initialize EB application
- [ ] Run `eb create` to create environment
- [ ] Set environment variables in EB console
- [ ] Run `eb deploy` to deploy
- [ ] Test backend endpoints
- [ ] Note the EB URL for frontend configuration

### Step 2: Frontend Deployment
- [ ] Navigate to `/client` directory
- [ ] Run `amplify init` to initialize Amplify
- [ ] Run `amplify add hosting` to add hosting
- [ ] Set environment variables in Amplify console
- [ ] Update `REACT_APP_API_URL` with EB URL
- [ ] Run `amplify publish` to deploy
- [ ] Test frontend application
- [ ] Note the Amplify URL

### Step 3: Cross-Service Configuration
- [ ] Update `CORS_ORIGINS` in EB with Amplify URL
- [ ] Redeploy backend with updated CORS
- [ ] Test end-to-end functionality
- [ ] Verify authentication works
- [ ] Test all API endpoints

## Post-Deployment Verification

### ✅ Functionality Testing
- [ ] User registration works
- [ ] User login works
- [ ] Game search works
- [ ] User profile features work
- [ ] Follow/unfollow functionality works
- [ ] YouTube videos load properly
- [ ] Security features (rate limiting, bot protection) work

### ✅ Performance Testing
- [ ] Page load times acceptable
- [ ] API response times reasonable
- [ ] Mobile responsiveness works
- [ ] Error handling works properly

### ✅ Security Testing
- [ ] HTTPS enforced
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Bot protection working
- [ ] No sensitive data exposed

## Production Monitoring Setup

### ✅ Logging and Monitoring
- [ ] CloudWatch logs configured
- [ ] Error tracking set up
- [ ] Performance monitoring active
- [ ] Billing alerts configured
- [ ] Health checks working

## Domain and DNS (Optional)

### ✅ Custom Domain Setup
- [ ] Domain purchased/available
- [ ] SSL certificate configured
- [ ] DNS records configured
- [ ] Domain verification completed

## Backup and Recovery

### ✅ Data Protection
- [ ] Database backup strategy planned
- [ ] Application data backup plan
- [ ] Recovery procedures documented

## Documentation

### ✅ Project Documentation
- [ ] Deployment guide updated
- [ ] Environment variables documented
- [ ] API documentation current
- [ ] Troubleshooting guide ready

---

## Environment Variables Summary

### Backend (Elastic Beanstalk)
```
SECRET_KEY=your-secure-secret-key
JWT_SECRET_KEY=your-secure-jwt-key
FLASK_ENV=production
YOUTUBE_API_KEY=your-youtube-api-key
CORS_ORIGINS=https://your-amplify-domain.amplifyapp.com
DATABASE_URL=sqlite:///game_library.db
```

### Frontend (Amplify)
```
REACT_APP_API_URL=https://your-eb-domain.elasticbeanstalk.com/api
REACT_APP_GIANT_BOMB_API_KEY=your-giant-bomb-api-key
REACT_APP_GIANT_BOMB_API_URL=https://www.giantbomb.com/api
CI=true
GENERATE_SOURCEMAP=false
```

## Estimated Timeline
- **Backend Setup**: 30-60 minutes
- **Frontend Setup**: 20-30 minutes  
- **Configuration & Testing**: 30-45 minutes
- **Total**: 1.5-2.5 hours

## Estimated Monthly Cost
- **Elastic Beanstalk (t3.micro)**: $10-15
- **Application Load Balancer**: $20
- **Amplify Hosting**: $1-5
- **Total**: ~$30-40/month
