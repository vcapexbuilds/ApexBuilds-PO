# 🌐 Online Deployment Setup Instructions
go
Your Apex PO System is now configured to work both locally and online! Here's what you need to do to complete the setup:

## ✅ What I've Already Done For You

1. **Created Dynamic Environment Detection**
   - Added `js/core/environment-config.js` that automatically detects local vs online
   - Updated all hardcoded paths to use dynamic configuration
   - Modified Microsoft Auth to support both environments

2. **Updated Path Management**
   - Print page navigation now works online
   - Form page links adapted for GitHub Pages
   - All internal navigation is now environment-aware

## 🔧 What You Need To Do Next

### Step 1: ✅ COMPLETED - GitHub Pages URL Updated
✅ I've already updated your configuration with your actual URL: `https://vcapexbuilds.github.io/ApexBuilds-PO/`

### Step 2: Update Microsoft Azure AD App Registration
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to Azure Active Directory > App registrations
3. Find your app registration (Client ID: d3d0abdb-6c1e-4e54-86e6-262ef5ea3365)
4. Go to "Authentication" section
5. Add your GitHub Pages URL as a redirect URI:
   ```
   https://vcapexbuilds.github.io/ApexBuilds-PO/pages/tracking.html
   ```
6. Keep the localhost URL for local testing:
   ```
   http://localhost:8080/pages/tracking.html
   ```

### Step 3: Test Your Online Application
1. Visit your GitHub Pages URL: `https://vcapexbuilds.github.io/ApexBuilds-PO/`
2. Try the Microsoft login
3. Test the PO tracking functionality
4. Verify the "View Details" button works online

## 🔍 How The Environment Detection Works

The system automatically detects if it's running:
- **Locally**: `localhost`, `127.0.0.1`, or any URL with a port number
- **Online**: GitHub Pages, custom domain, or any production URL

**Local Environment:**
- Uses relative paths (`../Print.html`)
- Microsoft Auth redirects to `http://localhost:8080/pages/tracking.html`

**Online Environment:**
- Uses absolute paths (`https://vcapexbuilds.github.io/ApexBuilds-PO/Print.html`)
- Microsoft Auth redirects to your GitHub Pages URL

## 🚀 Current Status

✅ **Working Locally**: Your app works on localhost as before
✅ **Ready for Online**: Environment detection is configured with your URL
✅ **Configuration Updated**: Using `https://vcapexbuilds.github.io/ApexBuilds-PO/`
⏳ **Needs Setup**: Azure AD redirect URI needs to be added

## 🛠️ If You Have Issues

**Common Issues & Solutions:**

1. **Microsoft Login Fails Online**
   - Ensure you added your GitHub Pages URL to Azure AD app registration
   - Check browser console for redirect URI mismatch errors

2. **Print Page Not Loading**
   - Verify all script files are loading (check Network tab in dev tools)
   - Ensure GitHub Pages is serving all JavaScript files correctly

3. **Navigation Not Working**
   - Check if `environment-config.js` is loading first
   - Verify console shows "Environment detected: PRODUCTION"

**Debug Mode:**
Open browser console to see environment detection messages:
```
🌍 Environment detected: PRODUCTION
🌍 Base URL: https://vcapexbuilds.github.io/ApexBuilds-PO
```

## 📞 Next Steps

1. ✅ GitHub Pages URL updated in configuration
2. Add the redirect URI to Azure AD: `https://vcapexbuilds.github.io/ApexBuilds-PO/pages/tracking.html`
3. Push changes to GitHub
4. Test your online application at `https://vcapexbuilds.github.io/ApexBuilds-PO/`
5. Let me know if you encounter any issues!

Your application should now work seamlessly both locally and online! 🎉
