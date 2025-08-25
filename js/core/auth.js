// Authentication System
class AuthManager {
    constructor() {
        console.log('=== AUTH MANAGER CONSTRUCTOR ===');
        this.currentUser = null;
        this.sessionTimeout = 24 * 60 * 60 * 1000; // 24 hours
        
        // OneDrive integration endpoints - REPLACE WITH YOUR ACTUAL POWER AUTOMATE URLs
        // User Management Flow: Create flow named "Apex-PO-User-Management"
        this.ONEDRIVE_USER_ENDPOINT = 'https://defaulta543e2f6ae4b4d1db263a38786ce68.44.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/5318a42f0c0f4d339862250fa4b2bb88/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=EUpzsCEZqn5zgWONTgEw7HOnRpYeFNDBIHvTDLGaQB8';
        // User Retrieval Flow: For getting user data from OneDrive
        this.ONEDRIVE_RETRIEVE_ENDPOINT = 'YOUR_USER_RETRIEVAL_POWER_AUTOMATE_URL_HERE';
        
        // Ensure storage is available
        console.log('Checking storage availability...');
        console.log('window.storage exists:', !!window.storage);
        console.log('global storage exists:', typeof storage !== 'undefined');
        
        this.storage = window.storage || (typeof storage !== 'undefined' ? storage : null);
        console.log('this.storage assigned:', !!this.storage);
        
        if (!this.storage) {
            console.error('CRITICAL: Storage not available! Auth will retry initialization...');
            // Don't throw error, just mark as not ready
            this.storageReady = false;
        } else {
            this.storageReady = true;
        }
        
        this.demoAccounts = {
            admin: {
                email: 'admin@demo.com',
                username: 'admin',
                password: 'admin123',
                role: 'admin',
                name: 'Demo Admin',
                company: 'Apex Building'
            },
            user: {
                email: 'user@demo.com',
                username: 'user',
                password: 'user123',
                role: 'user',
                name: 'Demo User',
                company: 'Test Company'
            },
            vcabrillos: {
                email: 'vcabrillos@apexbuilds.com',
                username: 'vcabrillos',
                password: 'demo123',
                role: 'user',
                name: 'Virgilio Cabrillos Jr.',
                company: 'Apex Building Group'
            }
        };
        this.init();
    }

    init() {
        // Check for existing session
        this.checkSession();
        
        // Set up session monitoring
        this.startSessionMonitoring();
        
        // Handle page navigation auth checks
        this.handlePageSecurity();
    }

