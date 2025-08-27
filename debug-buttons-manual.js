// Manual debug test - run this in the browser console

console.log('=== MANUAL BUTTON DEBUG TEST ===');
console.log('Document ready state:', document.readyState);

// Check if buttons exist
const addScheduleBtn = document.getElementById('addScheduleItem');
const addScopeBtn = document.getElementById('addScopeItem');

console.log('Schedule button:', {
    exists: !!addScheduleBtn,
    element: addScheduleBtn,
    text: addScheduleBtn?.textContent,
    style: addScheduleBtn?.getAttribute('style'),
    computedStyle: addScheduleBtn ? {
        display: window.getComputedStyle(addScheduleBtn).display,
        visibility: window.getComputedStyle(addScheduleBtn).visibility,
        pointerEvents: window.getComputedStyle(addScheduleBtn).pointerEvents
    } : 'N/A'
});

console.log('Scope button:', {
    exists: !!addScopeBtn,
    element: addScopeBtn,
    text: addScopeBtn?.textContent,
    style: addScopeBtn?.getAttribute('style'),
    computedStyle: addScopeBtn ? {
        display: window.getComputedStyle(addScopeBtn).display,
        visibility: window.getComputedStyle(addScopeBtn).visibility,
        pointerEvents: window.getComputedStyle(addScopeBtn).pointerEvents
    } : 'N/A'
});

// Check all buttons on the page
console.log('All buttons on page:');
document.querySelectorAll('button').forEach((btn, index) => {
    console.log(`Button ${index}:`, {
        id: btn.id || 'no-id',
        text: btn.textContent.trim(),
        type: btn.type,
        className: btn.className,
        disabled: btn.disabled,
        visible: window.getComputedStyle(btn).display !== 'none'
    });
});

// Check if POForm instance exists
console.log('POForm instance available:', !!window.poForm);

// Try manual binding
if (addScheduleBtn) {
    console.log('Attempting manual Schedule button binding...');
    addScheduleBtn.onclick = function(e) {
        console.log('MANUAL SCHEDULE BUTTON CLICKED!', e);
        alert('Schedule button clicked manually!');
    };
    console.log('Manual Schedule button binding complete');
} else {
    console.error('Cannot bind Schedule button - not found');
}

if (addScopeBtn) {
    console.log('Attempting manual Scope button binding...');
    addScopeBtn.onclick = function(e) {
        console.log('MANUAL SCOPE BUTTON CLICKED!', e);
        alert('Scope button clicked manually!');
    };
    console.log('Manual Scope button binding complete');
} else {
    console.error('Cannot bind Scope button - not found');
}
