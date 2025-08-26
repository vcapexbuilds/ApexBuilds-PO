// Clean form submission handler
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Initializing form submission handler...');
    
    // Remove any existing submit handlers
    const form = document.getElementById('poForm');
    const submitBtn = document.querySelector('button[type="submit"]');
    
    if (form && submitBtn) {
        // Clone and replace form to remove existing handlers
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
        const newSubmitBtn = newForm.querySelector('button[type="submit"]');
        
        // Add clean submission handler
        newForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('📝 Processing form submission...');
            
            try {
                // Check if Simple PO Handler is available
                if (!window.SimplePOHandler) {
                    alert('System not ready. Please refresh the page and try again.');
                    return;
                }
                
                // Collect form data
                const formData = window.SimplePOHandler.collectFormData();
                
                // Get project name for confirmation
                const projectName = formData.projectName || formData.meta?.projectName || 'Untitled Project';
                
                // Show confirmation dialog
                const confirmed = confirm(`Submit Purchase Order to Centralized System?\n\nProject: ${projectName}\n\n⚠️ This will send the PO to Power Automate for centralized processing.\n✅ No local storage - full centralization guaranteed.`);
                if (!confirmed) {
                    return;
                }
                
                // Update button state
                newSubmitBtn.textContent = '🔄 Submitting...';
                newSubmitBtn.disabled = true;
                newSubmitBtn.style.opacity = '0.7';
                
                // Submit the PO
                const result = await window.SimplePOHandler.submitPO(formData);
                
                // Handle result - centralized processing only
                if (result && result.success) {
                    let successMessage = `✅ SUCCESS!\n\nPO Number: ${result.poNumber}\n`;
                    
                    if (result.storage === 'power-automate-strict') {
                        successMessage += '\n🚀 Submitted to centralized Power Automate system!';
                        successMessage += '\n📋 Your PO is now in the centralized workflow.';
                    } else {
                        successMessage += '\n✅ Processed by centralized system.';
                    }
                    
                    alert(successMessage);
                    
                    // Clear form
                    newForm.reset();
                    
                    // Redirect based on user role
                    try {
                        const currentUser = window.auth?.getCurrentUser() || 
                                          JSON.parse(localStorage.getItem('currentUser') || '{}');
                        
                        if (currentUser?.role === 'admin') {
                            window.location.href = 'admin.html';
                        } else {
                            window.location.href = 'tracking.html';
                        }
                    } catch (redirectError) {
                        console.warn('Redirect error:', redirectError);
                        // Stay on form page
                    }
                    
                } else {
                    const errorMsg = result?.error || 'Centralized processing failed';
                    alert(`❌ Submission to centralized system failed:\n\n${errorMsg}\n\n⚠️ No local storage available - system requires Power Automate.\nPlease check your connection and try again.`);
                }
                
            } catch (error) {
                console.error('❌ Centralized form submission error:', error);
                alert(`❌ Centralized processing error:\n\n${error.message}\n\n⚠️ System requires Power Automate for centralized processing.\nNo local storage fallback available.`);
            } finally {
                // Reset button state
                newSubmitBtn.textContent = 'Submit Purchase Order';
                newSubmitBtn.disabled = false;
                newSubmitBtn.style.opacity = '';
            }
        });
        
        console.log('✅ Form submission handler ready');
    } else {
        console.error('❌ Form or submit button not found');
    }
});

console.log('📄 Form handler script loaded');
