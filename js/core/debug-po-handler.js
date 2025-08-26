/**
 * Debug version of Simple PO Handler to identify user data issues
 */
window.DebugPOHandler = {
    
    async testSubmission() {
        console.log('🧪 DEBUG: Starting test submission...');
        
        // Step 1: Check user data sources
        console.log('📋 Step 1: Checking all user data sources...');
        
        const sources = {
            microsoftAuth: null,
            authModule: null,
            storageModule: null,
            localStorage: null
        };
        
        // Check Microsoft Auth
        if (window.MicrosoftAuthConfig) {
            console.log('🔍 MicrosoftAuthConfig exists:', !!window.MicrosoftAuthConfig);
            console.log('🔍 Is authenticated:', window.MicrosoftAuthConfig.isAuthenticated ? window.MicrosoftAuthConfig.isAuthenticated() : 'Method not found');
            
            if (window.MicrosoftAuthConfig.isAuthenticated && window.MicrosoftAuthConfig.isAuthenticated()) {
                try {
                    sources.microsoftAuth = await window.MicrosoftAuthConfig.getUserInfo();
                    console.log('✅ Microsoft user:', sources.microsoftAuth);
                } catch (error) {
                    console.error('❌ Microsoft auth error:', error);
                }
            }
        }
        
        // Check auth module
        if (window.auth && window.auth.getCurrentUser) {
            sources.authModule = window.auth.getCurrentUser();
            console.log('📋 Auth module user:', sources.authModule);
        }
        
        // Check storage module
        if (window.storage && window.storage.getCurrentUser) {
            sources.storageModule = window.storage.getCurrentUser();
            console.log('💾 Storage module user:', sources.storageModule);
        }
        
        // Check localStorage
        try {
            const stored = localStorage.getItem('currentUser');
            if (stored) {
                sources.localStorage = JSON.parse(stored);
                console.log('🗄️ localStorage user:', sources.localStorage);
            }
        } catch (error) {
            console.error('❌ localStorage parse error:', error);
        }
        
        console.log('📊 All user sources:', sources);
        
        // Step 2: Test the submission data creation
        const now = new Date();
        const testUser = sources.localStorage || sources.authModule || sources.storageModule || {
            username: 'Debug Test User',
            email: 'debug@apexbuilding.com', 
            role: 'user'
        };
        
        console.log('👤 Selected user for submission:', testUser);
        
        const submittedByData = {
            username: testUser.username || 'Debug User',
            email: testUser.email || 'debug@apexbuilding.com',
            role: testUser.role || 'user',
            submittedAt: now.toISOString()
        };
        
        console.log('📋 submittedBy data created:', submittedByData);
        
        // Step 3: Create full submission object
        const fullSubmission = {
            poNumber: 'DEBUG-' + now.getTime(),
            meta: { projectName: 'Debug Test' },
            schedule: [],
            scope: [],
            submittedBy: submittedByData
        };
        
        console.log('📄 Full submission object:', fullSubmission);
        console.log('🎯 submittedBy section specifically:', JSON.stringify(fullSubmission.submittedBy, null, 2));
        
        return fullSubmission;
    }
};

console.log('🧪 Debug PO Handler loaded');
