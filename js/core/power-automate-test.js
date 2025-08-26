/**
 * Power Automate Test Script
 * Simple test to verify the endpoint is working
 */

window.testPowerAutomate = async function() {
    console.log('🧪 Testing Power Automate endpoint...');
    
    const testData = {
        poNumber: "TEST-" + Date.now(),
        meta: {
            projectName: "Test Project",
            generalContractor: "Test Contractor",
            address: "123 Test St",
            owner: "Test Owner"
        },
        schedule: [],
        scope: [],
        createdAt: new Date().toISOString(),
        sent: true,
        timestamp: Date.now(),
        id: Date.now(),
        sentAt: new Date().toISOString(),
        submittedBy: {
            userId: "test-user",
            username: "test-user",
            email: "test@test.com",
            company: "Test Company",
            role: "user",
            submittedAt: new Date().toISOString()
        }
    };
    
    const endpoint = 'https://defaulta543e2f6ae4b4d1db263a38786ce68.44.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/146de521bc3a415d9dbbdfec5476be38/triggers/manual/paths/invoke/?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=_bSEuYWnBRzJs_p7EvROZXVi6KLitzuyOtIlD7lEqLA';
    
    try {
        console.log('📤 Sending test data:', testData);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(testData)
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response headers:', [...response.headers.entries()]);
        
        const responseText = await response.text();
        console.log('📄 Response text:', responseText);
        
        if (response.ok) {
            console.log('✅ Power Automate test SUCCESSFUL!');
            alert('✅ Power Automate test SUCCESSFUL!\n\nYour endpoint is working correctly.');
            return true;
        } else {
            console.error('❌ Power Automate test failed:', response.status);
            alert(`❌ Power Automate test failed:\n\nStatus: ${response.status}\nResponse: ${responseText}`);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Power Automate test error:', error);
        alert(`❌ Power Automate test error:\n\n${error.message}`);
        return false;
    }
};

// Auto-run test when page loads (for debugging)
document.addEventListener('DOMContentLoaded', () => {
    console.log('🔧 Power Automate test function available as window.testPowerAutomate()');
    
    // Add a test button to the page
    const testBtn = document.createElement('button');
    testBtn.textContent = '🧪 Test Power Automate';
    testBtn.style.position = 'fixed';
    testBtn.style.top = '10px';
    testBtn.style.right = '10px';
    testBtn.style.zIndex = '9999';
    testBtn.style.padding = '10px';
    testBtn.style.backgroundColor = '#007bff';
    testBtn.style.color = 'white';
    testBtn.style.border = 'none';
    testBtn.style.borderRadius = '5px';
    testBtn.style.cursor = 'pointer';
    
    testBtn.onclick = window.testPowerAutomate;
    document.body.appendChild(testBtn);
});

console.log('🧪 Power Automate test script loaded');
