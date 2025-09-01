# Local Development Guide

## Testing Changes Locally

Follow these steps to test your changes locally before pushing to production:

### 1. Frontend Development

#### Start the React Development Server:
```bash
cd client
npm start
```

This will:
- Start the React development server on http://localhost:3000
- Use the `.env.local` file for environment variables
- Connect to the production Railway backend (no need to run Flask locally)
- Enable hot reloading - changes will appear instantly

#### Preview Your Changes:
- Open http://localhost:3000 in your browser
- Test your UI changes
- Verify functionality works correctly
- Check responsive design on different screen sizes

### 2. Backend Development (Optional)

If you need to test backend changes locally:

#### Start the Flask Development Server:
```bash
cd server
# Configure Python environment first
python run_dev.py
```

#### Update Frontend to Use Local Backend:
In `client/.env.local`, change:
```
REACT_APP_API_URL=http://localhost:5000/api
```

### 3. Testing Workflow

1. **Make Changes**: Edit your code
2. **Test Locally**: Run `npm start` and test at http://localhost:3000
3. **Verify Everything Works**: Check all functionality
4. **Commit & Push**: When satisfied, commit and push to production

### 4. Production Deployment

After testing locally:
```bash
git add .
git commit -m "Your commit message"
git push
```

This will automatically deploy:
- Frontend changes to Amplify (www.vgvaults.com)
- Backend changes to Railway (api.vgvaults.com)

### 5. Environment Files

- `.env.local` - Local development (this file)
- `.env.production` - Production build (used by Amplify)
- `.env` - Default environment (currently same as production)

### 6. Useful Commands

```bash
# Install dependencies
npm install

# Start development server
npm start

# Build for production (optional - Amplify does this automatically)
npm run build

# Run tests
npm test

# Check for linting errors
npm run lint
```

### 7. Troubleshooting

- **Port already in use**: React usually runs on port 3000. If taken, it will prompt for another port.
- **CORS errors**: Make sure you're using the correct API URL in your `.env.local`
- **Changes not showing**: Hard refresh your browser (Ctrl+F5 or Cmd+Shift+R)
- **Environment variables not loading**: Restart the development server after changing `.env.local`

## Notes

- The local development server supports hot reloading
- Environment variables starting with `REACT_APP_` are available in the React app
- Local development uses the production backend by default (easier setup)
- Always test major changes locally before pushing to production
