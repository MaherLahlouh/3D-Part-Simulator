// @ts-nocheck
import { authService } from './services/authService.ts';
/**
 * Dashboard Module
 * Simple dashboard with login and signup buttons
 */

const isTokenValid = authService.isLoggedIn();

if (isTokenValid) {

    window.location.href = '/src/client/pages/landing.html';
}

class Dashboard {
    /**
     * Initialize the dashboard
     */
    init(): void {
        // Cache DOM elements
        const loginBtn = document.getElementById('loginBtn');
        const signupBtn = document.getElementById('signupBtn');

        // Set up event listeners
        if (loginBtn) {
            loginBtn.addEventListener('click', () => {
                window.location.href = '/src/client/pages/login.html';
                console.log("Login button clicked, redirecting to login page.");
            });
        }

        if (signupBtn) {
            signupBtn.addEventListener('click', () => {
                window.location.href = '/src/client/pages/sign_up.html';
                console.log("Signup button clicked, redirecting to signup page.");
            });
        }

        console.log('✅ Dashboard initialized successfully');
    }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const dashboard = new Dashboard();
        dashboard.init();
        console.log("🚀 Dashboard initialized on DOMContentLoaded");
    });
} else {
    const dashboard = new Dashboard();
    dashboard.init();
    console.log("🚀 Dashboard initialized immediately");
}
