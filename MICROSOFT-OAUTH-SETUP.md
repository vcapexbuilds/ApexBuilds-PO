# Microsoft Azure AD OAuth Setup Guide

## ✅ **Current Status**
Your login page is now configured with **real Microsoft OAuth authentication**!

## 🔧 **Azure AD App Registration Setup Required**

To complete the Microsoft OAuth integration, you need to add the redirect URI to your Azure AD app registration:

### **Step 1: Add Redirect URI**
1. Go to [Azure Portal](https://portal.azure.com)
2. Navigate to **Azure Active Directory** > **App registrations**  
3. Find your app: **PO-Demo** (`d3d0abdb-6c1e-4e54-86e6-262ef5ea3365`)
4. Click on **Authentication** in the left sidebar
5. Under **Web** section (NOT SPA), click **+ Add URI**
6. Add this redirect URI: `http://localhost:3000`
7. Make sure it's under the **Web** platform (not Single-page application)
8. Click **Save**

> **⚠️ Important:** Use **Web** platform, not **SPA**! 
> - **Web** = Server-side apps with authorization code flow (what we're using)
> - **SPA** = Client-side apps with implicit flow (less secure, deprecated)

### **Step 2: Configure Token Configuration** 
1. In your **PO-Demo** app registration, click **Token configuration**
2. Click **+ Add optional claim**
3. Select **ID** token type
4. Add these claims:
   - `email`
   - `given_name` 
   - `family_name`
   - `upn`
5. Click **Add**

### **Step 3: API Permissions**
Ensure your app has these Microsoft Graph permissions:
- `openid` (Sign in and read user profile) - **Required**
- `profile` (View users' basic profile) - **Required**  
- `email` (View users' email address) - **Required**
- `User.Read` (Sign in and read user profile) - **Required**

## 🚀 **Testing the OAuth Flow**

### **Local Development Server**
A local server is running at: **http://localhost:3000**

### **Test Steps:**
1. Open http://localhost:3000 in your browser
2. Click **"Sign in with Microsoft"** button
3. You'll be redirected to Microsoft login
4. Enter your Apex Building Group credentials
5. Grant permissions when prompted
6. You'll be redirected back to the PO system
7. You should be logged in with your Microsoft account!

## 📋 **Current Configuration**

**Azure AD App Details:**
- **Application (Client) ID:** `d3d0abdb-6c1e-4e54-86e6-262ef5ea3365`
- **Directory (Tenant) ID:** `a543e2f6-ae4b-4d1d-b263-a38786ce6844` 
- **Redirect URI:** `http://localhost:3000` (for local testing)
- **Supported Account Types:** Single tenant (Apex Building Group only)

**OAuth Flow:** Authorization Code with PKCE (most secure)
**Platform Type:** Web (NOT SPA - Single Page Application)
**Token Storage:** Session storage (secure, temporary)
**User Info:** Retrieved from Microsoft Graph API

## 🔒 **Security Features Implemented**

✅ **PKCE (Proof Key for Code Exchange)** - Prevents code injection attacks  
✅ **State Parameter Validation** - Prevents CSRF attacks
✅ **Nonce Validation** - Prevents replay attacks  
✅ **Secure Token Storage** - Tokens stored in sessionStorage (not localStorage)
✅ **Automatic Token Cleanup** - Removes OAuth session data after use
✅ **Authorization Code Flow** - More secure than implicit flow (SPA)

## 🌐 **Production Deployment**

When you deploy to a web server:

1. **Update Redirect URI** in Azure AD to match your production URL
2. **Configure HTTPS** - OAuth requires HTTPS in production
3. **Update `microsoft-auth-config.js`** if needed for production domains

## 🆘 **Troubleshooting**

**Common Issues:**
- **"Redirect URI mismatch"** → Add `http://localhost:3000` to Azure AD redirect URIs
- **"Invalid client"** → Verify client ID matches exactly
- **"Unauthorized client"** → Check tenant ID and app permissions
- **"Access denied"** → User may not have permission or canceled auth

**Debug Info:**
Check browser console (F12) for detailed OAuth flow logs.

## 🎯 **Next Steps**

1. ✅ **Add redirect URI to Azure AD** (Step 1 above)
2. ✅ **Test Microsoft OAuth login** at http://localhost:3000  
3. ✅ **Verify user data** is retrieved correctly
4. 🔄 **Configure role mapping** based on user's Azure AD groups (optional)
5. 🚀 **Deploy to production server** when ready

---

Your Microsoft OAuth integration is **ready to test** once you add the redirect URI to Azure AD! 🎉
