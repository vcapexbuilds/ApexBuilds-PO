/**
 * Microsoft Azure AD SPA (Single Page Application) Configuration
 * Uses Implicit Flow - Less secure but works with current Azure AD setup
 */
window.MICROSOFT_SPA_CONFIG = {
    // Azure AD App Registration Details
    clientId: 'd3d0abdb-6c1e-4e54-86e6-262ef5ea3365',
    tenantId: 'a543e2f6-ae4b-4d1d-b263-a38786ce6844',
    
    // SPA OAuth Flow Configuration
    authority: 'https://login.microsoftonline.com/a543e2f6-ae4b-4d1d-b263-a38786ce6844',
    redirectUri: 'http://localhost:8080/pages/form.html', // Must match Azure AD app registration
    
    // Scopes to request
    scopes: [
        'openid',
        'profile',
        'email',
        'User.Read'
    ],
    
    // SPA endpoints (implicit flow)
    endpoints: {
        authorize: 'https://login.microsoftonline.com/a543e2f6-ae4b-4d1d-b263-a38786ce6844/oauth2/v2.0/authorize',
        userInfo: 'https://graph.microsoft.com/v1.0/me'
    }
};

/**
 * Microsoft SPA OAuth Helper Functions (Implicit Flow)
 */
window.MicrosoftSPA = {
    
    /**
     * Build OAuth authorization URL for implicit flow
     */
    buildAuthUrl: function() {
        const config = window.MICROSOFT_SPA_CONFIG;
        const state = this.generateState();
        const nonce = this.generateNonce();
        
        // Store state and nonce for validation
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('oauth_nonce', nonce);
        
        const params = new URLSearchParams({
            client_id: config.clientId,
            response_type: 'id_token token', // Implicit flow
            redirect_uri: config.redirectUri,
            response_mode: 'fragment', // Tokens in URL fragment
            scope: config.scopes.join(' '),
            state: state,
            nonce: nonce,
            prompt: 'select_account'
        });
        
        return `${config.endpoints.authorize}?${params.toString()}`;
    },
    
    /**
     * Generate random state parameter
     */
    generateState: function() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },
    
    /**
     * Generate random nonce parameter
     */
    generateNonce: function() {
        return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    },
    
    /**
     * Handle OAuth callback for implicit flow
     */
    handleCallback: function() {
        // Get tokens from URL fragment (not query parameters)
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        
        const accessToken = params.get('access_token');
        const idToken = params.get('id_token');
        const state = params.get('state');
        const error = params.get('error');
        
        if (error) {
            throw new Error(`OAuth Error: ${error} - ${params.get('error_description')}`);
        }
        
        if (!accessToken || !idToken || !state) {
            return null; // Not an OAuth callback
        }
        
        // Verify state parameter
        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) {
            throw new Error('Invalid state parameter - possible CSRF attack');
        }
        
        // Store tokens
        sessionStorage.setItem('access_token', accessToken);
        sessionStorage.setItem('id_token', idToken);
        
        // Clean up OAuth session data
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_nonce');
        
        // Clean up URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        return { access_token: accessToken, id_token: idToken };
    },
    
    /**
     * Get user info from Microsoft Graph
     */
    getUserInfo: async function() {
        const accessToken = sessionStorage.getItem('access_token');
        if (!accessToken) {
            throw new Error('No access token available');
        }
        
        const response = await fetch(window.MICROSOFT_SPA_CONFIG.endpoints.userInfo, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error(`Failed to get user info: ${response.statusText}`);
        }
        
        return response.json();
    },
    
    /**
     * Check if user is authenticated
     */
    isAuthenticated: function() {
        const accessToken = sessionStorage.getItem('access_token');
        return !!accessToken;
    },
    
    /**
     * Sign out user
     */
    signOut: function() {
        // Clear stored tokens
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('id_token');
        
        // Redirect to Microsoft logout
        const config = window.MICROSOFT_SPA_CONFIG;
        const logoutUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(config.redirectUri)}`;
        window.location.href = logoutUrl;
    }
};

console.log('⚠️ Microsoft Azure AD SPA configuration loaded');
console.log('🏢 Tenant:', window.MICROSOFT_SPA_CONFIG.tenantId);
console.log('📱 Client ID:', window.MICROSOFT_SPA_CONFIG.clientId);
console.log('🔗 Redirect URI:', window.MICROSOFT_SPA_CONFIG.redirectUri);
console.log('⚠️ WARNING: Using implicit flow - less secure than authorization code flow');
