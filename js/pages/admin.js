import { auth } from '../core/auth.js';

class AdminDashboard {
    constructor() {
        this.allPOs = [];
        this.initializeAuth();
        this.bindEvents();
        this.loadPOs();
        this.setupTabs();
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
        const totalValue = pos.reduce((sum, p) => sum + (parseFloat(p.meta.contractAmount) || 0), 0);

        document.getElementById('totalPOs').textContent = totalPOs;
        document.getElementById('pendingPOs').textContent = pendingPOs;
        document.getElementById('totalValue').textContent = `$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
        // Simplified - just show alert for now
        alert(`PO Details for: ${po.meta.projectName}\nCompany: ${po.meta.companyName}\nAmount: $${po.meta.contractAmount}`);
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
                    }
                });
            });
        });
    }
}

// Simple initialization - bypass all the complex component registry
document.addEventListener('DOMContentLoaded', () => {
    console.log('Admin page DOM loaded, initializing dashboard directly...');
    try {
        new AdminDashboard();
        console.log('Admin dashboard initialized successfully');
    } catch (error) {
        console.error('Failed to initialize admin dashboard:', error);
        alert('Failed to initialize admin dashboard. Check console for errors.');
    }
});
