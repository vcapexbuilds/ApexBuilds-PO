/**
 * PO Data Manager - Handles fetching and displaying PO data from Power Automate
 */
class PODataManager {
    constructor() {
        console.log('🔧 Initializing PO Data Manager...');
        console.log('🌍 Window objects available:', {
            'PO_DATA_CONFIG': !!window.PO_DATA_CONFIG,
            'PODataManager': !!window.PODataManager,
            'fetch': !!window.fetch
        });
        
        // Load configuration
        this.config = window.PO_DATA_CONFIG || {};
        
        // Power Automate endpoint for fetching PO data
        this.FETCH_PO_ENDPOINT = this.config.FETCH_ENDPOINT || 'https://prod-XX.eastus.logic.azure.com:443/workflows/YOUR_WORKFLOW_ID/triggers/manual/paths/invoke?api-version=2016-06-01&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=YOUR_SIGNATURE';
        
        if (this.FETCH_PO_ENDPOINT.includes('YOUR_WORKFLOW_ID')) {
            console.warn('⚠️ Power Automate endpoint not configured! Please update po-data-config.js');
        }
        
        this.isLoading = false;
        this.lastFetchTime = null;
        this.cachedData = null;
        this.cacheTimeout = this.config.CACHE_DURATION || 600000; // 10 minutes cache
        this.debugMode = this.config.DEBUG_MODE || false;
        
        this.init();
    }
    
    init() {
        console.log('✅ PO Data Manager initialized');
        
        // Set up refresh button event listener
        const refreshBtn = document.getElementById('refreshList');
        if (refreshBtn) {
            console.log('🔧 PODataManager: Setting up refresh button event listener');
            refreshBtn.addEventListener('click', () => {
                console.log('🔄 PODataManager: Refresh button clicked - clearing cache and fetching fresh data');
                
                // Clear localStorage cache
                this.clearCache();
                
                // Force refresh from Power Automate
                this.fetchAndDisplayPOs(true); 
            });
        } else {
            console.warn('⚠️ PODataManager: Refresh button not found!');
        }
        
        // Set up filter event listeners for client-side filtering
        this.setupFilterListeners();
        
        // Auto-fetch on page load
        this.fetchAndDisplayPOs(false);
    }
    
