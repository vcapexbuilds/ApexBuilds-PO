/**
 * Power Automate Configuration
 * Update these URLs with your actual Power Automate flow endpoints
 */
window.POWER_AUTOMATE_CONFIG = {
    // Main PO operations
    endpoints: {
        // GET all purchase orders
        getAllPOs: 'https://prod-XX.eastus.logic.azure.com/workflows/XXXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXXX',
        
        // GET user-specific purchase orders
        getUserPOs: 'https://prod-XX.eastus.logic.azure.com/workflows/XXXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXXX',
        
        // POST create new purchase order
        createPO: 'https://prod-XX.eastus.logic.azure.com/workflows/XXXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXXX',
        
        // PUT update existing purchase order
        updatePO: 'https://prod-XX.eastus.logic.azure.com/workflows/XXXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXXX',
        
        // DELETE purchase order
        deletePO: 'https://prod-XX.eastus.logic.azure.com/workflows/XXXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXXX',
        
        // GET purchase order document (PDF, Excel, etc.)
        getPODocument: 'https://prod-XX.eastus.logic.azure.com/workflows/XXXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXXX',
        
        // POST upload document/attachment
        uploadDocument: 'https://prod-XX.eastus.logic.azure.com/workflows/XXXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXXX',
        
        // POST validate user credentials
        validateUser: 'https://prod-XX.eastus.logic.azure.com/workflows/XXXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXXX',
        
        // GET user data and permissions
        getUserData: 'https://prod-XX.eastus.logic.azure.com/workflows/XXXXXX/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=XXXXXX'
    },
    
    // Request settings
    settings: {
        timeout: 30000, // 30 seconds
        retryAttempts: 3,
        retryDelay: 1000, // 1 second
        enableFallback: true, // Use test data if PA unavailable
        
        // Headers for all requests
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
    },
    
    // Expected response structure from Power Automate
    responseSchema: {
        success: true,      // boolean
        data: {},          // object or array
        error: null,       // string if success=false
        timestamp: '',     // ISO string
        source: 'pa'       // 'pa' for Power Automate
    },
    
    // Request payload structure to Power Automate
    requestSchema: {
        action: '',        // string: 'getAllPOs', 'createPO', etc.
        data: {},          // object: the main data payload
        user: {},          // object: current user info
        timestamp: '',     // ISO string
        requestId: ''      // string: unique request identifier
    }
};

/**
 * Update Power Automate endpoints programmatically
 */
window.updatePowerAutomateEndpoints = function(newEndpoints) {
    console.log('🔧 Updating Power Automate endpoints...');
    Object.assign(window.POWER_AUTOMATE_CONFIG.endpoints, newEndpoints);
    
    // Update the API instance if it exists
    if (window.powerAutomateAPI) {
        Object.assign(window.powerAutomateAPI.endpoints, newEndpoints);
        console.log('✅ Power Automate API endpoints updated');
    }
};

console.log('⚙️ Power Automate configuration loaded');
console.log('📋 Endpoints configured:', Object.keys(window.POWER_AUTOMATE_CONFIG.endpoints).length);
console.log('🔗 Update endpoints using: window.updatePowerAutomateEndpoints({...})');
