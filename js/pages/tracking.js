// Tracking Dashboard - Using global variables since dependencies are loaded as regular scripts

class TrackingDashboard {
    constructor() {
        console.log('=== TrackingDashboard constructor called ===');
        this.allPOs = [];
        this.filteredPOs = [];
        
        // Simplified initialization - don't wait for complex dependencies
        console.log('Initializing tracking dashboard...');
        this.initializeAuth();
        this.bindEvents();
        this.loadPOs();
    }

    initializeAuth() {
        console.log('=== TRACKING AUTH INITIALIZATION ===');
        
        // Simplified auth check
        if (!window.auth || !window.auth.isAuthenticated()) {
            console.log('Not authenticated, but continuing for testing...');
            // Don't redirect for now, just set a default user for testing
            document.getElementById('welcomeUser').textContent = 'Welcome, Test User';
        } else {
            // Update welcome message
            const currentUser = window.auth.getCurrentUser();
            console.log('Current user from auth system:', currentUser);
            
            if (currentUser) {
                const userName = currentUser.displayName || 
                               currentUser.name || 
                               currentUser.givenName || 
                               currentUser.username || 
                               (currentUser.email ? currentUser.email.split('@')[0] : '') ||
                               'User';
                
                console.log('Final userName selected:', userName);
                document.getElementById('welcomeUser').textContent = `Welcome, ${userName}`;
            }
        }
    }

    bindEvents() {
        console.log('Binding events...');
        
        // New PO button
        const newPOBtn = document.getElementById('newPOBtn');
        if (newPOBtn) {
            newPOBtn.addEventListener('click', () => {
                console.log('New PO button clicked, navigating to form...');
                window.location.href = '../pages/form.html';
            });
            console.log('New PO button event bound successfully');
        } else {
            console.error('New PO button not found!');
        }

        // Filter and action buttons - wrap in try-catch for safety
        try {
            document.getElementById('projectFilter').addEventListener('input', () => this.filterPOs());
            document.getElementById('statusFilter').addEventListener('change', () => this.filterPOs());
            document.getElementById('dateFrom').addEventListener('change', () => this.filterPOs());
            document.getElementById('dateTo').addEventListener('change', () => this.filterPOs());
            document.getElementById('applyFilters').addEventListener('click', () => this.filterPOs());
            document.getElementById('clearFilters').addEventListener('click', () => this.clearFilters());
            document.getElementById('refreshList').addEventListener('click', () => this.loadPOs());
            document.getElementById('exportList').addEventListener('click', () => this.exportPOs());
            const myOnlyEl = document.getElementById('myPOsOnly');
            if (myOnlyEl) myOnlyEl.addEventListener('change', () => this.filterPOs());
            console.log('All event binding completed successfully');
        } catch (error) {
            console.error('Error binding events:', error);
        }
    }

    async loadPOs() {
        console.log('=== LOADING POs (SIMPLIFIED) ===');
        this.showLoading(true);
        
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
        } finally {
            this.showLoading(false);
        }
    }

    showLoading(show) {
        const loadingEl = document.querySelector('.loading-spinner, .loading, #loading');
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
        console.log(`Loading state: ${show ? 'shown' : 'hidden'}`);
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
        let tempPOs = [...this.allPOs];
        console.log('Initial tempPOs length:', tempPOs.length);
        
        // Filter by "My POs only"
        const myPOsOnly = document.getElementById('myPOsOnly').checked;
        console.log('myPOsOnly checkbox:', myPOsOnly);
        
        if (myPOsOnly) {
            let currentUser = null;
            let userEmail = null;
            let userName = null;
            
            // Try to get current user from auth system
            if (window.auth && window.auth.getCurrentUser) {
                currentUser = window.auth.getCurrentUser();
                console.log('Current user from auth:', currentUser);
            }
            
            // Get user email and name for filtering
            if (currentUser && currentUser.email) {
                userEmail = currentUser.email;
                userName = currentUser.name || currentUser.displayName || currentUser.username;
            } else {
                // Fallback: check localStorage for user info
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        userEmail = parsed.email;
                        userName = parsed.name || parsed.displayName || parsed.username;
                        console.log('Using stored user:', parsed);
                    } catch (e) {
                        console.warn('Could not parse stored user:', e);
                    }
                }
            }
            
            // If still no user info, use your email as default for testing
            if (!userEmail) {
                console.log('No user info found, using default for testing');
                userEmail = 'vcabrillos@apexbuilds.com';
                userName = 'Virgilio Cabrillos Jr.';
            }
            
            userEmail = userEmail.toLowerCase();
            console.log('Filtering for user:', { userEmail, userName });
            
            tempPOs = tempPOs.filter(po => {
                // Check multiple possible email and name locations
                const submittedByEmail = po.submittedBy?.email?.toLowerCase();
                const requestedByEmail = po.meta?.requestedByEmail?.toLowerCase();
                const requestedBy = po.meta?.requestedBy?.toLowerCase();
                
                // Also check for name matches
                const submittedByName = po.submittedBy?.name?.toLowerCase();
                const requestedByName = po.meta?.requestedBy?.toLowerCase();
                
                const userNameLower = userName?.toLowerCase() || '';
                
                const emailMatch = submittedByEmail === userEmail || requestedByEmail === userEmail;
                const nameMatch = (userNameLower && (
                    submittedByName?.includes(userNameLower) ||
                    requestedByName?.includes(userNameLower) ||
                    requestedBy === userEmail
                ));
                
                console.log('Checking PO:', po.id, {
                    submittedByEmail,
                    requestedByEmail,
                    requestedBy,
                    userEmail,
                    userName: userNameLower,
                    emailMatch,
                    nameMatch,
                    finalMatch: emailMatch || nameMatch
                });
                
                return emailMatch || nameMatch;
            });
            console.log(`Filtered for "My POs only": ${tempPOs.length} remaining`);
        }
        
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
}

// Initialize the tracking dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOMContentLoaded event fired, creating TrackingDashboard');
    new TrackingDashboard();
});

// Backup initialization in case DOMContentLoaded already fired
if (document.readyState === 'loading') {
    console.log('Document still loading, waiting for DOMContentLoaded');
} else {
    console.log('Document already loaded, initializing immediately');
    new TrackingDashboard();
}
