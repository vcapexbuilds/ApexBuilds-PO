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
        console.log('📝 Binding schedule button...');
        
        // Clear any existing handlers and dataset
        scheduleBtn.onclick = null;
        scheduleBtn.removeAttribute('data-bound');
        
        // Add single handler with detailed logging
        scheduleBtn.onclick = function(e) {
            console.log('🎯🎯🎯 EMERGENCY SCHEDULE ONCLICK TRIGGERED!');
            console.log('Event:', e);
            e.preventDefault();
            e.stopPropagation();
            
            try {
                addScheduleItemDirect();
            } catch (error) {
                console.error('❌ Error in addScheduleItemDirect:', error);
                alert('Error adding schedule item: ' + error.message);
            }
        };
        
        // Also add addEventListener as backup
        scheduleBtn.addEventListener('click', function(e) {
            console.log('🎯 BACKUP SCHEDULE LISTENER TRIGGERED!');
            e.preventDefault();
            e.stopPropagation();
            addScheduleItemDirect();
        });
        
        console.log('✅ Schedule button emergency binding complete');
    } else {
        console.error('❌ Schedule button not found');
    }
    
    if (scopeBtn) {
        console.log('📝 Binding scope button...');
        
        // Clear any existing handlers and dataset
        scopeBtn.onclick = null;
        scopeBtn.removeAttribute('data-bound');
        
        // Add single handler with detailed logging
        scopeBtn.onclick = function(e) {
            console.log('🎯🎯🎯 EMERGENCY SCOPE ONCLICK TRIGGERED!');
            console.log('Event:', e);
            e.preventDefault();
            e.stopPropagation();
            
            try {
                addScopeItemDirect();
            } catch (error) {
                console.error('❌ Error in addScopeItemDirect:', error);
                alert('Error adding scope item: ' + error.message);
            }
        };
        
        // Also add addEventListener as backup
        scopeBtn.addEventListener('click', function(e) {
            console.log('🎯 BACKUP SCOPE LISTENER TRIGGERED!');
            e.preventDefault();
            e.stopPropagation();
            addScopeItemDirect();
        });
        
        console.log('✅ Scope button emergency binding complete');
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
        <td><input type="text" name="primeLine[]" required style="border: 2px solid green;"></td>
        <td><input type="text" name="budgetCode[]" required style="border: 2px solid green;"></td>
        <td><textarea name="description[]" required style="border: 2px solid green;"></textarea></td>
        <td><input type="number" name="quantity[]" required step="0.01" min="0" style="border: 2px solid green;"></td>
        <td><input type="text" name="unit[]" required style="border: 2px solid green;"></td>
        <td><input type="number" name="totalCost[]" required step="0.01" min="0" placeholder="0.00" style="border: 2px solid green;"></td>
        <td><input type="number" name="scheduled[]" required step="1" min="0" style="border: 2px solid green;"></td>
        <td><input type="number" name="apexContractValue[]" required step="0.01" min="0" style="border: 2px solid green;"></td>
        <td><input type="number" name="profit[]" required step="0.01" min="0" style="border: 2px solid green;"></td>
        <td>
            <button type="button" onclick="removeScheduleItem('${itemId}')" class="btn btn-danger btn-small">Remove</button>
        </td>
    `;
    
    console.log('📝 Setting row innerHTML...');
    row.innerHTML = rowHTML;
    
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
        <td><input type="text" name="scopeItemNumber[]" required value="${nextItemNumber}" readonly style="border: 2px solid blue;"></td>
        <td><textarea name="scopeDescription[]" required placeholder="Describe the scope of work" style="border: 2px solid blue;"></textarea></td>
        <td>
            <label><input type="radio" name="scopeStatus_${radioGroupId}" value="included" required> Included</label>
            <label><input type="radio" name="scopeStatus_${radioGroupId}" value="excluded" required> Excluded</label>
        </td>
        <td><button type="button" onclick="removeScopeItem('${itemId}')" class="btn btn-danger btn-small">Remove</button></td>
    `;
    
    console.log('📝 Setting scope row innerHTML...');
    row.innerHTML = rowHTML;
    
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
