/**
 * Environment Configuration - Automatically detects and configures for local vs online deployment
 */

class EnvironmentConfig {
    constructor() {
        this.isLocal = this.detectLocalEnvironment();
        this.baseUrl = this.getBaseUrl();
        this.config = this.generateConfig();
        
        console.log('🌍 Environment detected:', this.isLocal ? 'LOCAL' : 'PRODUCTION');
        console.log('🌍 Base URL:', this.baseUrl);
    }
    
    detectLocalEnvironment() {
        const hostname = window.location.hostname;
        return hostname === 'localhost' || 
               hostname === '127.0.0.1' || 
               hostname.includes('localhost') ||
               window.location.port !== '';
    }
    
    getBaseUrl() {
        if (this.isLocal) {
            // For local development
            return window.location.origin;
        } else {
            // For GitHub Pages - your actual site
            return 'https://vcapexbuilds.github.io/ApexBuilds-PO';
        }
    }
    
    generateConfig() {
        return {
            baseUrl: this.baseUrl,
            isLocal: this.isLocal,
            
            // Microsoft Auth Configuration
            auth: {
                redirectUri: this.isLocal 
                    ? `${this.baseUrl}/pages/tracking.html`
                    : 'https://vcapexbuilds.github.io/ApexBuilds-PO/pages/tracking.html', // Your actual GitHub Pages URL
                    
                // The actual production URL should be something like:
                // : 'https://vcapexbuilds.github.io/apex-po-system-test/pages/tracking.html'
            },
            
            // Navigation paths
            paths: {
                printPage: this.isLocal ? '../Print.html' : `${this.baseUrl}/Print.html`,
                formPage: this.isLocal ? '/pages/form.html' : `${this.baseUrl}/pages/form.html`,
                trackingPage: this.isLocal ? '/pages/tracking.html' : `${this.baseUrl}/pages/tracking.html`,
                loginPage: this.isLocal ? '/index.html' : `${this.baseUrl}/index.html`
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
