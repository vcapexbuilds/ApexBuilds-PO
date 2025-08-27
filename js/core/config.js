const config = {
    apiBaseUrl: 'https://your-api-base-url',
    storageKeys: {
        authToken: 'auth_token',
        userData: 'user_data',
        isAdmin: 'is_admin'
    }
};

// 🔧 AZURE AD CONFIGURATION FOR ORGANIZATIONAL TENANT
// Using your company's Azure AD - this is PRODUCTION READY! 🎉
const AZURE_CONFIG = {
    // 📝 Your Application (Client) ID from the screenshot
    clientId: "d3d0abdb-6c1e-4e54-86e6-262ef5ea3365",
    
    // 📝 Your Directory (Tenant) ID from the screenshot  
    authority: "https://login.microsoftonline.com/a543e2f6-ae4b-4d1d-b263-a38786ce6844",
    
    // 📝 Dynamic redirect URI based on environment
    get redirectUri() {
        if (window.ENV_CONFIG) {
            return window.ENV_CONFIG.getAuthRedirectUri();
        }
        // Fallback for local development
        return "http://localhost:8080/pages/tracking.html";
    },
    
    // 📝 Microsoft Graph scopes (these are correct - don't change)
    scopes: ["openid", "profile", "User.Read", "email"],
    
    // 📝 Cache configuration (correct - don't change)
    cache: {
        cacheLocation: "localStorage",
        storeAuthStateInCookie: false
    }
};

export default config;
export { AZURE_CONFIG };

// Dummy form schema for admin panel to load
const formSchema = {
    // This is a placeholder. A real schema should be loaded.
    properties: {}
};

// Register with the component registry
if (window.ComponentRegistry) {
    window.ComponentRegistry.register('formSchema', formSchema);
} else {
    window.formSchema = formSchema;
}