    // Login method
    async login(emailOrUsername, password) {
        console.log('=== AUTH LOGIN METHOD CALLED ===');
        console.log('Parameters received:', { 
            emailOrUsername: emailOrUsername, 
            password: password ? '***masked***' : 'empty' 
        });
        
        // Check if storage is ready
        if (!this.storageReady || !this.storage) {
            console.error('Storage not ready for login attempt');
            return {
                success: false,
                message: 'System is still initializing. Please wait a moment and try again.'
            };
        }
        
        try {
            console.log('Starting login validation...');
            console.log('Demo accounts available:', Object.keys(this.demoAccounts));
            
            let user = null;

            // Check all demo accounts (support both email and username)
            for (const [accountKey, accountData] of Object.entries(this.demoAccounts)) {
                console.log(`Checking against ${accountKey}:`, { 
                    email: accountData.email, 
                    username: accountData.username 
                });
                
                if ((emailOrUsername === accountData.email || emailOrUsername === accountData.username) && password === accountData.password) {
                    console.log(`${accountKey} authentication successful`);
                    user = { ...accountData };
                    break;
                }
            }

            if (!user) {
                console.log('Authentication failed - no matching credentials');
                throw new Error('Invalid credentials');
            }

            console.log('User authenticated, creating session...');

            // Create session
            const sessionData = {
                id: user.id || user.username, // Use username as fallback ID
                username: user.username || user.name,
                email: user.email,
                company: user.company,
                role: user.role,
                loginTime: new Date().toISOString(),
                expiresAt: new Date(Date.now() + this.sessionTimeout).toISOString()
            };

            // Store session
            console.log('Storing session data...');
            console.log('Storage object available:', !!this.storage);
            this.storage.setCurrentUser(sessionData);
            this.currentUser = sessionData;
            console.log('Session stored successfully');

            // Update user's last login
            this.storage.updateUser(user.id, {
                lastLogin: new Date().toISOString()
            });

            console.log('Login process completed successfully');
            return {
                success: true,
                user: sessionData,
                message: 'Login successful'
            };

        } catch (error) {
            console.error('=== LOGIN ERROR ===');
            console.error('Error details:', error);
            console.error('Error message:', error.message);
            console.error('Error stack:', error.stack);
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Register method
    async register(userData) {
        try {
            // Validate inputs
            const required = ['username', 'email', 'password', 'company'];
            for (const field of required) {
                if (!userData[field]) {
                    throw new Error(`${field} is required`);
                }
            }

            // Check if username already exists
            const existingUser = this.storage.users.find(user => 
                user.username.toLowerCase() === userData.username.toLowerCase()
            );
            
            if (existingUser) {
                throw new Error('Username already exists');
            }

            // Check if email already exists
            const existingEmail = this.storage.users.find(user => 
                user.email.toLowerCase() === userData.email.toLowerCase()
            );
            
            if (existingEmail) {
                throw new Error('Email already exists');
            }

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                throw new Error('Invalid email format');
            }

            // Validate password strength
            if (userData.password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            // Create new user
            const newUser = this.storage.addUser({
                username: userData.username,
                email: userData.email,
                password: userData.password, // In production, hash this
                company: userData.company,
                role: 'user' // Default role
            });

            // Save new user to OneDrive Business via Power Automate
            let oneDriveMessage = '';
            try {
                const oneDriveResult = await this.saveUserToOneDrive(newUser);
                console.log('OneDrive sync result:', oneDriveResult);
                
                // Handle different OneDrive sync results
                if (oneDriveResult.success) {
                    if (oneDriveResult.syncStatus === 'synced') {
                        oneDriveMessage = ' User data synced to OneDrive.';
                    } else if (oneDriveResult.syncStatus === 'exists') {
                        oneDriveMessage = ' User credentials already exist in OneDrive.';
                    }
                } else {
                    oneDriveMessage = ' (OneDrive sync failed - user created locally only)';
                }
            } catch (oneDriveError) {
                console.warn('Failed to save user to OneDrive:', oneDriveError.message);
                oneDriveMessage = ' (OneDrive sync failed - user created locally only)';
            }

            return {
                success: true,
                user: newUser,
                message: `Registration successful.${oneDriveMessage}`
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Logout method
    logout() {
        try {
            // Clear app session data
            if (this.storage) {
                this.storage.clearCurrentUser();
            }
            this.currentUser = null;

            // Clear OAuth/session artifacts
            try {
                localStorage.removeItem('currentUser');
                localStorage.removeItem('isAuthenticated');
                localStorage.removeItem('ms_graph_token');
                localStorage.removeItem('oauth_state');
                localStorage.removeItem('code_verifier');
                sessionStorage.removeItem('oauth_state');
                sessionStorage.removeItem('code_verifier');
            } catch (_) {}

            // Force account selection on next sign-in
            try { sessionStorage.setItem('force_login', '1'); } catch (_) {}

            // Redirect through Azure AD logout to end AAD session, then back to index
            const tenantId = (window.m365Config && typeof window.m365Config.getGraphConfig === 'function')
                ? window.m365Config.getGraphConfig().tenantId
                : null;
            const postLogout = `${window.location.origin}/index.html`;
            if (tenantId) {
                const aadLogout = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(postLogout)}`;
                window.location.href = aadLogout;
            } else {
                // Fallback: just go to login
                this.redirectToLogin();
            }

            return {
                success: true,
                message: 'Logged out successfully'
            };

        } catch (error) {
            return {
                success: false,
                message: 'Error during logout'
            };
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        console.log('=== IS AUTHENTICATED CHECK ===');
        console.log('Current user exists:', !!this.currentUser);
        
        // If no current user, try to check session first
        if (!this.currentUser) {
            console.log('No current user, checking session...');
            this.checkSession();
        }
        
        if (!this.currentUser) {
            console.log('Still no current user after session check');
            return false;
        }

        // Check if session has expired
        console.log('Checking expiration:', this.currentUser.expiresAt);
        if (new Date() > new Date(this.currentUser.expiresAt)) {
            console.log('Session expired, logging out');
            this.logout();
            return false;
        }

        console.log('User is authenticated');
        return true;
    }

    // Check if user has specific role
    hasRole(role) {
        return this.isAuthenticated() && this.currentUser.role === role;
    }

    // Check if user is admin
    isAdmin() {
        return this.hasRole('admin');
    }

    // Check if user is regular user
    isUser() {
        return this.hasRole('user');
    }

    // Get current user info
    getCurrentUser() {
        return this.isAuthenticated() ? this.currentUser : null;
    }

    // Get available roles for current user (defaults based on current role)
    getAvailableRoles() {
        if (!this.isAuthenticated()) return [];
        const roles = this.currentUser.roles;
        if (Array.isArray(roles) && roles.length) return roles;
        // Derive when not set
        return this.currentUser.role === 'admin' ? ['admin', 'user'] : ['user'];
    }

    // Set active role for the current session and persist appropriately
    setActiveRole(newRole) {
        if (!this.isAuthenticated()) {
            return { success: false, message: 'Not authenticated' };
        }
        const allowed = this.getAvailableRoles();
        if (!allowed.includes(newRole)) {
            return { success: false, message: 'Role not permitted for this user' };
        }
        this.currentUser.role = newRole;
        if (!Array.isArray(this.currentUser.roles) || !this.currentUser.roles.length) {
            this.currentUser.roles = allowed;
        }

        // Persist depending on session type
        if (this.currentUser.isOAuth) {
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        } else if (this.storage) {
            this.storage.setCurrentUser(this.currentUser);
        } else {
            localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        }

        return { success: true, user: this.currentUser };
    }

    // Check and restore session from storage
    checkSession() {
        console.log('=== CHECK SESSION START ===');
        
        // Check for OAuth session first
        try {
            const oauthUserData = localStorage.getItem('currentUser');
            console.log('OAuth user data found:', !!oauthUserData);
            
            if (oauthUserData) {
                const userData = JSON.parse(oauthUserData);
                console.log('Parsed OAuth user data:', userData);
                
                // Check if it's an OAuth session
                if (userData.isOAuth === true) {
                    console.log('OAuth session detected');
                    
                    // Check if session is still valid
                    if (new Date() <= new Date(userData.expiresAt)) {
                        console.log('OAuth session is valid');
                        this.currentUser = userData;
                        
                        // Try to refresh user info from Microsoft Graph API if available
                        this.refreshUserInfoFromGraph();
                        
                        return true;
                    } else {
                        console.log('OAuth session expired');
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('auth_token');
                        localStorage.removeItem('id_token');
                        return false;
                    }
                }
            }
        } catch (error) {
            console.error('Error checking OAuth session:', error);
        }
        
        // Fallback to standard storage method
        const sessionData = this.storage ? this.storage.getCurrentUser() : null;
        console.log('Standard session data found:', !!sessionData);
        
        if (sessionData) {
            // Check if session is still valid
            if (new Date() <= new Date(sessionData.expiresAt)) {
                console.log('Standard session is valid');
                this.currentUser = sessionData;
                return true;
            } else {
                console.log('Standard session expired');
                // Session expired, clear it
                if (this.storage) {
                    this.storage.clearCurrentUser();
                }
                return false;
            }
        }
        
        console.log('No valid session found');
        return false;
    }

    /**
     * Refresh user information from Microsoft Graph API
     */
    async refreshUserInfoFromGraph() {
        try {
            console.log('=== REFRESHING USER INFO FROM GRAPH API ===');
            
            // Check if Microsoft Graph API is available
            if (typeof MicrosoftGraphAPI !== 'undefined' && window.poSystemApp?.msGraphAPI) {
                console.log('Using Microsoft Graph API from app...');
                
                const userProfile = await window.poSystemApp.msGraphAPI.getUserProfile();
                if (userProfile && userProfile.displayName) {
                    console.log(`Updating user name from ${this.currentUser?.name} to ${userProfile.displayName}`);
                    
                    // Update current user with real Microsoft info
                    if (this.currentUser) {
                        this.currentUser.name = userProfile.displayName;
                        this.currentUser.username = userProfile.displayName;
                        this.currentUser.displayName = userProfile.displayName;
                        this.currentUser.givenName = userProfile.givenName || userProfile.displayName.split(' ')[0];
                        this.currentUser.familyName = userProfile.surname || userProfile.displayName.split(' ')[1] || '';
                        
                        if (userProfile.mail || userProfile.userPrincipalName) {
                            this.currentUser.email = userProfile.mail || userProfile.userPrincipalName;
                        }
                        
                        // Save updated user info
                        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                        
                        console.log('✅ User info updated with Microsoft Graph data:', this.currentUser);
                        return true;
                    }
                }
            } else {
                console.log('Microsoft Graph API not available, trying direct token approach...');
                
                // Try to get user info directly using stored token
                const storedToken = localStorage.getItem('ms_graph_token');
                if (storedToken) {
                    try {
                        const tokenData = JSON.parse(storedToken);
                        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
                            headers: {
                                'Authorization': `Bearer ${tokenData.access_token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        
                        if (response.ok) {
                            const userProfile = await response.json();
                            console.log('Got user profile directly from Graph API:', userProfile);
                            
                            if (this.currentUser && userProfile.displayName) {
                                this.currentUser.name = userProfile.displayName;
                                this.currentUser.username = userProfile.displayName;
                                this.currentUser.displayName = userProfile.displayName;
                                this.currentUser.givenName = userProfile.givenName || userProfile.displayName.split(' ')[0];
                                this.currentUser.familyName = userProfile.surname || userProfile.displayName.split(' ')[1] || '';
                                
                                if (userProfile.mail || userProfile.userPrincipalName) {
                                    this.currentUser.email = userProfile.mail || userProfile.userPrincipalName;
                                }
                                
                                localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
                                console.log('✅ User info updated via direct Graph API call:', this.currentUser);
                                return true;
                            }
                        }
                    } catch (error) {
                        console.error('Error with direct Graph API call:', error);
                    }
                }
            }
            
            return false;
        } catch (error) {
            console.log('Could not refresh user info from Graph API:', error.message);
            return false;
        }
    }

    /**
     * Manual method to refresh user name (can be called from console)
     */
    async refreshUserName() {
        console.log('=== MANUAL USER NAME REFRESH ===');
        const success = await this.refreshUserInfoFromGraph();
        if (success) {
            console.log('✅ User name refreshed successfully');
            // Reload the page to show updated name
            window.location.reload();
        } else {
            console.log('❌ Could not refresh user name');
        }
        return success;
    }

    // Extend session
    extendSession() {
        if (this.currentUser) {
            this.currentUser.expiresAt = new Date(Date.now() + this.sessionTimeout).toISOString();
            this.storage.setCurrentUser(this.currentUser);
        }
    }

    // Start monitoring session
    startSessionMonitoring() {
        // Check session every 5 minutes
        setInterval(() => {
            if (this.currentUser) {
                const now = new Date();
                const expiresAt = new Date(this.currentUser.expiresAt);
                
                // Warn user 10 minutes before session expires
                const timeUntilExpiry = expiresAt - now;
                if (timeUntilExpiry <= 10 * 60 * 1000 && timeUntilExpiry > 0) {
                    this.showSessionWarning();
                }
                
                // Auto-logout when session expires
                if (now >= expiresAt) {
                    this.handleSessionExpiry();
                }
            }
        }, 5 * 60 * 1000); // 5 minutes

        // Extend session on user activity
        ['click', 'keypress', 'scroll', 'mousemove'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                if (this.currentUser && Date.now() % 30000 === 0) { // Throttle to every 30 seconds
                    this.extendSession();
                }
            }, { passive: true });
        });
    }

