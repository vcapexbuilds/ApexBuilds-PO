// EMERGENCY BUTTON FIX - Direct button binding without dependencies
console.log('🚨 EMERGENCY BUTTON FIX LOADING...');

// Function to prevent duplicate form submissions
function fixFormSubmissionConflicts() {
    console.log('🔧 Fixing form submission conflicts...');
    
    const form = document.getElementById('poForm');
    if (!form) {
        console.error('❌ Form not found');
        return;
    }
    
    // Remove all existing event listeners by cloning the form
    const parent = form.parentNode;
    const newForm = form.cloneNode(true);
    parent.replaceChild(newForm, form);
    
    // Override onsubmit to prevent conflicts
    const finalForm = document.getElementById('poForm');
    finalForm.onsubmit = null;
    
    // Add single clean submission handler
    finalForm.addEventListener('submit', async (e) => {
        console.log('🎯💥 EMERGENCY FORM SUBMISSION HANDLER!');
        e.preventDefault();
        e.stopImmediatePropagation();
        
        try {
            if (!window.SimplePOHandler) {
                alert('System not ready. Please refresh the page.');
                return;
            }

            console.log('Form submission - using Simple PO Handler with Power Automate');
            
            // Collect form data using Simple PO Handler
            const formData = window.SimplePOHandler.collectFormData();

            // Show confirmation
            const projectName = formData.projectName || 'Untitled Project';
            if (!confirm(`Submit PO for "${projectName}"?\n\nThis will submit the PO to Power Automate for processing.`)) {
                return;
            }

            // Update button state
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = '🔄 Submitting to Power Automate...';
                submitBtn.disabled = true;
            }

            // Submit using Simple PO Handler
            const result = await window.SimplePOHandler.submitPO(formData);

            if (result && result.success) {
                let message = `SUCCESS! Purchase Order submitted!\n\n🎯 PO Number: ${result.poNumber}`;
                
                if (result.storage === 'power-automate') {
                    message += `\n🚀 Power Automate: ✅ Submitted successfully`;
                    message += `\n📡 Endpoint: ${result.endpoint ? 'Connected' : 'N/A'}`;
                } else if (result.storage === 'local-storage') {
                    message += `\n💾 Local Storage: ✅ Saved`;
                }
                
                alert(message);
                
                // Reset form
                finalForm.reset();
            } else {
                throw new Error(result?.error || 'Submission failed');
            }
        } catch (error) {
            console.error('❌ Error in form submission:', error);
            alert('Error submitting form: ' + error.message);
        } finally {
            // Reset button
            const submitBtn = document.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.textContent = 'Submit Purchase Order';
                submitBtn.disabled = false;
            }
        }
    });
    
    console.log('✅ Form submission handler fixed');
}

