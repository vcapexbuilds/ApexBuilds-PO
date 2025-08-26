// Microsoft Authentication Configuration and Handler
console.log('Microsoft Auth module loading...');

// Configuration for Microsoft Authentication
const msalConfig = {
    auth: {
        clientId: 'd3d0abdb-6c1e-4e54-86e6-262ef5ea3365', // Your Azure App ID
        authority: 'https://login.microsoftonline.com/a543e2f6-ae4b-4d1d-b263a38786ce6844', // Your tenant ID
        redirectUri: window.location.origin + window.location.pathname // Current page as redirect
    },
    cache: {
        cacheLocation: 'sessionStorage',
        storeAuthStateInCookie: false
    }
};

// Create MSAL instance
const msalInstance = new msal.PublicClientApplication(msalConfig);

// Login request configuration
const loginRequest = {
    scopes: ['User.Read', 'profile', 'openid', 'email']
};

// Microsoft Authentication Manager
class MicrosoftAuth {
    constructor() {
        this.msalInstance = msalInstance;
        this.currentAccount = null;
        console.log('MicrosoftAuth initialized');
    }

    async initialize() {
        try {
            console.log('Initializing Microsoft Auth...');
            await this.msalInstance.initialize();
            
            // Handle redirect promise
            const response = await this.msalInstance.handleRedirectPromise();
            if (response) {
                console.log('Redirect response:', response);
                this.currentAccount = response.account;
            } else {
                // Get account from cache
                const accounts = this.msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    this.currentAccount = accounts[0];
                    console.log('Found cached account:', this.currentAccount);
                }
            }
            
            return this.currentAccount;
        } catch (error) {
            console.error('Microsoft Auth initialization error:', error);
            throw error;
        }
    }

    async login() {
        try {
            console.log('Starting Microsoft login...');
            const response = await this.msalInstance.loginPopup(loginRequest);
            console.log('Login successful:', response);
            this.currentAccount = response.account;
            return response;
        } catch (error) {
            console.error('Microsoft login error:', error);
            throw error;
        }
    }

    async getUserInfo() {
        if (!this.currentAccount) {
            console.log('No current account, attempting to get from cache');
            const accounts = this.msalInstance.getAllAccounts();
            if (accounts.length > 0) {
                this.currentAccount = accounts[0];
            } else {
                console.log('No cached account found');
                return null;
            }
        }

        try {
            console.log('Getting user info for account:', this.currentAccount);
            
            // Try to get fresh token and user info
            const tokenRequest = {
                scopes: ['User.Read'],
                account: this.currentAccount
            };

            const response = await this.msalInstance.acquireTokenSilent(tokenRequest);
            console.log('Token acquired:', response);

            // Make API call to get user info
            const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
                headers: {
                    'Authorization': `Bearer ${response.accessToken}`
                }
            });

            if (userResponse.ok) {
                const userData = await userResponse.json();
                console.log('Microsoft Graph user data:', userData);
                return {
                    displayName: userData.displayName,
                    givenName: userData.givenName,
                    surname: userData.surname,
                    userPrincipalName: userData.userPrincipalName,
                    id: userData.id,
                    mail: userData.mail
                };
            } else {
                console.error('Failed to fetch user info from Microsoft Graph');
                // Fallback to account info
                return {
                    displayName: this.currentAccount.name,
                    givenName: this.currentAccount.idTokenClaims?.given_name,
                    surname: this.currentAccount.idTokenClaims?.family_name,
                    userPrincipalName: this.currentAccount.username,
                    id: this.currentAccount.homeAccountId
                };
            }
        } catch (error) {
            console.error('Error getting user info:', error);
            // Return basic account info as fallback
            if (this.currentAccount) {
                return {
                    displayName: this.currentAccount.name,
                    givenName: this.currentAccount.idTokenClaims?.given_name,
                    surname: this.currentAccount.idTokenClaims?.family_name,
                    userPrincipalName: this.currentAccount.username,
                    id: this.currentAccount.homeAccountId
                };
            }
            return null;
        }
    }

    isAuthenticated() {
        return this.currentAccount !== null;
    }

    async logout() {
        try {
            console.log('Logging out...');
            await this.msalInstance.logoutPopup({
                account: this.currentAccount
            });
            this.currentAccount = null;
        } catch (error) {
            console.error('Logout error:', error);
            throw error;
        }
    }

    getAccount() {
        return this.currentAccount;
    }
}

// Create global instance
const microsoftAuth = new MicrosoftAuth();

// Auto-initialize when script loads
microsoftAuth.initialize().catch(console.error);

console.log('Microsoft Auth module loaded');