    // Show session warning modal
    showSessionWarning() {
        // This would typically show a modal warning the user
        console.warn('Session will expire in 10 minutes');
        
        // You could implement a modal here
        if (typeof showModal === 'function') {
            showModal('Session Warning', 'Your session will expire in 10 minutes. Click OK to extend it.', [
                {
                    text: 'Extend Session',
                    class: 'btn-primary',
                    action: () => this.extendSession()
                },
                {
                    text: 'Logout',
                    class: 'btn-secondary',
                    action: () => this.logout()
                }
            ]);
        }
    }

    // Handle session expiry
    handleSessionExpiry() {
        // Show expiry message
        if (typeof showModal === 'function') {
            showModal('Session Expired', 'Your session has expired. Please log in again.', [
                {
                    text: 'OK',
                    class: 'btn-primary',
                    action: () => this.logout()
                }
            ]);
        } else {
            alert('Your session has expired. Please log in again.');
            this.logout();
        }
    }

    // Handle page security based on authentication
    handlePageSecurity() {
        const currentPath = window.location.pathname;
        const filename = currentPath.split('/').pop() || 'index.html';
        
        // Define protected pages
        const protectedPages = {
            'form.html': ['user', 'admin'],
            'tracking.html': ['user', 'admin'],
            'admin.html': ['admin']
        };

        // Check if current page requires authentication
        if (protectedPages[filename]) {
            if (!this.isAuthenticated()) {
                this.redirectToLogin();
                return;
            }

            // Check role-based access
            const requiredRoles = protectedPages[filename];
            if (!requiredRoles.includes(this.currentUser.role)) {
                this.redirectToUnauthorized();
                return;
            }
        }

        // Do NOT auto-redirect authenticated users away from the login page.
        // This prevents "auto login" behavior when visiting index.html directly.
        // Users can choose to proceed via UI (e.g., a Continue button) instead.
        if (filename === 'index.html' && this.isAuthenticated()) {
            console.log('Authenticated session detected on index.html; staying on page (no auto-redirect).');
        }
    }

