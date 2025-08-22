import api from '../core/api.js';
import storage from '../core/storage.js';

class POForm {
    constructor() {
        // Wait for DOM and scripts to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }

    initialize() {
        // Wait for global objects to be available
        const checkGlobals = () => {
            if (window.auth && window.showConfirmModal) {
                this.initializeAuth();
                this.bindEvents();
                this.loadDraft();
                this.scheduleItemTemplate = this.createScheduleItemTemplate();
                this.scopeItemTemplate = this.createScopeItemTemplate();
            } else {
                setTimeout(checkGlobals, 100);
            }
        };
        checkGlobals();
    }

    initializeAuth() {
        // Use global auth object that's loaded via script tag
        if (!window.auth || !window.auth.isAuthenticated()) {
            window.location.href = '/index.html';
            return;
        }

        // Check if we're revising an existing PO
        const urlParams = new URLSearchParams(window.location.search);
        this.revisionId = urlParams.get('revise');
        if (this.revisionId) {
            this.loadExistingPO(this.revisionId);
        }
    }

    bindEvents() {
        document.getElementById('backBtn').addEventListener('click', () => {
            window.showConfirmModal(
                'Confirm Navigation',
                'Are you sure you want to leave? Any unsaved changes will be lost.',
                () => window.history.back(),
                null
            );
        });

        // Note: Logout button now uses onclick="handleLogout()" in HTML

        document.getElementById('poForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('saveButton').addEventListener('click', () => this.saveDraft());
        document.getElementById('addScheduleItem').addEventListener('click', () => this.addScheduleItem());
        document.getElementById('addScopeItem').addEventListener('click', () => this.addScopeItem());

        // Auto-save draft every minute
        setInterval(() => this.saveDraft(true), 60000);
    }

    async loadExistingPO(poId) {
        try {
            const po = await api.getPOById(poId);
            this.fillFormData(po);
        } catch (error) {
            modal.showError('Failed to load PO data for revision.');
        }
    }

    fillFormData(po) {
        // Fill meta information
        Object.entries(po.meta).forEach(([key, value]) => {
            if (key === 'importantDates') {
                Object.entries(value).forEach(([dateKey, dateValue]) => {
                    const input = document.querySelector(`[name="meta.importantDates.${dateKey}"]`);
                    if (input) input.value = dateValue;
                });
            } else {
                const input = document.querySelector(`[name="meta.${key}"]`);
                if (input) input.value = value;
            }
        });

        // Fill schedule items
        po.schedule.forEach(item => this.addScheduleItem(item));

        // Fill scope items
        po.scope.forEach(item => this.addScopeItem(item));
    }

    createScheduleItemTemplate() {
        return `
            <div class="schedule-item">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Prime Line *</label>
                        <input type="text" name="primeLine" required>
                    </div>
                    <div class="form-group">
                        <label>Budget Code *</label>
                        <input type="text" name="budgetCode" required>
                    </div>
                    <div class="form-group">
                        <label>Description *</label>
                        <textarea name="description" required></textarea>
                    </div>
                    <div class="form-group">
                        <label>Quantity *</label>
                        <input type="number" name="qty" required>
                    </div>
                    <div class="form-group">
                        <label>Unit *</label>
                        <input type="number" name="unit" required>
                    </div>
                    <div class="form-group">
                        <label>Total Cost *</label>
                        <input type="number" name="totalCost" required>
                    </div>
                    <div class="form-group">
                        <label>Scheduled *</label>
                        <input type="number" name="scheduled" required>
                    </div>
                    <div class="form-group">
                        <label>Apex Contract Value *</label>
                        <input type="number" name="apexContractValue" required>
                    </div>
                </div>
                <button type="button" class="btn btn-danger remove-item">Remove</button>
            </div>
        `;
    }

    createScopeItemTemplate() {
        return `
            <div class="scope-item">
                <div class="form-grid">
                    <div class="form-group">
                        <label>Item Number *</label>
                        <input type="text" name="item" required>
                    </div>
                    <div class="form-group">
                        <label>Description *</label>
                        <textarea name="description" required></textarea>
                    </div>
                    <div class="form-group scope-status">
                        <label>Status *</label>
                        <div>
                            <label>
                                <input type="radio" name="status" value="included" checked> Included
                            </label>
                            <label>
                                <input type="radio" name="status" value="excluded"> Excluded
                            </label>
                        </div>
                    </div>
                </div>
                <button type="button" class="btn btn-danger remove-item">Remove</button>
            </div>
        `;
    }

    addScheduleItem(data = null) {
        const container = document.getElementById('scheduleItems');
        const div = document.createElement('div');
        div.innerHTML = this.scheduleItemTemplate;
        container.appendChild(div.firstElementChild);

        const item = container.lastElementChild;
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                const input = item.querySelector(`[name="${key}"]`);
                if (input) input.value = value;
            });
        }