// Function to directly bind buttons with multiple fallback approaches
function forceBindButtons() {
    console.log('🔧 forceBindButtons() called');
    
    const scheduleBtn = document.getElementById('addScheduleItem');
    const scopeBtn = document.getElementById('addScopeItem');
    
    console.log('Button check:', {
        scheduleBtn: !!scheduleBtn,
        scopeBtn: !!scopeBtn
    });
    
    if (scheduleBtn) {
        console.log('📝 FORCEFULLY binding schedule button...');
        
        // Remove ALL possible event handlers
        scheduleBtn.onclick = null;
        scheduleBtn.onmousedown = null;
        scheduleBtn.onmouseup = null;
        scheduleBtn.removeAttribute('data-bound');
        
        // Clone to remove all event listeners completely
        const parent = scheduleBtn.parentNode;
        const newBtn = scheduleBtn.cloneNode(true);
        parent.replaceChild(newBtn, scheduleBtn);
        
        // Add single handler only with MAXIMUM priority
        const finalBtn = document.getElementById('addScheduleItem');
        finalBtn.onclick = function(e) {
            console.log('🎯💥 EMERGENCY SCHEDULE BUTTON CLICKED!');
            e.preventDefault();
            e.stopImmediatePropagation();
            
            try {
                addScheduleItemDirect();
            } catch (error) {
                console.error('❌ Error in addScheduleItemDirect:', error);
                alert('Error adding schedule item: ' + error.message);
            }
        };
        
        // Also override addEventListener
        const originalAddEventListener = finalBtn.addEventListener;
        finalBtn.addEventListener = function() {
            console.log('🚫 Blocking addEventListener on schedule button');
            // Do nothing - block all future event listeners
        };
        
        console.log('✅ Schedule button FORCEFULLY bound');
    } else {
        console.error('❌ Schedule button not found');
    }
    
    if (scopeBtn) {
        console.log('📝 FORCEFULLY binding scope button...');
        
        // Remove ALL possible event handlers
        scopeBtn.onclick = null;
        scopeBtn.onmousedown = null;
        scopeBtn.onmouseup = null;
        scopeBtn.removeAttribute('data-bound');
        
        // Clone to remove all event listeners completely
        const parent = scopeBtn.parentNode;
        const newBtn = scopeBtn.cloneNode(true);
        parent.replaceChild(newBtn, scopeBtn);
        
        // Add single handler only with MAXIMUM priority
        const finalBtn = document.getElementById('addScopeItem');
        finalBtn.onclick = function(e) {
            console.log('🎯💥 EMERGENCY SCOPE BUTTON CLICKED!');
            e.preventDefault();
            e.stopImmediatePropagation();
            
            try {
                addScopeItemDirect();
            } catch (error) {
                console.error('❌ Error in addScopeItemDirect:', error);
                alert('Error adding scope item: ' + error.message);
            }
        };
        
        // Also override addEventListener
        const originalAddEventListener = finalBtn.addEventListener;
        finalBtn.addEventListener = function() {
            console.log('🚫 Blocking addEventListener on scope button');
            // Do nothing - block all future event listeners
        };
        
        console.log('✅ Scope button FORCEFULLY bound');
    } else {
        console.error('❌ Scope button not found');
    }
}

