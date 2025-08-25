/**
 * Power Automate API Manager
 * Handles all HTTP requests to Power Automate flows for PO system data
 */
class PowerAutomateAPI {
    constructor() {
        console.log('🔄 Initializing Power Automate API Manager');
        
        // Use configuration if available, otherwise defaults
        const config = window.POWER_AUTOMATE_CONFIG || {};
        
        // Power Automate Flow URLs - Update via config or directly
        this.endpoints = config.endpoints || {
            getAllPOs: 'YOUR_GET_ALL_POS_FLOW_URL_HERE',
            getUserPOs: 'YOUR_GET_USER_POS_FLOW_URL_HERE', 
            createPO: 'YOUR_CREATE_PO_FLOW_URL_HERE',
            updatePO: 'YOUR_UPDATE_PO_FLOW_URL_HERE',
            deletePO: 'YOUR_DELETE_PO_FLOW_URL_HERE',
            getPODocument: 'YOUR_GET_PO_DOCUMENT_FLOW_URL_HERE',
            uploadDocument: 'YOUR_UPLOAD_DOCUMENT_FLOW_URL_HERE',
            getUserData: 'YOUR_GET_USER_DATA_FLOW_URL_HERE',
            validateUser: 'YOUR_VALIDATE_USER_FLOW_URL_HERE'
        };
        
        // Request configuration
        this.config = config.settings || {
            timeout: 30000, // 30 seconds
            retryAttempts: 3,
            retryDelay: 1000, // 1 second
            enableFallback: true,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        console.log('📋 PA Endpoints configured:', Object.keys(this.endpoints).length);
        console.log('⚙️ PA Settings:', this.config);
    }

    /**
     * Make HTTP request to Power Automate flow
     */
    async makeRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        try {
            console.log(`🌐 Making request to: ${url}`, options);
            
            // Add user context to all requests
            const currentUser = window.auth?.getCurrentUser();
            const requestPayload = {
                ...options.body ? JSON.parse(options.body) : {},
                user: currentUser,
                requestId: this.generateRequestId(),
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    ...this.config.headers,
                    ...options.headers
                },
                body: options.method !== 'GET' ? JSON.stringify(requestPayload) : undefined
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Response error:', errorText);
                throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
            }

            // Handle different response types
            const contentType = response.headers.get('content-type');
            let data;
            
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else if (contentType && contentType.includes('application/pdf')) {
                data = await response.blob();
            } else {
                data = await response.text();
            }
            
            console.log('✅ Request successful:', data);
            return data;

        } catch (error) {
            clearTimeout(timeoutId);
            console.error('❌ Request failed:', error);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            
            throw error;
        }
    }

    generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get all purchase orders
     */
    async getAllPOs(filters = {}) {
        console.log('📥 Fetching all POs from Power Automate...', filters);
        
        try {
            const data = await this.makeRequest(this.endpoints.getAllPOs, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'getAllPOs',
                    filters: filters
                })
            });

            console.log(`✅ Retrieved ${data?.length || 0} POs`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Failed to get all POs:', error);
            
            if (this.config.enableFallback) {
                console.log('🔄 Falling back to test data...');
                return await this.getTestData();
            }
            
            throw error;
        }
    }

    /**
     * Get purchase orders for specific user
     */
    async getUserPOs(userEmail) {
        console.log('📥 Fetching user POs from Power Automate...', userEmail);
        
        try {
            const data = await this.makeRequest(this.endpoints.getUserPOs, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'getUserPOs',
                    userEmail: userEmail
                })
            });

            console.log(`✅ Retrieved ${data?.length || 0} user POs`);
            return data || [];
            
        } catch (error) {
            console.error('❌ Failed to get user POs:', error);
            
            if (this.config.enableFallback) {
                console.log('🔄 Falling back to filtered test data...');
                const testData = await this.getTestData();
                return testData.filter(po => 
                    po.meta?.requestedByEmail?.toLowerCase() === userEmail.toLowerCase() ||
                    po.submittedBy?.email?.toLowerCase() === userEmail.toLowerCase()
                );
            }
            
            throw error;
        }
    }

    /**
     * Create new purchase order
     */
    async createPO(poData) {
        console.log('📤 Creating PO via Power Automate...', poData);
        
        try {
            const data = await this.makeRequest(this.endpoints.createPO, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'createPO',
                    poData: poData
                })
            });

            console.log('✅ PO created successfully:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Failed to create PO:', error);
            
            if (this.config.enableFallback) {
                console.log('🔄 Simulating PO creation...');
                return {
                    success: true,
                    id: poData.id,
                    poNumber: poData.id,
                    status: poData.status,
                    message: 'PO created (simulated - PA not configured)'
                };
            }
            
            throw error;
        }
    }

    /**
     * Update existing purchase order
     */
    async updatePO(poId, updateData) {
        console.log('📝 Updating PO via Power Automate...', poId, updateData);
        
        try {
            const data = await this.makeRequest(this.endpoints.updatePO, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'updatePO',
                    poId: poId,
                    updateData: updateData
                })
            });

            console.log('✅ PO updated successfully:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Failed to update PO:', error);
            throw error;
        }
    }

    /**
     * Get PO document (PDF, Excel, etc.)
     */
    async getPODocument(poId, documentType = 'pdf') {
        console.log('📄 Fetching PO document from Power Automate...', poId, documentType);
        
        try {
            const data = await this.makeRequest(this.endpoints.getPODocument, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'getPODocument',
                    poId: poId,
                    documentType: documentType
                })
            });

            console.log('✅ Document retrieved successfully');
            return data;
            
        } catch (error) {
            console.error('❌ Failed to get document:', error);
            throw error;
        }
    }

    /**
     * Upload document to Power Automate
     */
    async uploadDocument(file, poId, documentType) {
        console.log('📤 Uploading document via Power Automate...', file.name, poId);
        
        try {
            // For file uploads, we may need to use FormData
            const formData = new FormData();
            formData.append('file', file);
            formData.append('poId', poId);
            formData.append('documentType', documentType);
            formData.append('timestamp', new Date().toISOString());
            
            // Add user context
            const currentUser = window.auth?.getCurrentUser();
            if (currentUser) {
                formData.append('user', JSON.stringify(currentUser));
            }

            const data = await this.makeRequest(this.endpoints.uploadDocument, {
                method: 'POST',
                body: formData,
                headers: {} // Let browser set content-type for FormData
            });

            console.log('✅ Document uploaded successfully:', data);
            return data;
            
        } catch (error) {
            console.error('❌ Failed to upload document:', error);
            throw error;
        }
    }

    /**
     * Validate user credentials
     */
    async validateUser(email, password) {
        console.log('🔐 Validating user via Power Automate...', email);
        
        try {
            const data = await this.makeRequest(this.endpoints.validateUser, {
                method: 'POST',
                body: JSON.stringify({
                    action: 'validateUser',
                    email: email,
                    password: password
                })
            });

            console.log('✅ User validated successfully');
            return data;
            
        } catch (error) {
            console.error('❌ User validation failed:', error);
            throw error;
        }
    }

    /**
     * Fallback to test data if Power Automate is not available
     * Remove this in production or when PA is fully configured
     */
    async getTestData() {
        if (!this.config.enableFallback) {
            throw new Error('Power Automate unavailable and fallback disabled');
        }
        
        console.log('⚠️ Using fallback test data - remove in production');
        try {
            const response = await fetch('../asset/data/test-data.json');
            if (response.ok) {
                const data = await response.json();
                console.log(`📋 Loaded ${data.length} test records`);
                return data;
            }
        } catch (error) {
            console.warn('No test data available:', error);
        }
        return [];
    }
}

// Global instance
window.powerAutomateAPI = new PowerAutomateAPI();