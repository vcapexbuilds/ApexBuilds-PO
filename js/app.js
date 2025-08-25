/**
 * Apex Building - Enhanced PO System
 * Main Application File with Real Microsoft 365 Integration
 * Version: 2.2.0
 * Date: August 2024
 */

// Global application configuration
window.POSystemConfig = {
    version: '2.2.0',
    environment: 'development', // development, staging, production
    features: {
        realM365Integration: true,
        adminPortal: true,
        enhancedApprovals: true,
        constructionOptimized: true
    }
};

// Central Component Registry
window.ComponentRegistry = {
    components: {},
    initCallbacks: [],
    isReady: false,
    
    register(name, component) {
        console.log(`Registering component: ${name}`);
        this.components[name] = component;
        window[name] = component; // Also make it globally available
        this.checkReadiness();
    },
    
    onReady(callback) {
        if (this.isReady) {
            callback();
        } else {
            this.initCallbacks.push(callback);
        }
    },
    
    checkReadiness() {
        const required = ['storage', 'poManager', 'formSchema', 'modal'];
        const available = required.filter(name => this.components[name]);
        
        console.log(`Components ready: ${available.length}/${required.length}`, available);
        
        if (available.length === required.length && !this.isReady) {
            this.isReady = true;
            console.log('All components ready! Executing callbacks...');
            this.initCallbacks.forEach(callback => {
                try {
                    callback();
                } catch (error) {
                    console.error('Error in init callback:', error);
                }
            });
            this.initCallbacks = [];
        }
    }
};

