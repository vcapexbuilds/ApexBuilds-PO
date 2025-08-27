// Tracking Dashboard - Using global variables since dependencies are loaded as regular scripts

class TrackingDashboard {
    constructor() {
        console.log('=== TrackingDashboard constructor called ===');
        
        // Initialize arrays with proper safety checks
        this.allPOs = [];
        this.filteredPOs = [];
        
        // Verify initialization
        console.log('Constructor - this.allPOs:', this.allPOs, 'Type:', typeof this.allPOs, 'Is array:', Array.isArray(this.allPOs));
        
        // Ensure DOM is ready before binding events
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.log('DOM ready, starting initialization...');
                this.initialize();
            });
        } else {
            console.log('DOM already ready, starting initialization...');
            this.initialize();
        }
    }
    
    initialize() {
        console.log('Initializing tracking dashboard...');
        this.initializeAuth();
        this.bindEvents();
        
        // Initialize PO Data Manager for Power Automate integration
        if (window.PODataManager) {
            console.log('🔗 TrackingDashboard: Initializing PO Data Manager for Power Automate integration...');
            this.poDataManager = new window.PODataManager();
            
            // Make the PODataManager instance globally accessible
            window.poDataManager = this.poDataManager;
            console.log('🌍 Made PODataManager globally accessible as window.poDataManager');
            
            // Override the PO Data Manager's display method to use our existing rendering
            this.poDataManager.displayPOs = (pos) => {
                console.log('📊 TrackingDashboard: Received POs from Power Automate:', pos);
                console.log('📊 Type of pos:', typeof pos, 'Is array:', Array.isArray(pos));
                
                // Safety check: ensure pos is always an array
                if (!Array.isArray(pos)) {
                    console.warn('⚠️ Power Automate returned non-array data, converting to empty array');
                    this.allPOs = [];
                } else {
                    this.allPOs = pos;
                }
                
                this.filterPOs();
                this.updateStats(this.filteredPOs);
            };
            
            // Override the error display to use our existing error handling
            this.poDataManager.showErrorState = (errorMessage) => {
                console.error('❌ TrackingDashboard: Power Automate error:', errorMessage);
                alert('Failed to load purchase orders: ' + errorMessage);
                this.allPOs = [];
                this.filteredPOs = [];
                this.renderPOs();
            };
        } else {
            console.warn('⚠️ TrackingDashboard: PODataManager not available, falling back to test data');
            this.loadPOs();
        }
    }

    initializeAuth() {
        console.log('=== TRACKING AUTH INITIALIZATION ===');
        
        // Give auth system time to fully initialize
        setTimeout(() => {
            console.log('🔍 Checking all auth data sources...');
            console.log('localStorage currentUser:', !!localStorage.getItem('currentUser'));
            console.log('localStorage apex_po_currentUser:', !!localStorage.getItem('apex_po_currentUser'));
            console.log('localStorage isAuthenticated:', localStorage.getItem('isAuthenticated'));
            console.log('sessionStorage currentUser:', !!sessionStorage.getItem('currentUser'));
            console.log('window.auth exists:', !!window.auth);
            if (window.auth) {
                console.log('window.auth.currentUser:', !!window.auth.currentUser);
                console.log('window.auth.isAuthenticated():', window.auth.isAuthenticated());
            }
            
            // Track page refresh/visit activity regardless of auth source
            const isPageRefresh = performance.navigation && performance.navigation.type === performance.navigation.TYPE_RELOAD;
            const activityAction = isPageRefresh ? 'tracking_page_refresh' : 'tracking_page_visit';
            console.log(`📊 Page ${isPageRefresh ? 'refresh' : 'visit'} detected`);
            
            // FIRST: Check if we have current user data (Microsoft OAuth or local auth)
            const storedUser = localStorage.getItem('currentUser');
            if (storedUser) {
                try {
                    const user = JSON.parse(storedUser);
                    console.log('Found current user:', user);
                    
                    // Check if this is a valid OAuth session
                    if (user.isOAuth && user.expiresAt) {
                        const isExpired = new Date() > new Date(user.expiresAt);
                        console.log('OAuth session expired?', isExpired);
                        if (isExpired) {
                            console.log('OAuth session expired, clearing data');
                            localStorage.removeItem('currentUser');
                            localStorage.removeItem('apex_po_currentUser');
                            localStorage.removeItem('isAuthenticated');
                            sessionStorage.removeItem('currentUser');
                            if (window.auth) {
                                window.auth.currentUser = null;
                            }
                            this.fallbackUserSetup();
                            return;
                        }
                    }
                    
                    let firstName = '';
                    if (user.firstName && user.firstName !== 'User') {
                        firstName = user.firstName;
                    } else if (user.givenName && user.givenName !== 'User') {
                        firstName = user.givenName;
                    } else if (user.displayName && user.displayName !== 'Microsoft User') {
                        firstName = user.displayName.split(' ')[0];
                    } else if (user.name && user.name !== 'Microsoft User') {
                        firstName = user.name.split(' ')[0];
                    } else if (user.username && user.username !== 'Microsoft User' && !user.username.includes('@')) {
                        firstName = user.username.split(' ')[0];
                    } else if (user.userPrincipalName) {
                        // Extract name from email if available
                        const emailPart = user.userPrincipalName.split('@')[0];
                        firstName = emailPart.replace(/[^a-zA-Z]/g, '');
                    } else if (user.email) {
                        // Extract name from email as last resort
                        const emailPart = user.email.split('@')[0];
                        firstName = emailPart.replace(/[^a-zA-Z]/g, '');
                    }
                    
                    // Fallback if no proper name found
                    if (!firstName || firstName === 'User' || firstName === 'Microsoft' || firstName.length < 2) {
                        firstName = 'User';
                    }
                    
                    if (firstName) {
                        const capitalizedName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                        console.log('Using current user name:', capitalizedName);
                        document.getElementById('welcomeUser').textContent = `Welcome, ${capitalizedName}`;
                        
                        // Ensure auth system has the user data
                        if (window.auth && !window.auth.currentUser) {
                            console.log('Setting user data in auth system');
                            window.auth.currentUser = user;
                        }
                        
                        // Track user activity - send to Power Automate
                        this.trackUserPageVisit(user, activityAction);
                        
                        return;
                    }
                } catch (error) {
                    console.error('Error parsing current user:', error);
                }
            }
            
            // SECOND: Check legacy Microsoft user storage
            const storedMSUser = localStorage.getItem('microsoftUser');
            if (storedMSUser) {
                try {
                    const msUser = JSON.parse(storedMSUser);
                    console.log('Found Microsoft OAuth user:', msUser);
                    
                    let firstName = this.extractFirstName(msUser);
                    if (firstName && firstName !== 'User') {
                        console.log('Using Microsoft OAuth name:', firstName);
                        document.getElementById('welcomeUser').textContent = `Welcome, ${firstName}`;
                        
                        // Track user activity for Microsoft OAuth user
                        this.trackUserPageVisit(msUser, activityAction);
                        
                        return;
                    }
                } catch (error) {
                    console.error('Error parsing Microsoft user:', error);
                }
            }
            
            // THIRD: Check local auth system (demo accounts)
            if (window.auth && window.auth.isAuthenticated()) {
                const currentUser = window.auth.getCurrentUser();
                console.log('Current user from auth system:', currentUser);
                
                if (currentUser) {
                    let firstName = this.extractFirstName(currentUser);
                    console.log('First name from auth system:', firstName);
                    
                    if (firstName && firstName !== 'User') {
                        document.getElementById('welcomeUser').textContent = `Welcome, ${firstName}`;
                        
                        // Store for consistency
                        const userData = {
                            username: currentUser.username || currentUser.name || firstName,
                            email: currentUser.email || '',
                            firstName: firstName,
                            source: 'auth-system'
                        };
                        localStorage.setItem('currentUser', JSON.stringify(userData));
                        
                        // Track user activity for demo account
                        this.trackUserPageVisit(userData, activityAction);
                        
                        return;
                    }
                }
            }
            
            // THIRD: Fallback to stored user or default
            this.fallbackUserSetup();
        }, 100); // Small delay to let auth finish initializing
    }
    
    fallbackUserSetup() {
        console.log('Using fallback user setup...');
        
        // Try multiple storage keys for Microsoft user data
        const possibleKeys = ['microsoftUser', 'currentUser', 'authUser', 'user'];
        
        for (const key of possibleKeys) {
            try {
                const storedData = localStorage.getItem(key);
                if (storedData) {
                    const user = JSON.parse(storedData);
                    console.log(`Found stored data in ${key}:`, user);
                    
                    let firstName = this.extractFirstName(user);
                    console.log('Extracted first name:', firstName);
                    
                    if (firstName && firstName !== 'User') {
                        document.getElementById('welcomeUser').textContent = `Welcome, ${firstName}`;
                        return; // Success, exit the function
                    }
                }
            } catch (error) {
                console.warn(`Error parsing ${key}:`, error);
            }
        }
        
        // If nothing found, show default
        console.log('No user data found, using default');
        document.getElementById('welcomeUser').textContent = 'Welcome, User';
    }
    
    extractFirstName(user) {
        console.log('Extracting first name from user:', user);
        let firstName = '';
        
        if (user.firstName) {
            firstName = user.firstName;
        } else if (user.givenName) {
            firstName = user.givenName;
        } else if (user.name) {
            // Extract first name from full name like "Virgilio Cabrillos Jr."
            firstName = user.name.split(' ')[0];
        } else if (user.displayName) {
            firstName = user.displayName.split(' ')[0];
        } else if (user.username && user.username !== 'Test User') {
            // Just use the username as fallback
            firstName = user.username;
        } else if (user.email) {
            firstName = user.email.split('@')[0].split('.')[0];
        } else {
            firstName = 'User';
        }
        
        console.log('Raw first name:', firstName);
        
        // Capitalize first letter
        const capitalized = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
        console.log('Capitalized first name:', capitalized);
        
        return capitalized;
    }

    /**
     * Track user activity and send to Power Automate
     */
    async trackUserPageVisit(user, action) {
        try {
            console.log('📊 Preparing user activity data for Power Automate...');
            
            // Prepare user activity data according to the requested schema
            const activityData = {
                action: action,
                timestamp: new Date().toISOString(),
                user: {
                    username: user.username || user.name || 'Unknown',
                    email: user.email || 'unknown@email.com',
                    role: user.role || 'user',
                    microsoftId: user.id || user.microsoftId || user.homeAccountId || null,
                    source: user.provider || user.source || 'microsoft-oauth'
                }
            };
            
            console.log('📤 Sending user activity to Power Automate:', activityData);
            
            // Send to Power Automate if API is available
            if (window.powerAutomateAPI) {
                await window.powerAutomateAPI.trackUserActivity(activityData);
            } else {
                console.warn('⚠️ PowerAutomateAPI not available, skipping activity tracking');
            }
        } catch (error) {
            console.error('❌ Error tracking user activity:', error);
            // Don't break the app if tracking fails
        }
    }

    bindEvents() {
        console.log('=== BINDING EVENTS ===');
        console.log('Document ready state:', document.readyState);
        console.log('DOM fully loaded:', document.readyState === 'complete');
        
        // Wait a bit to ensure all DOM elements are fully rendered
        setTimeout(() => {
            console.log('🔍 Checking DOM elements...');

            // Filter and action buttons - wrap in try-catch for safety
            try {
                // Check if each element exists before binding
                const elements = [
                    'projectFilter', 'statusFilter', 'dateFrom', 'dateTo', 
                    'applyFilters', 'clearFilters', 'refreshList', 'exportList'
                ];
                
                elements.forEach(id => {
                    const element = document.getElementById(id);
                    if (element) {
                        console.log(`✅ Found ${id}, binding event`);
                        
                        // Add visual feedback for button clicks
                        if (['refreshList', 'exportList', 'applyFilters', 'clearFilters'].includes(id)) {
                            element.addEventListener('click', (e) => {
                                console.log(`🖱️ Button ${id} clicked, adding visual feedback`);
                                e.target.disabled = true;
                                e.target.style.opacity = '0.6';
                                setTimeout(() => {
                                    e.target.disabled = false;
                                    e.target.style.opacity = '1';
                                }, 2000);
                            });
                        }
                        
                        switch(id) {
                            case 'projectFilter':
                            case 'statusFilter':
                            case 'dateFrom':
                            case 'dateTo':
                                element.addEventListener('input', () => this.filterPOs());
                                if (id === 'statusFilter') element.addEventListener('change', () => this.filterPOs());
                                break;
                            case 'applyFilters':
                                element.addEventListener('click', () => this.filterPOs());
                                break;
                            case 'clearFilters':
                                element.addEventListener('click', () => this.clearFilters());
                                break;
                            case 'refreshList':
                                console.log('🔧 TrackingDashboard: Setting up refresh button event listener');
                                element.addEventListener('click', () => {
                                    console.log('🔄 TrackingDashboard: Refresh button clicked');
                                    console.log('🔍 PO Data Manager exists:', !!this.poDataManager);
                                    
                                    // Show user feedback
                                    const originalText = element.textContent;
                                    element.textContent = '🔄 Refreshing...';
                                    element.disabled = true;
                                    
                                    // Reset button after 5 seconds regardless
                                    const resetButton = () => {
                                        element.textContent = originalText;
                                        element.disabled = false;
                                    };
                                    setTimeout(resetButton, 5000);
                                    
                                    console.log('🔍 PO Data Manager methods:', this.poDataManager ? Object.getOwnPropertyNames(Object.getPrototypeOf(this.poDataManager)) : 'N/A');
                                    
                                    // Try to initialize PO Data Manager if it doesn't exist
                                    if (!this.poDataManager && window.PODataManager) {
                                        console.log('🔧 Initializing PO Data Manager for refresh...');
                                        try {
                                            this.poDataManager = new window.PODataManager();
                                            window.poDataManager = this.poDataManager;
                                            
                                            // Override display methods
                                            this.poDataManager.displayPOs = (pos) => {
                                                console.log('📊 TrackingDashboard: Received POs from Power Automate (refresh):', pos);
                                                console.log('📊 Type of pos:', typeof pos, 'Is array:', Array.isArray(pos));
                                                
                                                if (!Array.isArray(pos)) {
                                                    console.warn('⚠️ Power Automate returned non-array data, converting to empty array');
                                                    this.allPOs = [];
                                                } else {
                                                    this.allPOs = pos;
                                                }
                                                
                                                this.filterPOs();
                                                this.updateStats(this.filteredPOs);
                                                resetButton(); // Reset button when done
                                            };
                                        } catch (error) {
                                            console.error('❌ Failed to initialize PO Data Manager:', error);
                                            resetButton();
                                        }
                                    }
                                    
                                    if (this.poDataManager && typeof this.poDataManager.fetchAndDisplayPOs === 'function') {
                                        console.log('✅ Using PO Data Manager for refresh');
                                        try {
                                            // Clear cache first to ensure fresh data
                                            if (typeof this.poDataManager.clearCache === 'function') {
                                                console.log('🗑️ Clearing cache before refresh...');
                                                this.poDataManager.clearCache();
                                            }
                                            
                                            this.poDataManager.fetchAndDisplayPOs(true); // Force refresh from Power Automate
                                            console.log('📡 Force refresh request sent to Power Automate');
                                        } catch (error) {
                                            console.error('❌ Error during PO Data Manager refresh:', error);
                                            // Fallback to manual reload
                                            this.loadPOs();
                                            resetButton();
                                        }
                                    } else {
                                        console.log('⚠️ PO Data Manager not available, falling back to loadPOs for refresh');
                                        console.log('💡 Note: This will only refresh test data, not Power Automate data');
                                        this.loadPOs();
                                        resetButton();
                                    }
                                });
                                break;
                            case 'exportList':
                                element.addEventListener('click', () => this.exportPOs());
                                break;
                        }
                    } else {
                        console.log(`⚠️ Element ${id} not found, skipping...`);
                    }
                });
                
                console.log('🎉 All event binding completed successfully');
            } catch (error) {
                console.error('❌ Error binding events:', error);
            }
        }, 100); // Small delay to ensure DOM is fully rendered
    }

    async loadPOs() {
        console.log('=== LOADING POs (SIMPLIFIED) ===');
        
        try {
            // Directly load test data - bypass PO Manager complexity
            console.log('Loading test data directly...');
            const response = await fetch('../asset/data/test-data.json');
            
            if (!response.ok) {
                throw new Error(`Failed to load test data: ${response.status} ${response.statusText}`);
            }
            
            const testData = await response.json();
            console.log(`✅ Loaded ${testData.length} test purchase orders`);
            console.log('Raw test data:', testData);
            
            this.allPOs = this.convertTestDataToPOs(testData);
            console.log('✅ Converted to PO objects:', this.allPOs);
            
            this.filterPOs();
            this.updateStats(this.filteredPOs);
            
        } catch (error) {
            console.error('❌ Error loading POs:', error);
            alert('Failed to load purchase orders: ' + error.message);
            this.allPOs = [];
            this.filteredPOs = [];
            this.renderPOs();
        }
    }

    renderPOs() {
        console.log('=== RENDER POs ===');
        console.log('Rendering POs:', this.filteredPOs);
        
        // Find the main container - look for po-list first, then fallback
        let container = document.querySelector('.po-list');
        if (!container) {
            container = document.querySelector('#po-list, .purchase-orders-list, .main-content');
        }
        
        if (!container) {
            console.error('❌ Could not find PO container element');
            return;
        }

        // Hide loading and empty states
        const loadingSpinner = document.getElementById('loadingSpinner');
        const emptyState = document.getElementById('emptyState');
        const poTable = document.getElementById('poTable');
        
        if (loadingSpinner) loadingSpinner.style.display = 'none';
        if (emptyState) emptyState.style.display = 'none';
        if (poTable) poTable.style.display = 'none';

        // Create or find the cards container
        let cardsContainer = container.querySelector('.po-cards-container');
        if (!cardsContainer) {
            cardsContainer = document.createElement('div');
            cardsContainer.className = 'po-cards-container';
            
            // Find the right place to insert - after the header if it exists
            const header = container.querySelector('.list-header');
            if (header) {
                header.after(cardsContainer);
            } else {
                container.appendChild(cardsContainer);
            }
        }

        // Safety check: ensure this.filteredPOs is an array
        if (!Array.isArray(this.filteredPOs)) {
            console.warn('⚠️ this.filteredPOs is not an array in renderPOs, resetting to empty array');
            this.filteredPOs = [];
        }

        if (this.filteredPOs.length === 0) {
            cardsContainer.innerHTML = '<div class="no-pos">No purchase orders found.</div>';
            return;
        }

        cardsContainer.innerHTML = this.filteredPOs.map(po => `
            <div class="po-item">
                <div class="po-header">
                    <h3>${po.id} - ${po.project}</h3>
                    <span class="status status-${po.status.toLowerCase()}">${po.status}</span>
                </div>
                <div class="po-details">
                    <p><strong>Contractor:</strong> ${po.contractor}</p>
                    <p><strong>Work Type:</strong> ${po.workType}</p>
                    <p><strong>Amount:</strong> $${po.totalAmount?.toLocaleString() || '0'}</p>
                    <p><strong>Submitted:</strong> ${new Date(po.submittedAt).toLocaleDateString()}</p>
                </div>
            </div>
        `).join('');
        
        console.log(`✅ Rendered ${this.filteredPOs.length} POs`);
    }

    /**
     * Convert OneDrive files to PO objects
     */
    async convertOneDriveFilesToPOs(oneDriveFiles) {
        const pos = [];
        
        for (const file of oneDriveFiles) {
            try {
                // Try to parse the file content if it's a JSON file
                if (file.name.endsWith('.json') && window.oneDrivePowerAutomatePOManager?.msGraphAPI) {
                    try {
                        const fileContent = await window.oneDrivePowerAutomatePOManager.msGraphAPI.downloadFile(file.id);
                        const poData = JSON.parse(fileContent);
                        
                        // Add OneDrive metadata
                        poData.oneDriveFile = {
                            id: file.id,
                            name: file.name,
                            lastModified: file.lastModifiedDateTime,
                            webUrl: file.webUrl
                        };
                        poData.source = poData.source || 'OneDrive';
                        
                        pos.push(poData);
                    } catch (parseError) {
                        console.warn(`Failed to parse OneDrive file ${file.name}:`, parseError.message);
                    }
                } else {
                    // Create a minimal PO object from file metadata
                    const poFromMetadata = {
                        poNumber: this.extractPONumberFromFileName(file.name),
                        fileName: file.name,
                        status: 'submitted',
                        submittedAt: file.lastModifiedDateTime || file.createdDateTime,
                        source: 'OneDrive-Metadata',
                        oneDriveFile: {
                            id: file.id,
                            name: file.name,
                            lastModified: file.lastModifiedDateTime,
                            webUrl: file.webUrl,
                            size: file.size
                        },
                        formData: {
                            // Basic info from filename/metadata
                            contractor: 'Unknown',
                            projectName: 'Unknown'
                        }
                    };
                    
                    pos.push(poFromMetadata);
                }
            } catch (error) {
                console.warn(`Error processing OneDrive file ${file.name}:`, error.message);
            }
        }
        
        return pos;
    }

    /**
     * Extract PO number from filename
     */
    extractPONumberFromFileName(filename) {
        const match = filename.match(/PO[^-]*-?(\d+)/i);
        return match ? match[0] : `PO-${Date.now()}`;
    }

    /**
     * Convert test data to PO objects for tracking display
     */
    convertTestDataToPOs(testData) {
        console.log('Converting test data to POs:', testData);
        
        // Safety check: ensure testData is an array
        if (!Array.isArray(testData)) {
            console.warn('⚠️ testData is not an array:', testData);
            return [];
        }
        
        return testData.map(po => {
            return {
                id: po.id,
                poNumber: po.id,
                project: po.meta.projectName,
                contractor: po.meta.companyName,
                status: po.status || 'Draft',
                submittedAt: po.createdAt || new Date().toISOString(),
                submittedBy: {
                    name: po.meta.requestedBy,
                    email: po.meta.requestedByEmail || po.meta.requestedBy
                },
                totalAmount: po.meta.contractAmount || 0,
                workType: po.meta.workType || 'General',
                source: 'Test Data'
            };
        });
    }

    updateDataSourceIndicator(response) {
        // DISABLED: Data source indicator removed per user request
        return;
    }

    showOneDriveWarning() {
        // Show a subtle warning about OneDrive connection
        let warning = document.getElementById('oneDriveWarning');
        if (!warning) {
            warning = document.createElement('div');
            warning.id = 'oneDriveWarning';
            warning.className = 'onedrive-warning';
            warning.style.cssText = `
                position: fixed;
                top: 110px;
                right: 20px;
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 4px;
                padding: 8px 12px;
                font-size: 12px;
                z-index: 1000;
                max-width: 250px;
            `;
            warning.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <span>⚠️</span>
                    <span>OneDrive sync unavailable. Showing local data only.</span>
                </div>
            `;
            document.body.appendChild(warning);
            
            // Auto-hide after 5 seconds
            setTimeout(() => {
                if (warning.parentNode) {
                    warning.parentNode.removeChild(warning);
                }
            }, 5000);
        }
    }

    displayPOs(pos) {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const emptyState = document.getElementById('emptyState');
        const poTable = document.getElementById('poTable');
        const poTableBody = document.getElementById('poTableBody');

        // Hide loading
        loadingSpinner.style.display = 'none';

        if (!pos || pos.length === 0) {
            emptyState.style.display = 'block';
            poTable.style.display = 'none';
            return;
        }

        // Show table and hide empty state
        emptyState.style.display = 'none';
        poTable.style.display = 'block';

        // Generate table rows
        poTableBody.innerHTML = pos.map(po => this.createPORow(po)).join('');

        // Update stats
        this.updateStats(pos);

        // Add event listeners to action buttons
        document.querySelectorAll('.po-action').forEach(button => {
            button.addEventListener('click', (e) => this.handlePOAction(e));
        });
    }

    createPORow(po) {
        const statusClass = po.status ? po.status.toLowerCase() : 'draft';
        const formattedDate = new Date(po.createdAt).toLocaleDateString();
        const contractAmount = parseFloat(po.meta?.contractAmount || 0);
        
        // Get submitted by information
        const submittedByInfo = po.submittedBy || {};
        const submittedByDisplay = submittedByInfo.username || 'Unknown';
        const submittedByTooltip = `${submittedByInfo.username || 'Unknown'} (${submittedByInfo.email || 'No email'}) - ${submittedByInfo.company || 'No company'}`;
        
        return `
            <tr data-po-id="${po.id}">
                <td>${po.id}</td>
                <td>${po.meta?.projectName || 'N/A'}</td>
                <td>${po.meta?.generalContractor || 'N/A'}</td>
                <td><span class="status-badge status-${statusClass}">${po.status || 'Draft'}</span></td>
                <td>${formattedDate}</td>
                <td>$${contractAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td title="${submittedByTooltip}">
                    <span class="submitted-by">
                        👤 ${submittedByDisplay}
                        ${submittedByInfo.role === 'admin' ? ' <span class="admin-badge">Admin</span>' : ''}
                    </span>
                </td>
                <td class="actions">
                    <button class="btn-small btn-primary po-action" data-action="view" data-po-id="${po.id}">View</button>
                    ${po.status === 'Draft' ? `<button class="btn-small btn-secondary po-action" data-action="edit" data-po-id="${po.id}">Edit</button>` : ''}
                    <button class="btn-small btn-danger po-action" data-action="delete" data-po-id="${po.id}">Delete</button>
                </td>
            </tr>
        `;
    }

    updateStats(pos) {
        console.log('=== UPDATE STATS ===');
        console.log('Stats for POs:', pos);
        console.log('Type of pos:', typeof pos, 'Is array:', Array.isArray(pos));
        
        // Safety check: ensure pos is an array
        if (!Array.isArray(pos)) {
            console.warn('⚠️ pos is not an array in updateStats, using empty array');
            pos = [];
        }
        
        const total = pos.length;
        const submitted = pos.filter(po => po.status === 'Submitted').length;
        const approved = pos.filter(po => po.status === 'Approved').length;
        const totalValue = pos.reduce((sum, po) => sum + (parseFloat(po.totalAmount || 0)), 0);

        console.log('Stats calculated:', { total, submitted, approved, totalValue });

        // Update DOM elements safely
        const totalEl = document.getElementById('totalPOs');
        const submittedEl = document.getElementById('submittedPOs');
        const approvedEl = document.getElementById('approvedPOs');
        const totalValueEl = document.getElementById('totalValue');

        if (totalEl) totalEl.textContent = total;
        if (submittedEl) submittedEl.textContent = submitted;
        if (approvedEl) approvedEl.textContent = approved;
        if (totalValueEl) totalValueEl.textContent = `$${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
        
        console.log('✅ Stats updated in DOM');
    }

    async handlePOAction(event) {
        const action = event.target.dataset.action;
        const poId = parseInt(event.target.dataset.poId);

        switch (action) {
            case 'view':
                this.viewPODetails(poId);
                break;
            case 'edit':
                window.location.href = `../pages/form.html?revise=${poId}`;
                break;
            case 'delete':
                this.deletePO(poId);
                break;
        }
    }

    async viewPODetails(poId) {
        try {
            const po = this.allPOs.find(p => p.id === poId);
            if (!po) {
                window.modal.showError('PO not found.');
                return;
            }

            const detailsHtml = `
                <div class="po-details-modal">
                    <h3>PO #${po.id} - ${po.meta?.projectName || 'N/A'}</h3>
                    <div class="details-grid">
                        <div class="detail-item">
                            <strong>Status:</strong> ${po.status || 'Draft'}
                        </div>
                        <div class="detail-item">
                            <strong>General Contractor:</strong> ${po.meta?.generalContractor || 'N/A'}
                        </div>
                        <div class="detail-item">
                            <strong>Contract Amount:</strong> $${parseFloat(po.meta?.contractAmount || 0).toLocaleString()}
                        </div>
                        <div class="detail-item">
                            <strong>Created:</strong> ${new Date(po.createdAt).toLocaleDateString()}
                        </div>
                        <div class="detail-item">
                            <strong>Project Manager:</strong> ${po.meta?.projectManager || 'N/A'}
                        </div>
                        <div class="detail-item">
                            <strong>Contact:</strong> ${po.meta?.contactName || 'N/A'} (${po.meta?.email || 'N/A'})
                        </div>
                        <div class="detail-item">
                            <strong>Submitted By:</strong> 
                            <div class="submitter-info">
                                👤 ${po.submittedBy?.username || 'Unknown'}
                                ${po.submittedBy?.role === 'admin' ? '<span class="admin-badge">Admin</span>' : ''}
                                <br>
                                <small>📧 ${po.submittedBy?.email || 'No email'}</small>
                                <br>
                                <small>🏢 ${po.submittedBy?.company || 'No company'}</small>
                                ${po.submittedBy?.submittedAt ? `<br><small>🕐 ${new Date(po.submittedBy.submittedAt).toLocaleDateString()} ${new Date(po.submittedBy.submittedAt).toLocaleTimeString()}</small>` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            `;

            window.modal.show({
                title: 'Purchase Order Details',
                content: detailsHtml,
                actions: [
                    {
                        text: 'Close',
                        class: 'btn-secondary',
                        action: () => window.modal.hide()
                    }
                ]
            });
        } catch (error) {
            console.error('Error viewing PO details:', error);
            window.modal.showError('Failed to load PO details.');
        }
    }

    async deletePO(poId) {
        window.modal.showConfirm(
            `Are you sure you want to delete PO #${poId}? This action cannot be undone.`,
            async () => {
                try {
                    await window.api.deletePO(poId);
                    window.modal.showSuccess('PO deleted successfully.');
                    this.loadPOs(); // Refresh the list
                } catch (error) {
                    console.error('Error deleting PO:', error);
                    window.modal.showError('Failed to delete PO. Please try again.');
                }
            }
        );
    }

    filterPOs() {
        console.log('=== FILTER POs START ===');
        console.log('All POs:', this.allPOs);
        console.log('Type of this.allPOs:', typeof this.allPOs);
        console.log('Is array:', Array.isArray(this.allPOs));
        
        // Safety check: Ensure this.allPOs is always an array
        if (!Array.isArray(this.allPOs)) {
            console.warn('⚠️ this.allPOs is not an array, resetting to empty array');
            this.allPOs = [];
        }
        
        let tempPOs = [...this.allPOs];
        console.log('Initial tempPOs length:', tempPOs.length);
        
        // Note: No user filtering needed - tracking page is already user-specific
        
        // Filter by status
        const status = document.getElementById('statusFilter').value;
        if (status) {
            tempPOs = tempPOs.filter(po => po.status === status);
            console.log(`Filtered by status "${status}": ${tempPOs.length} remaining`);
        }
        
        // Filter by date range
        const dateFrom = document.getElementById('dateFrom').value;
        if (dateFrom) {
            tempPOs = tempPOs.filter(po => new Date(po.submittedAt) >= new Date(dateFrom));
            console.log(`Filtered by date from "${dateFrom}": ${tempPOs.length} remaining`);
        }
        
        const dateTo = document.getElementById('dateTo').value;
        if (dateTo) {
            tempPOs = tempPOs.filter(po => new Date(po.submittedAt) <= new Date(dateTo));
            console.log(`Filtered by date to "${dateTo}": ${tempPOs.length} remaining`);
        }
        
        // Filter by project
        const project = document.getElementById('projectFilter').value.toLowerCase();
        if (project) {
            tempPOs = tempPOs.filter(po => po.project && po.project.toLowerCase().includes(project));
            console.log(`Filtered by project "${project}": ${tempPOs.length} remaining`);
        }
        
        console.log('Final filtered POs:', tempPOs);
        this.filteredPOs = tempPOs;
        console.log('=== CALLING RENDER POs ===');
        this.renderPOs();
        this.updateStats(this.filteredPOs);
    }

    clearFilters() {
        document.getElementById('projectFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        
        // Safety check: ensure this.allPOs is an array
        if (!Array.isArray(this.allPOs)) {
            console.warn('⚠️ this.allPOs is not an array in clearFilters, resetting to empty array');
            this.allPOs = [];
        }
        
        this.filteredPOs = [...this.allPOs];
        this.displayPOs(this.filteredPOs);
    }

    exportPOs() {
        if (!this.filteredPOs.length) {
            window.modal.showError('No POs to export.');
            return;
        }

        try {
            const csvContent = this.generateCSV(this.filteredPOs);
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `apex_pos_${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            window.modal.showSuccess('POs exported successfully.');
        } catch (error) {
            console.error('Export error:', error);
            window.modal.showError('Failed to export POs.');
        }
    }

    generateCSV(pos) {
        const headers = ['PO ID', 'Project Name', 'General Contractor', 'Status', 'Created Date', 'Contract Amount', 'Project Manager', 'Contact'];
        const rows = pos.map(po => [
            po.id,
            po.meta?.projectName || '',
            po.meta?.generalContractor || '',
            po.status || 'Draft',
            new Date(po.createdAt).toLocaleDateString(),
            parseFloat(po.meta?.contractAmount || 0),
            po.meta?.projectManager || '',
            po.meta?.contactName || ''
        ]);

        return [headers, ...rows]
            .map(row => row.map(field => `"${field}"`).join(','))
            .join('\n');
    }

    /**
     * Get PO data by PO number for detailed view
     */
    getPOData(poNumber) {
        console.log('🔍 Searching for PO data:', poNumber);
        
        // Search in filteredPOs first, then fallback to allPOs
        let foundPO = this.filteredPOs.find(po => po.poNumber === poNumber);
        
        if (!foundPO) {
            foundPO = this.allPOs.find(po => po.poNumber === poNumber);
        }
        
        // If still not found, try to get from PODataManager cache
        if (!foundPO && this.poDataManager?.cachedData?.pos) {
            foundPO = this.poDataManager.cachedData.pos.find(po => po.poNumber === poNumber);
        }
        
        if (foundPO) {
            console.log('✅ Found PO data:', foundPO);
            return foundPO;
        }
        
        console.warn('⚠️ PO not found:', poNumber);
        return null;
    }
}

// Initialize the tracking dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired, creating TrackingDashboard');
    window.trackingDashboard = new TrackingDashboard();
});

// Backup initialization in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
} else {
    console.log('Document already loaded, initializing immediately');
    window.trackingDashboard = new TrackingDashboard();
}
