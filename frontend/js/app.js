// Application Entry Point
import { router } from './router/router.js';
import { store } from './state/store.js';
import { userService } from './services/user.service.js';
import { Navbar } from './components/navbar.js';

// Import pages
import { homePage } from './pages/home.js';
import { loginPage } from './pages/login.js';
import { registerPage } from './pages/register.js';
import { verifyEmailPage } from './pages/verify-email.js';
import { forgotPasswordPage } from './pages/forgot-password.js';
import { resetPasswordPage } from './pages/reset-password.js';
import { cameraPage } from './pages/camera.js';
import { profilePage } from './pages/profile.js';
import { settingsPage } from './pages/settings.js';

class App {
    async init() {
        // Setup routes
        this.setupRoutes();

        // Check for existing session
        await this.checkAuth();

        // Initialize navbar
        Navbar.init();

        // Initialize router
        router.init();
    }

    setupRoutes() {
        // Public routes (guest only)
        router.register('/login', loginPage, { guestOnly: true });
        router.register('/register', registerPage, { guestOnly: true });
        router.register('/forgot-password', forgotPasswordPage, { guestOnly: true });
        router.register('/reset-password', resetPasswordPage, { guestOnly: true });

        // Public routes
        router.register('/verify', verifyEmailPage);

        // Protected routes
        router.register('/', homePage, { protected: true });
        router.register('/camera', cameraPage, { protected: true });
        router.register('/settings', settingsPage, { protected: true });
        router.register('/profile/:username', profilePage, { protected: true });
    }

    async checkAuth() {
        const token = store.getToken();

        if (token) {
            // Try to restore user from localStorage first
            store.restoreUser();

            // Then verify token is still valid
            try {
                await userService.getMe();
            } catch (error) {
                // Token invalid or expired
                console.log('Session expired, clearing auth');
                store.clearAuth();
            }
        }
    }
}

// Bootstrap the application
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