    // Redirect to login page
    redirectToLogin() {
        const currentPath = window.location.pathname;
        const isInPages = currentPath.includes('/pages/');
        const loginPath = isInPages ? '../index.html' : 'index.html';
        
        window.location.href = loginPath;
    }

    // Redirect to dashboard based on role
    redirectToDashboard() {
        if (this.isAdmin()) {
            window.location.href = 'pages/admin.html';
        } else {
            window.location.href = 'pages/tracking.html';
        }
    }

    // Redirect to unauthorized page or show message
    redirectToUnauthorized() {
        alert('You do not have permission to access this page.');
        this.redirectToDashboard();
    }

    // Update user profile
    async updateProfile(updateData) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            // Don't allow role changes through profile update
            delete updateData.role;
            delete updateData.status;
            delete updateData.id;

            // Update user in storage
            const updatedUser = this.storage.updateUser(this.currentUser.id, updateData);
            
            if (!updatedUser) {
                throw new Error('Failed to update profile');
            }

            // Update current session if email or username changed
            if (updateData.email) this.currentUser.email = updateData.email;
            if (updateData.username) this.currentUser.username = updateData.username;
            if (updateData.company) this.currentUser.company = updateData.company;

            this.storage.setCurrentUser(this.currentUser);

            return {
                success: true,
                message: 'Profile updated successfully'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Change password
    async changePassword(currentPassword, newPassword) {
        try {
            if (!this.isAuthenticated()) {
                throw new Error('Not authenticated');
            }

            // Get current user data
            const user = this.storage.getUserById(this.currentUser.id);
            
            if (!user || user.password !== currentPassword) {
                throw new Error('Current password is incorrect');
            }

            if (newPassword.length < 6) {
                throw new Error('New password must be at least 6 characters long');
            }

            // Update password
            this.storage.updateUser(this.currentUser.id, {
                password: newPassword // In production, hash this
            });

            return {
                success: true,
                message: 'Password changed successfully'
            };

        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Get user permissions
    getPermissions() {
        if (!this.isAuthenticated()) {
            return [];
        }

        const permissions = {
            admin: [
                'view_all_pos',
                'edit_all_pos',
                'delete_all_pos',
                'approve_pos',
                'reject_pos',
                'manage_users',
                'view_reports',
                'export_data'
            ],
            user: [
                'create_po',
                'view_own_pos',
                'edit_own_pos',
                'delete_own_pos'
            ]
        };

        return permissions[this.currentUser.role] || [];
    }

    // Check if user has specific permission
    hasPermission(permission) {
        return this.getPermissions().includes(permission);
    }
    
    // OneDrive Integration Methods
    async saveUserToOneDrive(userData) {
        try {
            console.log('💾 Saving user to OneDrive...', userData.username);
            
            const payload = {
                action: 'save_user',
                userData: {
                    id: userData.id || Date.now(),
                    username: userData.username,
                    email: userData.email,
                    role: userData.role || 'user',
                    company: userData.company || 'Apex Construction',
                    createdAt: userData.createdAt || new Date().toISOString(),
                    lastLogin: new Date().toISOString(),
                    status: userData.status || 'active'
                },
                timestamp: new Date().toISOString()
            };

            const response = await fetch(this.ONEDRIVE_USER_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            // Parse response body
            const responseData = await response.json();

            // Handle different Power Automate response types
            if (response.status === 200) {
                switch (responseData.status) {
                    case 'success':
                        console.log('✅ User saved to OneDrive successfully');
                        return { 
                            success: true, 
                            syncStatus: 'synced',
                            message: 'User successfully added to OneDrive'
                        };
                    
                    case 'exists':
                        console.warn('⚠️ User already exists in OneDrive');
                        return { 
                            success: true, 
                            syncStatus: 'exists',
                            message: 'User already exists in OneDrive'
                        };
                    
                    case 'fail':
                        console.error('❌ Power Automate reported failure');
                        return { 
                            success: false, 
                            syncStatus: 'failed',
                            error: 'Power Automate reported failure'
                        };
                    
                    default:
                        console.error('❌ Unknown response status:', responseData.status);
                        return { 
                            success: false, 
                            syncStatus: 'unknown',
                            error: `Unknown status: ${responseData.status}`
                        };
                }
            } else if (response.status === 500) {
                console.error('❌ Server error from Power Automate');
                return { 
                    success: false, 
                    syncStatus: 'error',
                    error: 'Server error from Power Automate'
                };
            } else {
                console.error('❌ Failed to save user to OneDrive:', response.status);
                return { 
                    success: false, 
                    syncStatus: 'failed',
                    error: `HTTP ${response.status}`
                };
            }
        } catch (error) {
            console.error('❌ OneDrive user save error:', error);
            return { success: false, error: error.message };
        }
    }

    async retrieveUsersFromOneDrive(filters = {}) {
        try {
            console.log('📥 Retrieving users from OneDrive...');
            
            const payload = {
                action: 'get_users',
                filters: {
                    role: filters.role || null,
                    status: filters.status || 'active'
                },
                timestamp: new Date().toISOString()
            };

            const response = await fetch(this.ONEDRIVE_RETRIEVE_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Users retrieved from OneDrive:', data.users?.length || 0);
                return { success: true, users: data.users || [] };
            } else {
                console.error('❌ Failed to retrieve users from OneDrive:', response.status);
                return { success: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            console.error('❌ OneDrive user retrieval error:', error);
            return { success: false, error: error.message };
        }
    }

    async syncUserLogin(userData) {
        // Save login timestamp to OneDrive
        try {
            const payload = {
                action: 'update_login',
                userData: {
                    id: userData.id || Date.now(),
                    username: userData.username,
                    email: userData.email,
                    role: userData.role || 'user',
                    company: userData.company || 'Apex Construction',
                    lastLogin: new Date().toISOString(),
                    status: userData.status || 'active'
                },
                timestamp: new Date().toISOString()
            };

            await fetch(this.ONEDRIVE_USER_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });
            
            console.log('✅ User login synced to OneDrive');
        } catch (error) {
            console.error('❌ Failed to sync login to OneDrive:', error);
        }
    }
}

// Initialize auth manager with better error handling
console.log('=== INITIALIZING AUTH MANAGER ===');

let auth; // Declare auth in the module scope

function initializeAuth() {
    console.log('Storage available:', !!window.storage);
    
    if (!window.storage) {
        console.log('Storage not available yet, waiting...');
        setTimeout(initializeAuth, 100);
        return;
    }
    
    try {
        console.log('Creating AuthManager...');
        auth = new AuthManager(); // Assign to the module-scoped variable
        console.log('Auth manager created:', !!auth);

        // Make auth available globally
        window.auth = auth;
        console.log('Auth assigned to window.auth:', !!window.auth);
        console.log('Demo accounts available:', Object.keys(auth.demoAccounts));
        console.log('Demo user credentials:', {
            username: auth.demoAccounts.user.username,
            email: auth.demoAccounts.user.email,
            password: auth.demoAccounts.user.password
        });
    } catch (error) {
        console.error('Failed to initialize auth manager:', error);
        setTimeout(initializeAuth, 500); // Retry after 500ms
    }
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeAuth);
} else {
    initializeAuth();
}

// Export for use in other modules
export { auth };