        item.querySelector('.remove-item').addEventListener('click', () => {
            modal.showConfirm(
                'Are you sure you want to remove this schedule item?',
                () => item.remove(),
                null
            );
        });
    }

    addScopeItem(data = null) {
        const container = document.getElementById('scopeItems');
        const div = document.createElement('div');
        div.innerHTML = this.scopeItemTemplate;
        container.appendChild(div.firstElementChild);

        const item = container.lastElementChild;
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                if (key === 'included' || key === 'excluded') {
                    const radio = item.querySelector(`[name="status"][value="${key === 'included' ? 'included' : 'excluded'}"]`);
                    if (radio) radio.checked = value;
                } else {
                    const input = item.querySelector(`[name="${key}"]`);
                    if (input) input.value = value;
                }
            });
        }

        item.querySelector('.remove-item').addEventListener('click', () => {
            modal.showConfirm(
                'Are you sure you want to remove this scope item?',
                () => item.remove(),
                null
            );
        });
    }

    collectFormData() {
        const formData = {
            meta: {
                importantDates: {}
            },
            schedule: [],
            scope: []
        };

        // Collect meta information
        const metaInputs = document.querySelectorAll('[name^="meta."]');
        metaInputs.forEach(input => {
            const path = input.name.split('.');
            if (path.length === 3) {
                // Handle nested importantDates
                formData.meta.importantDates[path[2]] = input.value;
            } else {
                formData.meta[path[1]] = input.value;
            }
        });

        // Collect schedule items
        document.querySelectorAll('.schedule-item').forEach(item => {
            const scheduleItem = {};
            item.querySelectorAll('[name]').forEach(input => {
                scheduleItem[input.name] = input.type === 'number' ? Number(input.value) : input.value;
            });
            formData.schedule.push(scheduleItem);
        });

        // Collect scope items
        document.querySelectorAll('.scope-item').forEach(item => {
            const scopeItem = {
                included: item.querySelector('[name="status"][value="included"]').checked,
                excluded: item.querySelector('[name="status"][value="excluded"]').checked
            };
            item.querySelectorAll('input[name]:not([name="status"]), textarea').forEach(input => {
                scopeItem[input.name] = input.value;
            });
            formData.scope.push(scopeItem);
        });

        // Add metadata
        formData.createdAt = new Date().toISOString();
        formData.sent = false;
        formData.timestamp = Date.now();
        formData.id = this.revisionId || Date.now();

        return formData;
    }

    saveDraft(silent = false) {
        const formData = this.collectFormData();
        storage.saveDraft(formData);
        if (!silent) {
            modal.showSuccess('Draft saved successfully.');
        }
    }

    loadDraft() {
        if (this.revisionId) return; // Don't load draft if we're revising an existing PO

        const draft = storage.getDraft();
        if (draft) {
            modal.showConfirm(
                'Would you like to load your saved draft?',
                () => this.fillFormData(draft),
                () => storage.clearDraft()
            );
        }
    }

    async handleSubmit(event) {
        event.preventDefault();
        
        try {
            const formData = this.collectFormData();
            
            // Show confirmation modal with summary
            modal.show({
                title: 'Confirm Submission',
                content: this.createSubmissionSummary(formData),
                size: 'large',
                actions: [
                    {
                        id: 'cancel',
                        label: 'Cancel',
                        class: 'btn-secondary'
                    },
                    {
                        id: 'confirm',
                        label: 'Confirm & Submit',
                        class: 'btn-primary',
                        handler: async () => {
                            try {
                                formData.sent = true;
                                formData.sentAt = new Date().toISOString();
                                await api.submitPO(formData);
                                storage.clearDraft();
                                
                                modal.show({
                                    title: 'Success',
                                    content: 'Purchase Order submitted successfully.',
                                    actions: [{
                                        id: 'ok',
                                        label: 'View My POs',
                                        class: 'btn-primary',
                                        handler: () => window.location.href = '/pages/tracking.html'
                                    }]
                                });
                            } catch (error) {
                                modal.showError('Failed to submit Purchase Order. Please try again.');
                            }
                        }
                    }
                ]
            });
        } catch (error) {
            modal.showError('Failed to prepare submission. Please check your inputs and try again.');
        }
    }

    createSubmissionSummary(data) {
        return `
            <div class="submission-summary">
                <h3>Project Summary</h3>
                <p><strong>Project Name:</strong> ${data.meta.projectName}</p>
                <p><strong>Contract Amount:</strong> $${Number(data.meta.contractAmount).toLocaleString()}</p>
                
                <h3>Schedule Summary</h3>
                <p><strong>Items:</strong> ${data.schedule.length}</p>
                <p><strong>Total Value:</strong> $${data.schedule.reduce((sum, item) => sum + Number(item.totalCost), 0).toLocaleString()}</p>
                
                <h3>Scope Summary</h3>
                <p><strong>Items:</strong> ${data.scope.length}</p>
                <p><strong>Included Items:</strong> ${data.scope.filter(item => item.included).length}</p>
                <p><strong>Excluded Items:</strong> ${data.scope.filter(item => item.excluded).length}</p>
                
                <div class="summary-warning">
                    Please review all information carefully before submitting. 
                    This action cannot be undone.
                </div>
            </div>
        `;
    }
}

// Initialize the form
new POForm();
