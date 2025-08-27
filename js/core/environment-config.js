/**
 * GitHub Pages Environment Configuration - Production only
 */

class EnvironmentConfig {
    constructor() {
        this.isLocal = false; // Always false for GitHub Pages
        this.baseUrl = 'https://vcapexbuilds.github.io/ApexBuilds-PO';
        this.config = this.generateConfig();
        
        console.log('🌍 Environment: GITHUB PAGES PRODUCTION');
        console.log('🌍 Base URL:', this.baseUrl);
        console.log('🌍 Form page path:', this.getFormPagePath());
    }
    
    detectLocalEnvironment() {
        return false; // Always production for GitHub Pages
    }
    
    getBaseUrl() {
        return 'https://vcapexbuilds.github.io/ApexBuilds-PO';
    }
    
    generateConfig() {
        return {
            baseUrl: this.baseUrl,
            isLocal: false,
            
            // Microsoft Auth Configuration
            auth: {
                redirectUri: 'https://vcapexbuilds.github.io/ApexBuilds-PO/pages/tracking.html'
            },
            
            // Navigation paths - All GitHub Pages URLs
            paths: {
                printPage: `${this.baseUrl}/Print.html`,
                formPage: `${this.baseUrl}/pages/form.html`,
                trackingPage: `${this.baseUrl}/pages/tracking.html`,
                loginPage: `${this.baseUrl}/index.html`
            },
            
            // Debug info
            debug: {
                hostname: window.location.hostname,
                pathname: window.location.pathname,
                origin: window.location.origin,
                isLocal: this.isLocal,
                baseUrl: this.baseUrl
            }
        };
    }
    
    // Helper methods for getting configuration values
    getAuthRedirectUri() {
        return this.config.auth.redirectUri;
    }
    
    getPrintPagePath() {
        return this.config.paths.printPage;
    }
    
    getFormPagePath() {
        return this.config.paths.formPage;
    }
    
    getAuthRedirectUri() {
        return this.config.auth.redirectUri;
    }
    
    getTrackingPagePath() {
        return this.config.paths.trackingPage;
    }
    
    getLoginPagePath() {
        return this.config.paths.loginPage;
    }
}

// Create global instance
window.ENV_CONFIG = new EnvironmentConfig();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnvironmentConfig;
}
