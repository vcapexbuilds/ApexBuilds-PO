class POForm {
    constructor() {
        console.log('=== POForm CONSTRUCTOR CALLED ===');
        console.log('Document ready state:', document.readyState);
        console.log('Location:', window.location.href);
        
        // Ensure dependencies are available globally
        this.api = window.api;
        this.storage = window.storage;
        
        console.log('Dependencies check:', {
            api: !!this.api,
            storage: !!this.storage,
            auth: !!window.auth,
            modal: !!window.modal
        });
        
        // Add immediate form check
        this.checkFormExists();
        
        // Wait for DOM and scripts to be ready
        if (document.readyState === 'loading') {
            console.log('DOM still loading, waiting for DOMContentLoaded...');
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            console.log('DOM already loaded, initializing immediately');
            this.initialize();
        }
    }
    
    checkFormExists() {
        const form = document.getElementById('poForm');
        console.log('Form exists check:', {
            form: !!form,
            formId: form ? form.id : 'not found',
            formTag: form ? form.tagName : 'not found'
        });
        
        const submitBtn = form ? form.querySelector('button[type="submit"]') : null;
        console.log('Submit button exists:', {
            button: !!submitBtn,
            buttonText: submitBtn ? submitBtn.textContent : 'not found',
            buttonType: submitBtn ? submitBtn.type : 'not found'
        });
    }

    initialize() {
        console.log('=== POForm initialize called ===');
        console.log('window.auth available:', !!window.auth);
        console.log('window.modal available:', !!window.modal);
        console.log('window.api available:', !!window.api);
        console.log('window.storage available:', !!window.storage);
        
        // Wait for global objects to be available
        const checkGlobals = () => {
            if (window.auth && window.modal && window.api && window.storage) {
                console.log('✅ All globals are available, initializing...');
                this.initializeAuth();
                this.bindEvents();
                this.loadDraft();
                this.scheduleItemTemplate = this.createScheduleItemTemplate();
                this.scopeItemTemplate = this.createScopeItemTemplate();
            } else {
                console.log('⏳ Waiting for globals...', {
                    auth: !!window.auth, 
                    modal: !!window.modal,
                    showConfirmModal: !!window.showConfirmModal,
                    api: !!window.api,
                    storage: !!window.storage
                });
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
        console.log('=== BIND EVENTS CALLED ===');
        console.log('DOM ready state:', document.readyState);
        console.log('Total forms on page:', document.forms.length);
        console.log('All forms:', Array.from(document.forms).map(f => f.id || f.name || 'unnamed'));
        
        const backBtn = document.getElementById('backBtn');
        console.log('Back button found:', !!backBtn);
        
        if (backBtn) {
            backBtn.addEventListener('click', (e) => {
                console.log('Back button clicked!', e);
                
                if (typeof window.showConfirmModal === 'function') {
                    window.showConfirmModal(
                        'Confirm Navigation',
                        'Are you sure you want to leave? Any unsaved changes will be lost.',
                        () => {
                            console.log('Confirmed, navigating to appropriate dashboard');
                            this.navigateToDashboard();
                        },
                        () => {
                            console.log('Cancelled navigation');
                        }
                    );
                } else {
                    console.log('showConfirmModal not available, using basic confirm');
                    if (confirm('Are you sure you want to leave? Any unsaved changes will be lost.')) {
                        this.navigateToDashboard();
                    }
                }
            });
            console.log('✅ Back button event bound');
        } else {
            console.error('❌ Back button not found!');
        }

        // DETAILED FORM SUBMIT BINDING
        console.log('=== ATTEMPTING TO BIND FORM SUBMIT ===');
        const poForm = document.getElementById('poForm');
        
        if (!poForm) {
            console.error('❌ CRITICAL: poForm element not found!');
            console.log('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
            return;
        }
        
        console.log('✅ poForm found:', {
            id: poForm.id,
            tagName: poForm.tagName,
            className: poForm.className,
            childElementCount: poForm.childElementCount
        });
        
        // Multiple binding approaches for maximum compatibility
        console.log('Binding submit event with multiple approaches...');
        
        // Approach 1: addEventListener on form
        try {
            poForm.addEventListener('submit', (e) => {
                console.log('🎯 FORM SUBMIT EVENT TRIGGERED (addEventListener)!', e);
                console.log('Event target:', e.target);
                console.log('Event type:', e.type);
                console.log('preventDefault available:', typeof e.preventDefault);
                this.handleSubmit(e);
            });
            console.log('✅ Approach 1: addEventListener bound');
        } catch (error) {
            console.error('❌ Approach 1 failed:', error);
        }
        
        // Approach 2: onsubmit property
        try {
            poForm.onsubmit = (e) => {
                console.log('🎯 FORM SUBMIT EVENT TRIGGERED (onsubmit)!', e);
                this.handleSubmit(e);
                return false; // Prevent default
            };
            console.log('✅ Approach 2: onsubmit property set');
        } catch (error) {
            console.error('❌ Approach 2 failed:', error);
        }
        
        // Approach 3: Direct button click binding
        const submitBtns = poForm.querySelectorAll('button[type="submit"]');
        console.log('Submit buttons found:', submitBtns.length);
        
        submitBtns.forEach((btn, index) => {
            console.log(`Submit button ${index}:`, {
                text: btn.textContent.trim(),
                type: btn.type,
                className: btn.className
            });
            
            try {
                btn.addEventListener('click', (e) => {
                    console.log(`🎯 SUBMIT BUTTON ${index} CLICKED!`, e);
                    console.log('Button element:', btn);
                    console.log('Will trigger form submit...');
                    // Let the normal form submit happen
                });
                console.log(`✅ Button ${index} click event bound`);
            } catch (error) {
                console.error(`❌ Button ${index} binding failed:`, error);
            }
        });

        // Save button
        const saveBtn = document.getElementById('saveButton');
        if (saveBtn) {
            console.log('Save button found, binding...');
            saveBtn.addEventListener('click', () => this.saveDraft());
            console.log('✅ Save button event bound');
        } else {
            console.log('ℹ️ Save button not found (may be optional)');
        }

        // Auto-save draft every minute
        console.log('Setting up auto-save interval...');
        setInterval(() => this.saveDraft(true), 60000);
        console.log('✅ Auto-save interval set');
        
        console.log('=== BIND EVENTS COMPLETED ===');
    }

    navigateToDashboard() {
        // Navigate to appropriate dashboard based on user role
        if (window.auth && window.auth.isAuthenticated()) {
            const currentUser = window.auth.getCurrentUser();
            if (currentUser && currentUser.role === 'admin') {
                console.log('Navigating to admin dashboard');
                window.location.href = '../pages/admin.html';
            } else {
                console.log('Navigating to user dashboard (tracking)');
                window.location.href = '../pages/tracking.html';
            }
        } else {
            console.log('User not authenticated, redirecting to login');
            window.location.href = '../index.html';
        }
    }

    async loadExistingPO(poId) {
        try {
            const po = await this.api.getPOById(poId);
            this.fillFormData(po);
        } catch (error) {
            window.modal.showError('Failed to load PO data for revision.');
        }
    }

    fillFormData(po) {
        // Fill meta (flat fields)
        const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v ?? ''; };
        const m = po.meta || {};
        setVal('projectName', m.projectName);
        setVal('generalContractor', m.generalContractor);
        setVal('address', m.address);
        setVal('owner', m.owner);
        setVal('apexOwner', m.apexOwner);
        setVal('typeStatus', m.typeStatus);
        setVal('projectManager', m.projectManager);
        setVal('contractAmount', m.contractAmount);
        setVal('addAltAmount', m.addAltAmount);
        setVal('retainagePct', m.retainagePct);
        setVal('addAltDetails', m.addAltDetails);
        setVal('requestedBy', m.requestedBy);
        setVal('companyName', m.companyName);
        setVal('contactName', m.contactName);
        setVal('email', m.email);
        setVal('cellNumber', m.cellNumber);
        setVal('officeNumber', m.officeNumber);
        setVal('vendorType', m.vendorType);
        setVal('workType', m.workType);

        const d = (m.importantDates) || {};
        setVal('noticeToProceed', d.noticeToProceed);
        setVal('anticipatedStart', d.anticipatedStart);
        setVal('substantialCompletion', d.substantialCompletion);
        setVal('hundredPercent', d.hundredPercent);

        // Populate tables via dynamicForm if available
        if (Array.isArray(po.schedule) && window.dynamicForm) {
            window.dynamicForm.clearAllItems();
            window.dynamicForm.loadScheduleData(po.schedule);
        }
        if (Array.isArray(po.scope) && window.dynamicForm) {
            window.dynamicForm.loadScopeData(po.scope);
        }
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
                    <div class="form-group">
                        <label>Profit *</label>
                        <input type="number" name="profit" required>
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
            window.modal.showConfirm(
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
            window.modal.showConfirm(
                'Are you sure you want to remove this scope item?',
                () => item.remove(),
                null
            );
        });
    }

    collectFormData() {
        // Build meta object in the requested flat structure
        const val = (id) => {
            const el = document.getElementById(id);
            return el ? el.value : '';
        };
        const num = (id) => {
            const n = Number(val(id));
            return isNaN(n) ? 0 : n;
        };

        const formData = {
            meta: {
                projectName: val('projectName'),
                generalContractor: val('generalContractor'),
                address: val('address'),
                owner: val('owner'),
                apexOwner: val('apexOwner'),
                typeStatus: val('typeStatus'),
                projectManager: val('projectManager'),
                contractAmount: num('contractAmount'),
                addAltAmount: num('addAltAmount'),
                addAltDetails: val('addAltDetails'),
                retainagePct: num('retainagePct'),
                requestedBy: val('requestedBy'),
                companyName: val('companyName'),
                contactName: val('contactName'),
                cellNumber: val('cellNumber'),
                email: val('email'),
                officeNumber: val('officeNumber'),
                vendorType: val('vendorType'),
                workType: val('workType'),
                importantDates: {
                    noticeToProceed: val('noticeToProceed'),
                    anticipatedStart: val('anticipatedStart'),
                    substantialCompletion: val('substantialCompletion'),
                    hundredPercent: val('hundredPercent')
                }
            },
            schedule: (window.dynamicForm && typeof window.dynamicForm.getScheduleItems === 'function')
                ? window.dynamicForm.getScheduleItems()
                : [],
            scope: (window.dynamicForm && typeof window.dynamicForm.getScopeItems === 'function')
                ? window.dynamicForm.getScopeItems()
                : []
        };

        // Add metadata
        formData.createdAt = new Date().toISOString();
        formData.sent = false;
        formData.timestamp = Date.now();
        formData.id = this.revisionId || Date.now();

        console.log('=== COLLECTED FORM DATA ===');
        console.log('Form data:', JSON.stringify(formData, null, 2));
        console.log('Schedule items count:', formData.schedule.length);
        console.log('First schedule item fields:', formData.schedule.length > 0 ? Object.keys(formData.schedule[0]) : 'No schedule items');
        console.log('Schedule data validation:', {
            hasSchedule: Array.isArray(formData.schedule),
            scheduleLength: formData.schedule.length,
            allRequiredFieldsPresent: formData.schedule.every(item => {
                const required = ['primeLine', 'budgetCode', 'description', 'qty', 'unit', 'totalCost', 'scheduled', 'apexContractValue', 'profit'];
                const present = required.filter(field => item[field] !== undefined && item[field] !== '');
                console.log(`Schedule item fields: ${Object.keys(item).join(', ')}`);
                console.log(`Required fields present: ${present.join(', ')}`);
                console.log(`Missing fields: ${required.filter(f => !present.includes(f)).join(', ')}`);
                return required.every(field => item[field] !== undefined && item[field] !== '');
            })
        });

        return formData;
    }

    saveDraft(silent = false) {
        const formData = this.collectFormData();
        this.storage.saveDraft(formData);
        if (!silent) {
            window.modal.showSuccess('Draft saved successfully.');
        }
    }

    loadDraft() {
        if (this.revisionId) return; // Don't load draft if we're revising an existing PO

        const draft = this.storage.getDraft();
        if (draft && draft.data) {
            console.log('Draft found, checking modal availability...');
            
            // Try different modal methods in order of preference
            if (window.modal && typeof window.modal.show === 'function') {
                console.log('Using window.modal.show');
                window.modal.show({
                    title: 'Load Draft',
                    content: 'Would you like to load your saved draft?',
                    actions: [
                        {
                            id: 'load',
                            label: 'Load Draft',
                            class: 'btn-primary',
                            handler: () => this.fillFormData(draft.data)
                        },
                        {
                            id: 'discard',
                            label: 'Discard Draft', 
                            class: 'btn-secondary',
                            handler: () => this.storage.clearDraft()
                        }
                    ]
                });
            } else if (confirm('Would you like to load your saved draft? (Click OK to load, Cancel to discard)')) {
                console.log('Using basic confirm dialog');
                this.fillFormData(draft.data);
            } else {
                this.storage.clearDraft();
            }
        }
    }

    async handleSubmit(event) {
        console.log('🚀🚀🚀 === FORM SUBMIT HANDLER CALLED === 🚀🚀🚀');
        console.log('Event received:', event);
        console.log('Event type:', event ? event.type : 'no event');
        console.log('Event target:', event ? event.target : 'no target');
        console.log('Timestamp:', new Date().toISOString());
        
        if (event) {
            console.log('Preventing default form submission...');
            event.preventDefault();
            console.log('Default prevented');
        } else {
            console.warn('No event object received!');
        }
        
        // Add a visible indicator that submit was triggered
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            const originalText = submitBtn.textContent;
            submitBtn.textContent = '🔄 Processing...';
            submitBtn.disabled = true;
            
            // Reset after 10 seconds as failsafe
            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }, 10000);
        }
        
        try {
            console.log('Checking dependencies...');
            console.log('this.api available:', !!this.api);
            console.log('this.storage available:', !!this.storage);
            console.log('window.modal available:', !!window.modal);
            
            if (!this.api) {
                console.error('❌ CRITICAL: this.api not available!');
                alert('System Error: API not available. Please refresh the page.');
                return;
            }
            
            if (!window.modal) {
                console.error('❌ CRITICAL: window.modal not available!');
                alert('System Error: Modal system not available. Please refresh the page.');
                return;
            }
            
            console.log('Collecting form data...');
            const formData = this.collectFormData();
            console.log('✅ Form data collected:', formData);
            
            console.log('Showing confirmation modal...');
            // Show confirmation modal with summary
            window.modal.show({
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
                                console.log('User confirmed submission, proceeding...');
                                // Show loading modal
                                window.modal.showLoadingModal('Submitting Purchase Order...');
                                
                                formData.sent = true;
                                formData.sentAt = new Date().toISOString();
                                
                                console.log('Calling this.api.createPO...');
                                
                                // Add timeout to prevent hanging
                                const submitTimeout = new Promise((_, reject) => {
                                    setTimeout(() => reject(new Error('Submission timeout after 30 seconds')), 30000);
                                });
                                
                                const submitPromise = this.api.createPO(formData);
                                
                                const result = await Promise.race([submitPromise, submitTimeout]);
                                console.log('API result received:', result);
                                
                                // Hide loading modal
                                window.modal.hideLoadingModal();
                                
                                if (result.success) {
                                    console.log('Submission successful!');
                                    this.storage.clearDraft();
                                    
                                    // Show detailed success message
                                    const syncStatus = result.syncStatus || 'unknown';
                                    const powerAutomateStatus = syncStatus === 'synced' ? 
                                        '✅ Successfully sent to Power Automate' : 
                                        '⚠️ Saved locally, will retry sending to Power Automate';
                                    
                                    window.modal.show({
                                        title: 'Purchase Order Submitted Successfully!',
                                        content: `
                                            <div class="success-details">
                                                <p><strong>PO ID:</strong> ${result.po.id}</p>
                                                <p><strong>Status:</strong> ${result.po.status}</p>
                                                <p><strong>Local Storage:</strong> ✅ Saved successfully</p>
                                                <p><strong>Power Automate:</strong> ${powerAutomateStatus}</p>
                                                <p><strong>Submitted At:</strong> ${new Date(result.po.sentAt).toLocaleString()}</p>
                                            </div>
                                        `,
                                        actions: [{
                                            id: 'ok',
                                            label: 'View My POs',
                                            class: 'btn-primary',
                                            handler: () => {
                                                const currentUser = window.auth?.getCurrentUser();
                                                if (currentUser?.role === 'admin') {
                                                    window.location.href = '/pages/admin.html';
                                                } else {
                                                    window.location.href = '/pages/tracking.html';
                                                }
                                            }
                                        }]
                                    });
                                } else {
                                    console.log('Submission failed:', result);
                                    window.modal.showErrorModal(
                                        'Submission Failed',
                                        `Failed to submit Purchase Order: ${result.error || 'Unknown error'}`
                                    );
                                }
                            } catch (error) {
                                console.error('Submit error:', error);
                                window.modal.hideLoadingModal();
                                
                                // Reset submit button
                                const submitBtn = document.querySelector('button[type="submit"]');
                                if (submitBtn) {
                                    submitBtn.style.background = '';
                                    submitBtn.style.transform = '';
                                    submitBtn.textContent = 'Submit Purchase Order';
                                    submitBtn.disabled = false;
                                }
                                
                                window.modal.showError(
                                    `Submission Failed: ${error.message || 'Network or server error'}`
                                );
                            }
                        }
                    }
                ]
            });
        } catch (error) {
            console.error('Error preparing submission:', error);
            window.modal.showError('Failed to prepare submission. Please check your inputs and try again.');
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
console.log('📝 Creating POForm instance...');
const poFormInstance = new POForm();
window.poForm = poFormInstance; // Make available globally for debugging
console.log('📝 POForm instance created and assigned to window.poForm');
