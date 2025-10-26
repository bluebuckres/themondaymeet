# 🔧 Vercel Auto-Deployment Troubleshooting

## Why Changes Don't Auto-Deploy

### 1. **Project Not Connected to GitHub**
- Go to Vercel Dashboard → Your Project → Settings → Git
- Check if GitHub repository is properly connected
- If not connected, click "Connect Git Repository"

### 2. **Wrong Branch Being Deployed**
- Check which branch Vercel is watching (usually `main` or `master`)
- Ensure you're pushing to the correct branch
- In Vercel Settings → Git → Production Branch

### 3. **Auto-Deploy Disabled**
- Go to Settings → Git
- Ensure "Automatic deployments" is enabled

### 4. **Build Errors**
- Check Vercel Dashboard → Deployments
- Look for failed deployments with error messages

## Quick Fixes

### Manual Deployment Trigger
1. Go to Vercel Dashboard
2. Click your project
3. Go to "Deployments" tab
4. Click "Redeploy" on the latest deployment

### Force New Deployment
1. Make a small change (add a space in README)
2. Commit and push to trigger deployment
3. Or use Vercel CLI: `vercel --prod`

### Check Deployment Logs
1. Vercel Dashboard → Deployments
2. Click on failed/latest deployment
3. Check "Build Logs" and "Function Logs"
