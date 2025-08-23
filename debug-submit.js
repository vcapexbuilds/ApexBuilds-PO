// Debug Submit Button - Add this script to form.html temporarily
console.log('🔍 DEBUG SUBMIT SCRIPT LOADED');

document.addEventListener('DOMContentLoaded', function() {
    console.log('🔍 Debug script: DOM loaded');
    
    // Wait a bit for other scripts to load
    setTimeout(function() {
        console.log('🔍 Debug script: Running tests...');
        
        // Test 1: Check if form exists
        const form = document.getElementById('poForm');
        console.log('🔍 Test 1 - Form exists:', !!form);
        if (form) {
            console.log('🔍 Form details:', {
                id: form.id,
                tag: form.tagName,
                children: form.children.length
            });
        }
        
        // Test 2: Check for submit buttons
        const submitBtns = document.querySelectorAll('button[type="submit"]');
        console.log('🔍 Test 2 - Submit buttons found:', submitBtns.length);
        submitBtns.forEach((btn, i) => {
            console.log(`🔍 Button ${i}:`, btn.textContent.trim());
        });
        
        // Test 3: Check if POForm class was instantiated
        console.log('🔍 Test 3 - Global POForm:', typeof POForm);
        console.log('🔍 Test 3 - window.poForm:', !!window.poForm);
        
        // Test 4: Add manual click handler for debugging
        if (submitBtns.length > 0) {
            const testBtn = submitBtns[0];
            console.log('🔍 Adding manual test handler to first submit button');
            
            testBtn.addEventListener('click', function(e) {
                console.log('🔍 MANUAL TEST HANDLER TRIGGERED!');
                console.log('🔍 Event:', e);
                console.log('🔍 Button:', this);
                
                // Don't prevent default here, let normal flow happen
                console.log('🔍 Letting normal form submission flow continue...');
            });
        }
        
        // Test 5: Check globals
        console.log('🔍 Test 5 - Globals available:', {
            auth: !!window.auth,
            api: !!window.api,
            storage: !!window.storage,
            modal: !!window.modal,
            showConfirmModal: !!window.showConfirmModal
        });
        
    }, 2000); // Wait 2 seconds
});
