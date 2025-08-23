// Tracking Dashboard - Using global variables since dependencies are loaded as regular scripts

class TrackingDashboard {
    constructor() {
        console.log('TrackingDashboard constructor called');
        this.allPOs = [];
        this.filteredPOs = [];
        
        // Wait for dependencies to load
        if (typeof window.auth === 'undefined' || typeof window.api === 'undefined') {
            console.error('Dependencies not loaded yet, retrying...');
            setTimeout(() => new TrackingDashboard(), 100);
            return;
        }
        
        console.log('Dependencies loaded, initializing...');
        this.initializeAuth();
        this.bindEvents();
        this.loadPOs();
    }

    initializeAuth() {
        if (!window.auth.isAuthenticated()) {
            window.location.href = '/index.html';
            return;
        }
        
        // Update welcome message
        const currentUser = window.auth.getCurrentUser();
        if (currentUser) {
            document.getElementById('welcomeUser').textContent = `Welcome, ${currentUser.username}`;
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
            console.log('All event binding completed successfully');
        } catch (error) {
            console.error('Error binding events:', error);
        }
    }

    async loadPOs() {
        try {
            // Show loading
            document.getElementById('loadingSpinner').style.display = 'block';
            document.getElementById('emptyState').style.display = 'none';
            document.getElementById('poTable').style.display = 'none';

            const response = await window.api.getPOs({}, window.auth.getCurrentUser()?.id);
            this.allPOs = response.data || response || [];
            this.filteredPOs = [...this.allPOs];
            this.displayPOs(this.filteredPOs);
        } catch (error) {
            console.error('Failed to load POs:', error);
            document.getElementById('loadingSpinner').style.display = 'none';
            window.modal.showError('Failed to load POs. Please try again later.');
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
        
        return `
            <tr data-po-id="${po.id}">
                <td>${po.id}</td>
                <td>${po.meta?.projectName || 'N/A'}</td>
                <td>${po.meta?.generalContractor || 'N/A'}</td>
                <td><span class="status-badge status-${statusClass}">${po.status || 'Draft'}</span></td>
                <td>${formattedDate}</td>
                <td>$${contractAmount.toLocaleString('en-US', {minimumFractionDigits: 2})}</td>
                <td class="actions">
                    <button class="btn-small btn-primary po-action" data-action="view" data-po-id="${po.id}">View</button>
                    ${po.status === 'Draft' ? `<button class="btn-small btn-secondary po-action" data-action="edit" data-po-id="${po.id}">Edit</button>` : ''}
                    <button class="btn-small btn-danger po-action" data-action="delete" data-po-id="${po.id}">Delete</button>
                </td>
            </tr>
        `;
    }

    updateStats(pos) {
        const total = pos.length;
        const submitted = pos.filter(po => po.status === 'Submitted').length;
        const approved = pos.filter(po => po.status === 'Approved').length;
        const totalValue = pos.reduce((sum, po) => sum + (parseFloat(po.meta?.contractAmount || 0)), 0);

        document.getElementById('totalPOs').textContent = total;
        document.getElementById('submittedPOs').textContent = submitted;
        document.getElementById('approvedPOs').textContent = approved;
        document.getElementById('totalValue').textContent = `$${totalValue.toLocaleString('en-US', {minimumFractionDigits: 2})}`;
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
        const projectFilter = document.getElementById('projectFilter').value.toLowerCase();
        const statusFilter = document.getElementById('statusFilter').value;
        const dateFrom = document.getElementById('dateFrom').value;
        const dateTo = document.getElementById('dateTo').value;

        this.filteredPOs = this.allPOs.filter(po => {
            // Project name filter
            if (projectFilter && !po.meta?.projectName?.toLowerCase().includes(projectFilter)) {
                return false;
            }

            // Status filter
            if (statusFilter && po.status !== statusFilter) {
                return false;
            }

            // Date range filter
            if (dateFrom || dateTo) {
                const poDate = new Date(po.createdAt);
                if (dateFrom && poDate < new Date(dateFrom)) {
                    return false;
                }
                if (dateTo && poDate > new Date(dateTo + 'T23:59:59')) {
                    return false;
                }
            }

            return true;
        });

        this.displayPOs(this.filteredPOs);
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
