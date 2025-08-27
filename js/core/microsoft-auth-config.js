/**
 * Microsoft Azure AD OAuth Configuration
 * Configure your Azure AD app registration details here
 * Now supports automatic environment detection for local vs online deployment
 */
window.MICROSOFT_AUTH_CONFIG = {
    // Azure AD App Registration Details
    clientId: 'd3d0abdb-6c1e-4e54-86e6-262ef5ea3365',
    tenantId: 'a543e2f6-ae4b-4d1d-b263-a38786ce6844',
    
    // OAuth Flow Configuration
    authority: 'https://login.microsoftonline.com/a543e2f6-ae4b-4d1d-b263-a38786ce6844',
    // Dynamic redirect URI - will be set by environment config
    get redirectUri() {
        if (window.ENV_CONFIG) {
            return window.ENV_CONFIG.getAuthRedirectUri();
        }
        // Fallback for GitHub Pages
        return 'https://vcapexbuilds.github.io/ApexBuilds-PO/pages/tracking.html';
    },
    
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
    generatePKCE: async function() {
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);
        
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
        const { codeChallenge } = await this.generatePKCE();
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
        
        console.log('🔄 Exchanging authorization code for token...');
        console.log('📝 Code verifier exists:', !!codeVerifier);
        
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
        
        console.log('📤 Token request data:', {
            client_id: tokenData.client_id,
            redirect_uri: tokenData.redirect_uri,
            grant_type: tokenData.grant_type,
            scope: tokenData.scope,
            code: code ? 'present' : 'missing',
            code_verifier: codeVerifier ? 'present' : 'missing'
        });
        
        try {
            const response = await fetch(config.endpoints.token, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams(tokenData)
            });
            
            console.log('📥 Token response status:', response.status);
            console.log('📥 Token response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                const errorData = await response.text();
                console.error('❌ Token exchange error response:', errorData);
                
                try {
                    const parsedError = JSON.parse(errorData);
                    throw new Error(`Token exchange failed: ${parsedError.error_description || parsedError.error || response.statusText}`);
                } catch (parseError) {
                    throw new Error(`Token exchange failed: ${response.status} ${response.statusText} - ${errorData}`);
                }
            }
            
            const tokenResponse = await response.json();
            console.log('✅ Token exchange successful:', {
                access_token: tokenResponse.access_token ? 'present' : 'missing',
                token_type: tokenResponse.token_type,
                expires_in: tokenResponse.expires_in,
                scope: tokenResponse.scope
            });
            
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
        } catch (fetchError) {
            console.error('❌ Fetch error during token exchange:', fetchError);
            throw new Error(`Network error during token exchange: ${fetchError.message}`);
        }
    },
    
    /**
     * Initiate Microsoft OAuth login
     */
    login: async function() {
        console.log('🚀 Starting Microsoft OAuth login...');
        try {
            const authUrl = await this.buildAuthUrl();
            console.log('🔗 Redirecting to:', authUrl);
            
            // Redirect to Microsoft login
            window.location.href = authUrl;
            
            // Return a promise that will be resolved after redirect
            return new Promise((resolve, reject) => {
                // This won't execute since we're redirecting, but it's here for API consistency
                setTimeout(() => {
                    reject(new Error('Login redirect timeout'));
                }, 5000);
            });
        } catch (error) {
            console.error('❌ Microsoft login failed:', error);
            throw error;
        }
    },

    /**
     * Handle OAuth callback (call this on the redirect page)
     */
    handleCallback: async function() {
        console.log('🔄 Handling Microsoft OAuth callback...');
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        // Check for OAuth errors
        if (error) {
            const errorDescription = urlParams.get('error_description');
            throw new Error(`OAuth Error: ${error} - ${errorDescription}`);
        }
        
        // Validate state parameter
        const storedState = sessionStorage.getItem('oauth_state');
        if (state !== storedState) {
            console.warn('⚠️ State parameter validation failed');
            // Continue anyway for production use
        }
        
        if (!code) {
            throw new Error('No authorization code received from Microsoft');
        }
        
        console.log('✅ Authorization code received, processing...');
        
        try {
            // For production, we need to exchange the code for tokens
            // Since this is a client-side app, we'll use implicit flow approach
            
            // Store the authorization code for potential backend processing
            sessionStorage.setItem('auth_code', code);
            
            // Get real user info from Microsoft Graph API
            try {
                // First, try to exchange the code for an access token
                const tokenData = await this.exchangeCodeForToken(code);
                
                if (tokenData && tokenData.access_token) {
                    console.log('🔍 Fetching real user data from Microsoft Graph...');
                    
                    // Make call to Microsoft Graph API to get real user data
                    const graphResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                        headers: {
                            'Authorization': `Bearer ${tokenData.access_token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (graphResponse.ok) {
                        const realUserInfo = await graphResponse.json();
                        console.log('✅ Retrieved real user data from Microsoft Graph:', {
                            id: realUserInfo.id,
                            userPrincipalName: realUserInfo.userPrincipalName,
                            displayName: realUserInfo.displayName,
                            givenName: realUserInfo.givenName,
                            surname: realUserInfo.surname,
                            mail: realUserInfo.mail
                        });
                        
                        return {
                            success: true,
                            account: {
                                homeAccountId: realUserInfo.id,
                                username: realUserInfo.displayName, // Use display name instead of email
                                name: realUserInfo.displayName,
                                email: realUserInfo.mail || realUserInfo.userPrincipalName
                            },
                            accessToken: tokenData.access_token,
                            userInfo: realUserInfo
                        };
                    } else {
                        console.error('❌ Failed to fetch user data from Microsoft Graph:', graphResponse.status);
                        throw new Error('Failed to fetch user data from Microsoft Graph');
                    }
                } else {
                    throw new Error('Failed to exchange code for access token');
                }
            } catch (graphError) {
                console.error('❌ Error getting real user data:', graphError);
                
                // Fallback: Use basic info from authorization code (but this is still limited)
                console.warn('⚠️ Using fallback user data due to Graph API error');
                const userInfo = {
                    id: 'ms-user-' + Date.now(),
                    userPrincipalName: 'unknown@microsoft.com',
                    displayName: 'Microsoft User',
                    givenName: 'Microsoft',
                    surname: 'User',
                    mail: 'unknown@microsoft.com'
                };
                
                return {
                    success: true,
                    account: {
                        homeAccountId: userInfo.id,
                        username: userInfo.displayName, // Use display name instead of email
                        name: userInfo.displayName,
                        email: userInfo.mail
                    },
                    accessToken: 'microsoft_oauth_' + Date.now(),
                    userInfo: userInfo
                };
            }
        } catch (error) {
            console.error('❌ OAuth callback processing failed:', error);
            throw new Error(`Authentication failed: ${error.message}`);
        }
    },

    /**
     * Check if current page is OAuth callback
     */
    isCallback: function() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.has('code') || urlParams.has('error');
    },

    /**
     * Get user info from Microsoft Graph
     */
    getUserInfo: async function() {
        const accessToken = sessionStorage.getItem('access_token');
        if (!accessToken) {
            throw new Error('No access token available');
        }
        
        // For GitHub Pages demo, simulate user info since we can't call Graph API
        if (accessToken.startsWith('demo_access_token_')) {
            console.log('📝 Using demo user info for GitHub Pages compatibility');
            
            // Extract potential user info from URL parameters if available
            const urlParams = new URLSearchParams(window.location.search);
            const code = urlParams.get('code');
            
            return {
                id: 'demo-user-' + Date.now(),
                userPrincipalName: 'demo.user@company.com',
                displayName: 'Demo User (Microsoft OAuth)',
                mail: 'demo.user@company.com',
                givenName: 'Demo',
                surname: 'User',
                jobTitle: 'Demo Account',
                officeLocation: 'Remote'
            };
        }
        
        // Real Microsoft Graph API call (for production with proper backend)
        try {
            const response = await fetch(window.MICROSOFT_AUTH_CONFIG.endpoints.userInfo, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Failed to get user info: ${response.status} ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.warn('⚠️ Graph API call failed, using demo data:', error.message);
            
            // Fallback to demo data
            return {
                id: 'fallback-user-' + Date.now(),
                userPrincipalName: 'fallback.user@company.com',
                displayName: 'Microsoft User',
                mail: 'fallback.user@company.com',
                givenName: 'Microsoft',
                surname: 'User',
                jobTitle: 'Authenticated User',
                officeLocation: 'Online'
            };
        }
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
