// API and Power Automate Integration
// 🚨 MANDATORY: Read CRITICAL_INTEGRATION_REQUIREMENTS.md before making ANY changes!
class APIManager {
    constructor() {
        // ⚠️ CRITICAL: JSON structure must match CRITICAL_INTEGRATION_REQUIREMENTS.md exactly
        // READ CRITICAL_INTEGRATION_REQUIREMENTS.md BEFORE MAKING ANY CHANGES!
        // Any deviation will cause HTTP 400 schema validation errors
        
        // Load Power Automate HTTP trigger URL from environment variable or secure config
        this.POWER_AUTOMATE_URL = (typeof process !== 'undefined' && process.env && process.env.POWER_AUTOMATE_URL)
            ? process.env.POWER_AUTOMATE_URL
            : (window && window.POWER_AUTOMATE_URL ? window.POWER_AUTOMATE_URL : 
                'https://defaulta543e2f6ae4b4d1db263a38786ce68.44.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/146de521bc3a415d9dbbdfec5476be38/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=_bSEuYWnBRzJs_p7EvROZXVi6KLitzuyOtIlD7lEqLA');
        
        console.log('🔗 Power Automate URL configured:', this.POWER_AUTOMATE_URL);
        
        // OneDrive retrieval endpoints - REPLACE WITH YOUR ACTUAL POWER AUTOMATE URLs
        // PO Data Retrieval Flow: Create flow named "Apex-PO-Data-Retrieval"
        this.ONEDRIVE_GET_POS_URL = 'YOUR_PO_RETRIEVAL_POWER_AUTOMATE_URL_HERE';
        // User Data Retrieval Flow: For getting user data (same as auth.js endpoint)
        this.ONEDRIVE_GET_USERS_URL = 'YOUR_USER_RETRIEVAL_POWER_AUTOMATE_URL_HERE';
        
        // Configuration
        this.config = {
            timeout: 30000, // 30 seconds
            retryAttempts: 3,
            retryDelay: 1000, // 1 second
            enableSync: false // Disable Power Automate sync by default; OneDrive is primary DB
        };
        
        // Queue for failed requests
        this.failedRequests = [];
        
        // Initialize
        this.init();
    }

    // Simple PO number generator: PO-YYMM-XXXXXX
    generatePONumber() {
        const now = new Date();
        const yy = String(now.getFullYear()).slice(-2);
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const seq = String(Math.floor(Math.random() * 1000000)).padStart(6, '0');
        return `PO-${yy}${mm}-${seq}`;
    }

