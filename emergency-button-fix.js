// EMERGENCY BUTTON FIX - Direct button binding without dependencies
console.log('🚨 EMERGENCY BUTTON FIX LOADING...');

// Function to directly bind buttons with multiple fallback approaches
function forceBindButtons() {
    console.log('🔧 forceBindButtons() called');
    
    const scheduleBtn = document.getElementById('addScheduleItem');
    const scopeBtn = document.getElementById('addScopeItem');
    
    console.log('Button check:', {
        scheduleBtn: !!scheduleBtn,
        scopeBtn: !!scopeBtn
    });
    
    if (scheduleBtn && !scheduleBtn.dataset.bound) {
        // Mark as bound to prevent duplicate handlers
        scheduleBtn.dataset.bound = 'true';
        
        // Clear any existing handlers
        scheduleBtn.onclick = null;
        
        // Add single handler
        scheduleBtn.onclick = function(e) {
            console.log('🎯 EMERGENCY SCHEDULE ONCLICK!');
            e.preventDefault();
            e.stopPropagation();
            addScheduleItemDirect();
        };
        
        console.log('✅ Schedule button emergency binding complete');
    }
    
    if (scopeBtn && !scopeBtn.dataset.bound) {
        // Mark as bound to prevent duplicate handlers
        scopeBtn.dataset.bound = 'true';
        
        // Clear any existing handlers
        scopeBtn.onclick = null;
        
        // Add single handler
        scopeBtn.onclick = function(e) {
            console.log('🎯 EMERGENCY SCOPE ONCLICK!');
            e.preventDefault();
            e.stopPropagation();
            addScopeItemDirect();
        };
        
        console.log('✅ Scope button emergency binding complete');
    }
}

// Direct functions to add items without dependencies
function addScheduleItemDirect() {
    console.log('🔧 addScheduleItemDirect() called');
    
    const tbody = document.getElementById('scheduleItems');
    if (!tbody) {
        console.error('❌ scheduleItems tbody not found');
        return;
    }
    
    const itemId = `schedule-${Date.now()}`;
    const row = document.createElement('tr');
    row.id = itemId;
    
    row.innerHTML = `
        <td><input type="text" name="primeLine[]" required></td>
        <td><input type="text" name="budgetCode[]" required></td>
        <td><textarea name="description[]" required></textarea></td>
        <td><input type="number" name="quantity[]" required step="0.01" min="0"></td>
        <td><input type="text" name="unit[]" required></td>
        <td><input type="number" name="totalCost[]" required step="0.01" min="0" placeholder="0.00"></td>
        <td><input type="number" name="scheduled[]" required step="1" min="0"></td>
        <td><input type="number" name="apexContractValue[]" required step="0.01" min="0"></td>
        <td><input type="number" name="profit[]" required step="0.01" min="0"></td>
        <td>
            <button type="button" onclick="removeScheduleItem('${itemId}')" class="btn btn-danger btn-small">Remove</button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Hide empty state message
    const emptyState = document.getElementById('noScheduleItems');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    console.log('✅ Schedule item added successfully:', itemId);
}

function addScopeItemDirect() {
    console.log('🔧 addScopeItemDirect() called');
    
    const tbody = document.getElementById('scopeItems');
    if (!tbody) {
        console.error('❌ scopeItems tbody not found');
        return;
    }
    
    // Calculate the next item number based on existing rows
    const existingRows = tbody.querySelectorAll('tr');
    const nextItemNumber = existingRows.length + 1;
    
    const itemId = `scope-${Date.now()}`;
    const radioGroupId = Date.now();
    const row = document.createElement('tr');
    row.id = itemId;
    
    row.innerHTML = `
        <td><input type="text" name="scopeItemNumber[]" required value="${nextItemNumber}" readonly></td>
        <td><textarea name="scopeDescription[]" required placeholder="Describe the scope of work"></textarea></td>
        <td>
            <label><input type="radio" name="scopeStatus_${radioGroupId}" value="included" required> Included</label>
            <label><input type="radio" name="scopeStatus_${radioGroupId}" value="excluded" required> Excluded</label>
        </td>
        <td><button type="button" onclick="removeScopeItem('${itemId}')" class="btn btn-danger btn-small">Remove</button></td>
    `;
    
    tbody.appendChild(row);
    
    // Hide empty state message
    const emptyState = document.getElementById('noScopeItems');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    console.log('✅ Scope item added successfully:', itemId);
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
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', forceBindButtons);
} else {
    forceBindButtons();
}

// Also bind on window load as backup
window.addEventListener('load', forceBindButtons);

// And try again after a short delay
setTimeout(forceBindButtons, 100);
setTimeout(forceBindButtons, 500);
setTimeout(forceBindButtons, 1000);

console.log('🚨 EMERGENCY BUTTON FIX LOADED');
