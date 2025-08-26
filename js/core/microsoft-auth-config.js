/**
 * Microsoft Azure AD OAuth Configuration
 * Configure your Azure AD app registration details here
 */
window.MICROSOFT_AUTH_CONFIG = {
    // Azure AD App Registration Details
    clientId: 'd3d0abdb-6c1e-4e54-86e6-262ef5ea3365',
    tenantId: 'a543e2f6-ae4b-4d1d-b263-a38786ce6844',
    
    // OAuth Flow Configuration
    authority: 'https://login.microsoftonline.com/a543e2f6-ae4b-4d1d-b263-a38786ce6844',
    redirectUri: window.location.protocol === 'file:' 
        ? 'http://localhost:3000' // For local development
        : window.location.origin + window.location.pathname, // For web deployment
    
    // Scopes to request
    scopes: [
        'openid',
        'profile',
        'email',
        'User.Read'
    ],
    
    // Azure AD endpoints
    endpoints: {
        authorize: 'https://login.microsoftonline.com/a543e2f6-ae4b-4d1d-b263-a38786ce6844/oauth2/v2.0/authorize',
        token: 'https://login.microsoftonline.com/a543e2f6-ae4b-4d1d-b263-a38786ce6844/oauth2/v2.0/token',
        userInfo: 'https://graph.microsoft.com/v1.0/me'
    },
    
    // OAuth 2.0 PKCE Configuration
    codeChallenge: {
        method: 'S256'
    }
};

/**
 * Microsoft OAuth Helper Functions
 */
window.MicrosoftAuth = {
    
    /**
     * Generate PKCE code verifier and challenge
     */
    generatePKCE: function() {
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = this.generateCodeChallenge(codeVerifier);
        
        sessionStorage.setItem('oauth_code_verifier', codeVerifier);
        return { codeVerifier, codeChallenge };
    },
    
    /**
     * Generate random string for PKCE code verifier
     */
    generateCodeVerifier: function() {
        const array = new Uint32Array(56/2);
        crypto.getRandomValues(array);
        return Array.from(array, dec => ('0' + dec.toString(16)).substr(-2)).join('');
    },
    
    /**
     * Generate PKCE code challenge from verifier
     */
    generateCodeChallenge: function(codeVerifier) {
        const encoder = new TextEncoder();
        const data = encoder.encode(codeVerifier);
        return crypto.subtle.digest('SHA-256', data).then(digest => {
            return btoa(String.fromCharCode(...new Uint8Array(digest)))
                .replace(/\+/g, '-')
                .replace(/\//g, '_')
                .replace(/=/g, '');
        });
    },
    
    /**
     * Build OAuth authorization URL
     */
    buildAuthUrl: async function() {
        const config = window.MICROSOFT_AUTH_CONFIG;
        const { codeChallenge } = this.generatePKCE();
        const state = this.generateState();
        const nonce = this.generateNonce();
        
        // Store state and nonce for validation
        sessionStorage.setItem('oauth_state', state);
        sessionStorage.setItem('oauth_nonce', nonce);
        
        const params = new URLSearchParams({
            client_id: config.clientId,
            response_type: 'code',
            redirect_uri: config.redirectUri,
            response_mode: 'query',
            scope: config.scopes.join(' '),
            state: state,
            nonce: nonce,
            code_challenge: await codeChallenge,
            code_challenge_method: 'S256',
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
     * Handle OAuth callback
     */
    handleCallback: async function() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        if (error) {
            throw new Error(`OAuth Error: ${error} - ${urlParams.get('error_description')}`);
        }
        
        if (!code || !state) {
            return null; // Not an OAuth callback
        }
        
        // Verify state parameter
        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) {
            throw new Error('Invalid state parameter - possible CSRF attack');
        }
        
        return this.exchangeCodeForToken(code);
    },
    
    /**
     * Exchange authorization code for access token
     */
    exchangeCodeForToken: async function(code) {
        const config = window.MICROSOFT_AUTH_CONFIG;
        const codeVerifier = sessionStorage.getItem('oauth_code_verifier');
        
        if (!codeVerifier) {
            throw new Error('Code verifier not found - PKCE flow compromised');
        }
        
        const tokenData = {
            client_id: config.clientId,
            scope: config.scopes.join(' '),
            code: code,
            redirect_uri: config.redirectUri,
            grant_type: 'authorization_code',
            code_verifier: codeVerifier
        };
        
        const response = await fetch(config.endpoints.token, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams(tokenData)
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(`Token exchange failed: ${errorData.error_description || response.statusText}`);
        }
        
        const tokenResponse = await response.json();
        
        // Store tokens securely
        sessionStorage.setItem('access_token', tokenResponse.access_token);
        if (tokenResponse.refresh_token) {
            sessionStorage.setItem('refresh_token', tokenResponse.refresh_token);
        }
        
        // Clean up OAuth session data
        sessionStorage.removeItem('oauth_code_verifier');
        sessionStorage.removeItem('oauth_state');
        sessionStorage.removeItem('oauth_nonce');
        
        return tokenResponse;
    },
    
    /**
     * Get user info from Microsoft Graph
     */
    getUserInfo: async function() {
        const accessToken = sessionStorage.getItem('access_token');
        if (!accessToken) {
            throw new Error('No access token available');
        }
        
        const response = await fetch(window.MICROSOFT_AUTH_CONFIG.endpoints.userInfo, {
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
        sessionStorage.removeItem('refresh_token');
        
        // Redirect to Microsoft logout
        const config = window.MICROSOFT_AUTH_CONFIG;
        const logoutUrl = `https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(config.redirectUri)}`;
        window.location.href = logoutUrl;
    }
};

console.log('✅ Microsoft Azure AD OAuth configuration loaded');
console.log('🏢 Tenant:', window.MICROSOFT_AUTH_CONFIG.tenantId);
console.log('📱 Client ID:', window.MICROSOFT_AUTH_CONFIG.clientId);
console.log('🔗 Redirect URI:', window.MICROSOFT_AUTH_CONFIG.redirectUri);