// Direct functions to add items without dependencies
function addScheduleItemDirect() {
    console.log('🔧🔧🔧 addScheduleItemDirect() called');
    
    const tbody = document.getElementById('scheduleItems');
    console.log('Schedule tbody lookup result:', tbody);
    
    if (!tbody) {
        console.error('❌ scheduleItems tbody not found');
        console.log('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return;
    }
    
    console.log('📊 Current tbody children count BEFORE:', tbody.children.length);
    
    const itemId = `schedule-${Date.now()}`;
    const row = document.createElement('tr');
    row.id = itemId;
    
    console.log('📝 Creating row with ID:', itemId);
    
    const rowHTML = `
        <td><input type="text" name="primeLine[]"></td>
        <td><input type="text" name="budgetCode[]"></td>
        <td><textarea name="description[]" placeholder="Description"></textarea></td>
        <td><input type="number" name="quantity[]" step="0.01" min="0"></td>
        <td><input type="text" name="unit[]"></td>
        <td><input type="number" name="totalCost[]" step="0.01" min="0" placeholder="0.00"></td>
        <td><input type="number" name="scheduled[]" step="1" min="0"></td>
        <td><input type="number" name="apexContractValue[]" step="0.01" min="0"></td>
        <td><input type="number" name="profit[]" step="0.01" min="0"></td>
        <td>
            <button type="button" onclick="removeScheduleItem('${itemId}')" class="btn btn-danger btn-small">Remove</button>
        </td>
    `;
    
    console.log('📝 Setting row innerHTML...');
    row.innerHTML = rowHTML;
    
    // Ensure row is visible with explicit styling
    row.style.height = 'auto';
    row.style.minHeight = '40px';
    row.style.display = 'table-row';
    
    console.log('📝 Appending row to tbody...');
    tbody.appendChild(row);
    
    console.log('📊 Current tbody children count AFTER:', tbody.children.length);
    console.log('📊 Row actually added:', !!document.getElementById(itemId));
    
    // Hide empty state message
    const emptyState = document.getElementById('noScheduleItems');
    if (emptyState) {
        console.log('📝 Hiding empty state message...');
        emptyState.style.display = 'none';
    } else {
        console.log('⚠️ Empty state element not found');
    }
    
    console.log('✅ Schedule item added successfully:', itemId);
    
    // Force a visual refresh
    tbody.style.display = 'none';
    tbody.offsetHeight; // Trigger reflow
    tbody.style.display = '';
}

function addScopeItemDirect() {
    console.log('🔧🔧🔧 addScopeItemDirect() called');
    
    const tbody = document.getElementById('scopeItems');
    console.log('Scope tbody lookup result:', tbody);
    
    if (!tbody) {
        console.error('❌ scopeItems tbody not found');
        console.log('Available elements with IDs:', Array.from(document.querySelectorAll('[id]')).map(el => el.id));
        return;
    }
    
    console.log('📊 Current scope tbody children count BEFORE:', tbody.children.length);
    
    // Calculate the next item number based on existing rows
    const existingRows = tbody.querySelectorAll('tr');
    const nextItemNumber = existingRows.length + 1;
    
    console.log('📊 Calculated next item number:', nextItemNumber);
    
    const itemId = `scope-${Date.now()}`;
    const radioGroupId = Date.now();
    const row = document.createElement('tr');
    row.id = itemId;
    
    console.log('📝 Creating scope row with ID:', itemId);
    
    const rowHTML = `
        <td><input type="text" name="scopeItemNumber[]" value="${nextItemNumber}" readonly></td>
        <td><textarea name="scopeDescription[]" placeholder="Describe the scope of work"></textarea></td>
        <td style="white-space: nowrap;">
            <label style="display: inline-block; margin-right: 10px;"><input type="radio" name="scopeStatus_${radioGroupId}" value="included"> Included</label>
            <label style="display: inline-block;"><input type="radio" name="scopeStatus_${radioGroupId}" value="excluded"> Excluded</label>
        </td>
        <td><button type="button" onclick="removeScopeItem('${itemId}')" class="btn btn-danger btn-small">Remove</button></td>
    `;
    
    console.log('📝 Setting scope row innerHTML...');
    row.innerHTML = rowHTML;
    
    // Ensure row is visible with explicit styling
    row.style.height = 'auto';
    row.style.minHeight = '40px';
    row.style.display = 'table-row';
    
    console.log('📝 Appending scope row to tbody...');
    tbody.appendChild(row);
    
    console.log('📊 Current scope tbody children count AFTER:', tbody.children.length);
    console.log('📊 Scope row actually added:', !!document.getElementById(itemId));
    
    // Hide empty state message
    const emptyState = document.getElementById('noScopeItems');
    if (emptyState) {
        console.log('📝 Hiding scope empty state message...');
        emptyState.style.display = 'none';
    } else {
        console.log('⚠️ Scope empty state element not found');
    }
    
    console.log('✅ Scope item added successfully:', itemId);
    
    // Force a visual refresh
    tbody.style.display = 'none';
    tbody.offsetHeight; // Trigger reflow
    tbody.style.display = '';
}

// Remove item functions
function removeScheduleItem(itemId) {
    const row = document.getElementById(itemId);
    if (row) {
        row.remove();
        
        // Check if we need to show empty state
        const tbody = document.getElementById('scheduleItems');
        if (tbody && tbody.children.length === 0) {
            const emptyState = document.getElementById('noScheduleItems');
            if (emptyState) {
                emptyState.style.display = 'block';
            }
        }
    }
}

function removeScopeItem(itemId) {
    const row = document.getElementById(itemId);
    if (row) {
        row.remove();
        
        // Renumber remaining scope items
        const tbody = document.getElementById('scopeItems');
        if (tbody) {
            const remainingRows = tbody.querySelectorAll('tr');
            remainingRows.forEach((row, index) => {
                const numberInput = row.querySelector('input[name="scopeItemNumber[]"]');
                if (numberInput) {
                    numberInput.value = index + 1;
                }
            });
        }
        
        // Check if we need to show empty state
        if (tbody && tbody.children.length === 0) {
            const emptyState = document.getElementById('noScopeItems');
            if (emptyState) {
                emptyState.style.display = 'block';
            }
        }
    }
}

// Make functions globally available
window.removeScheduleItem = removeScheduleItem;
window.removeScopeItem = removeScopeItem;

// Bind buttons immediately and on different events
let buttonsAlreadyBound = false;

function safeBindButtons() {
    if (buttonsAlreadyBound) {
        console.log('⚠️ Buttons already bound, skipping...');
        return;
    }
    
    forceBindButtons();
    buttonsAlreadyBound = true;
}

// Wait for all other scripts to load first, then forcefully override
window.addEventListener('load', () => {
    console.log('🚀 Window loaded, waiting for other scripts...');
    setTimeout(() => {
        console.log('🔥 FORCE OVERRIDING ALL BUTTON BINDINGS...');
        buttonsAlreadyBound = false; // Reset flag
        safeBindButtons();
        fixFormSubmissionConflicts(); // Fix form submission conflicts too
    }, 2000); // Wait 2 seconds for other scripts
    
    // Additional aggressive binding after 5 seconds
    setTimeout(() => {
        console.log('🔥🔥 SUPER AGGRESSIVE BUTTON BINDING...');
        buttonsAlreadyBound = false; // Reset flag again
        safeBindButtons();
    }, 5000); // Extra aggressive binding
});

// Backup binding attempts
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', safeBindButtons);
} else {
    safeBindButtons();
}