    init() {
        // Check for pending failed requests on startup
        this.processPendingRequests();
        
        // Set up periodic sync check
        this.startPeriodicSync();
        
        // Listen for online/offline events
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    // Generic HTTP request method
    async makeRequest(url, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: this.config.timeout
        };

        const requestOptions = { ...defaultOptions, ...options };

        console.log('🌐 Making HTTP request:', {
            url: url,
            method: requestOptions.method,
            headers: requestOptions.headers,
            bodyLength: requestOptions.body ? requestOptions.body.length : 0
        });

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                console.log('⏰ Request timeout after', requestOptions.timeout, 'ms');
                controller.abort();
            }, requestOptions.timeout);

            const response = await fetch(url, {
                ...requestOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            console.log('📡 Response received:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: Object.fromEntries(response.headers.entries())
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.log('❌ Response error body:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            // Try to parse JSON response
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
                console.log('📄 Non-JSON response:', data);
            }
            
            console.log('✅ Request successful, data:', data);
            return { success: true, data };

        } catch (error) {
            console.error('❌ Request failed:', {
                url: url,
                error: error.message,
                name: error.name
            });
            
            if (error.name === 'AbortError') {
                return { success: false, error: 'Request timeout' };
            }
            
            return { success: false, error: error.message };
        }
    }

    // Sync data with Power Automate
    async syncWithPowerAutomate(action, data, retryCount = 0) {
        if (!this.config.enableSync) {
            console.log('Power Automate sync is disabled');
            return { success: true, message: 'Sync disabled' };
        }

        try {
            const payload = {
                action: action,
                data: data,
                timestamp: new Date().toISOString(),
                userId: window.auth.getCurrentUser()?.id || null,
                userInfo: window.auth.getCurrentUser() || null
            };

            const response = await this.makeRequest(this.POWER_AUTOMATE_URL, {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.success) {
                console.log(`Power Automate sync successful: ${action}`);
                return response;
            } else {
                throw new Error(response.error);
            }

        } catch (error) {
            console.error(`Power Automate sync failed: ${action}`, error);

            // Retry logic
            if (retryCount < this.config.retryAttempts) {
                console.log(`Retrying sync in ${this.config.retryDelay}ms... (${retryCount + 1}/${this.config.retryAttempts})`);
                
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
                return this.syncWithPowerAutomate(action, data, retryCount + 1);
            }

            // Add to failed requests queue
            this.addToFailedQueue(action, data);

            return {
                success: false,
                error: error.message,
                queued: true
            };
        }
    }

    // Purchase Order API methods
    async createPO(poData) {
        try {
            console.log('=== CREATE PO STARTED ===');
            console.log('Input PO data:', JSON.stringify(poData, null, 2));
            
            // Validate PO data
            const validation = window.storage.validatePOSchema(poData);
            if (!validation.isValid) {
                console.log('❌ PO validation failed:', validation.errors);
                return {
                    success: false,
                    errors: validation.errors
                };
            }
            console.log('✅ PO validation passed');

            // Save locally first
            const savedPO = window.storage.addPO(poData);
            console.log('✅ PO saved locally with ID:', savedPO.id);
            
            // Update status to submitted
            const submittedPO = window.storage.updatePO(savedPO.id, {
                sent: true,
                sentAt: new Date().toISOString(),
                status: 'Submitted'
            });
            console.log('✅ PO status updated to Submitted');

            // Ensure a PO number exists for downstream systems
            if (!poData.poDetails) poData.poDetails = {};
            if (!poData.poDetails.poNumber) {
                poData.poDetails.poNumber = this.generatePONumber();
                console.log('🆔 Generated PO Number:', poData.poDetails.poNumber);
            }

            // Send shaped payload directly (not wrapped in action/data)
            console.log('🚀 Starting Power Automate sync...');
            const shaped = this.shapePOForSend(submittedPO);
            const syncResult = await this.syncDirectly(shaped);
            console.log('💬 Sync result:', syncResult);

            const finalResult = {
                success: true,
                po: submittedPO,
                syncStatus: syncResult.success ? 'synced' : 'queued',
                message: 'Purchase Order created successfully'
            };
            console.log('=== CREATE PO COMPLETED SUCCESSFULLY ===');
            
            return finalResult;

        } catch (error) {
            console.error('Create PO error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updatePO(poId, updateData) {
        try {
            // Update locally
            const updatedPO = window.storage.updatePO(poId, {
                ...updateData,
                updatedAt: new Date().toISOString()
            });

            if (!updatedPO) {
                throw new Error('Purchase Order not found');
            }

            // Send shaped payload directly
            const shaped = this.shapePOForSend(updatedPO);
            const syncResult = await this.syncDirectly(shaped);

            return {
                success: true,
                po: updatedPO,
                syncStatus: syncResult.success ? 'synced' : 'queued',
                message: 'Purchase Order updated successfully'
            };

        } catch (error) {
            console.error('Update PO error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Shape PO to the requested HTTP schema
    // 🚨 CRITICAL: DO NOT MODIFY THIS STRUCTURE WITHOUT READING CRITICAL_INTEGRATION_REQUIREMENTS.md
    // This function MUST produce EXACTLY the JSON structure expected by Power Automate
    shapePOForSend(po) {
        if (!po) return po;
        
        const meta = po.meta || {};
    // Derive PO number if available; fallback to a stable reference using local id
    const poNumber = (po.poDetails && po.poDetails.poNumber) || po.poNumber || `PO-${po.id || Date.now()}`;
        
        // Ensure proper data types - Power Automate expects specific types
        // Convert numeric strings to actual numbers and handle empty values
        const parseNumber = (value) => {
            if (value === null || value === undefined || value === '') return 0;
            const num = Number(value);
            return isNaN(num) ? 0 : num;
        };
        
        // Convert unit string to integer (mapping common units)
        const parseUnit = (unit) => {
            const unitMap = {
                'EA': 1, 'EACH': 1,
                'SF': 2, 'SQ FT': 2, 
                'LF': 3, 'LIN FT': 3,
                'CY': 4, 'CU YD': 4,
                'SY': 5, 'SQ YD': 5,
                'TON': 6, 'TONS': 6,
                'LS': 7, 'LUMP SUM': 7,
                'HR': 8, 'HOUR': 8, 'HOURS': 8,
                'DAY': 9, 'DAYS': 9,
                'WEEK': 10, 'WEEKS': 10
            };
            const unitStr = String(unit || '').toUpperCase().trim();
            return unitMap[unitStr] || 1; // Default to 1 (EACH) if unknown
        };
        
        // Convert date to integer YYYYMMDD format  
        const parseScheduled = (dateValue) => {
            if (!dateValue) return 0;
            const date = new Date(dateValue);
            if (isNaN(date.getTime())) return 0;
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return parseInt(`${year}${month}${day}`);
        };
        
        const shaped = {
            poNumber: String(poNumber),
            meta: {
                projectName: String(meta.projectName || ""),
                generalContractor: String(meta.generalContractor || ""),
                address: String(meta.address || ""),
                owner: String(meta.owner || ""),
                apexOwner: String(meta.apexOwner || ""),
                typeStatus: String(meta.typeStatus || ""),
                projectManager: String(meta.projectManager || ""),
                contractAmount: parseNumber(meta.contractAmount),
                addAltAmount: parseNumber(meta.addAltAmount),
                addAltDetails: String(meta.addAltDetails || ""),
                retainagePct: parseNumber(meta.retainagePct),
                requestedBy: String(meta.requestedBy || ""),
                companyName: String(meta.companyName || ""),
                contactName: String(meta.contactName || ""),
                cellNumber: String(meta.cellNumber || ""),
                email: String(meta.email || ""),
                officeNumber: String(meta.officeNumber || ""),
                vendorType: String(meta.vendorType || ""),
                workType: String(meta.workType || ""),
                importantDates: {
                    noticeToProceed: String((meta.importantDates?.noticeToProceed) || ""),
                    anticipatedStart: String((meta.importantDates?.anticipatedStart) || ""),
                    substantialCompletion: String((meta.importantDates?.substantialCompletion) || ""),
                    hundredPercent: String((meta.importantDates?.hundredPercent) || "")
                }
            },
            schedule: Array.isArray(po.schedule) ? po.schedule.map(item => ({
                primeLine: String(item.primeLine || ""),
                budgetCode: String(item.budgetCode || ""),
                description: String(item.description || ""),
                qty: parseNumber(item.qty),
                unit: parseUnit(item.unit), // Convert to integer per schema
                totalCost: parseNumber(item.totalCost),
                scheduled: parseScheduled(item.scheduled), // Convert to integer YYYYMMDD
                apexContractValue: parseNumber(item.apexContractValue),
                profit: parseNumber(item.profit)
            })) : [],
            scope: Array.isArray(po.scope) ? po.scope.map(item => ({
                item: String(item.item || ""),
                description: String(item.description || ""),
                included: Boolean(item.included),
                excluded: Boolean(item.excluded)
            })) : [],
            createdAt: String(po.createdAt || new Date().toISOString()),
            sent: Boolean(po.sent),
            timestamp: parseNumber(po.timestamp) || Date.now(),
            id: parseNumber(po.id) || Date.now(),
            sentAt: String(po.sentAt || new Date().toISOString()),
            submittedBy: {
                userId: String((po.submittedBy?.userId) || ""),
                username: String((po.submittedBy?.username) || "unknown"),
                email: String((po.submittedBy?.email) || ""),
                company: String((po.submittedBy?.company) || ""),
                role: String((po.submittedBy?.role) || "user"),
                submittedAt: String((po.submittedBy?.submittedAt) || new Date().toISOString())
            }
        };
        
    console.log('🔄 Shaped PO for Power Automate (with poNumber):', JSON.stringify(shaped, null, 2));
        return shaped;
    }

    // Send payload directly to Power Automate without wrapper, with retry and queue handling
    async syncDirectly(data, retryCount = 0) {
        if (!this.config.enableSync) {
            console.log('Power Automate sync is disabled');
            return { success: true, message: 'Sync disabled' };
        }

        console.log('=== POWER AUTOMATE SYNC ATTEMPT ===');
        console.log('URL:', this.POWER_AUTOMATE_URL);
        console.log('Raw data received:', JSON.stringify(data, null, 2));
        console.log('Data structure analysis:', {
            hasSchedule: Array.isArray(data.schedule),
            scheduleLength: data.schedule ? data.schedule.length : 0,
            scheduleFields: data.schedule && data.schedule.length > 0 ? Object.keys(data.schedule[0]) : [],
            hasScope: Array.isArray(data.scope),
            scopeLength: data.scope ? data.scope.length : 0
        });
        console.log('Data being sent:', JSON.stringify(data, null, 2));
        console.log('Retry count:', retryCount);

        try {
            const response = await this.makeRequest(this.POWER_AUTOMATE_URL, {
                method: 'POST',
                body: JSON.stringify(data),
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                }
            });

            if (response.success) {
                console.log('✅ Power Automate sync successful');
                console.log('Response:', response.data);
                return response;
            } else {
                console.error('❌ Power Automate sync failed:', response.error);
                throw new Error(response.error);
            }

        } catch (error) {
            console.error('❌ Power Automate sync failed with error:', error);
            console.log('Error details:', {
                message: error.message,
                name: error.name,
                stack: error.stack
            });

            // Retry logic
            if (retryCount < this.config.retryAttempts) {
                console.log(`🔄 Retrying direct sync in ${this.config.retryDelay}ms... (${retryCount + 1}/${this.config.retryAttempts})`);
                await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (retryCount + 1)));
                return this.syncDirectly(data, retryCount + 1);
            }

            console.log('❌ All retry attempts exhausted, adding to failed queue');
            // Add to failed requests queue
            this.addToFailedQueue('DIRECT_SYNC', data);

            return {
                success: false,
                error: error.message,
                queued: true
            };
        }
    }

    async deletePO(poId) {
        try {
            // Get PO data before deletion
            const po = window.storage.getPOById(poId);
            if (!po) {
                throw new Error('Purchase Order not found');
            }

            // Delete locally
            const deleted = window.storage.deletePO(poId);
            if (!deleted) {
                throw new Error('Failed to delete Purchase Order');
            }

            // Sync with Power Automate
            const syncResult = await this.syncWithPowerAutomate('DELETE_PO', { id: poId, ...po });

            return {
                success: true,
                syncStatus: syncResult.success ? 'synced' : 'queued',
                message: 'Purchase Order deleted successfully'
            };

        } catch (error) {
            console.error('Delete PO error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getPOs(filters = {}, userId = null) {
        try {
            // Get from local storage
            const pos = window.storage.searchPOs(filters.query || '', filters, userId);
            
            // Apply pagination if specified
            let result = pos;
            if (filters.page && filters.limit) {
                result = window.storage.paginateResults(pos, filters.page, filters.limit);
            }

            return {
                success: true,
                data: result,
                message: 'Purchase Orders retrieved successfully'
            };

        } catch (error) {
            console.error('Get POs error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getPOById(poId) {
        try {
            const po = window.storage.getPOById(poId);
            
            if (!po) {
                throw new Error('Purchase Order not found');
            }

            return {
                success: true,
                data: po,
                message: 'Purchase Order retrieved successfully'
            };

        } catch (error) {
            console.error('Get PO by ID error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // User management API methods (Admin only)
    async createUser(userData) {
        try {
            if (!auth.hasPermission('manage_users')) {
                throw new Error('Insufficient permissions');
            }

            // Register user
            const result = await auth.register(userData);
            
            if (result.success) {
                // Sync with Power Automate
                const syncResult = await this.syncWithPowerAutomate('CREATE_USER', result.user);
                
                return {
                    success: true,
                    user: result.user,
                    syncStatus: syncResult.success ? 'synced' : 'queued',
                    message: 'User created successfully'
                };
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            console.error('Create user error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async updateUser(userId, userData) {
        try {
            if (!auth.hasPermission('manage_users')) {
                throw new Error('Insufficient permissions');
            }

            const updatedUser = window.storage.updateUser(userId, userData);
            
            if (!updatedUser) {
                throw new Error('User not found');
            }

            // Sync with Power Automate
            const syncResult = await this.syncWithPowerAutomate('UPDATE_USER', updatedUser);

            return {
                success: true,
                user: updatedUser,
                syncStatus: syncResult.success ? 'synced' : 'queued',
                message: 'User updated successfully'
            };

        } catch (error) {
            console.error('Update user error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async deleteUser(userId) {
        try {
            if (!auth.hasPermission('manage_users')) {
                throw new Error('Insufficient permissions');
            }

            // Get user data before deletion
            const user = window.storage.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Delete user
            const deleted = window.storage.deleteUser(userId);
            if (!deleted) {
                throw new Error('Failed to delete user');
            }

            // Sync with Power Automate
            const syncResult = await this.syncWithPowerAutomate('DELETE_USER', { id: userId, ...user });

            return {
                success: true,
                syncStatus: syncResult.success ? 'synced' : 'queued',
                message: 'User deleted successfully'
            };

        } catch (error) {
            console.error('Delete user error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async getUsers() {
        try {
            if (!auth.hasPermission('manage_users')) {
                throw new Error('Insufficient permissions');
            }

            const users = window.storage.getUsers();
            
            return {
                success: true,
                data: users,
                message: 'Users retrieved successfully'
            };

        } catch (error) {
            console.error('Get users error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Statistics API methods
    async getStats(userId = null) {
        try {
            const poStats = window.storage.getPOStats(userId);
            const userStats = window.auth.hasPermission('manage_users') ? window.storage.getUserStats() : null;

            return {
                success: true,
                data: {
                    pos: poStats,
                    users: userStats
                },
                message: 'Statistics retrieved successfully'
            };

        } catch (error) {
            console.error('Get stats error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Export data
    async exportData(type = 'all', format = 'json') {
        try {
            const data = window.storage.exportData(type);
            
            if (format === 'json') {
                return {
                    success: true,
                    data: data,
                    filename: `apex_po_export_${type}_${new Date().toISOString().split('T')[0]}.json`,
                    message: 'Data exported successfully'
                };
            }
            
            // Could add CSV export here
            throw new Error('Unsupported export format');

        } catch (error) {
            console.error('Export error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Failed request queue management
    addToFailedQueue(action, data) {
        const failedRequest = {
            id: Date.now() + Math.random(),
            action,
            data,
            timestamp: new Date().toISOString(),
            attempts: 0
        };

        this.failedRequests.push(failedRequest);
        
        // Save to local storage for persistence
        window.storage.set('failedRequests', this.failedRequests);
    }

    async processPendingRequests() {
        // Load failed requests from storage
        const savedFailedRequests = window.storage.get('failedRequests', []);
        this.failedRequests = savedFailedRequests;

        if (this.failedRequests.length === 0) return;

        console.log(`Processing ${this.failedRequests.length} pending requests...`);

        const processedRequests = [];

        for (const request of this.failedRequests) {
            try {
                request.attempts++;
                
                const result = await this.syncWithPowerAutomate(request.action, request.data);
                
                if (result.success) {
                    console.log(`Successfully processed pending request: ${request.action}`);
                    processedRequests.push(request);
                } else if (request.attempts >= this.config.retryAttempts) {
                    console.log(`Giving up on failed request after ${request.attempts} attempts: ${request.action}`);
                    processedRequests.push(request);
                }
                
            } catch (error) {
                console.error(`Failed to process pending request: ${request.action}`, error);
            }
        }

        // Remove processed requests
        this.failedRequests = this.failedRequests.filter(
            request => !processedRequests.includes(request)
        );

        // Update storage
        window.storage.set('failedRequests', this.failedRequests);
    }

    // Network status handlers
    handleOnline() {
        console.log('Connection restored. Processing pending requests...');
        this.processPendingRequests();
    }

    handleOffline() {
        console.log('Connection lost. New requests will be queued.');
    }

    // Periodic sync
    startPeriodicSync() {
        // Process pending requests every 5 minutes
        setInterval(() => {
            if (navigator.onLine && this.failedRequests.length > 0) {
                this.processPendingRequests();
            }
        }, 5 * 60 * 1000);
    }

    // Configuration methods
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        window.storage.set('apiConfig', this.config);
    }

    getConfig() {
        return { ...this.config };
    }

    // Health check
    async healthCheck() {
        try {
            const result = await this.makeRequest(this.POWER_AUTOMATE_URL, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'HEALTH_CHECK',
                    timestamp: new Date().toISOString()
                })
            });

            return {
                success: result.success,
                online: navigator.onLine
            };
        } catch (error) {
            return {
                success: false,
                online: false
            };
        }
    }
    
    // OneDrive Integration Methods
    async retrievePOsFromOneDrive(filters = {}) {
        // Prefer direct Microsoft Graph integration (shared centralized folder) over placeholder endpoints
        try {
            console.log('📥 Retrieving POs from OneDrive via Graph...', filters);

            // Ensure Graph integration is available on this page
            if (typeof window.RealM365Integration === 'undefined') {
                console.warn('RealM365Integration not loaded on this page');
                return { success: false, error: 'M365 integration not available' };
            }

            const integ = new window.RealM365Integration();
            await integ.initialize();
            const auth = await integ.checkAuthenticationStatus();
            if (!auth?.authenticated) {
                console.warn('Not authenticated with Microsoft 365; skipping OneDrive retrieval');
                return { success: false, error: 'Not authenticated', requiresAuth: true };
            }

            // Determine scope for listing
            const contractor = filters.contractor || 'General Contractor';
            const year = (filters.year || new Date().getFullYear()).toString();
            const list = await integ.listPOs(contractor, year);

            // Current session for filtering to "My" POs if a userId filter is provided
            const currentSession = (window.auth && typeof window.auth.getCurrentUser === 'function')
                ? window.auth.getCurrentUser()
                : null;

            // Map Graph results to app PO shape
            const mapToPO = (item) => {
                // If coming from Microsoft Lists, the item is already in the app shape
                if (item && item.source === 'mslists') {
                    const poNumber = item.poNumber || item.data?.poNumber || `PO-${item.id || Date.now()}`;
                    const createdAt = item.createdAt || new Date().toISOString();
                    return {
                        id: item.id || (() => {
                            const str = String(poNumber);
                            let hash = 0; for (let i=0;i<str.length;i++){ hash=((hash<<5)-hash)+str.charCodeAt(i); hash|=0; }
                            const n = Math.abs(hash); return Number(String(n).padEnd(10,'0').slice(0,10));
                        })(),
                        createdAt,
                        status: item.status || 'Submitted',
                        meta: { ...(item.meta || {}) },
                        submittedBy: { ...(item.submittedBy || {}) },
                        source: 'mslists',
                        poNumber
                    };
                }

                const data = item?.data || {};
                const poNumber = data.poDetails?.poNumber || data.poNumber || item?.poNumber || 'UNKNOWN';

                // Deterministic id from poNumber if missing
                const deterministicId = (() => {
                    const str = String(poNumber);
                    let hash = 0;
                    for (let i = 0; i < str.length; i++) {
                        hash = ((hash << 5) - hash) + str.charCodeAt(i);
                        hash |= 0; // Convert to 32-bit int
                    }
                    // Keep it positive and 10 digits-ish
                    const n = Math.abs(hash);
                    return Number(String(n).padEnd(10, '0').slice(0, 10));
                })();

                const createdAt = data.createdAt || data.submittedBy?.submittedAt || item?.createdAt || item?.lastModified || new Date().toISOString();
                const status = data.status || data.poDetails?.status || data.workflow?.status || 'Submitted';

                const meta = {
                    projectName: data.meta?.projectName || data.poDetails?.projectName || data.project?.name || 'N/A',
                    generalContractor: data.meta?.generalContractor || data.contractor || 'General Contractor',
                    contractAmount: Number(data.meta?.contractAmount || data.poDetails?.totalAmount || data.totalAmount || 0)
                };

                const submittedBy = data.submittedBy || {
                    username: currentSession?.username || currentSession?.name || auth?.user || 'Unknown',
                    email: currentSession?.email || auth?.email || '',
                    company: data.meta?.company || currentSession?.company || '',
                    role: currentSession?.role || 'user',
                    submittedAt: data.submittedBy?.submittedAt || createdAt
                };

                return {
                    id: data.id || deterministicId,
                    createdAt,
                    status,
                    meta,
                    submittedBy,
                    source: 'onedrive',
                    // Keep references for future drill-in if needed
                    poNumber,
                    oneDrive: {
                        folderName: item.folderName,
                        lastModified: item.lastModified
                    }
                };
            };

            let pos = Array.isArray(list) ? list.map(mapToPO) : [];

            // Optional filter for "My POs"
            if (filters.userId && currentSession) {
                const uid = filters.userId;
                const email = currentSession.email;
                pos = pos.filter(p => (
                    p.submittedBy?.userId === uid ||
                    p.submittedBy?.username === uid ||
                    (email && p.submittedBy?.email === email)
                ));
            }

            console.log('✅ POs retrieved from OneDrive via Graph:', pos.length);
            return {
                success: true,
                pos,
                count: pos.length,
                source: 'onedrive'
            };
        } catch (error) {
            console.error('❌ OneDrive PO retrieval error (Graph):', error);
            // Fallback to legacy HTTP endpoint if configured
            try {
                if (this.ONEDRIVE_GET_POS_URL && !this.ONEDRIVE_GET_POS_URL.includes('YOUR_PO_RETRIEVAL_POWER_AUTOMATE_URL_HERE')) {
                    const payload = {
                        action: 'get_pos',
                        filters: {
                            userId: filters.userId || null,
                            status: filters.status || null,
                            dateFrom: filters.dateFrom || null,
                            dateTo: filters.dateTo || null
                        },
                        timestamp: new Date().toISOString()
                    };
                    const response = await fetch(this.ONEDRIVE_GET_POS_URL, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });
                    if (response.ok) {
                        const data = await response.json();
                        return { success: true, pos: data.pos || [], count: data.count || 0, source: 'onedrive' };
                    }
                }
            } catch (e) {
                console.warn('Legacy OneDrive endpoint retrieval also failed:', e?.message || e);
            }
            return { success: false, error: error.message };
        }
    }

    async retrieveUsersFromOneDrive(filters = {}) {
        try {
            console.log('📥 Retrieving users from OneDrive...', filters);
            
            const payload = {
                action: 'get_users',
                filters: {
                    role: filters.role || null,
                    status: filters.status || 'active'
                },
                timestamp: new Date().toISOString()
            };

            const response = await fetch(this.ONEDRIVE_GET_USERS_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Users retrieved from OneDrive:', data.users?.length || 0);
                return { 
                    success: true, 
                    users: data.users || [],
                    count: data.count || 0,
                    source: 'onedrive'
                };
            } else {
                console.error('❌ Failed to retrieve users from OneDrive:', response.status);
                return { success: false, error: `HTTP ${response.status}` };
            }
        } catch (error) {
            console.error('❌ OneDrive user retrieval error:', error);
            return { success: false, error: error.message };
        }
    }

    // Combined method to get POs from both local storage and OneDrive
    async getAllPOs(userId = null, includeOneDrive = true) {
        try {
            console.log('📊 Getting all POs from all sources...');
            
            // Get local POs
            const localPOs = window.storage ? window.storage.getUserPOs(userId) : [];
            console.log(`📱 Local POs: ${localPOs.length}`);
            
            let oneDrivePOs = [];
            if (includeOneDrive) {
                // Get OneDrive POs
                const oneDriveResult = await this.retrievePOsFromOneDrive({ userId });
                if (oneDriveResult.success) {
                    oneDrivePOs = oneDriveResult.pos;
                    console.log(`☁️ OneDrive POs: ${oneDrivePOs.length}`);
                }
            }
            
            // Merge and deduplicate (prefer OneDrive version if duplicate IDs)
            const mergedPOs = this.mergePOData(localPOs, oneDrivePOs);
            console.log(`🔗 Total merged POs: ${mergedPOs.length}`);
            
            return {
                success: true,
                pos: mergedPOs,
                local: localPOs.length,
                onedrive: oneDrivePOs.length,
                total: mergedPOs.length
            };
        } catch (error) {
            console.error('❌ Error getting all POs:', error);
            return { success: false, error: error.message, pos: [] };
        }
    }

    // Helper method to merge and deduplicate PO data
    mergePOData(localPOs, oneDrivePOs) {
        const merged = [...localPOs];
        const localIds = new Set(localPOs.map(po => po.id));
        
        // Add OneDrive POs that aren't already in local storage
        oneDrivePOs.forEach(oneDrivePO => {
            if (!localIds.has(oneDrivePO.id)) {
                merged.push({
                    ...oneDrivePO,
                    source: 'onedrive'
                });
            } else {
                // Replace local version with OneDrive version (more recent)
                const localIndex = merged.findIndex(po => po.id === oneDrivePO.id);
                if (localIndex !== -1) {
                    merged[localIndex] = {
                        ...oneDrivePO,
                        source: 'synced'
                    };
                }
            }
        });
        
        // Sort by creation date (newest first)
        return merged.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
}

// Initialize API manager
const apiManager = new APIManager();

// Register with the component registry
if (window.ComponentRegistry) {
    window.ComponentRegistry.register('poManager', apiManager);
} else {
    // Fallback for when registry isn't available yet
    window.poManager = apiManager;
}