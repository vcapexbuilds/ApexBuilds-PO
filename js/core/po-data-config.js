/**
 * Power Automate Configuration for PO Data Management
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a Power Automate flow with HTTP trigger
 * 2. Replace the URLs below with your actual flow URLs
 * 3. Ensure your flow returns JSON in the expected format
 */

window.PO_DATA_CONFIG = {
    // Power Automate HTTP trigger URL for fetching PO data
    // Your flow should accept POST requests with this payload:
    // {
    //   "action": "fetch_pos",
    //   "timestamp": "2025-08-26T14:30:15.234Z",
    //   "user": { "username": "...", "email": "...", "role": "..." }
    // }
    // NOTE: Filters are NOT sent to Power Automate - they are applied client-side
    FETCH_ENDPOINT: 'https://defaulta543e2f6ae4b4d1db263a38786ce68.44.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/61439310bdc243fc86369acaafe55125/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=vUQgXsDVJ6r1s4my2mzZP_opej1KCtJiJx-sM9TqySo',
    
    // Expected response format from Power Automate:
    // {
    //   "success": true,
    //   "pos": [
    //     {
    //       "id": "1724684215234",
    //       "poNumber": "APEX-250826-1430-001",
    //       "status": "submitted",
    //       "createdAt": "2025-08-26T14:30:15.234Z",
    //       "meta": {
    //         "projectName": "Downtown Office Complex Phase 2",
    //         "companyName": "Premier Subcontractors Inc",
    //         "contractAmount": 2500000,
    //         ...
    //       },
    //       "submittedBy": {
    //         "username": "John Smith",
    //         "email": "john.smith@apexbuilding.com"
    //       },
    //       "schedule": [...],
    //       "scope": [...]
    //     }
    //   ],
    //   "total": 1,
    //   "timestamp": "2025-08-26T14:30:15.234Z"
    // }
    
    // Optional: Separate endpoint for individual PO details
    GET_PO_ENDPOINT: 'https://prod-XX.eastus.logic.azure.com:443/workflows/YOUR_GETPO_WORKFLOW_ID/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=YOUR_GETPO_SIGNATURE',
    
    // Optional: Endpoint for updating PO status
    UPDATE_PO_ENDPOINT: 'https://prod-XX.eastus.logic.azure.com:443/workflows/YOUR_UPDATE_WORKFLOW_ID/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=YOUR_UPDATE_SIGNATURE',
    
    // Cache settings
    CACHE_DURATION: 600000, // 10 minutes
    
    // Auto-refresh settings
    AUTO_REFRESH_INTERVAL: 300000, // 5 minutes
    AUTO_REFRESH_ENABLED: false,
    
    // Request timeout
    REQUEST_TIMEOUT: 30000, // 30 seconds
    
    // Debug mode
    DEBUG_MODE: false
};

/**
 * POWER AUTOMATE FLOW SETUP GUIDE:
 * 
 * 1. CREATE FETCH PO FLOW:
 *    - Trigger: "When a HTTP request is received"
 *    - Method: POST
 *    - Add actions to:
 *      a) Parse the request body JSON
 *      b) Query your data source (SharePoint, SQL, etc.)
 *      c) Filter based on user and criteria
 *      d) Format response as JSON
 *      e) Return HTTP response with PO array
 * 
 * 2. SAMPLE FLOW ACTIONS:
 *    - Parse JSON (use the request payload schema above)
 *    - Get items from SharePoint/SQL where:
 *      - If filters.myPOsOnly: submittedBy.email = user.email
 *      - If filters.status: status = filters.status
 *      - If filters.dateFrom/dateTo: created between dates
 *    - Select/Transform items to match expected JSON structure
 *    - Response: Return JSON with success=true and pos array
 * 
 * 3. TEST YOUR FLOW:
 *    - Use the "Test" feature in Power Automate
 *    - Send sample request payload
 *    - Verify response matches expected format
 *    - Copy the HTTP trigger URL to FETCH_ENDPOINT above
 */
