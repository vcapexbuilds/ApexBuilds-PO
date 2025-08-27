// Login Page Logic
class LoginPage {
    constructor() {
        this.init();
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeWhenReady());
        } else {
            this.initializeWhenReady();
        }
    }

    initializeWhenReady() {
        console.log('=== LOGIN PAGE INITIALIZATION ===');
        // Wait for global objects to be available
        const checkGlobals = () => {
            console.log('Checking global objects:', {
                auth: !!window.auth,
                showErrorModal: !!window.showErrorModal,
                showSuccessModal: !!window.showSuccessModal,
                storage: !!window.storage
            });
            
            if (window.auth) {
                console.log('Auth object found, setting up event listeners...');
                this.setupEventListeners();
                this.checkExistingSession();
            } else {
                console.log('Waiting for auth object...');
                setTimeout(checkGlobals, 100);
            }
        };
        checkGlobals();
    }

    setupEventListeners() {
        console.log('=== SETTING UP EVENT LISTENERS ===');
        
        // Microsoft Login Button
        const microsoftLoginBtn = document.getElementById('microsoftLoginBtn');
        console.log('Microsoft login button found:', !!microsoftLoginBtn);
        
        if (microsoftLoginBtn) {
            microsoftLoginBtn.addEventListener('click', (e) => {
                console.log('MICROSOFT LOGIN BUTTON CLICKED');
                this.handleMicrosoftLogin(e);
            });
            console.log('Microsoft login button event listener attached');
        } else {
            console.error('Microsoft login button not found!');
        }
        
        // Demo Login Form
        const demoLoginForm = document.getElementById('demoLoginForm');
        console.log('Demo login form found:', !!demoLoginForm);
        
        if (demoLoginForm) {
            demoLoginForm.addEventListener('submit', (e) => {
                console.log('DEMO LOGIN FORM SUBMITTED');
                this.handleDemoLogin(e);
            });
            console.log('Demo login form event listener attached');
        }
        
        // Toggle demo login visibility
        const loginDivider = document.querySelector('.login-divider');
        if (loginDivider) {
            loginDivider.addEventListener('click', () => {
                const demoSection = document.getElementById('demoLoginSection');
                if (demoSection) {
                    const isHidden = demoSection.style.display === 'none';
                    demoSection.style.display = isHidden ? 'block' : 'none';
                    console.log('Demo section toggled:', isHidden ? 'visible' : 'hidden');
                }
            });
        }

        // Modal event handlers
        this.setupModalHandlers();

        // Enter key handling for better UX
        this.setupKeyboardHandlers();
    }

    // Handle Microsoft OAuth Login
    async handleMicrosoftLogin(event) {
        console.log('=== MICROSOFT LOGIN HANDLER ===');
        event.preventDefault();
        
        try {
            this.showLoadingModal('Redirecting to Microsoft...');
            
            // Check if Microsoft Auth is available
            if (typeof window.MicrosoftAuth === 'undefined' || typeof window.MicrosoftAuth.login !== 'function') {
                console.error('Microsoft Auth not properly configured');
                this.hideLoadingModal();
                this.showErrorModal('Configuration Error', 'Microsoft authentication is not properly configured. Please contact your administrator.');
                return;
            }
            
            // Get role selection
            const roleSelect = document.getElementById('oauthRoleChoice');
            const selectedRole = roleSelect ? roleSelect.value : 'auto';
            
            console.log('Selected role:', selectedRole);
            
            // Store the role selection for after redirect
            sessionStorage.setItem('selected_role', selectedRole);
            
            // Initiate Microsoft OAuth login (this will redirect)
            await window.MicrosoftAuth.login();
            
        } catch (error) {
            console.error('Microsoft login error:', error);
            this.hideLoadingModal();
            this.showErrorModal('Login Failed', error.message || 'Failed to initiate Microsoft authentication.');
        }
    }

    // Handle Demo Login
    async handleDemoLogin(event) {
        console.log('=== DEMO LOGIN HANDLER ===');
        event.preventDefault();
        
        const form = event.target;
        const formData = new FormData(form);
        
        const username = formData.get('username');
        const password = formData.get('password');
        const role = formData.get('role') || 'user';

        console.log('Demo login attempt:', { username, role });

        if (!username || !password) {
            this.showErrorModal('Invalid Input', 'Please enter both username and password.');
            return;
        }

        try {
            this.showLoadingModal('Signing in...');
            
            // Simulate login delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Use the auth system for demo login (with fallback)
            let loginSuccess = false;
            
            if (typeof window.auth !== 'undefined' && window.auth.login) {
                loginSuccess = await window.auth.login(username, password, role);
            } else {
                // Fallback: simple credential check and direct authentication
                console.warn('Auth system not available, using fallback authentication');
                
                // Simple demo validation (accept any non-empty credentials)
                if (username && password) {
                    const userData = {
                        id: `demo-${username}`,
                        username: username,
                        name: username.charAt(0).toUpperCase() + username.slice(1),
                        role: role || 'user',
                        provider: 'demo',
                        loginTime: new Date().toISOString()
                    };
                    
                    // Store user data in localStorage
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                    localStorage.setItem('isAuthenticated', 'true');
                    localStorage.setItem('userRole', userData.role);
                    
                    loginSuccess = true;
                }
            }
            
            if (loginSuccess) {
                console.log('Demo login successful');
                this.hideLoadingModal();
                
                // Redirect based on role
                if (role === 'admin') {
                    window.location.href = 'https://vcapexbuilds.github.io/ApexBuilds-PO/pages/admin.html';
                } else {
                    window.location.href = 'https://vcapexbuilds.github.io/ApexBuilds-PO/pages/tracking.html';
                }
            } else {
                throw new Error('Invalid credentials');
            }
            
        } catch (error) {
            console.error('Demo login error:', error);
            this.hideLoadingModal();
            this.showErrorModal('Login Failed', error.message || 'Invalid username or password.');
        }
    }

    // Determine role from Microsoft account
    determineRoleFromAccount(account) {
        // Simple role determination logic - you can customize this
        if (account.username && account.username.includes('admin')) {
            return 'admin';
        }
        return 'user';
    }

    // Show loading modal
    showLoadingModal(message = 'Loading...') {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            const messageElement = modal.querySelector('p');
            if (messageElement) {
                messageElement.textContent = message;
            }
            modal.style.display = 'flex';
        }
    }

    // Hide loading modal
    hideLoadingModal() {
        const modal = document.getElementById('loadingModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    // Show error modal
    showErrorModal(title, message) {
        const modal = document.getElementById('errorModal');
        if (modal) {
            const titleElement = modal.querySelector('#errorTitle');
            const messageElement = modal.querySelector('#errorMessage');
            
            if (titleElement) titleElement.textContent = title;
            if (messageElement) messageElement.textContent = message;
            
            modal.style.display = 'flex';
        }
    }

    // Check for existing session
    checkExistingSession() {
        if (auth.isAuthenticated()) {
            // User is already logged in, redirect to appropriate dashboard
            if (auth.isAdmin()) {
                window.location.href = 'pages/admin.html';
            } else {
                window.location.href = 'pages/tracking.html';
            }
        }
    }

    // Handle login form submission
    async handleLogin(event) {
        console.log('=== HANDLE LOGIN CALLED ===');
        event.preventDefault();
        
        console.log('Login form submitted - event prevented');

        const form = event.target;
        const formData = new FormData(form);
        
        const username = formData.get('username');
        const password = formData.get('password');
        const role = formData.get('role');

        console.log('Form data extracted:', { 
            username: username, 
            password: password ? '***masked***' : 'empty',
            role: role 
        });

        // Basic client-side validation
        if (!username || !password || !role) {
            console.error('Validation failed - missing fields');
            if (typeof showErrorModal === 'function') {
                showErrorModal('Validation Error', 'Please fill in all fields.');
            } else {
                alert('Please fill in all fields.');
            }
            return;
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton ? submitButton.textContent : '';
        const originalClass = submitButton ? submitButton.className : '';
        if (submitButton) {
            submitButton.innerHTML = '<span class="loading-spinner"></span><span class="btn-loading-text">Logging in...</span>';
            submitButton.className = originalClass + ' btn-loading';
            submitButton.disabled = true;
        }
        console.log('Button state updated to loading');

        try {
            // Check if auth object is available
            console.log('Checking auth object availability:', !!window.auth);
            if (!window.auth) {
                throw new Error('Auth system not available');
            }

            console.log('Calling window.auth.login...');
            // Attempt login - auth.login only takes 2 parameters (username, password)
            // The role is automatically determined by which demo account is used
            const result = await window.auth.login(username.trim(), password);
            console.log('Login result received:', result);

            if (result.success) {
                console.log('Login successful, processing success...');
                
                if (typeof showSuccessModal === 'function') {
                    showSuccessModal(
                        'Login Successful',
                        `Welcome, ${result.user.username}!`,
                        [{
                            text: 'Continue',
                            class: 'btn-primary',
                            action: () => {
                                this.redirectAfterLogin(result.user.role);
                            }
                        }]
                    );
                } else {
                    // Fallback if modal not available
                    alert(`Welcome, ${result.user.username}!`);
                    this.redirectAfterLogin(result.user.role);
                }
            } else {
                console.log('Login failed:', result.message);
                if (typeof showErrorModal === 'function') {
                    showErrorModal('Login Failed', result.message);
                } else {
                    alert('Login Failed: ' + result.message);
                }
            }

        } catch (error) {
            console.error('Login error occurred:', error);
            if (typeof showErrorModal === 'function') {
                showErrorModal('Login Error', 'An unexpected error occurred. Please try again.');
            } else {
                alert('Login Error: An unexpected error occurred. Please try again.');
            }
        } finally {
            // Reset button state
            console.log('Resetting button state');
            if (submitButton) {
                submitButton.innerHTML = originalText;
                submitButton.className = originalClass;
                submitButton.disabled = false;
            }
        }
    }

    // Redirect user after successful login
    redirectAfterLogin(role) {
        if (role === 'admin') {
            window.location.href = 'pages/admin.html';
        } else {
            window.location.href = 'pages/tracking.html';
        }
    }

    // Setup registration handlers
    setupRegistrationHandlers() {
        const registerLink = document.getElementById('registerLink');
        const registerModal = document.getElementById('registerModal');
        const registerForm = document.getElementById('registerForm');
        const cancelRegisterBtn = document.getElementById('cancelRegister');

        // Show registration modal
        if (registerLink) {
            registerLink.addEventListener('click', (e) => {
                e.preventDefault();
                showModal('registerModal');
            });
        }

        // Handle registration form submission
        if (registerForm) {
            registerForm.addEventListener('submit', (e) => this.handleRegistration(e));
        }

        // Cancel registration
        if (cancelRegisterBtn) {
            cancelRegisterBtn.addEventListener('click', () => {
                closeModal('registerModal');
            });
        }
    }

    // Handle user registration
    async handleRegistration(event) {
        event.preventDefault();

        const form = event.target;
        const formData = new FormData(form);

        const userData = {
            username: formData.get('username'),
            email: formData.get('email'),
            password: formData.get('password'),
            company: formData.get('company')
        };

        // Client-side validation
        const validation = this.validateRegistrationData(userData);
        if (!validation.isValid) {
            if (typeof window.showErrorModal === 'function') {
                window.showErrorModal('Validation Error', validation.errors.join('\n'));
            } else {
                alert('Validation Error: ' + validation.errors.join('\n'));
            }
            return;
        }

        // Show loading state
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        const originalClass = submitButton.className;
        
        // Add loading animation
        submitButton.innerHTML = '<span class="loading-spinner"></span><span class="btn-loading-text">Creating Account...</span>';
        submitButton.className = originalClass + ' btn-loading';
        submitButton.disabled = true;

        try {
            // Attempt registration
            const result = await auth.register(userData);

            if (result.success) {
                if (typeof window.closeModal === 'function') {
                    window.closeModal('registerModal');
                }
                
                if (typeof window.showSuccessModal === 'function') {
                    window.showSuccessModal(
                        'Registration Successful',
                        `Account created successfully for ${result.user.username}. You can now log in.`,
                        [{
                            text: 'OK',
                            class: 'btn-primary',
                            action: () => {
                                // Pre-fill login form
                                document.getElementById('username').value = userData.username;
                                document.getElementById('role').value = 'user';
                            }
                        }]
                    );
                } else {
                    alert(`Registration Successful: Account created for ${result.user.username}. You can now log in.`);
                    document.getElementById('username').value = userData.username;
                    document.getElementById('role').value = 'user';
                }
            } else {
                if (typeof window.showErrorModal === 'function') {
                    window.showErrorModal('Registration Failed', result.message);
                } else {
                    alert('Registration Failed: ' + result.message);
                }
            }

        } catch (error) {
            console.error('Registration error:', error);
            if (typeof window.showErrorModal === 'function') {
                window.showErrorModal('Registration Error', 'An unexpected error occurred. Please try again.');
            } else {
                alert('Registration Error: An unexpected error occurred. Please try again.');
            }
        } finally {
            // Reset button state
            submitButton.innerHTML = originalText;
            submitButton.className = originalClass;
            submitButton.disabled = false;
        }
    }

    // Validate registration data
    validateRegistrationData(userData) {
        const errors = [];

        // Username validation
        if (!userData.username || userData.username.length < 3) {
            errors.push('Username must be at least 3 characters long');
        }

        // Email validation
        if (!userData.email) {
            errors.push('Email is required');
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                errors.push('Please enter a valid email address');
            }
        }

        // Password validation
        if (!userData.password) {
            errors.push('Password is required');
        } else if (userData.password.length < 6) {
            errors.push('Password must be at least 6 characters long');
        }

        // Company validation
        if (!userData.company || userData.company.length < 2) {
            errors.push('Company name must be at least 2 characters long');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Setup modal handlers
    setupModalHandlers() {
        // Close modals when clicking outside
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                closeModal(e.target.id);
            }
        });

        // Close button handlers
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    closeModal(modal.id);
                }
            });
        });

        // Message modal OK button
        const messageOkBtn = document.getElementById('messageOk');
        if (messageOkBtn) {
            messageOkBtn.addEventListener('click', () => {
                closeModal('messageModal');
            });
        }
    }

    // Setup keyboard handlers
    setupKeyboardHandlers() {
        // Enter key on login form
        document.getElementById('loginForm')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const submitButton = document.querySelector('#loginForm button[type="submit"]');
                if (submitButton && !submitButton.disabled) {
                    submitButton.click();
                }
            }
        });

        // Enter key on registration form
        document.getElementById('registerForm')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const submitButton = document.querySelector('#registerForm button[type="submit"]');
                if (submitButton && !submitButton.disabled) {
                    submitButton.click();
                }
            }
        });

        // ESC key to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const openModals = document.querySelectorAll('.modal[style*="block"]');
                if (openModals.length > 0) {
                    closeModal(openModals[openModals.length - 1].id);
                }
            }
        });
    }

    // Show demo credentials helper
    showDemoCredentials() {
        if (typeof window.showInfoModal === 'function') {
            window.showInfoModal(
                'Demo Credentials',
                `You can use these demo credentials to test the system:
                
                Admin Access:
                Username: admin
                Password: admin123
                Role: Admin
                
                User Access:
                Username: user
                Password: user123
                Role: User
                
                Or create a new account using the registration form.`,
            [{
                text: 'Use Admin Demo',
                class: 'btn-secondary',
                action: () => {
                    document.getElementById('username').value = 'admin';
                    document.getElementById('password').value = 'admin123';
                    document.getElementById('role').value = 'admin';
                }
            },
            {
                text: 'Use User Demo',
                class: 'btn-secondary',
                action: () => {
                    document.getElementById('username').value = 'user';
                    document.getElementById('password').value = 'user123';
                    document.getElementById('role').value = 'user';
                }
            },
            {
                text: 'Close',
                class: 'btn-primary',
                action: () => {}
            }]
        );
        } else {
            alert(`Demo Credentials:
            
Admin Access: admin/admin123 (Role: Admin)
User Access: user/user123 (Role: User)`);
        }
    }

    // Handle forgot password (placeholder for future implementation)
    handleForgotPassword() {
        if (typeof window.showInfoModal === 'function') {
            window.showInfoModal(
                'Password Reset',
                'Password reset functionality will be available in a future update. Please contact your administrator for assistance.',
                [{
                    text: 'OK',
                    class: 'btn-primary',
                    action: () => {}
                }]
            );
        } else {
            alert('Password Reset: Password reset functionality will be available in a future update. Please contact your administrator for assistance.');
        }
    }

    // Toggle password visibility
    togglePasswordVisibility(inputId) {
        const passwordInput = document.getElementById(inputId);
        const toggleButton = passwordInput.nextElementSibling;

        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            toggleButton.textContent = '👁️';
        } else {
            passwordInput.type = 'password';
            toggleButton.textContent = '👁️‍🗨️';
        }
    }

    // Form field focus effects
    setupFormEnhancements() {
        const formInputs = document.querySelectorAll('.form-group input, .form-group select');
        
        formInputs.forEach(input => {
            // Add focus effects
            input.addEventListener('focus', () => {
                input.parentElement.classList.add('focused');
            });

            input.addEventListener('blur', () => {
                input.parentElement.classList.remove('focused');
                
                // Add validation feedback
                if (input.hasAttribute('required') && !input.value.trim()) {
                    input.parentElement.classList.add('error');
                } else {
                    input.parentElement.classList.remove('error');
                    if (input.value.trim()) {
                        input.parentElement.classList.add('success');
                    }
                }
            });

            // Real-time validation for email
            if (input.type === 'email') {
                input.addEventListener('input', () => {
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (input.value && !emailRegex.test(input.value)) {
                        input.parentElement.classList.add('error');
                        input.parentElement.classList.remove('success');
                    } else if (input.value) {
                        input.parentElement.classList.remove('error');
                        input.parentElement.classList.add('success');
                    }
                });
            }
        });
    }

    // Handle connection status
    handleConnectionStatus() {
        window.addEventListener('online', () => {
            if (typeof window.showSuccessModal === 'function') {
                window.showSuccessModal('Connection Restored', 'You are now online.');
            }
        });

        window.addEventListener('offline', () => {
            showWarningModal('Connection Lost', 'You are now offline. Some features may not be available.');
        });
    }
}

// Initialize login page
const loginPage = new LoginPage();

// Demo credentials removed for GitHub Pages production

// Initialize the login page when the script loads
console.log('Initializing Login Page...');
window.loginPageInstance = new LoginPage();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LoginPage;
}