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
        // Check multiple authentication methods
        const isAuthenticatedViaAuth = window.auth && window.auth.isAuthenticated();
        const isAuthenticatedViaLocalStorage = localStorage.getItem('isAuthenticated') === 'true';
        const hasCurrentUser = localStorage.getItem('currentUser') || (window.storage && window.storage.getCurrentUser());
        
        console.log('Authentication check:', {
            authObject: isAuthenticatedViaAuth,
            localStorage: isAuthenticatedViaLocalStorage,
            hasUser: !!hasCurrentUser
        });
        
        if (!isAuthenticatedViaAuth && !isAuthenticatedViaLocalStorage && !hasCurrentUser) {
            console.log('Not authenticated, redirecting to login');
            window.location.href = '/index.html';
            return;
        }
        
        // Check user role for proper page redirection
        let currentUser = null;
        if (window.storage && window.storage.getCurrentUser) {
            currentUser = window.storage.getCurrentUser();
        } else if (localStorage.getItem('currentUser')) {
            currentUser = JSON.parse(localStorage.getItem('currentUser'));
        }
        
        if (currentUser) {
            console.log('Current user:', currentUser);
            // Redirect based on role if this is the initial login
            const urlParams = new URLSearchParams(window.location.search);
            const fromLogin = urlParams.get('from') === 'login';
            
            if (fromLogin) {
                if (currentUser.role === 'admin') {
                    window.location.href = '/pages/admin.html';
                    return;
                } else {
                    // For regular users, stay on form page or go to tracking
                    // You can change this to redirect to tracking page if preferred
                    // window.location.href = '/pages/tracking.html';
                }
            }
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
        // Build meta object in the enhanced structure
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

        // Legacy fields for backward compatibility
        formData.createdAt = new Date().toISOString();
        formData.sent = false;
        formData.timestamp = Date.now();
        formData.id = this.revisionId || Date.now();
        
        // Enhanced user information for UserPOManager
        const currentUser = window.auth ? window.auth.getCurrentUser() : null;
        if (currentUser) {
            formData.submittedBy = {
                userId: currentUser.id,
                username: currentUser.username || currentUser.name,
                email: currentUser.email,
                upn: currentUser.upn || currentUser.email,
                company: currentUser.company || 'Apex Building Corporation',
                role: currentUser.role || 'user',
                department: currentUser.department || 'General',
                submittedAt: new Date().toISOString()
            };
        } else {
            // Fallback for cases where auth isn't available
            formData.submittedBy = {
                userId: 'anonymous',
                username: 'Anonymous User',
                email: '',
                upn: '',
                company: 'Apex Building Corporation',
                role: 'user',
                department: 'General',
                submittedAt: new Date().toISOString()
            };
        }

        console.log('=== COLLECTED ENHANCED FORM DATA ===');
        console.log('Form data structure:', {
            meta: !!formData.meta,
            schedule: formData.schedule.length,
            scope: formData.scope.length,
            submittedBy: !!formData.submittedBy,
            userId: formData.submittedBy.userId
        });
        console.log('Schedule items count:', formData.schedule.length);
        console.log('First schedule item fields:', formData.schedule.length > 0 ? Object.keys(formData.schedule[0]) : 'No schedule items');
        console.log('User context:', formData.submittedBy);
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
        console.log('🚀🚀🚀 === ENHANCED FORM SUBMIT HANDLER === 🚀🚀🚀');
        console.log('Event received:', event);
        console.log('HybridPOManager available:', !!window.hybridPOManager);
        console.log('UserPOManager available:', !!window.userPOManager);
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
        let originalText = '';
        let originalClass = '';
        if (submitBtn) {
            originalText = submitBtn.innerHTML;
            originalClass = submitBtn.className;
            submitBtn.innerHTML = '<span class="loading-spinner"></span><span class="btn-loading-text">Processing...</span>';
            submitBtn.className = originalClass + ' btn-loading';
            submitBtn.disabled = true;
            
            // Reset after 30 seconds as failsafe
            setTimeout(() => {
                if (submitBtn.disabled) {
                    submitBtn.innerHTML = originalText;
                    submitBtn.className = originalClass;
                    submitBtn.disabled = false;
                }
            }, 30000);
        }

        try {
            console.log('Checking dependencies...');
            console.log('Enhanced dependencies:', {
                hybridPOManager: !!window.hybridPOManager,
                userPOManager: !!window.userPOManager,
                api: !!this.api,
                storage: !!this.storage,
                modal: !!window.modal
            });
            
            // Prefer hybrid PO manager for Google Drive integration
            const poManager = window.hybridPOManager || window.userPOManager;
            const managerType = window.hybridPOManager ? 'HybridPOManager (MS365 + Google Drive)' : 'UserPOManager (legacy)';
            
            if (!poManager) {
                console.error('❌ CRITICAL: No PO Manager available!');
                alert('System Error: PO Manager not available. Please refresh the page.');
                return;
            }
            
            console.log(`✅ Using ${managerType} for submission`);
            
            if (!window.modal) {
                console.error('❌ CRITICAL: Modal system not available!');
                alert('System Error: Modal system not available. Please refresh the page.');
                return;
            }
            
            console.log('Collecting form data for enhanced submission...');
            const formData = this.collectFormData();
            console.log('✅ Form data collected:', formData);
            
            // Calculate total amount for business rules
            const totalAmount = formData.schedule.reduce((sum, item) => sum + (Number(item.totalCost) || 0), 0);
            console.log('Total PO Amount:', totalAmount);
            
            console.log('Showing enhanced confirmation modal...');
            // Show enhanced confirmation modal with PO preview
            window.modal.show({
                title: 'Confirm Purchase Order Submission',
                content: this.createEnhancedSubmissionSummary(formData, totalAmount),
                size: 'large',
                actions: [
                    {
                        id: 'save-draft',
                        label: 'Save as Draft',
                        class: 'btn-secondary',
                        handler: async () => {
                            try {
                                console.log('Saving as draft...');
                                window.modal.showLoadingModal('Saving Draft...');
                                
                                const result = await poManager.submitPO(formData, { 
                                    isDraft: true,
                                    comments: 'Saved as draft from form submission'
                                });
                                
                                window.modal.hideLoadingModal();
                                
                                if (result.success) {
                                    // Clear form draft from old storage
                                    this.storage.clearDraft();
                                    
                                    window.modal.show({
                                        title: 'Draft Saved Successfully!',
                                        content: `
                                            <div class="success-details">
                                                <p><strong>PO Number:</strong> ${result.poNumber}</p>
                                                <p><strong>Status:</strong> Draft</p>
                                                <p><strong>Total Amount:</strong> $${totalAmount.toLocaleString()}</p>
                                                <p>You can continue editing this draft or submit it later from your dashboard.</p>
                                            </div>
                                        `,
                                        actions: [{
                                            id: 'continue',
                                            label: 'Continue Editing',
                                            class: 'btn-secondary'
                                        }, {
                                            id: 'dashboard',
                                            label: 'Go to Dashboard',
                                            class: 'btn-primary',
                                            handler: () => {
                                                window.location.href = '/pages/tracking.html';
                                            }
                                        }]
                                    });
                                } else {
                                    window.modal.showErrorModal('Draft Save Failed', result.error);
                                }
                            } catch (error) {
                                window.modal.hideLoadingModal();
                                console.error('Draft save error:', error);
                                window.modal.showError(`Failed to save draft: ${error.message}`);
                            }
                        }
                    },
                    {
                        id: 'cancel',
                        label: 'Cancel',
                        class: 'btn-secondary'
                    },
                    {
                        id: 'confirm',
                        label: 'Submit for Approval',
                        class: 'btn-primary',
                        handler: async () => {
                            try {
                                console.log('User confirmed submission, proceeding with enhanced flow...');
                                
                                // Show loading modal with enhanced messaging
                                window.modal.showLoadingModal('Submitting Purchase Order...', 
                                    'Creating PO with approval workflow and audit trail');
                                
                                // Submit through enhanced PO Manager (Hybrid or User)
                                const result = await poManager.submitPO(formData, {
                                    priority: this.determinePriority(formData, totalAmount),
                                    expectedDelivery: formData.meta?.importantDates?.substantialCompletion,
                                    comments: 'Submitted via enhanced form system',
                                    reason: `New PO submission for ${formData.meta?.projectName || 'project'}`
                                });
                                
                                console.log('Enhanced submission result:', result);
                                
                                // Also submit through legacy API for Power Automate compatibility
                                let legacyResult = null;
                                try {
                                    formData.sent = true;
                                    formData.sentAt = new Date().toISOString();
                                    legacyResult = await this.api.createPO(formData);
                                    console.log('Legacy API result:', legacyResult);
                                } catch (legacyError) {
                                    console.warn('Legacy API submission failed:', legacyError);
                                }
                                
                                // Hide loading modal
                                window.modal.hideLoadingModal();
                                
                                if (result.success) {
                                    console.log('Enhanced submission successful!');
                                    
                                    // Clear form draft
                                    this.storage.clearDraft();
                                    
                                    // Show enhanced success modal
                                    const approvalStatus = result.requiresApproval ? 
                                        '⏳ Pending Approval - Notifications sent to approvers' : 
                                        '✅ Auto-Approved';
                                    
                                    const powerAutomateStatus = legacyResult?.success ? 
                                        '✅ Successfully sent to Power Automate' : 
                                        '⚠️ Will retry sending to Power Automate';
                                    
                                    window.modal.show({
                                        title: 'Purchase Order Submitted Successfully!',
                                        content: `
                                            <div class="enhanced-success-details">
                                                <div class="success-header">
                                                    <h3>📋 PO Details</h3>
                                                </div>
                                                <div class="success-row">
                                                    <strong>PO Number:</strong> <span class="highlight">${result.poNumber}</span>
                                                </div>
                                                <div class="success-row">
                                                    <strong>PO ID:</strong> ${result.poId}
                                                </div>
                                                <div class="success-row">
                                                    <strong>Status:</strong> <span class="status-${result.status}">${result.status.toUpperCase()}</span>
                                                </div>
                                                <div class="success-row">
                                                    <strong>Total Amount:</strong> $${totalAmount.toLocaleString()}
                                                </div>
                                                
                                                <div class="success-header">
                                                    <h3>🔄 Processing Status</h3>
                                                </div>
                                                <div class="success-row">
                                                    <strong>Enhanced Tracking:</strong> ✅ Saved with full audit trail
                                                </div>
                                                <div class="success-row">
                                                    <strong>Approval Workflow:</strong> ${approvalStatus}
                                                </div>
                                                <div class="success-row">
                                                    <strong>Power Automate:</strong> ${powerAutomateStatus}
                                                </div>
                                                <div class="success-row">
                                                    <strong>OneDrive Sync:</strong> ⏳ Queued for synchronization
                                                </div>
                                                
                                                ${result.requiresApproval ? `
                                                <div class="approval-info">
                                                    <p><strong>Next Steps:</strong></p>
                                                    <ul>
                                                        <li>Approval notifications have been sent</li>
                                                        <li>You'll receive email updates on status changes</li>
                                                        <li>Track progress in your PO dashboard</li>
                                                    </ul>
                                                </div>
                                                ` : ''}
                                            </div>
                                            
                                            <style>
                                            .enhanced-success-details {
                                                text-align: left;
                                                line-height: 1.6;
                                            }
                                            .success-header {
                                                margin: 20px 0 10px 0;
                                                padding-bottom: 8px;
                                                border-bottom: 2px solid #e0e0e0;
                                            }
                                            .success-header h3 {
                                                margin: 0;
                                                color: #2c3e50;
                                                font-size: 1.1em;
                                            }
                                            .success-row {
                                                margin: 8px 0;
                                                padding: 4px 0;
                                            }
                                            .highlight {
                                                background: #fff3cd;
                                                padding: 2px 6px;
                                                border-radius: 3px;
                                                font-weight: bold;
                                            }
                                            .status-submitted {
                                                color: #28a745;
                                                font-weight: bold;
                                            }
                                            .approval-info {
                                                background: #f8f9fa;
                                                padding: 15px;
                                                border-radius: 5px;
                                                margin-top: 15px;
                                                border-left: 4px solid #007bff;
                                            }
                                            .approval-info ul {
                                                margin: 10px 0 0 0;
                                                padding-left: 20px;
                                            }
                                            .approval-info li {
                                                margin: 5px 0;
                                            }
                                            </style>
                                        `,
                                        actions: [{
                                            id: 'track-po',
                                            label: 'Track This PO',
                                            class: 'btn-primary',
                                            handler: () => {
                                                window.location.href = `/pages/tracking.html?po=${result.poNumber}`;
                                            }
                                        }, {
                                            id: 'dashboard',
                                            label: 'Go to Dashboard',
                                            class: 'btn-secondary',
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
                                    console.log('Enhanced submission failed:', result);
                                    window.modal.showErrorModal(
                                        'Submission Failed',
                                        `Failed to submit Purchase Order: ${result.error || 'Unknown error'}`
                                    );
                                }
                            } catch (error) {
                                console.error('Enhanced submit error:', error);
                                window.modal.hideLoadingModal();
                                
                                window.modal.showError(
                                    `Submission Failed: ${error.message || 'Network or server error'}`
                                );
                            } finally {
                                // Reset submit button
                                if (submitBtn) {
                                    submitBtn.innerHTML = originalText;
                                    submitBtn.className = originalClass;
                                    submitBtn.disabled = false;
                                }
                            }
                        }
                    }
                ]
            });
        } catch (error) {
            console.error('Error preparing enhanced submission:', error);
            window.modal.showError('Failed to prepare submission. Please check your inputs and try again.');
            
            // Reset submit button on error
            if (submitBtn) {
                submitBtn.innerHTML = originalText;
                submitBtn.className = originalClass;
                submitBtn.disabled = false;
            }
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

    createEnhancedSubmissionSummary(data, totalAmount) {
        const priority = this.determinePriority(data, totalAmount);
        const approvalRequired = this.determineApprovalRequired(totalAmount);
        const estimatedApprovalTime = this.estimateApprovalTime(totalAmount);
        
        return `
            <div class="enhanced-submission-summary">
                <div class="summary-section">
                    <h3>📋 Project Details</h3>
                    <div class="summary-grid">
                        <div class="summary-item">
                            <strong>Project Name:</strong> ${data.meta.projectName || 'Not specified'}
                        </div>
                        <div class="summary-item">
                            <strong>General Contractor:</strong> ${data.meta.generalContractor || 'Not specified'}
                        </div>
                        <div class="summary-item">
                            <strong>Project Manager:</strong> ${data.meta.projectManager || 'Not specified'}
                        </div>
                        <div class="summary-item">
                            <strong>Contract Amount:</strong> $${Number(data.meta.contractAmount || 0).toLocaleString()}
                        </div>
                    </div>
                </div>

                <div class="summary-section">
                    <h3>💰 Financial Summary</h3>
                    <div class="financial-summary">
                        <div class="summary-item highlight">
                            <strong>Total PO Amount:</strong> <span class="amount">$${totalAmount.toLocaleString()}</span>
                        </div>
                        <div class="summary-item">
                            <strong>Schedule Items:</strong> ${data.schedule.length}
                        </div>
                        <div class="summary-item">
                            <strong>Scope Items:</strong> ${data.scope.length} (${data.scope.filter(item => item.included).length} included, ${data.scope.filter(item => item.excluded).length} excluded)
                        </div>
                    </div>
                </div>

                <div class="summary-section">
                    <h3>⚡ Processing Information</h3>
                    <div class="processing-info">
                        <div class="summary-item">
                            <strong>Priority Level:</strong> <span class="priority-${priority}">${priority.toUpperCase()}</span>
                        </div>
                        <div class="summary-item">
                            <strong>Approval Required:</strong> ${approvalRequired ? '✅ Yes' : '❌ No'}
                        </div>
                        ${approvalRequired ? `
                        <div class="summary-item">
                            <strong>Estimated Approval Time:</strong> ${estimatedApprovalTime}
                        </div>
                        ` : ''}
                        <div class="summary-item">
                            <strong>PO Number:</strong> <em>Will be generated upon submission</em>
                        </div>
                    </div>
                </div>

                <div class="summary-warning">
                    <h4>⚠️ Before You Submit</h4>
                    <ul>
                        <li>Review all project details and financial information</li>
                        <li>Ensure all schedule items are complete and accurate</li>
                        <li>Verify scope items are properly categorized</li>
                        ${approvalRequired ? '<li>This PO will require approval before processing</li>' : ''}
                        <li>You can save as draft to continue editing later</li>
                    </ul>
                </div>
            </div>
            
            <style>
            .enhanced-submission-summary {
                text-align: left;
                line-height: 1.5;
            }
            .summary-section {
                margin: 20px 0;
                padding: 15px;
                border: 1px solid #e0e0e0;
                border-radius: 8px;
                background: #f9f9f9;
            }
            .summary-section h3 {
                margin: 0 0 15px 0;
                color: #2c3e50;
                font-size: 1.1em;
                border-bottom: 2px solid #3498db;
                padding-bottom: 5px;
            }
            .summary-grid, .financial-summary, .processing-info {
                display: grid;
                gap: 10px;
            }
            .summary-grid {
                grid-template-columns: 1fr 1fr;
            }
            .summary-item {
                padding: 8px;
                background: white;
                border-radius: 4px;
                border-left: 3px solid #3498db;
            }
            .summary-item.highlight {
                background: #e8f6f3;
                border-left-color: #27ae60;
            }
            .amount {
                font-size: 1.2em;
                font-weight: bold;
                color: #27ae60;
            }
            .priority-normal { color: #3498db; }
            .priority-high { color: #e67e22; }
            .priority-urgent { color: #e74c3c; font-weight: bold; }
            .summary-warning {
                background: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 15px;
                margin-top: 20px;
            }
            .summary-warning h4 {
                margin: 0 0 10px 0;
                color: #856404;
            }
            .summary-warning ul {
                margin: 0;
                padding-left: 20px;
            }
            .summary-warning li {
                margin: 5px 0;
                color: #856404;
            }
            </style>
        `;
    }

    determinePriority(data, totalAmount) {
        // Determine priority based on amount and project urgency
        if (totalAmount > 200000) return 'urgent';
        if (totalAmount > 100000) return 'high';
        
        // Check for urgent keywords in project name or type
        const urgentKeywords = ['urgent', 'emergency', 'critical', 'asap', 'rush'];
        const projectText = (data.meta.projectName + ' ' + data.meta.typeStatus).toLowerCase();
        const hasUrgentKeywords = urgentKeywords.some(keyword => projectText.includes(keyword));
        
        if (hasUrgentKeywords) return 'high';
        
        return 'normal';
    }

    determineApprovalRequired(totalAmount) {
        // Business rule: amounts over $50K require approval
        return totalAmount > 50000;
    }

    estimateApprovalTime(totalAmount) {
        if (totalAmount > 200000) return '2-3 business days';
        if (totalAmount > 100000) return '1-2 business days';
        return '4-24 hours';
    }
}

// Initialize the form
console.log('📝 Creating POForm instance...');
const poFormInstance = new POForm();
window.poForm = poFormInstance; // Make available globally for debugging
console.log('📝 POForm instance created and assigned to window.poForm');
