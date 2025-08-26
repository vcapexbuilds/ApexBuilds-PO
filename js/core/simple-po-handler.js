/**
 * S    async submitPO(formData) {
        console.log('📋 Starting PO submission...');
        
        try {PO Form Submission Handler
 * Uses available Power Automate API or local storage as fallback
 */
window.SimplePOHandler = {
    
    /**
     * Submit PO form data
     */
    async submitPO(formData) {
        console.log('� DEBUG: SimplePOHandler.submitPO called');
        console.log('🔍 Form data received:', formData);
        console.log('�📋 SimplePOHandler: Starting PO submission...');
        
        try {
            // Generate PO number
            const poNumber = this.generatePONumber();
            const now = new Date();
            
            // Get current user info (try async first, fallback to sync)
            let currentUser = null;
            try {
                currentUser = await this.getCurrentUserInfo();
                console.log('✅ Async user retrieval successful:', currentUser);
            } catch (error) {
                console.warn('Could not get async user info, using sync fallback:', error);
                currentUser = this.getCurrentUser();
                console.log('✅ Sync user retrieval result:', currentUser);
            }
            
            // Ensure we have a valid user object
            if (!currentUser || typeof currentUser !== 'object') {
                console.warn('⚠️ Invalid user object, creating default');
                currentUser = {
                    username: 'System User',
                    email: 'system@apexbuilding.com',
                    role: 'user'
                };
            }
            
            // Ensure required fields exist
            if (!currentUser.username) currentUser.username = 'System User';
            if (!currentUser.email) currentUser.email = 'system@apexbuilding.com';
            if (!currentUser.role) currentUser.role = 'user';
            
                // Build submittedBy section with guaranteed valid data
                const submittedByUser = {
                    username: currentUser.username || 'System User',
                    email: currentUser.email || 'system@apexbuilding.com',
                    role: currentUser.role || 'user',
                    submittedAt: now.toISOString()
                };
                
                console.log('👤 Final submittedBy data (guaranteed valid):', submittedByUser);            // Format data according to your Power Automate schema
            const submissionData = {
                poNumber: poNumber,
                meta: {
                    projectName: formData.projectName || '',
                    generalContractor: formData.generalContractor || '',
                    address: formData.address || '',
                    owner: formData.owner || '',
                    apexOwner: formData.apexOwner || '',
                    typeStatus: formData.typeStatus || '',
                    projectManager: formData.projectManager || '',
                    contractAmount: parseInt(formData.contractAmount) || 0,
                    addAltAmount: parseInt(formData.addAltAmount) || 0,
                    addAltDetails: formData.addAltDetails || '',
                    retainagePct: parseInt(formData.retainagePct) || 0,
                    requestedBy: formData.requestedBy || '',
                    companyName: formData.companyName || '',
                    contactName: formData.contactName || '',
                    cellNumber: formData.cellNumber || '',
                    email: formData.email || '',
                    officeNumber: formData.officeNumber || '',
                    vendorType: formData.vendorType || '',
                    workType: formData.workType || '',
                    importantDates: {
                        noticeToProceed: formData.noticeToProceed || '',
                        anticipatedStart: formData.anticipatedStart || '',
                        substantialCompletion: formData.substantialCompletion || '',
                        hundredPercent: formData.hundredPercent || ''
                    }
                },
                schedule: formData.schedule || [],
                scope: formData.scope || [],
                createdAt: now.toISOString(),
                sent: true,
                status: 'submitted',
                importance: formData.importance || 'normal',
                timestamp: now.getTime(),
                id: now.getTime(), // Simple ID generation
                sentAt: now.toISOString(),
                submittedBy: submittedByUser
            };
            
            console.log('💾 Submission data prepared:', submissionData);
            console.log('👤 submittedBy section specifically:', submissionData.submittedBy);
            
            // STRICT Power Automate submission only - no local storage fallback
            if (!window.POWER_AUTOMATE_CONFIG) {
                throw new Error('Power Automate configuration not found. System requires centralized processing.');
            }
            
            console.log('🔄 Submitting to Power Automate (centralized processing)...');
            const result = await this.submitToPowerAutomate(submissionData);
            
            if (!result || !result.success) {
                throw new Error(result?.error || 'Power Automate submission failed');
            }
            
            console.log('✅ Power Automate submission successful - centralized processing complete');
            return result;
            
        } catch (error) {
            console.error('❌ PO submission error:', error);
            return {
                success: false,
                error: error.message,
                poNumber: null
            };
        }
    },
    
    /**
     * Submit to Power Automate using your actual endpoint (STRICT MODE - no fallback)
     */
    async submitToPowerAutomate(data) {
        const config = window.POWER_AUTOMATE_CONFIG?.endpoints;
        
        // Strict validation - must have Power Automate configured
        if (!config || !config.createPO) {
            throw new Error('Power Automate configuration missing. Centralized processing requires Power Automate endpoint.');
        }
        
        if (config.createPO.includes('XXXXXX') || config.createPO.includes('placeholder')) {
            throw new Error('Power Automate endpoint not properly configured. Cannot process without centralized system.');
        }
        
        console.log('🚀 STRICT MODE: Submitting PO to Power Automate (centralized processing only)...');
        console.log('📡 Endpoint:', config.createPO.substring(0, 80) + '...');
        
        try {
            // Make direct HTTP request to your Power Automate endpoint
            const response = await fetch(config.createPO, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(data)
            });
            
            console.log('📡 Power Automate response status:', response.status);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('❌ Power Automate error response:', errorText);
                throw new Error(`Centralized processing failed: ${response.status} ${response.statusText}. ${errorText}`);
            }
            
            // Try to parse response as JSON
            let responseData;
            try {
                const responseText = await response.text();
                if (responseText.trim()) {
                    responseData = JSON.parse(responseText);
                } else {
                    // Empty response is considered success for Power Automate
                    responseData = { success: true, message: 'PO processed centrally' };
                }
            } catch (parseError) {
                console.warn('⚠️ Could not parse response as JSON, treating as success');
                responseData = { success: true, message: 'PO processed centrally' };
            }
            
            console.log('✅ PO submitted to Power Automate (centralized) successfully');
            
            return {
                success: true,
                poNumber: data.poNumber,
                storage: 'power-automate-strict',
                message: 'PO submitted to centralized Power Automate system',
                endpoint: config.createPO.substring(0, 50) + '...',
                data: responseData,
                processingMode: 'centralized-only'
            };
            
        } catch (error) {
            console.error('❌ Centralized Power Automate submission error:', error);
            throw new Error(`Centralized processing failed: ${error.message}. No local fallback available.`);
        }
    },
    
    /**
     * Generate unique PO number
     */
    generatePONumber() {
        const date = new Date();
        const year = date.getFullYear().toString().slice(-2);
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const time = date.getHours().toString().padStart(2, '0') + 
                    date.getMinutes().toString().padStart(2, '0');
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        
        return `APEX-${year}${month}${day}-${time}-${random}`;
    },
    
    /**
     * Get current user info from Microsoft OAuth authentication
     */
    async getCurrentUserInfo() {
        console.log('🔍 Getting current user info...');
        
        // Try to get user from Microsoft OAuth first
        if (window.MicrosoftAuthConfig && window.MicrosoftAuthConfig.isAuthenticated()) {
            try {
                console.log('🔐 Microsoft Auth is authenticated, getting user info...');
                const msUserInfo = await window.MicrosoftAuthConfig.getUserInfo();
                console.log('📋 Microsoft user info received:', msUserInfo);
                
                if (msUserInfo) {
                    const user = {
                        username: msUserInfo.displayName || msUserInfo.name || msUserInfo.userPrincipalName || 'Unknown User',
                        email: msUserInfo.userPrincipalName || msUserInfo.mail || msUserInfo.email || 'unknown@apexbuilding.com',
                        role: 'user' // Default role - you can enhance this based on your business logic
                    };
                    console.log('✅ Processed Microsoft user for submission:', user);
                    return user;
                }
            } catch (error) {
                console.warn('❌ Could not get Microsoft user info:', error);
            }
        } else {
            console.log('⚠️ Microsoft Auth not available or not authenticated');
        }
        
        // Fallback to storage module
        if (window.storage && typeof window.storage.getCurrentUser === 'function') {
            console.log('🔍 Trying storage module...');
            const user = window.storage.getCurrentUser();
            if (user) {
                console.log('📋 Storage user found:', user);
                return {
                    username: user.username || user.name || 'Unknown User',
                    email: user.email || 'unknown@apexbuilding.com', 
                    role: user.role || 'user'
                };
            }
        }
        
        // Fallback to auth module
        if (window.auth && typeof window.auth.getCurrentUser === 'function') {
            console.log('🔍 Trying auth module...');
            const user = window.auth.getCurrentUser();
            if (user) {
                console.log('📋 Auth user found:', user);
                return {
                    username: user.username || user.name || 'Unknown User',
                    email: user.email || 'unknown@apexbuilding.com',
                    role: user.role || 'user'
                };
            }
        }
        
        // Fallback to localStorage
        console.log('🔍 Trying localStorage...');
        try {
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                const user = JSON.parse(stored);
                console.log('📋 localStorage user found:', user);
                if (user) {
                    return {
                        username: user.username || user.name || 'Unknown User',
                        email: user.email || 'unknown@apexbuilding.com',
                        role: user.role || 'user'
                    };
                }
            }
        } catch (error) {
            console.warn('Error parsing currentUser from localStorage:', error);
        }
        
        // Return default user if nothing found
        console.log('⚠️ No user found anywhere, using default');
        return { 
            username: 'Default User',
            email: 'user@apexbuilding.com',
            role: 'user'
        };
    },
    
    /**
     * Get current user info (synchronous wrapper)
     */
    getCurrentUser() {
        console.log('🔍 getCurrentUser (sync) called...');
        
        // For synchronous calls, try storage first
        if (window.storage && typeof window.storage.getCurrentUser === 'function') {
            console.log('🔍 Checking storage module...');
            const user = window.storage.getCurrentUser();
            if (user) {
                console.log('✅ Storage user found:', user);
                return user;
            }
        }
        
        // Try auth module
        if (window.auth && typeof window.auth.getCurrentUser === 'function') {
            console.log('🔍 Checking auth module...');
            const user = window.auth.getCurrentUser();
            if (user) {
                console.log('✅ Auth user found:', user);
                return user;
            }
        }
        
        // Fallback to localStorage
        console.log('🔍 Checking localStorage...');
        try {
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                const user = JSON.parse(stored);
                console.log('✅ localStorage user found:', user);
                if (user) return user;
            }
        } catch (error) {
            console.warn('Error parsing currentUser from localStorage:', error);
        }
        
        // Return default demo user if nothing found
        console.log('⚠️ No user found, returning default');
        const defaultUser = { 
            username: 'Default User',
            email: 'user@apexbuilding.com',
            role: 'user'
        };
        console.log('📋 Default user:', defaultUser);
        return defaultUser;
    },
    
    /**
     * Collect form data from the form and map to your JSON schema
     */
    collectFormData() {
        const form = document.getElementById('poForm');
        if (!form) {
            throw new Error('Form with ID "poForm" not found');
        }
        
        const formData = new FormData(form);
        const data = {};
        
        // Extract all form fields
        for (const [key, value] of formData.entries()) {
            if (value && value.trim && value.trim() !== '') {
                data[key] = value.trim();
            } else if (value !== null && value !== undefined && value !== '') {
                data[key] = value;
            }
        }
        
        console.log('📋 Raw form data collected:', data);
        
        // Collect schedule items (if dynamic form module is available)
        let scheduleItems = [];
        try {
            if (window.dynamicForm && typeof window.dynamicForm.getScheduleData === 'function') {
                scheduleItems = window.dynamicForm.getScheduleData();
            } else {
                // Simple fallback - collect any schedule-related inputs
                scheduleItems = this.collectScheduleItems();
            }
        } catch (error) {
            console.warn('Error collecting schedule items:', error);
            scheduleItems = [];
        }
        
        // Collect scope items (if available)
        let scopeItems = [];
        try {
            if (window.dynamicForm && typeof window.dynamicForm.getScopeData === 'function') {
                scopeItems = window.dynamicForm.getScopeData();
            } else {
                // Simple fallback
                scopeItems = this.collectScopeItems();
            }
        } catch (error) {
            console.warn('Error collecting scope items:', error);
            scopeItems = [];
        }
        
        // Add collected arrays to data
        data.schedule = scheduleItems;
        data.scope = scopeItems;
        
        console.log('✅ Complete form data with schedule and scope:', data);
        return data;
    },
    
    /**
     * Simple schedule collection fallback
     */
    collectScheduleItems() {
        const scheduleInputs = document.querySelectorAll('[name*="schedule"], [name*="primeLine"], [name*="budgetCode"], [name*="qty"], [name*="unit"], [name*="totalCost"], [name*="apexContractValue"], [name*="profit"]');
        const items = [];
        
        // Look for schedule table or dynamic inputs
        const scheduleRows = document.querySelectorAll('.schedule-row, .dynamic-row, tr[data-schedule]');
        
        scheduleRows.forEach((row, index) => {
            const item = {
                primeLine: this.getInputValue(row, '[name*="primeLine"], [data-field="primeLine"]') || '',
                budgetCode: this.getInputValue(row, '[name*="budgetCode"], [data-field="budgetCode"]') || '',
                description: this.getInputValue(row, '[name*="description"], [data-field="description"]') || '',
                qty: parseInt(this.getInputValue(row, '[name*="qty"], [data-field="qty"]')) || 0,
                unit: parseInt(this.getInputValue(row, '[name*="unit"], [data-field="unit"]')) || 0,
                totalCost: parseInt(this.getInputValue(row, '[name*="totalCost"], [data-field="totalCost"]')) || 0,
                scheduled: parseInt(this.getInputValue(row, '[name*="scheduled"], [data-field="scheduled"]')) || 0,
                apexContractValue: parseInt(this.getInputValue(row, '[name*="apexContractValue"], [data-field="apexContractValue"]')) || 0,
                profit: parseInt(this.getInputValue(row, '[name*="profit"], [data-field="profit"]')) || 0
            };
            
            // Only add if there's some meaningful data
            if (item.description || item.budgetCode || item.primeLine) {
                items.push(item);
            }
        });
        
        return items;
    },
    
    /**
     * Simple scope collection fallback
     */
    collectScopeItems() {
        const scopeInputs = document.querySelectorAll('[name*="scope"], [name*="included"], [name*="excluded"]');
        const items = [];
        
        // Look for scope table or dynamic inputs
        const scopeRows = document.querySelectorAll('.scope-row, .scope-item, tr[data-scope]');
        
        scopeRows.forEach((row, index) => {
            const item = {
                item: this.getInputValue(row, '[name*="item"], [data-field="item"]') || '',
                description: this.getInputValue(row, '[name*="description"], [data-field="description"]') || '',
                included: this.getCheckboxValue(row, '[name*="included"], [data-field="included"]'),
                excluded: this.getCheckboxValue(row, '[name*="excluded"], [data-field="excluded"]')
            };
            
            // Only add if there's some meaningful data
            if (item.item || item.description) {
                items.push(item);
            }
        });
        
        return items;
    },
    
    /**
     * Helper to get input value from a row
     */
    getInputValue(row, selector) {
        if (!row) return '';
        const input = row.querySelector(selector);
        return (input && input.value) ? input.value : '';
    },
    
    /**
     * Helper to get checkbox value from a row
     */
    getCheckboxValue(row, selector) {
        if (!row) return false;
        const input = row.querySelector(selector);
        return (input && input.checked) ? input.checked : false;
    }
};

console.log('📋 Simple PO Handler loaded and ready');
