/**
 * S    async submitPO(formData) {
        console.log('📋 Starting PO submission...');
        
        try {PO Form Submission Handler
 * Uses available Power Automate API or local storage as fallback
 */
window.SimplePOHandler = {
    
    /**
     * Safe parsing functions for data type conversion
     */
    safeParseInt(value) {
        if (!value || value === '' || value === null || value === undefined) {
            return 0;
        }
        const parsed = parseInt(value, 10);
        return isNaN(parsed) ? 0 : parsed;
    },
    
    safeParseFloat(value) {
        if (!value || value === '' || value === null || value === undefined) {
            return 0;
        }
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    },
    
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
                    contractAmount: this.safeParseFloat(formData.contractAmount),
                    addAltAmount: this.safeParseFloat(formData.addAltAmount),
                    addAltDetails: formData.addAltDetails || '',
                    retainagePct: this.safeParseFloat(formData.retainagePct),
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
                timestamp: Math.floor(now.getTime() / 1000), // Convert to seconds (integer)
                id: Math.floor(now.getTime() / 1000), // Simple ID generation as integer
                sentAt: now.toISOString(),
                submittedBy: submittedByUser
            };
            
            console.log('💾 Submission data prepared:', submissionData);
            console.log('👤 submittedBy section specifically:', submissionData.submittedBy);
            console.log('🔍 Data types check:', {
                contractAmount: typeof submissionData.meta.contractAmount,
                addAltAmount: typeof submissionData.meta.addAltAmount,
                retainagePct: typeof submissionData.meta.retainagePct,
                timestamp: typeof submissionData.timestamp,
                id: typeof submissionData.id,
                scheduleItemsCount: submissionData.schedule.length,
                firstScheduleItem: submissionData.schedule[0] ? {
                    qty: typeof submissionData.schedule[0].qty,
                    totalCost: typeof submissionData.schedule[0].totalCost,
                    scheduled: typeof submissionData.schedule[0].scheduled,
                    apexContractValue: typeof submissionData.schedule[0].apexContractValue,
                    profit: typeof submissionData.schedule[0].profit
                } : 'No schedule items'
            });
            
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
        const items = [];
        
        // Look for schedule table tbody
        const scheduleTable = document.getElementById('scheduleItems');
        if (!scheduleTable) {
            console.warn('No schedule table found');
            return items;
        }
        
        const scheduleRows = scheduleTable.querySelectorAll('tr');
        
        scheduleRows.forEach((row, index) => {
            // Get values using the actual field names from emergency-button-fix.js
            const primeLine = this.getInputValue(row, '[name="primeLine[]"]');
            const budgetCode = this.getInputValue(row, '[name="budgetCode[]"]');
            const description = this.getInputValue(row, '[name="description[]"]');
            const quantity = this.getInputValue(row, '[name="quantity[]"]');
            const unit = this.getInputValue(row, '[name="unit[]"]');
            const totalCost = this.getInputValue(row, '[name="totalCost[]"]');
            const scheduled = this.getInputValue(row, '[name="scheduled[]"]');
            const apexContractValue = this.getInputValue(row, '[name="apexContractValue[]"]');
            const profit = this.getInputValue(row, '[name="profit[]"]');
            
            // Only add if there's some meaningful data
            if (primeLine || budgetCode || description) {
                const item = {
                    primeLine: primeLine || '',
                    budgetCode: budgetCode || '',
                    description: description || '',
                    qty: this.safeParseFloat(quantity),
                    unit: unit || '',
                    totalCost: this.safeParseFloat(totalCost),
                    scheduled: this.safeParseInt(scheduled),
                    apexContractValue: this.safeParseFloat(apexContractValue),
                    profit: this.safeParseFloat(profit)
                };
                
                console.log(`Schedule item ${index + 1}:`, item);
                items.push(item);
            }
        });
        
        console.log('Collected schedule items:', items);
        return items;
    },
    
    /**
     * Simple scope collection fallback
     */
    collectScopeItems() {
        const items = [];
        
        // Look for scope table tbody
        const scopeTable = document.getElementById('scopeItems');
        if (!scopeTable) {
            console.warn('No scope table found');
            return items;
        }
        
        const scopeRows = scopeTable.querySelectorAll('tr');
        
        scopeRows.forEach((row, index) => {
            // Get values using the actual field names from emergency-button-fix.js
            const itemNumber = this.getInputValue(row, '[name="scopeItemNumber[]"]');
            const description = this.getInputValue(row, '[name="scopeDescription[]"]');
            
            // Handle radio buttons for status (included/excluded)
            const includedRadio = row.querySelector('[name*="scopeStatus_"][value="included"]');
            const excludedRadio = row.querySelector('[name*="scopeStatus_"][value="excluded"]');
            
            const included = includedRadio && includedRadio.checked;
            const excluded = excludedRadio && excludedRadio.checked;
            
            // Only add if there's some meaningful data
            if (itemNumber || description) {
                const item = {
                    item: this.safeParseInt(itemNumber), // Convert to integer
                    description: description || '',
                    included: Boolean(included),
                    excluded: Boolean(excluded)
                };
                
                console.log(`Scope item ${index + 1}:`, item);
                items.push(item);
            }
        });
        
        console.log('Collected scope items:', items);
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
