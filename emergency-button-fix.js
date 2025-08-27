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
    
    if (scheduleBtn) {
        // Clear any existing handlers
        scheduleBtn.onclick = null;
        
        // Add multiple handlers
        scheduleBtn.onclick = function(e) {
            console.log('🎯 EMERGENCY SCHEDULE ONCLICK!');
            e.preventDefault();
            addScheduleItemDirect();
        };
        
        scheduleBtn.addEventListener('click', function(e) {
            console.log('🎯 EMERGENCY SCHEDULE ADDEVENTLISTENER!');
            e.preventDefault();
            addScheduleItemDirect();
        });
        
        console.log('✅ Schedule button emergency binding complete');
    } else {
        console.error('❌ Schedule button not found');
    }
    
    if (scopeBtn) {
        // Clear any existing handlers
        scopeBtn.onclick = null;
        
        // Add multiple handlers
        scopeBtn.onclick = function(e) {
            console.log('🎯 EMERGENCY SCOPE ONCLICK!');
            e.preventDefault();
            addScopeItemDirect();
        };
        
        scopeBtn.addEventListener('click', function(e) {
            console.log('🎯 EMERGENCY SCOPE ADDEVENTLISTENER!');
            e.preventDefault();
            addScopeItemDirect();
        });
        
        console.log('✅ Scope button emergency binding complete');
    } else {
        console.error('❌ Scope button not found');
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
    const radioGroupId = Date.now();
    const row = document.createElement('tr');
    row.id = itemId;
    
    row.innerHTML = `
        <td><input type="text" name="primeLine[]" placeholder="Prime Line" required></td>
        <td><input type="text" name="budgetCode[]" placeholder="Budget Code" required></td>
        <td><textarea name="description[]" placeholder="Description" required></textarea></td>
        <td><input type="number" name="quantity[]" placeholder="Qty" min="0" step="0.01" required></td>
        <td><input type="text" name="unit[]" placeholder="Unit" required></td>
        <td><input type="number" name="totalCost[]" placeholder="Total Cost" min="0" step="0.01" required></td>
        <td>
            <label><input type="radio" name="scheduled_${radioGroupId}" value="yes" required> Yes</label>
            <label><input type="radio" name="scheduled_${radioGroupId}" value="no" required> No</label>
        </td>
        <td><input type="number" name="apexContractValue[]" placeholder="Contract Value" min="0" step="0.01" required></td>
        <td><input type="number" name="profit[]" placeholder="Profit" min="0" step="0.01" required></td>
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
    alert('Schedule item added successfully!');
}

function addScopeItemDirect() {
    console.log('🔧 addScopeItemDirect() called');
    
    const tbody = document.getElementById('scopeItems');
    if (!tbody) {
        console.error('❌ scopeItems tbody not found');
        return;
    }
    
    const itemId = `scope-${Date.now()}`;
    const row = document.createElement('tr');
    row.id = itemId;
    
    row.innerHTML = `
        <td><input type="text" name="scopeItemNumber[]" placeholder="Item #" required></td>
        <td><textarea name="scopeDescription[]" placeholder="Description" required></textarea></td>
        <td>
            <select name="scopeStatus[]" required>
                <option value="">Select Status</option>
                <option value="included">Included</option>
                <option value="excluded">Excluded</option>
            </select>
        </td>
        <td>
            <button type="button" onclick="removeScopeItem('${itemId}')" class="btn btn-danger btn-small">Remove</button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Hide empty state message
    const emptyState = document.getElementById('noScopeItems');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
    
    console.log('✅ Scope item added successfully:', itemId);
    alert('Scope item added successfully!');
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
        
        // Check if we need to show empty state
        const tbody = document.getElementById('scopeItems');
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
