import { auth } from '../core/auth.js';

class AdminDashboard {
    constructor() {
        this.allPOs = [];
        this.allUsers = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.initializeAuth();
        this.bindEvents();
        this.loadPOs();
        this.loadUsers();
        this.setupTabs();
        this.initializeReports();
        this.initializeSettings();
    }

    initializeAuth() {
        console.log('=== ADMIN AUTH INITIALIZATION ===');
        
        const welcomeElement = document.getElementById('welcomeAdmin');
        if (!welcomeElement) return;
        
        // Check if auth is available and user is authenticated
        if (window.auth && window.auth.isAuthenticated()) {
            const currentUser = window.auth.getCurrentUser();
            console.log('Current admin user:', currentUser);
            
            if (currentUser) {
                let firstName = '';
                
                // Try to get first name from various user properties
                if (currentUser.givenName) {
                    firstName = currentUser.givenName;
                } else if (currentUser.displayName) {
                    firstName = currentUser.displayName.split(' ')[0];
                } else if (currentUser.name) {
                    firstName = currentUser.name.split(' ')[0];
                } else if (currentUser.username) {
                    firstName = currentUser.username.split(' ')[0];
                } else if (currentUser.email) {
                    firstName = currentUser.email.split('@')[0].split('.')[0];
                } else {
                    firstName = 'Admin';
                }
                
                // Capitalize first letter
                firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                
                console.log('Admin first name extracted:', firstName);
                welcomeElement.textContent = `Welcome, ${firstName}`;
            }
        } else {
            // Try to get user from localStorage
            try {
                const storedUser = localStorage.getItem('currentUser');
                if (storedUser) {
                    const user = JSON.parse(storedUser);
                    let firstName = '';
                    
                    if (user.username) {
                        firstName = user.username.split(' ')[0];
                    } else if (user.name) {
                        firstName = user.name.split(' ')[0];
                    } else if (user.email) {
                        firstName = user.email.split('@')[0].split('.')[0];
                    } else {
                        firstName = 'Admin';
                    }
                    
                    // Capitalize first letter
                    firstName = firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
                    welcomeElement.textContent = `Welcome, ${firstName}`;
                } else {
                    welcomeElement.textContent = 'Welcome, Admin';
                }
            } catch (error) {
                console.warn('Error parsing stored user for admin:', error);
                welcomeElement.textContent = 'Welcome, Admin';
            }
        }
    }

