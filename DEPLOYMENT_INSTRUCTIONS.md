# GitHub Pages Deployment Instructions

## Issue Fixed
The issue where GitHub Pages was serving a blank page with the error `GET https://lordzura.github.io/src/main.tsx net::ERR_ABORTED 404 (Not Found)` has been resolved.

## Root Cause
GitHub Pages was serving the source `index.html` file instead of the built version from the `dist` folder. The source file references `/src/main.tsx` which doesn't exist in the deployed version, while the built version correctly references the bundled JavaScript assets.

## Solution Implemented

### 1. GitHub Actions Workflow
Created `.github/workflows/deploy.yml` which:
- Automatically builds the project when you push to the `main` branch
- Deploys the `dist` folder contents to GitHub Pages
- Uses the modern GitHub Pages deployment action for reliability

### 2. Fixed Source Index.html
- Cleaned up the source `index.html` to remove duplicate debug messages
- Kept the script reference for development while ensuring production builds work correctly

## GitHub Pages Configuration Required

⚠️ **IMPORTANT**: You need to update your GitHub Pages settings:

1. Go to your repository: https://github.com/LordZura/Guides
2. Click on **Settings** tab
3. Scroll down to **Pages** section
4. Under **Source**, select **"GitHub Actions"** instead of "Deploy from a branch"

This will use the automated workflow instead of trying to serve files from a branch.

## How It Works

### Development (localhost)
- Run `npm run dev` - serves the source files directly
- Vite development server handles module resolution
- Works at `http://localhost:5173/Guides/`

### Production (GitHub Pages)
- GitHub Actions automatically runs `npm run build` on every push
- Creates optimized bundles in `dist` folder
- Deploys only the `dist` contents to GitHub Pages
- Serves at `https://lordzura.github.io/Guides/`

## Manual Deployment (Alternative)
If you prefer manual deployment, you can still use:
```bash
npm run deploy
```
This uses `gh-pages` to deploy the `dist` folder to the `gh-pages` branch.

## Verification
After the GitHub Actions workflow runs:
1. Check the "Actions" tab in your repository to see deployment status
2. Visit https://lordzura.github.io/Guides/
3. The page should load correctly without any 404 errors for JavaScript files

## Troubleshooting

### If you still see the blank page:
1. Check that GitHub Pages is set to use "GitHub Actions" as the source
2. Verify the workflow ran successfully in the "Actions" tab
3. Clear your browser cache (the old files might be cached)
4. Wait a few minutes for GitHub Pages CDN to update

### If the workflow fails:
1. Check the Actions tab for error messages
2. Ensure your environment variables are set if needed for the build
3. Verify all dependencies are properly listed in package.json