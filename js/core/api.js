// API and Power Automate Integration
class APIManager {
    constructor() {
        // Replace with your actual Power Automate HTTP trigger URL
        this.POWER_AUTOMATE_URL = 'https://defaulta543e2f6ae4b4d1db263a38786ce68.44.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/146de521bc3a415d9dbbdfec5476be38/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=_bSEuYWnBRzJs_p7EvROZXVi6KLitzuyOtIlD7lEqLA';
        
        // Configuration
        this.config = {
            timeout: 30000, // 30 seconds
            retryAttempts: 3,
            retryDelay: 1000, // 1 second
            enableSync: true // Enable/disable Power Automate sync
        };
        
        // Queue for failed requests
        this.failedRequests = [];
        
        // Initialize
        this.init();
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

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);

            const response = await fetch(url, {
                ...requestOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return { success: true, data };

        } catch (error) {
            console.error('Request failed:', error);
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
                userId: auth.getCurrentUser()?.id || null,
                userInfo: auth.getCurrentUser() || null
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
            // Validate PO data
            const validation = storage.validatePOSchema(poData);
            if (!validation.isValid) {
                return {
                    success: false,
                    errors: validation.errors
                };
            }

            // Save locally first
            const savedPO = storage.addPO(poData);
            
            // Update status to submitted
            const submittedPO = storage.updatePO(savedPO.id, {
                sent: true,
                sentAt: new Date().toISOString(),
                status: 'Submitted'
            });

            // Shape payload to requested structure and sync
            const shaped = this.shapePOForSend(submittedPO);
            const syncResult = await this.syncWithPowerAutomate('CREATE_PO', shaped);

            return {
                success: true,
                po: submittedPO,
                syncStatus: syncResult.success ? 'synced' : 'queued',
                message: 'Purchase Order created successfully'
            };

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
            const updatedPO = storage.updatePO(poId, {
                ...updateData,
                updatedAt: new Date().toISOString()
            });

            if (!updatedPO) {
                throw new Error('Purchase Order not found');
            }

            // Shape payload and sync
            const shaped = this.shapePOForSend(updatedPO);
            const syncResult = await this.syncWithPowerAutomate('UPDATE_PO', shaped);

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
    shapePOForSend(po) {
        if (!po) return po;
        return {
            meta: po.meta || {},
            schedule: Array.isArray(po.schedule) ? po.schedule : [],
            scope: Array.isArray(po.scope) ? po.scope : [],
            createdAt: po.createdAt || new Date().toISOString(),
            sent: !!po.sent,
            timestamp: po.timestamp || Date.now(),
            id: po.id,
            sentAt: po.sentAt || ''
        };
    }

    async deletePO(poId) {
        try {
            // Get PO data before deletion
            const po = storage.getPOById(poId);
            if (!po) {
                throw new Error('Purchase Order not found');
            }

            // Delete locally
            const deleted = storage.deletePO(poId);
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
            const pos = storage.searchPOs(filters.query || '', filters, userId);
            
            // Apply pagination if specified
            let result = pos;
            if (filters.page && filters.limit) {
                result = storage.paginateResults(pos, filters.page, filters.limit);
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
            const po = storage.getPOById(poId);
            
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

            const updatedUser = storage.updateUser(userId, userData);
            
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
            const user = storage.getUserById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Delete user
            const deleted = storage.deleteUser(userId);
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

            const users = storage.getUsers();
            
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
            const poStats = storage.getPOStats(userId);
            const userStats = auth.hasPermission('manage_users') ? storage.getUserStats() : null;

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
            const data = storage.exportData(type);
            
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
        storage.set('failedRequests', this.failedRequests);
    }

    async processPendingRequests() {
        // Load failed requests from storage
        const savedFailedRequests = storage.get('failedRequests', []);
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
        storage.set('failedRequests', this.failedRequests);
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
        storage.set('apiConfig', this.config);
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
}