    bindEvents() {
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                if (confirm('Are you sure you want to logout?')) {
                    auth.logout();
                }
            });
        }
        
        const applyFiltersBtn = document.getElementById('applyFilters');
        if(applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => this.filterPOs());
        }

        const refreshBtn = document.getElementById('refreshList');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.loadPOs());
        }

        const clearFiltersBtn = document.getElementById('clearFilters');
        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => this.clearFilters());
        }

        const exportAllBtn = document.getElementById('exportAll');
        if (exportAllBtn) {
            exportAllBtn.addEventListener('click', () => this.exportPOs());
        }

        const bulkActionsBtn = document.getElementById('bulkActions');
        if (bulkActionsBtn) {
            bulkActionsBtn.addEventListener('click', () => this.showBulkActions());
        }
    }

    async loadPOs() {
        const loadingSpinner = document.getElementById('loadingSpinner');
        const poTableContainer = document.getElementById('poTableContainer');
        
        console.log('loadPOs started. Hiding table and showing spinner.');
        if(loadingSpinner) loadingSpinner.style.display = 'block';
        if(poTableContainer) poTableContainer.style.display = 'none';

        try {
            // DEBUGGING: Load from a local file to test UI rendering and logic.
            console.log("Fetching POs from local test file: ../../asset/data/test-data.json");
            const response = await fetch('../asset/data/test-data.json');
            console.log('Fetch response received:', { status: response.status, ok: response.ok });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const pos = await response.json();
            console.log('Parsed POs:', pos);
            
            if (!pos || pos.length === 0) {
                console.log('No POs found in data. Displaying message.');
                this.displayMessage('No purchase orders found in the local test file.');
                return;
            }

            this.allPOs = pos; // Cache for filtering
            console.log('Calling displayPOs with fetched data.');
            this.displayPOs(pos);
            console.log('Calling updateStats with fetched data.');
            this.updateStats(pos);

        } catch (error) {
            console.error('Failed to load POs from local test file:', error);
            // Simple alert instead of modal for debugging
            alert('Failed to load local test data. Check console for errors.');
            this.displayMessage('Could not load Purchase Orders.');
        } finally {
            console.log('loadPOs finished. Hiding spinner, showing table.');
            if(loadingSpinner) loadingSpinner.style.display = 'none';
            if(poTableContainer) poTableContainer.style.display = 'block';
        }
    }

    displayPOs(pos) {
        console.log('displayPOs called with:', pos);
        const poTableBody = document.getElementById('poTableBody');
        if (!poTableBody) {
            console.error("Element with ID 'poTableBody' not found. Cannot display POs.");
            return;
        }
        
        console.log('Clearing existing table content.');
        poTableBody.innerHTML = ''; // Clear existing rows

        if (pos.length === 0) {
            console.log('pos array is empty. Displaying "no match" message.');
            poTableBody.innerHTML = '<tr><td colspan="9" class="no-pos-message">No purchase orders match the current filters.</td></tr>';
            return;
        }

        console.log(`Generating and inserting ${pos.length} rows into the table.`);
        pos.forEach((po, index) => {
            const rowHTML = this.createPOTableRow(po);
            // console.log(`Inserting row ${index + 1}:`, rowHTML); // This can be too verbose
            poTableBody.insertAdjacentHTML('beforeend', rowHTML);
        });

        // Add event listeners to action buttons
        const actionButtons = document.querySelectorAll('.po-action');
        console.log(`Found ${actionButtons.length} action buttons. Adding event listeners.`);
        actionButtons.forEach(button => {
            button.addEventListener('click', (e) => this.handlePOAction(e));
        });
        console.log('Finished adding event listeners.');
    }
    
    displayMessage(message) {
        const poTableBody = document.getElementById('poTableBody');
        if (poTableBody) {
            poTableBody.innerHTML = `<tr><td colspan="9" class="no-pos-message">${message}</td></tr>`;
        }
        const totalPOs = document.getElementById('totalPOs');
        if(totalPOs) totalPOs.textContent = 0;
    }

    updateStats(pos) {
        const totalPOs = pos.length;
        const pendingPOs = pos.filter(p => p.status === 'Submitted').length;
        const approvedPOs = pos.filter(p => p.status === 'Approved').length;
        const totalValue = pos.reduce((sum, p) => sum + (parseFloat(p.meta.contractAmount) || 0), 0);

        document.getElementById('totalPOs').textContent = totalPOs;
        document.getElementById('pendingPOs').textContent = pendingPOs;
        document.getElementById('totalValue').textContent = `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        // Update total users if available
        if (this.allUsers.length > 0) {
            document.getElementById('totalUsers').textContent = this.allUsers.length;
        }
    }

    createPOTableRow(po) {
        const poId = po.id || `local_${Date.now()}`;
        const requestedBy = po.meta?.requestedBy || 'N/A';
        const projectName = po.meta?.projectName || 'N/A';
        const companyName = po.meta?.companyName || 'N/A';
        const contractAmount = po.meta?.contractAmount ? `$${parseFloat(po.meta.contractAmount).toLocaleString()}` : '$0';
        const status = po.status || 'Unknown';
        const createdDate = po.createdAt ? new Date(po.createdAt).toLocaleDateString() : 'N/A';

        return `
            <tr data-po-id="${poId}">
                <td><input type="checkbox" class="po-select"></td>
                <td>${poId}</td>
                <td>${requestedBy}</td>
                <td>${projectName}</td>
                <td>${companyName}</td>
                <td>${contractAmount}</td>
                <td><span class="status ${status.toLowerCase()}">${status}</span></td>
                <td>${createdDate}</td>
                <td class="actions">
                    <button class="btn-action po-action" data-action="view" data-po-id="${poId}">View</button>
                    <button class="btn-action po-action" data-action="approve" data-po-id="${poId}">Approve</button>
                </td>
            </tr>
        `;
    }

    async handlePOAction(event) {
        const action = event.target.dataset.action;
        const poId = event.target.dataset.poId;

        console.log(`Action: ${action}, PO ID: ${poId}`);

        const po = this.allPOs.find(p => p.id === poId);

        if (action === 'view') {
            if (po) {
                this.viewPODetails(po);
            } else {
                alert('Could not find PO details.');
            }
        } else {
            alert(`Action '${action}' clicked for PO from '${po?.meta.companyName}'. This is a work in progress.`);
        }
    }

    viewPODetails(po) {
        // Create a detailed modal view
        const modalContent = this.createPODetailsModal(po);
        this.showModal('Purchase Order Details', modalContent);
    }

    createPODetailsModal(po) {
        return `
            <div class="po-detail-view">
                <div class="detail-section">
                    <h3>📋 Project Information</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px;">
                        <div><strong>PO ID:</strong> ${po.id}</div>
                        <div><strong>Status:</strong> <span class="status ${po.status.toLowerCase()}">${po.status}</span></div>
                        <div><strong>Project Name:</strong> ${po.meta.projectName}</div>
                        <div><strong>Company:</strong> ${po.meta.companyName}</div>
                        <div><strong>Requested By:</strong> ${po.meta.requestedBy}</div>
                        <div><strong>Project Manager:</strong> ${po.meta.projectManager}</div>
                        <div><strong>Contract Amount:</strong> $${parseFloat(po.meta.contractAmount).toLocaleString()}</div>
                        <div><strong>Created:</strong> ${new Date(po.createdAt).toLocaleDateString()}</div>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h3>💰 Schedule Items</h3>
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>Line</th>
                                <th>Budget Code</th>
                                <th>Description</th>
                                <th>Qty</th>
                                <th>Unit</th>
                                <th>Total Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${po.schedule.map(item => `
                                <tr>
                                    <td>${item.primeLine}</td>
                                    <td>${item.budgetCode}</td>
                                    <td>${item.description}</td>
                                    <td>${item.qty}</td>
                                    <td>${item.unit}</td>
                                    <td>$${item.totalCost.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="detail-section">
                    <h3>🔧 Scope Items</h3>
                    <table class="detail-table">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Status</th>
                                <th>Cost</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${po.scope.map(item => `
                                <tr>
                                    <td>${item.item}</td>
                                    <td>${item.included ? 'Included' : 'Excluded'}</td>
                                    <td>$${item.cost.toLocaleString()}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        `;
    }

    showModal(title, content) {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${title}</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                <div class="modal-actions">
                    <button class="btn-secondary modal-close">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                document.body.removeChild(modal);
            });
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    clearFilters() {
        document.getElementById('userFilter').value = '';
        document.getElementById('statusFilter').value = '';
        document.getElementById('contractorFilter').value = '';
        document.getElementById('dateFrom').value = '';
        document.getElementById('dateTo').value = '';
        document.getElementById('minAmount').value = '';
        document.getElementById('maxAmount').value = '';
        
        this.displayPOs(this.allPOs);
    }

    exportPOs() {
        const csvContent = this.convertPOsToCSV(this.allPOs);
        this.downloadCSV(csvContent, 'purchase_orders.csv');
    }

    convertPOsToCSV(pos) {
        const headers = ['ID', 'Status', 'Requested By', 'Project Name', 'Company', 'Contract Amount', 'Created Date'];
        const rows = pos.map(po => [
            po.id,
            po.status,
            po.meta.requestedBy,
            po.meta.projectName,
            po.meta.companyName,
            po.meta.contractAmount,
            new Date(po.createdAt).toLocaleDateString()
        ]);
        
        return [headers, ...rows].map(row => 
            row.map(field => `"${field}"`).join(',')
        ).join('\n');
    }

    downloadCSV(content, filename) {
        const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    showBulkActions() {
        const selectedPOs = document.querySelectorAll('.po-select:checked');
        if (selectedPOs.length === 0) {
            alert('Please select at least one purchase order.');
            return;
        }
        
        const actions = ['Approve Selected', 'Reject Selected', 'Export Selected'];
        const actionButtons = actions.map(action => 
            `<button class="btn-primary" onclick="adminDashboard.handleBulkAction('${action.toLowerCase().replace(' selected', '')}')">${action}</button>`
        ).join('');
        
        this.showModal('Bulk Actions', `
            <p>Selected ${selectedPOs.length} purchase order(s)</p>
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px;">
                ${actionButtons}
            </div>
        `);
    }

    handleBulkAction(action) {
        const selectedPOs = document.querySelectorAll('.po-select:checked');
        const selectedIds = Array.from(selectedPOs).map(cb => cb.closest('tr').dataset.poId);
        
        switch(action) {
            case 'approve':
                if (confirm(`Approve ${selectedIds.length} purchase orders?`)) {
                    selectedIds.forEach(id => {
                        const po = this.allPOs.find(p => p.id === id);
                        if (po) po.status = 'Approved';
                    });
                    this.displayPOs(this.allPOs);
                    this.updateStats(this.allPOs);
                }
                break;
            case 'reject':
                if (confirm(`Reject ${selectedIds.length} purchase orders?`)) {
                    selectedIds.forEach(id => {
                        const po = this.allPOs.find(p => p.id === id);
                        if (po) po.status = 'Rejected';
                    });
                    this.displayPOs(this.allPOs);
                    this.updateStats(this.allPOs);
                }
                break;
            case 'export':
                const selectedPOsData = this.allPOs.filter(po => selectedIds.includes(po.id));
                const csvContent = this.convertPOsToCSV(selectedPOsData);
                this.downloadCSV(csvContent, `selected_purchase_orders.csv`);
                break;
        }
        
        // Close any open modals
        const modals = document.querySelectorAll('.modal-overlay');
        modals.forEach(modal => modal.remove());
    }
    
    filterPOs() {
        if (!this.allPOs) return;

        const userFilter = document.getElementById('userFilter').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value.toLowerCase();
        const contractorFilter = document.getElementById('contractorFilter').value.toLowerCase();
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;
        const minAmount = parseFloat(document.getElementById('minAmount').value) || 0;
        const maxAmount = parseFloat(document.getElementById('maxAmount').value) || Infinity;

        const filteredPOs = this.allPOs.filter(po => {
            const poDate = new Date(po.createdAt);
            const poAmount = parseFloat(po.meta.contractAmount);

            const matchesUser = !userFilter || (po.meta.requestedBy && po.meta.requestedBy.toLowerCase().includes(userFilter));
            const matchesStatus = !statusFilter || (po.status && po.status.toLowerCase() === statusFilter);
            const matchesContractor = !contractorFilter || (po.meta.companyName && po.meta.companyName.toLowerCase().includes(contractorFilter));
            const matchesDate = (!dateFrom || poDate >= new Date(dateFrom)) && (!dateTo || poDate <= new Date(dateTo));
            const matchesAmount = poAmount >= minAmount && poAmount <= maxAmount;

            return matchesUser && matchesStatus && matchesContractor && matchesDate && matchesAmount;
        });

        this.displayPOs(filteredPOs);
    }
    
    setupTabs() {
        const tabButtons = document.querySelectorAll('.tab-button');
        const tabContents = document.querySelectorAll('.tab-content');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const tab = button.dataset.tab;

                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');

                tabContents.forEach(content => {
                    content.classList.remove('active');
                    if (content.id === `${tab}Tab`) {
                        content.classList.add('active');
                        // Load tab-specific content
                        this.loadTabContent(tab);
                    }
                });
            });
        });
    }

    loadTabContent(tab) {
        switch(tab) {
            case 'users':
                this.displayUsers();
                break;
            case 'reports':
                this.generateReports();
                break;
            case 'settings':
                this.displaySettings();
                break;
        }
    }

    async loadUsers() {
        try {
            const response = await fetch('../asset/data/test-users.json');
            if (response.ok) {
                this.allUsers = await response.json();
                console.log('Users loaded:', this.allUsers);
            }
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    }

    displayUsers() {
        const usersTab = document.getElementById('usersTab');
        if (!usersTab) return;

        usersTab.innerHTML = `
            <div class="user-management">
                <div class="list-header">
                    <h2>👥 User Management</h2>
                    <div class="list-actions">
                        <button id="addUserBtn" class="btn-primary">+ Add User</button>
                        <button id="refreshUsersBtn" class="btn-secondary">🔄 Refresh</button>
                    </div>
                </div>
                
                <div class="user-grid" id="userGrid">
                    ${this.allUsers.map(user => this.createUserCard(user)).join('')}
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('addUserBtn')?.addEventListener('click', () => this.showAddUserModal());
        document.getElementById('refreshUsersBtn')?.addEventListener('click', () => this.loadUsers());
        
        // Add event listeners to user actions
        document.querySelectorAll('.user-action').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleUserAction(e));
        });
    }

    createUserCard(user) {
        const initials = (user.firstName[0] + user.lastName[0]).toUpperCase();
        const lastLogin = user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never';
        
        return `
            <div class="user-card" data-user-id="${user.id}">
                <div class="user-header">
                    <div class="user-avatar">${initials}</div>
                    <div class="user-info">
                        <h4>${user.firstName} ${user.lastName}</h4>
                        <p>${user.email}</p>
                    </div>
                </div>
                
                <div class="user-details">
                    <div class="user-detail">
                        <strong>Role:</strong>
                        <span>${user.role}</span>
                    </div>
                    <div class="user-detail">
                        <strong>Department:</strong>
                        <span>${user.department}</span>
                    </div>
                    <div class="user-detail">
                        <strong>Status:</strong>
                        <span class="status ${user.status.toLowerCase()}">${user.status}</span>
                    </div>
                    <div class="user-detail">
                        <strong>Last Login:</strong>
                        <span>${lastLogin}</span>
                    </div>
                </div>
                
                <div class="user-actions">
                    <button class="user-action" data-action="edit" data-user-id="${user.id}">Edit</button>
                    <button class="user-action" data-action="permissions" data-user-id="${user.id}">Permissions</button>
                    <button class="user-action btn-danger" data-action="deactivate" data-user-id="${user.id}">
                        ${user.status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                </div>
            </div>
        `;
    }

    handleUserAction(event) {
        const action = event.target.dataset.action;
        const userId = event.target.dataset.userId;
        const user = this.allUsers.find(u => u.id === userId);

        switch(action) {
            case 'edit':
                this.showEditUserModal(user);
                break;
            case 'permissions':
                this.showUserPermissions(user);
                break;
            case 'deactivate':
                this.toggleUserStatus(user);
                break;
        }
    }

    showEditUserModal(user) {
        const modalContent = `
            <form id="editUserForm">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div>
                        <label><strong>First Name:</strong></label>
                        <input type="text" name="firstName" value="${user.firstName}" required>
                    </div>
                    <div>
                        <label><strong>Last Name:</strong></label>
                        <input type="text" name="lastName" value="${user.lastName}" required>
                    </div>
                    <div>
                        <label><strong>Email:</strong></label>
                        <input type="email" name="email" value="${user.email}" required>
                    </div>
                    <div>
                        <label><strong>Phone:</strong></label>
                        <input type="tel" name="phone" value="${user.phone}">
                    </div>
                    <div>
                        <label><strong>Role:</strong></label>
                        <select name="role">
                            <option value="Project Manager" ${user.role === 'Project Manager' ? 'selected' : ''}>Project Manager</option>
                            <option value="Senior Estimator" ${user.role === 'Senior Estimator' ? 'selected' : ''}>Senior Estimator</option>
                            <option value="Project Coordinator" ${user.role === 'Project Coordinator' ? 'selected' : ''}>Project Coordinator</option>
                            <option value="Construction Manager" ${user.role === 'Construction Manager' ? 'selected' : ''}>Construction Manager</option>
                            <option value="Administrator" ${user.role === 'Administrator' ? 'selected' : ''}>Administrator</option>
                        </select>
                    </div>
                    <div>
                        <label><strong>Department:</strong></label>
                        <select name="department">
                            <option value="Operations" ${user.department === 'Operations' ? 'selected' : ''}>Operations</option>
                            <option value="Estimation" ${user.department === 'Estimation' ? 'selected' : ''}>Estimation</option>
                            <option value="Field Operations" ${user.department === 'Field Operations' ? 'selected' : ''}>Field Operations</option>
                            <option value="IT" ${user.department === 'IT' ? 'selected' : ''}>IT</option>
                        </select>
                    </div>
                </div>
                <div style="margin-top: 20px; text-align: center;">
                    <button type="submit" class="btn-primary">Update User</button>
                    <button type="button" class="btn-secondary modal-close">Cancel</button>
                </div>
            </form>
        `;
        
        this.showModal('Edit User', modalContent);
        
        document.getElementById('editUserForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateUser(user.id, new FormData(e.target));
        });
    }

    updateUser(userId, formData) {
        const user = this.allUsers.find(u => u.id === userId);
        if (user) {
            user.firstName = formData.get('firstName');
            user.lastName = formData.get('lastName');
            user.email = formData.get('email');
            user.phone = formData.get('phone');
            user.role = formData.get('role');
            user.department = formData.get('department');
            
            this.displayUsers();
            document.querySelectorAll('.modal-overlay').forEach(modal => modal.remove());
            alert('User updated successfully!');
        }
    }

    toggleUserStatus(user) {
        const newStatus = user.status === 'Active' ? 'Inactive' : 'Active';
        const action = newStatus === 'Active' ? 'activate' : 'deactivate';
        
        if (confirm(`Are you sure you want to ${action} ${user.firstName} ${user.lastName}?`)) {
            user.status = newStatus;
            this.displayUsers();
        }
    }

    initializeReports() {
        // Initialize reports functionality
        this.reportData = {
            posByStatus: {},
            posByMonth: {},
            topProjects: [],
            userActivity: {}
        };
    }

    generateReports() {
        const reportsTab = document.getElementById('reportsTab');
        if (!reportsTab) return;

        // Calculate report data
        this.calculateReportData();

        reportsTab.innerHTML = `
            <div class="reports-section">
                <div class="list-header">
                    <h2>📊 Reports & Analytics</h2>
                    <div class="list-actions">
                        <button id="exportReportBtn" class="btn-primary">📋 Export Report</button>
                        <button id="refreshReportsBtn" class="btn-secondary">🔄 Refresh</button>
                    </div>
                </div>

                <div class="report-cards">
                    <div class="report-card">
                        <i>📈</i>
                        <h4>Status Distribution</h4>
                        <p>PO status breakdown and trends</p>
                    </div>
                    <div class="report-card">
                        <i>💰</i>
                        <h4>Financial Summary</h4>
                        <p>Total values and averages</p>
                    </div>
                    <div class="report-card">
                        <i>📅</i>
                        <h4>Monthly Trends</h4>
                        <p>PO submission patterns</p>
                    </div>
                    <div class="report-card">
                        <i>👤</i>
                        <h4>User Activity</h4>
                        <p>Most active users and departments</p>
                    </div>
                </div>

                <div class="charts-container">
                    <div class="chart-card">
                        <h3>📊 PO Status Distribution</h3>
                        <div id="statusChart">${this.createStatusChart()}</div>
                    </div>
                    
                    <div class="chart-card">
                        <h3>💼 Top Projects by Value</h3>
                        <div id="projectsChart">${this.createTopProjectsChart()}</div>
                    </div>
                    
                    <div class="chart-card">
                        <h3>📈 Monthly PO Trends</h3>
                        <div id="trendsChart">${this.createMonthlyTrendsChart()}</div>
                    </div>
                    
                    <div class="chart-card">
                        <h3>🎯 Department Performance</h3>
                        <div id="departmentChart">${this.createDepartmentChart()}</div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('exportReportBtn')?.addEventListener('click', () => this.exportReport());
        document.getElementById('refreshReportsBtn')?.addEventListener('click', () => this.generateReports());
    }

    calculateReportData() {
        // Status distribution
        this.reportData.posByStatus = this.allPOs.reduce((acc, po) => {
            acc[po.status] = (acc[po.status] || 0) + 1;
            return acc;
        }, {});

        // Top projects by value
        this.reportData.topProjects = this.allPOs
            .map(po => ({
                name: po.meta.projectName,
                value: parseFloat(po.meta.contractAmount),
                company: po.meta.companyName
            }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Monthly trends
        this.reportData.posByMonth = this.allPOs.reduce((acc, po) => {
            const month = new Date(po.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            acc[month] = (acc[month] || 0) + 1;
            return acc;
        }, {});
    }

    createStatusChart() {
        const data = this.reportData.posByStatus;
        const total = Object.values(data).reduce((sum, count) => sum + count, 0);
        
        return Object.entries(data).map(([status, count]) => {
            const percentage = ((count / total) * 100).toFixed(1);
            return `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                    <span><strong>${status}:</strong> ${count} POs</span>
                    <span style="color: var(--apex-primary); font-weight: 600;">${percentage}%</span>
                </div>
            `;
        }).join('');
    }

    createTopProjectsChart() {
        return this.reportData.topProjects.map((project, index) => `
            <div style="margin-bottom: 15px; padding: 12px; border: 1px solid var(--apex-light-gray); border-radius: 8px;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>#${index + 1} ${project.name}</strong>
                        <br><small style="color: var(--apex-gray);">${project.company}</small>
                    </div>
                    <div style="text-align: right; color: var(--apex-primary); font-weight: 600;">
                        $${project.value.toLocaleString()}
                    </div>
                </div>
            </div>
        `).join('');
    }

    createMonthlyTrendsChart() {
        const data = this.reportData.posByMonth;
        return Object.entries(data).map(([month, count]) => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; padding: 8px; background: #f8f9fa; border-radius: 6px;">
                <span>${month}</span>
                <span style="background: var(--apex-primary); color: white; padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                    ${count} POs
                </span>
            </div>
        `).join('');
    }

    createDepartmentChart() {
        const departments = this.allUsers.reduce((acc, user) => {
            if (user.status === 'Active') {
                acc[user.department] = (acc[user.department] || 0) + 1;
            }
            return acc;
        }, {});

        return Object.entries(departments).map(([dept, count]) => `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 6px;">
                <span><strong>${dept}</strong></span>
                <span style="color: var(--apex-primary); font-weight: 600;">${count} users</span>
            </div>
        `).join('');
    }

    exportReport() {
        const reportData = {
            generatedAt: new Date().toISOString(),
            summary: {
                totalPOs: this.allPOs.length,
                totalUsers: this.allUsers.length,
                totalValue: this.allPOs.reduce((sum, po) => sum + parseFloat(po.meta.contractAmount || 0), 0)
            },
            statusDistribution: this.reportData.posByStatus,
            topProjects: this.reportData.topProjects,
            monthlyTrends: this.reportData.posByMonth
        };

        const jsonContent = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `admin_report_${new Date().toISOString().split('T')[0]}.json`;
        link.click();
    }

    initializeSettings() {
        this.settings = {
            notifications: {
                emailNotifications: true,
                pushNotifications: false,
                reportFrequency: 'weekly'
            },
            system: {
                autoApproval: false,
                maxContractAmount: 50000,
                requireApprovalOver: 10000
            },
            display: {
                itemsPerPage: 10,
                defaultView: 'table',
                showStatusColors: true
            }
        };
    }

    displaySettings() {
        const settingsTab = document.getElementById('settingsTab');
        if (!settingsTab) return;

        settingsTab.innerHTML = `
            <div class="settings-section">
                <div class="list-header">
                    <h2>⚙️ Admin Settings</h2>
                    <div class="list-actions">
                        <button id="saveSettingsBtn" class="btn-primary">💾 Save Settings</button>
                        <button id="resetSettingsBtn" class="btn-secondary">🔄 Reset</button>
                    </div>
                </div>

                <div class="settings-group">
                    <h3>🔔 Notification Settings</h3>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Email Notifications</h4>
                            <p>Receive email notifications for new PO submissions</p>
                        </div>
                        <div class="setting-control">
                            <div class="toggle-switch ${this.settings.notifications.emailNotifications ? 'active' : ''}" 
                                 data-setting="notifications.emailNotifications">
                            </div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Push Notifications</h4>
                            <p>Browser push notifications for urgent items</p>
                        </div>
                        <div class="setting-control">
                            <div class="toggle-switch ${this.settings.notifications.pushNotifications ? 'active' : ''}" 
                                 data-setting="notifications.pushNotifications">
                            </div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Report Frequency</h4>
                            <p>How often to receive automated reports</p>
                        </div>
                        <div class="setting-control">
                            <select data-setting="notifications.reportFrequency">
                                <option value="daily" ${this.settings.notifications.reportFrequency === 'daily' ? 'selected' : ''}>Daily</option>
                                <option value="weekly" ${this.settings.notifications.reportFrequency === 'weekly' ? 'selected' : ''}>Weekly</option>
                                <option value="monthly" ${this.settings.notifications.reportFrequency === 'monthly' ? 'selected' : ''}>Monthly</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <h3>🔧 System Settings</h3>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Auto Approval</h4>
                            <p>Automatically approve POs under threshold</p>
                        </div>
                        <div class="setting-control">
                            <div class="toggle-switch ${this.settings.system.autoApproval ? 'active' : ''}" 
                                 data-setting="system.autoApproval">
                            </div>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Maximum Contract Amount</h4>
                            <p>Maximum contract amount allowed without special approval</p>
                        </div>
                        <div class="setting-control">
                            <input type="number" value="${this.settings.system.maxContractAmount}" 
                                   data-setting="system.maxContractAmount" min="1000" step="1000">
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Require Approval Over</h4>
                            <p>Dollar amount requiring manual approval</p>
                        </div>
                        <div class="setting-control">
                            <input type="number" value="${this.settings.system.requireApprovalOver}" 
                                   data-setting="system.requireApprovalOver" min="100" step="100">
                        </div>
                    </div>
                </div>

                <div class="settings-group">
                    <h3>🎨 Display Settings</h3>
                    
                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Items Per Page</h4>
                            <p>Number of items to display per page</p>
                        </div>
                        <div class="setting-control">
                            <select data-setting="display.itemsPerPage">
                                <option value="5" ${this.settings.display.itemsPerPage === 5 ? 'selected' : ''}>5</option>
                                <option value="10" ${this.settings.display.itemsPerPage === 10 ? 'selected' : ''}>10</option>
                                <option value="25" ${this.settings.display.itemsPerPage === 25 ? 'selected' : ''}>25</option>
                                <option value="50" ${this.settings.display.itemsPerPage === 50 ? 'selected' : ''}>50</option>
                            </select>
                        </div>
                    </div>

                    <div class="setting-item">
                        <div class="setting-info">
                            <h4>Show Status Colors</h4>
                            <p>Use color coding for PO status badges</p>
                        </div>
                        <div class="setting-control">
                            <div class="toggle-switch ${this.settings.display.showStatusColors ? 'active' : ''}" 
                                 data-setting="display.showStatusColors">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for settings
        this.bindSettingsEvents();
    }

    bindSettingsEvents() {
        // Toggle switches
        document.querySelectorAll('.toggle-switch').forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                e.target.classList.toggle('active');
                this.updateSetting(e.target.dataset.setting, e.target.classList.contains('active'));
            });
        });

        // Input fields and selects
        document.querySelectorAll('[data-setting]').forEach(input => {
            if (input.tagName === 'INPUT' || input.tagName === 'SELECT') {
                input.addEventListener('change', (e) => {
                    let value = e.target.value;
                    if (e.target.type === 'number') {
                        value = parseInt(value);
                    }
                    this.updateSetting(e.target.dataset.setting, value);
                });
            }
        });

        // Save and reset buttons
        document.getElementById('saveSettingsBtn')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('resetSettingsBtn')?.addEventListener('click', () => this.resetSettings());
    }

    updateSetting(path, value) {
        const keys = path.split('.');
        let current = this.settings;
        
        for (let i = 0; i < keys.length - 1; i++) {
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        console.log('Setting updated:', path, value);
    }

    saveSettings() {
        localStorage.setItem('adminSettings', JSON.stringify(this.settings));
        alert('Settings saved successfully!');
    }

    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            localStorage.removeItem('adminSettings');
            this.initializeSettings();
            this.displaySettings();
            alert('Settings reset to defaults.');
        }
    }
}

// Simple initialization - bypass all the complex component registry
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin page DOM loaded, initializing dashboard directly...');
    try {
        window.adminDashboard = new AdminDashboard();
        console.log('Admin dashboard initialized successfully');
    } catch (error) {
        console.error('Failed to initialize admin dashboard:', error);
        alert('Failed to initialize admin dashboard. Check console for errors.');
    }
});