class POSystemApp {
    constructor() {
        this.version = '2.2.0';
        this.currentUser = null;
        this.userPOManager = null;
        this.m365Integration = null;
        this.isAuthenticated = false;
        this.authInProgress = false;
        
        console.log('Apex PO System v' + this.version + ' starting...');
        this.initialize();
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            console.log('Initializing application components...');
            
            // Initialize configuration first
            await this.initializeConfiguration();
            
            // Check for OAuth callback
            await this.handleOAuthCallback();
            
            // Initialize core components
            await this.initializeComponents();
            
            // Setup authentication
            await this.setupAuthentication();
            
            // Initialize UI
            this.initializeUI();
            
            console.log('Application initialized successfully');
            this.displaySystemStatus();
        } catch (error) {
            console.error('Error initializing application:', error);
            this.displayError('Failed to initialize application: ' + error.message);
        }
    }

    /**
     * Initialize Power Automate configuration
     */
    async initializeConfiguration() {
        try {
            // Wait for config to load
            if (typeof PowerAutomateConfig !== 'undefined') {
                // Configuration should already be loaded globally
                if (!window.powerAutomateConfig) {
                    console.log('Creating new Power Automate configuration instance');
                    window.powerAutomateConfig = new PowerAutomateConfig();
                }
                console.log('Power Automate configuration loaded successfully');
                console.log('Environment info:', window.powerAutomateConfig.getEnvironmentInfo());
            } else {
                console.warn('Power Automate configuration class not available');
            }
        } catch (error) {
            console.error('Error initializing configuration:', error);
            // Continue initialization even if config fails
        }
    }

    /**
     * Handle OAuth callback if present
     */
    async handleOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const authCode = urlParams.get('code');
        
        if (authCode) {
            console.log('Processing OAuth callback...');
            this.authInProgress = true;
            
            try {
                if (this.m365Integration) {
                    await this.m365Integration.handleOAuthCallback();
                    console.log('OAuth callback processed successfully');
                    this.isAuthenticated = true;
                }
            } catch (error) {
                console.error('Error processing OAuth callback:', error);
                this.displayError('Authentication failed: ' + error.message);
            } finally {
                this.authInProgress = false;
            }
        }
    }

    /**
     * Initialize core application components
     */
    async initializeComponents() {
        // Initialize User PO Manager
        if (typeof UserPOManager !== 'undefined') {
            this.userPOManager = new UserPOManager();
            console.log('User PO Manager initialized');
        }
        
        // Initialize Microsoft Graph API
        if (typeof MicrosoftGraphAPI !== 'undefined') {
            this.msGraphAPI = new MicrosoftGraphAPI();
            await this.msGraphAPI.initializeAPI();
            console.log('Microsoft Graph API initialized');
        }
        
        // Initialize Real Microsoft 365 Integration
        if (typeof RealM365Integration !== 'undefined' && POSystemConfig.features.realM365Integration) {
            this.m365Integration = new RealM365Integration();
            const initResult = await this.m365Integration.initialize();
            
            if (initResult) {
                console.log('Real Microsoft 365 Integration initialized');
                
                // Check authentication status
                const authStatus = await this.m365Integration.checkAuthenticationStatus();
                this.isAuthenticated = authStatus.authenticated;
                
                if (this.isAuthenticated) {
                    console.log(`Authenticated as: ${authStatus.user}`);
                    this.currentUser = {
                        name: authStatus.user,
                        email: authStatus.email,
                        level: 5 // Default user level, should be determined by business logic
                    };
                }
            } else {
                console.warn('Failed to initialize Microsoft 365 Integration');
            }
        }
        
        // Connect User PO Manager with M365 Integration
        if (this.userPOManager && this.m365Integration) {
            this.userPOManager.setM365Integration(this.m365Integration);
            console.log('Connected User PO Manager with Microsoft 365 Integration');
        }
    }

    /**
     * Setup authentication system
     */
    async setupAuthentication() {
        // Check for existing authentication
        if (!this.isAuthenticated && !this.authInProgress) {
            console.log('No active authentication found');
            
            // Check localStorage for user data
            const storedUser = localStorage.getItem('current_user');
            if (storedUser) {
                try {
                    this.currentUser = JSON.parse(storedUser);
                    console.log('Restored user from localStorage:', this.currentUser.name);
                } catch (error) {
                    console.warn('Invalid stored user data, clearing...');
                    localStorage.removeItem('current_user');
                }
            }
        }
        
        // Setup authentication UI
        this.setupAuthenticationUI();
    }

    /**
     * Setup authentication UI elements
     */
    setupAuthenticationUI() {
        const loginButton = document.getElementById('login-button');
        const logoutButton = document.getElementById('logout-button');
        const userInfo = document.getElementById('user-info');
        
        if (loginButton) {
            loginButton.onclick = () => this.initiateLogin();
        }
        
        if (logoutButton) {
            logoutButton.onclick = () => this.logout();
        }
        
        // Update UI based on authentication status
        this.updateAuthenticationUI();
    }

    /**
     * Update authentication UI based on current status
     */
    updateAuthenticationUI() {
        const loginButton = document.getElementById('login-button');
        const logoutButton = document.getElementById('logout-button');
        const userInfo = document.getElementById('user-info');
        const authStatus = document.getElementById('auth-status');
        
        if (this.isAuthenticated && this.currentUser) {
            // Show authenticated state
            if (loginButton) loginButton.style.display = 'none';
            if (logoutButton) logoutButton.style.display = 'inline-block';
            if (userInfo) {
                userInfo.textContent = `${this.currentUser.name} (${this.currentUser.email || 'No email'})`;
                userInfo.style.display = 'block';
            }
            if (authStatus) {
                authStatus.textContent = '✅ Authenticated with Microsoft 365';
                authStatus.className = 'auth-status authenticated';
            }
        } else {
            // Show unauthenticated state
            if (loginButton) loginButton.style.display = 'inline-block';
            if (logoutButton) logoutButton.style.display = 'none';
            if (userInfo) userInfo.style.display = 'none';
            if (authStatus) {
                authStatus.textContent = '⚠️ Not authenticated - Click login to connect to Microsoft 365';
                authStatus.className = 'auth-status not-authenticated';
            }
        }
    }

    /**
     * Initiate login process
     */
    async initiateLogin() {
        if (this.authInProgress) {
            console.log('Authentication already in progress');
            return;
        }
        
        try {
            console.log('Initiating Microsoft 365 login...');
            this.authInProgress = true;
            
            if (this.m365Integration && this.m365Integration.graphAPI) {
                await this.m365Integration.graphAPI.redirectToAzureAD();
            } else {
                throw new Error('Microsoft 365 integration not available');
            }
        } catch (error) {
            console.error('Error initiating login:', error);
            this.displayError('Failed to start login process: ' + error.message);
            this.authInProgress = false;
        }
    }

    /**
     * Logout user
     */
    logout() {
        console.log('Logging out user...');
        
        // Clear authentication data
        this.isAuthenticated = false;
        this.currentUser = null;
        
        // Clear stored data
        localStorage.removeItem('current_user');
        localStorage.removeItem('ms_graph_token');
        
        // Update UI
        this.updateAuthenticationUI();
        
        // Reload page to clear any cached data
        setTimeout(() => {
            window.location.reload();
        }, 1000);
        
        console.log('User logged out');
    }

    /**
     * Initialize UI components
     */
    initializeUI() {
        // Setup form handlers
        this.setupFormHandlers();
        
        // Setup admin portal if available
        this.setupAdminPortal();
        
        // Setup tracking page if available
        this.setupTrackingPage();
        
        // Setup integration testing
        this.setupIntegrationTesting();
        
        console.log('UI components initialized');
    }

    /**
     * Setup form handlers
     */
    setupFormHandlers() {
        // Main PO form
        const poForm = document.getElementById('po-form');
        if (poForm) {
            poForm.onsubmit = (e) => this.handlePOSubmission(e);
        }
        
        // Document upload
        const fileInput = document.getElementById('file-upload');
        if (fileInput) {
            fileInput.onchange = (e) => this.handleFileUpload(e);
        }
        
        // Test integration button
        const testButton = document.getElementById('test-integration');
        if (testButton) {
            testButton.onclick = () => this.testIntegration();
        }
    }

    /**
     * Setup admin portal functionality
     */
    setupAdminPortal() {
        if (!POSystemConfig.features.adminPortal) return;
        
        const adminButton = document.getElementById('admin-portal-button');
        if (adminButton) {
            adminButton.onclick = () => this.openAdminPortal();
        }
        
        // Only show admin functions to appropriate users
        if (this.currentUser && this.currentUser.level <= 2) {
            if (adminButton) adminButton.style.display = 'inline-block';
        }
    }

    /**
     * Setup tracking page functionality
     */
    setupTrackingPage() {
        const trackingForm = document.getElementById('tracking-form');
        if (trackingForm) {
            trackingForm.onsubmit = (e) => this.handleTrackingSearch(e);
        }
        
        // Auto-load user's POs if authenticated
        if (this.isAuthenticated && window.location.pathname.includes('tracking')) {
            this.loadUserPOs();
        }
    }

    /**
     * Setup integration testing functionality
     */
    setupIntegrationTesting() {
        const testAllButton = document.getElementById('test-all-integrations');
        if (testAllButton) {
            testAllButton.onclick = () => this.testAllIntegrations();
        }
        
        const webhookTestButton = document.getElementById('test-webhooks');
        if (webhookTestButton) {
            webhookTestButton.onclick = () => this.testWebhooks();
        }
    }

    /**
     * Handle PO form submission
     */
    async handlePOSubmission(event) {
        event.preventDefault();
        
        if (!this.isAuthenticated) {
            this.displayError('Please authenticate with Microsoft 365 first');
            return;
        }
        
        if (!this.userPOManager) {
            this.displayError('PO Manager not initialized');
            return;
        }
        
        try {
            console.log('Processing PO submission...');
            
            // Collect form data
            const formData = new FormData(event.target);
            const poData = this.collectPOFormData(formData);
            
            // Add user information
            poData.createdBy = this.currentUser.name;
            poData.createdAt = new Date().toISOString();
            poData.approvalLevel = this.currentUser.level;
            
            // Save PO using enhanced system
            const result = await this.userPOManager.saveUserPOs([poData]);
            
            if (result.success) {
                this.displaySuccess(`PO ${poData.poNumber} created successfully!`);
                event.target.reset(); // Clear form
                
                // Redirect to tracking page
                setTimeout(() => {
                    window.location.href = 'pages/tracking.html';
                }, 2000);
            } else {
                throw new Error(result.message || 'Failed to save PO');
            }
        } catch (error) {
            console.error('Error submitting PO:', error);
            this.displayError('Failed to submit PO: ' + error.message);
        }
    }

    /**
     * Collect PO form data
     */
    collectPOFormData(formData) {
        const poNumber = this.generatePONumber();
        
        return {
            poNumber: poNumber,
            vendor: formData.get('vendor'),
            description: formData.get('description'),
            totalAmount: parseFloat(formData.get('amount')) || 0,
            projectCode: formData.get('project-code'),
            requestedBy: formData.get('requested-by') || this.currentUser.name,
            department: formData.get('department'),
            urgency: formData.get('urgency') || 'normal',
            deliveryDate: formData.get('delivery-date'),
            notes: formData.get('notes'),
            status: 'PENDING',
            contractor: formData.get('contractor') || 'General Contractor'
        };
    }

    /**
     * Generate PO number
     */
    generatePONumber() {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const random = String(Math.floor(Math.random() * 9999)).padStart(4, '0');
        
        return `${year}${month}-${random}`;
    }

    /**
     * Handle file upload
     */
    async handleFileUpload(event) {
        if (!this.isAuthenticated) {
            this.displayError('Please authenticate with Microsoft 365 first');
            return;
        }
        
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        const poNumber = document.getElementById('po-number-for-upload')?.value;
        if (!poNumber) {
            this.displayError('Please specify PO number for document upload');
            return;
        }
        
        try {
            for (const file of files) {
                console.log(`Uploading file: ${file.name}`);
                
                const result = await this.m365Integration.uploadDocumentToPO(
                    poNumber, 
                    file,
                    'Documents', // Default to Documents folder
                    { contractor: 'General Contractor' }
                );
                
                if (result.success) {
                    this.displaySuccess(`File ${file.name} uploaded successfully!`);
                } else {
                    throw new Error(`Failed to upload ${file.name}`);
                }
            }
        } catch (error) {
            console.error('Error uploading files:', error);
            this.displayError('Failed to upload files: ' + error.message);
        }
    }

    /**
     * Test Microsoft 365 integration
     */
    async testIntegration() {
        if (!this.m365Integration) {
            this.displayError('Microsoft 365 integration not available');
            return;
        }
        
        try {
            console.log('Testing Microsoft 365 integration...');
            this.displayInfo('Testing integration... Please wait.');
            
            const results = await this.m365Integration.testIntegration();
            
            console.log('Integration test results:', results);
            
            // Display results
            const successCount = Object.values(results)
                .filter(r => r && r.success !== false && r.authenticated !== false).length;
            const totalTests = Object.keys(results).length;
            
            if (successCount === totalTests) {
                this.displaySuccess(`Integration test passed! All ${totalTests} components working correctly.`);
            } else {
                this.displayWarning(`Integration test partial: ${successCount}/${totalTests} components working. Check console for details.`);
            }
        } catch (error) {
            console.error('Integration test failed:', error);
            this.displayError('Integration test failed: ' + error.message);
        }
    }

    /**
     * Test all integrations
     */
    async testAllIntegrations() {
        console.log('Testing all integrations...');
        this.displayInfo('Running comprehensive integration tests...');
        
        const results = {
            m365Integration: null,
            webhooks: null,
            dataStructures: null,
            folderCreation: null
        };
        
        try {
            // Test M365 Integration
            if (this.m365Integration) {
                results.m365Integration = await this.m365Integration.testIntegration();
            }
            
            // Test webhook system
            if (this.m365Integration?.powerAutomate) {
                results.webhooks = await this.m365Integration.powerAutomate.testAllWebhooks();
            }
            
            // Test data structures
            if (this.userPOManager) {
                results.dataStructures = await this.userPOManager.testDataStructures();
            }
            
            console.log('All integration test results:', results);
            this.displaySuccess('All integration tests completed. Check console for detailed results.');
        } catch (error) {
            console.error('Comprehensive integration test failed:', error);
            this.displayError('Integration tests failed: ' + error.message);
        }
    }

    /**
     * Test webhooks specifically
     */
    async testWebhooks() {
        if (!this.m365Integration?.powerAutomate) {
            this.displayError('Power Automate webhooks not available');
            return;
        }
        
        try {
            console.log('Testing webhooks...');
            this.displayInfo('Testing webhook connectivity...');
            
            const results = await this.m365Integration.powerAutomate.testAllWebhooks();
            
            const successCount = Object.values(results).filter(r => r.success).length;
            const totalWebhooks = Object.keys(results).length;
            
            if (successCount === totalWebhooks) {
                this.displaySuccess(`All ${totalWebhooks} webhooks tested successfully!`);
            } else {
                this.displayWarning(`Webhook test results: ${successCount}/${totalWebhooks} successful. Check console for details.`);
            }
            
            console.log('Webhook test results:', results);
        } catch (error) {
            console.error('Webhook test failed:', error);
            this.displayError('Webhook test failed: ' + error.message);
        }
    }

    /**
     * Display system status
     */
    displaySystemStatus() {
        const statusElement = document.getElementById('system-status');
        if (!statusElement) return;
        
        const status = {
            version: this.version,
            authenticated: this.isAuthenticated,
            user: this.currentUser?.name || 'Not logged in',
            m365Integration: !!this.m365Integration,
            userPOManager: !!this.userPOManager,
            realIntegration: POSystemConfig.features.realM365Integration
        };
        
        statusElement.innerHTML = `
            <h3>System Status</h3>
            <div class="status-grid">
                <div>Version: <strong>${status.version}</strong></div>
                <div>Authentication: <strong>${status.authenticated ? '✅ Active' : '❌ Required'}</strong></div>
                <div>User: <strong>${status.user}</strong></div>
                <div>M365 Integration: <strong>${status.m365Integration ? '✅ Active' : '❌ Unavailable'}</strong></div>
                <div>Real Integration: <strong>${status.realIntegration ? '✅ Enabled' : '⚠️ Disabled'}</strong></div>
            </div>
        `;
    }

    /**
     * Display success message
     */
    displaySuccess(message) {
        this.displayMessage(message, 'success');
    }

    /**
     * Display error message
     */
    displayError(message) {
        this.displayMessage(message, 'error');
        console.error(message);
    }

    /**
     * Display warning message
     */
    displayWarning(message) {
        this.displayMessage(message, 'warning');
        console.warn(message);
    }

    /**
     * Display info message
     */
    displayInfo(message) {
        this.displayMessage(message, 'info');
    }

    /**
     * Display message in UI
     */
    displayMessage(message, type = 'info') {
        let messageContainer = document.getElementById('message-container');
        
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.id = 'message-container';
            messageContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 400px;
            `;
            document.body.appendChild(messageContainer);
        }
        
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.style.cssText = `
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            color: white;
            font-weight: bold;
            cursor: pointer;
            background-color: ${this.getMessageColor(type)};
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        `;
        messageElement.textContent = message;
        
        // Auto-remove after 5 seconds
        const removeMessage = () => {
            if (messageElement.parentNode) {
                messageElement.parentNode.removeChild(messageElement);
            }
        };
        
        messageElement.onclick = removeMessage;
        setTimeout(removeMessage, 5000);
        
        messageContainer.appendChild(messageElement);
    }

    /**
     * Get color for message type
     */
    getMessageColor(type) {
        const colors = {
            success: '#4CAF50',
            error: '#f44336',
            warning: '#ff9800',
            info: '#2196F3'
        };
        return colors[type] || colors.info;
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.poSystemApp = new POSystemApp();
});

console.log('Apex PO System App v2.2.0 loaded with Real Microsoft 365 Integration');