// Multiple backup attempts with different delays
setTimeout(() => {
    if (!buttonsAlreadyBound) {
        console.log('🔄 Backup binding attempt 1...');
        safeBindButtons();
    }
}, 1000);

setTimeout(() => {
    console.log('🔄 Backup binding attempt 2 (forced)...');
    buttonsAlreadyBound = false;
    safeBindButtons();
}, 3000);

setTimeout(() => {
    console.log('🔄 Final backup binding attempt...');
    buttonsAlreadyBound = false;
    safeBindButtons();
}, 7000);

console.log('🚨 EMERGENCY BUTTON FIX LOADED');

// Test function to manually check button responsiveness
window.testButtonBinding = function() {
    console.log('🧪 Testing button binding...');
    const scheduleBtn = document.getElementById('addScheduleItem');
    const scopeBtn = document.getElementById('addScopeItem');
    
    console.log('Schedule button:', scheduleBtn);
    console.log('Schedule button onclick:', scheduleBtn ? scheduleBtn.onclick : 'N/A');
    console.log('Scope button:', scopeBtn);
    console.log('Scope button onclick:', scopeBtn ? scopeBtn.onclick : 'N/A');
    
    if (scheduleBtn) {
        console.log('🔥 FORCE BINDING SCHEDULE BUTTON RIGHT NOW!');
        scheduleBtn.onclick = function(e) {
            console.log('🎯💥 MANUAL TEST SCHEDULE BUTTON CLICKED!');
            e.preventDefault();
            e.stopImmediatePropagation();
            addScheduleItemDirect();
        };
    }
    
    if (scopeBtn) {
        console.log('🔥 FORCE BINDING SCOPE BUTTON RIGHT NOW!');
        scopeBtn.onclick = function(e) {
            console.log('🎯💥 MANUAL TEST SCOPE BUTTON CLICKED!');
            e.preventDefault();
            e.stopImmediatePropagation();
            addScopeItemDirect();
        };
    }
    
    console.log('✅ Manual binding test completed');
};

// Auto-run test function after a delay
setTimeout(() => {
    console.log('🧪 Running automatic button test...');
    window.testButtonBinding();
}, 8000); // Run test after 8 seconds

// Force update - Wed Aug 27 17:10:45 UTC 2025