    /**
     * Setup filter event listeners for client-side filtering
     */
    setupFilterListeners() {
        const filterElements = [
            'myPOsOnly',
            'statusFilter', 
            'dateFrom',
            'dateTo',
            'projectFilter'
        ];
        
        filterElements.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener('change', () => {
                    console.log('🔍 Filter changed - applying client-side filtering');
                    this.applyClientFiltersAndDisplay();
                });
                
                if (element.type === 'text') {
                    element.addEventListener('input', () => {
                        console.log('🔍 Search input changed - applying client-side filtering');
                        this.applyClientFiltersAndDisplay();
                    });
                }
            }
        });
        
        // Apply filters button
        const applyBtn = document.getElementById('applyFilters');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                console.log('🔍 Apply filters clicked - applying client-side filtering');
                this.applyClientFiltersAndDisplay();
            });
        }
        
        // Clear filters button  
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                console.log('🧹 Clear filters clicked');
                this.clearFilters();
                this.applyClientFiltersAndDisplay();
            });
        }
    }
    
    /**
     * Fetch PO data from Power Automate
     * @param {boolean} forceRefresh - Skip cache and force fresh data from Power Automate
     */
    async fetchAndDisplayPOs(forceRefresh = false) {
        console.log('🚀 fetchAndDisplayPOs called with forceRefresh:', forceRefresh);
        console.log('📍 Current endpoint:', this.FETCH_PO_ENDPOINT);
        console.log('🔍 Endpoint check result:', this.FETCH_PO_ENDPOINT.includes('YOUR_WORKFLOW_ID') ? 'DEMO MODE' : 'LIVE MODE');
        
        try {
            // Check cache first - only refresh fetches from Power Automate
            if (!forceRefresh && this.cachedData && this.isCacheValid()) {
                console.log('📦 Using cached data (valid for 10 minutes or until refresh button clicked)');
                this.applyClientFiltersAndDisplay();
                return;
            }
            
            if (this.isLoading) {
                console.log('⏳ Already fetching data, skipping...');
                return;
            }
            
            this.isLoading = true;
            this.showLoadingState();
            
            console.log('🌐 Fetching fresh PO data from Power Automate...');
            
            // DEMO MODE: Use sample data if endpoint not configured
            if (this.FETCH_PO_ENDPOINT.includes('YOUR_WORKFLOW_ID')) {
                console.log('🎭 Using demo data (Power Automate not configured)');
                const demoData = this.getDemoData();
                setTimeout(() => {
                    this.cachedData = demoData;
                    this.lastFetchTime = new Date();
                    this.applyClientFiltersAndDisplay();
                    console.log('✅ Demo data cached and displayed successfully');
                }, 1000); // Simulate network delay
                return;
            }
            
            // Get current user info for Power Automate request
            const currentUser = this.getCurrentUser();
            
            // Prepare request payload - ONLY send user info, no filters
            const requestPayload = {
                action: 'fetch_pos',
                timestamp: new Date().toISOString(),
                user: currentUser
            };
            
            console.log('📤 Sending request to Power Automate (user info only):', requestPayload);
            console.log('🔗 Power Automate URL:', this.FETCH_PO_ENDPOINT);
            
            // Make request to Power Automate
            const response = await fetch(this.FETCH_PO_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestPayload)
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const rawData = await response.json();
            console.log('📥 Received raw data from Power Automate:', rawData);
            
            // Handle different response formats
            let data = rawData;
            
            // If response has statusCode wrapper, extract the body
            if (rawData.statusCode && rawData.body) {
                console.log('🔧 Detected statusCode wrapper, extracting body...');
                data = rawData.body;
                console.log('📦 Extracted body data:', data);
            }
            
            // Validate response structure
            if (!data || !Array.isArray(data.pos)) {
                throw new Error('Invalid response format from Power Automate');
            }
            
            // Process and clean the PO data
            data.pos = data.pos.map(po => this.processPoData(po));
            
            // Cache the processed data
            this.cachedData = data;
            this.lastFetchTime = new Date();
            
            // Apply client-side filters and display
            this.applyClientFiltersAndDisplay();
            
            console.log('✅ PO data fetched, cached, and displayed successfully');
            
        } catch (error) {
            console.error('❌ Error fetching PO data:', error);
            console.error('❌ Error details:', {
                name: error.name,
                message: error.message,
                stack: error.stack,
                endpoint: this.FETCH_PO_ENDPOINT
            });
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
            this.hideLoadingState();
        }
    }
    
    /**
     * Apply client-side filters and display filtered results
     */
    /**
     * Process individual PO data from Power Automate format
     * Handles JSON string parsing for meta and submittedBy fields
     */
    processPoData(po) {
        try {
            // Parse meta field if it's a JSON string
            if (typeof po.meta === 'string') {
                try {
                    const parsedMeta = JSON.parse(po.meta);
                    po.meta = parsedMeta;
                } catch (e) {
                    po.meta = {}; // Default to empty object
                }
            } else if (!po.meta || typeof po.meta !== 'object') {
                po.meta = {};
            }
            
            // Parse submittedBy field if it's a JSON string
            if (typeof po.submittedBy === 'string') {
                try {
                    const parsedSubmittedBy = JSON.parse(po.submittedBy);
                    po.submittedBy = parsedSubmittedBy;
                } catch (e) {
                    po.submittedBy = {}; // Default to empty object
                }
            } else if (!po.submittedBy || typeof po.submittedBy !== 'object') {
                po.submittedBy = {};
            }
            
            // Ensure schedule and scope are arrays
            if (!Array.isArray(po.schedule)) {
                po.schedule = [];
            }
            if (!Array.isArray(po.scope)) {
                po.scope = [];
            }
            
            return po;
            
        } catch (error) {
            console.error('❌ Error processing PO data:', error);
            return po; // Return original data if processing fails
        }
    }

    applyClientFiltersAndDisplay() {
        if (!this.cachedData || !this.cachedData.pos) {
            console.log('⚠️ No cached data available for filtering');
            return;
        }
        
        const filters = this.getCurrentFilters();
        const currentUser = this.getCurrentUser();
        
        console.log('🔍 Applying client-side filters:', filters);
        
        let filteredPOs = [...this.cachedData.pos];
        
        // Filter: My POs only
        if (filters.myPOsOnly && currentUser && currentUser.email) {
            filteredPOs = filteredPOs.filter(po => 
                po.submittedBy && po.submittedBy.email === currentUser.email
            );
        }
        
        // Filter: Status
        if (filters.status) {
            filteredPOs = filteredPOs.filter(po => 
                po.status && po.status.toLowerCase() === filters.status.toLowerCase()
            );
        }
        
        // Filter: Date range
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom);
            filteredPOs = filteredPOs.filter(po => {
                const poDate = new Date(po.createdAt);
                return poDate >= fromDate;
            });
        }
        
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999); // End of day
            filteredPOs = filteredPOs.filter(po => {
                const poDate = new Date(po.createdAt);
                return poDate <= toDate;
            });
        }
        
        // Filter: Project name search
        if (filters.project) {
            const searchTerm = filters.project.toLowerCase();
            filteredPOs = filteredPOs.filter(po => 
                po.meta && po.meta.projectName && 
                po.meta.projectName.toLowerCase().includes(searchTerm)
            );
        }
        
        // Create filtered data object
        const filteredData = {
            ...this.cachedData,
            pos: filteredPOs,
            filtered: true,
            originalTotal: this.cachedData.pos.length,
            filteredTotal: filteredPOs.length
        };
        
        console.log(`🔍 Filtered ${this.cachedData.pos.length} → ${filteredPOs.length} POs`);
        
        // Display filtered results
        this.displayPOs(filteredData);
    }
    
    /**
     * Clear all filters
     */
    clearFilters() {
        const filterElements = {
            'myPOsOnly': false,
            'statusFilter': '',
            'dateFrom': '',
            'dateTo': '',
            'projectFilter': ''
        };
        
        Object.keys(filterElements).forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = filterElements[id];
                } else {
                    element.value = filterElements[id];
                }
            }
        });
        
        console.log('🧹 All filters cleared');
    }
    displayPOs(data) {
        const poTableBody = document.getElementById('poTableBody');
        const poTable = document.getElementById('poTable');
        const emptyState = document.getElementById('emptyState');
        
        if (!poTableBody || !data.pos || data.pos.length === 0) {
            // Show empty state
            if (poTable) poTable.style.display = 'none';
            if (emptyState) {
                emptyState.style.display = 'block';
                if (data.filtered && data.originalTotal > 0) {
                    emptyState.innerHTML = `
                        <p>No purchase orders match your current filters.</p>
                        <p>Showing 0 of ${data.originalTotal} total POs</p>
                        <button onclick="window.poDataManager.clearFilters(); window.poDataManager.applyClientFiltersAndDisplay();" 
                                class="btn-secondary">Clear Filters</button>
                        <a href="/pages/form.html" class="btn-primary" style="margin-left: 10px;">Create New PO</a>
                    `;
                } else {
                    emptyState.innerHTML = `
                        <p>No purchase orders found.</p>
                        <a href="/pages/form.html" class="btn-primary">Create Your First PO</a>
                    `;
                }
            }
            this.updateStats({ totalPOs: 0, submittedPOs: 0, approvedPOs: 0, totalValue: 0 });
            return;
        }
        
        // Hide empty state, show table
        if (emptyState) emptyState.style.display = 'none';
        if (poTable) poTable.style.display = 'block';
        
        // Clear existing rows
        poTableBody.innerHTML = '';
        
        // Process and display each PO
        data.pos.forEach(po => {
            const row = this.createPOTableRow(po);
            poTableBody.appendChild(row);
        });
        
        // Update statistics
        this.updateStats(this.calculateStats(data.pos));
        
        // Show filter info if filtered
        if (data.filtered) {
            console.log(`📊 Displayed ${data.pos.length} filtered POs (${data.originalTotal} total in cache)`);
            this.showFilterInfo(data.filteredTotal, data.originalTotal);
        } else {
            console.log(`📊 Displayed ${data.pos.length} POs from cache`);
            this.hideFilterInfo();
        }
    }
    
    /**
     * Create a table row for a PO
     */
    createPOTableRow(po) {
        const row = document.createElement('tr');
        
        // Map your JSON structure to table columns
        const statusClass = this.getStatusClass(po.status);
        const formattedDate = this.formatDate(po.createdAt);
        
        // Handle empty strings and null/undefined values - show actual state from JSON
        const projectName = (po.meta?.projectName && po.meta.projectName.trim()) || 'N/A';
        const companyName = (po.meta?.companyName && po.meta.companyName.trim()) || 'N/A';
        const username = (po.submittedBy?.username && po.submittedBy.username.trim()) || 'N/A';
        
        // Handle contract amount - convert string to number if needed
        let contractAmount = 0;
        if (po.meta?.contractAmount && po.meta.contractAmount.toString().trim()) {
            const amount = parseFloat(po.meta.contractAmount);
            contractAmount = isNaN(amount) ? 0 : amount;
        }
        const formattedAmount = this.formatCurrency(contractAmount);
        
        // Enhance status display
        const statusDisplay = po.status || 'Draft';
        const statusIcon = this.getStatusIcon(statusDisplay);
        
        row.innerHTML = `
            <td><strong>${po.poNumber}</strong></td>
            <td title="Project: ${projectName}">${projectName}</td>
            <td title="Company: ${companyName}">${companyName}</td>
            <td><span class="status-badge ${statusClass}">${statusIcon} ${statusDisplay}</span></td>
            <td title="Created: ${formattedDate}">${formattedDate}</td>
            <td class="amount-cell" title="Contract Amount: ${formattedAmount}"><strong>${formattedAmount}</strong></td>
            <td title="Submitted by: ${username}">${username}</td>
            <td>
                <div class="action-buttons">
                    <button onclick="viewPO('${po.poNumber}')" class="btn-action" title="View Details">👁️</button>
                    <button onclick="editPO('${po.poNumber}')" class="btn-action" title="Edit PO">✏️</button>
                    <button onclick="downloadPO('${po.poNumber}')" class="btn-action" title="Download PDF">📥</button>
                </div>
            </td>
        `;
        
        return row;
    }

    /**
     * Get status icon for display
     */
    getStatusIcon(status) {
        const icons = {
            'submitted': '📤',
            'approved': '✅',
            'rejected': '❌',
            'pending': '⏳',
            'draft': '📝',
            'completed': '🎉'
        };
        return icons[status.toLowerCase()] || '📋';
    }
    
    /**
     * Update statistics display
     */
    updateStats(stats) {
        const elements = {
            totalPOs: document.getElementById('totalPOs'),
            submittedPOs: document.getElementById('submittedPOs'),
            approvedPOs: document.getElementById('approvedPOs'),
            totalValue: document.getElementById('totalValue')
        };
        
        Object.keys(elements).forEach(key => {
            if (elements[key]) {
                let value = stats[key];
                if (key === 'totalValue') {
                    value = this.formatCurrency(value);
                }
                elements[key].textContent = value;
            }
        });
    }
    
    /**
     * Calculate statistics from PO array
     */
    calculateStats(pos) {
        return {
            totalPOs: pos.length,
            submittedPOs: pos.filter(po => po.status === 'submitted').length,
            approvedPOs: pos.filter(po => po.status === 'approved').length,
            totalValue: pos.reduce((sum, po) => {
                let amount = 0;
                if (po.meta?.contractAmount) {
                    const parsed = parseFloat(po.meta.contractAmount);
                    amount = isNaN(parsed) ? 0 : parsed;
                }
                return sum + amount;
            }, 0)
        };
    }
    
    /**
     * Get current filter values
     */
    getCurrentFilters() {
        return {
            myPOsOnly: document.getElementById('myPOsOnly')?.checked || false,
            status: document.getElementById('statusFilter')?.value || '',
            dateFrom: document.getElementById('dateFrom')?.value || '',
            dateTo: document.getElementById('dateTo')?.value || '',
            project: document.getElementById('projectFilter')?.value || ''
        };
    }
    
    /**
     * Clear all cached data and localStorage
     */
    clearCache() {
        console.log('🗑️ Clearing PODataManager cache and localStorage...');
        
        // Clear internal cache
        this.cachedData = null;
        this.lastFetchTime = null;
        
        // Clear any PO-related localStorage items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('po-') || key.includes('POData') || key.includes('poCache'))) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('🗑️ Removed localStorage key:', key);
        });
        
        console.log('✅ Cache cleared successfully');
    }

    /**
     * Load test data with actual values for demonstration
     */
    async loadTestData() {
        try {
            const response = await fetch('./SAMPLE-PO-JSON.json');
            const samplePO = await response.json();
            
            // Create test response structure matching PA format
            const testResponse = {
                statusCode: "200",
                body: {
                    success: true,
                    pos: [
                        {
                            ...samplePO,
                            status: "submitted",
                            createdAt: new Date().toISOString(),
                            sentAt: new Date().toISOString(),
                            importance: "normal",
                            submittedBy: {
                                username: "john.doe",
                                email: "john.doe@apex.com",
                                firstName: "John",
                                role: "Project Manager",
                                microsoftId: "test-id-123",
                                source: "webapp",
                                isOAuth: true,
                                submittedAt: new Date().toISOString()
                            }
                        }
                    ],
                    totalCount: 1,
                    queryTime: new Date().toISOString()
                }
            };
            
            console.log('📊 Loading test data with actual values...');
            this.displayPOs(this.processPoData(testResponse));
            
        } catch (error) {
            console.error('❌ Error loading test data:', error);
            // Fallback to empty state
            this.displayPOs({ pos: [], filtered: false });
        }
    }

    /**
     * Get current user information
     */
    getCurrentUser() {
        try {
            const userStr = localStorage.getItem('currentUser');
            return userStr ? JSON.parse(userStr) : null;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }
    
    /**
     * Check if cached data is still valid
     */
    isCacheValid() {
        if (!this.lastFetchTime) return false;
        return (new Date() - this.lastFetchTime) < this.cacheTimeout;
    }
    
    /**
     * Show loading state
     */
    showLoadingState() {
        const refreshBtn = document.getElementById('refreshList');
        if (refreshBtn) {
            refreshBtn.textContent = '⏳ Loading...';
            refreshBtn.disabled = true;
        }
        
        // Show loading in table
        const poTableBody = document.getElementById('poTableBody');
        if (poTableBody) {
            poTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px;">
                        <div class="loading-spinner"></div>
                        Loading purchase orders...
                    </td>
                </tr>
            `;
        }
    }
    
    /**
     * Hide loading state
     */
    hideLoadingState() {
        const refreshBtn = document.getElementById('refreshList');
        if (refreshBtn) {
            refreshBtn.textContent = '🔄 Refresh';
            refreshBtn.disabled = false;
        }
    }
    
    /**
     * Show error state
     */
    showErrorState(message) {
        const poTableBody = document.getElementById('poTableBody');
        if (poTableBody) {
            poTableBody.innerHTML = `
                <tr>
                    <td colspan="8" style="text-align: center; padding: 20px; color: #d32f2f;">
                        ❌ Error loading POs: ${message}
                        <br>
                        <button onclick="window.poDataManager.fetchAndDisplayPOs(true)" 
                                class="btn-secondary" style="margin-top: 10px;">
                            Try Again
                        </button>
                    </td>
                </tr>
            `;
        }
        
        // Show error toast/alert
        if (typeof window.showNotification === 'function') {
            window.showNotification('Error loading purchase orders: ' + message, 'error');
        }
    }
    
    /**
     * Utility functions
     */
    getStatusClass(status) {
        const statusClasses = {
            'draft': 'status-draft',
            'submitted': 'status-submitted',
            'approved': 'status-approved',
            'rejected': 'status-rejected',
            'completed': 'status-completed'
        };
        return statusClasses[status?.toLowerCase()] || 'status-draft';
    }
    
    formatDate(dateString) {
        if (!dateString) return 'N/A';
        try {
            return new Date(dateString).toLocaleDateString();
        } catch (error) {
            return 'Invalid Date';
        }
    }
    
    formatCurrency(amount) {
        if (!amount || isNaN(amount)) return '$0.00';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    }
    
    /**
     * Show filter information
     */
    showFilterInfo(filteredCount, totalCount) {
        // Create or update filter info element
        let filterInfo = document.getElementById('filterInfo');
        if (!filterInfo) {
            filterInfo = document.createElement('div');
            filterInfo.id = 'filterInfo';
            filterInfo.className = 'filter-info';
            
            const listHeader = document.querySelector('.list-header');
            if (listHeader) {
                listHeader.appendChild(filterInfo);
            }
        }
        
        filterInfo.innerHTML = `
            <span class="filter-badge">
                Showing ${filteredCount} of ${totalCount} POs
                <button onclick="window.poDataManager.clearFilters(); window.poDataManager.applyClientFiltersAndDisplay();" 
                        class="clear-filters-btn" title="Clear all filters">×</button>
            </span>
        `;
        filterInfo.style.display = 'block';
    }
    
    /**
     * Hide filter information
     */
    hideFilterInfo() {
        const filterInfo = document.getElementById('filterInfo');
        if (filterInfo) {
            filterInfo.style.display = 'none';
        }
    }
    
    /**
     * Get demo data for testing
     */
    getDemoData() {
        return {
            success: true,
            pos: [
                {
                    id: "1724684215234",
                    poNumber: "APEX-250826-1430-001",
                    status: "submitted",
                    createdAt: "2025-08-26T14:30:15.234Z",
                    meta: {
                        projectName: "Downtown Office Complex Phase 2",
                        companyName: "Premier Subcontractors Inc",
                        contractAmount: 2500000
                    },
                    submittedBy: {
                        username: "John Smith",
                        email: "john.smith@apexbuilding.com"
                    }
                },
                {
                    id: "1724684215235",
                    poNumber: "APEX-250826-1431-002",
                    status: "approved",
                    createdAt: "2025-08-26T15:45:30.567Z",
                    meta: {
                        projectName: "Retail Plaza Construction",
                        companyName: "ABC Contractors LLC",
                        contractAmount: 1750000
                    },
                    submittedBy: {
                        username: "Sarah Johnson",
                        email: "sarah.johnson@apexbuilding.com"
                    }
                },
                {
                    id: "1724684215236",
                    poNumber: "APEX-250826-1432-003",
                    status: "draft",
                    createdAt: "2025-08-26T16:20:45.890Z",
                    meta: {
                        projectName: "Industrial Warehouse Renovation",
                        companyName: "XYZ Building Solutions",
                        contractAmount: 950000
                    },
                    submittedBy: {
                        username: "Mike Chen",
                        email: "mike.chen@apexbuilding.com"
                    }
                }
            ],
            total: 3,
            timestamp: new Date().toISOString()
        };
    }
}

// Global functions for table actions
window.viewPO = function(poNumber) {
    // Test: completely minimal function
    window.open('../Print.html', '_blank');
};

window.editPO = function(poNumber) {
    console.log('✏️ Editing PO:', poNumber);
    // Implement edit functionality - navigate to form with PO number
    window.location.href = `/pages/form.html?edit=${poNumber}`;
};

window.downloadPO = function(poNumber) {
    console.log('📥 Downloading PO:', poNumber);
    // Implement download functionality
    alert(`Downloading PO: ${poNumber}`);
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    if (window.location.pathname.includes('tracking.html')) {
        window.poDataManager = new PODataManager();
    }
});
