import { router } from './router/router.js';
import { store } from './state/store.js';
import { userService } from './services/user.service.js';
import { Navbar } from './components/navbar.js';

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
        this.setupRoutes();

        await this.checkAuth();

        Navbar.init();

        router.init();
    }

    setupRoutes() {
        router.register('/login', loginPage, { guestOnly: true });
        router.register('/register', registerPage, { guestOnly: true });
        router.register('/forgot-password', forgotPasswordPage, { guestOnly: true });
        router.register('/reset-password', resetPasswordPage, { guestOnly: true });

        router.register('/verify', verifyEmailPage);

        router.register('/', homePage);
        router.register('/camera', cameraPage, { protected: true });
        router.register('/settings', settingsPage, { protected: true });
        router.register('/profile/:username', profilePage, { protected: true });
    }

    async checkAuth() {
        const token = store.getToken();

        if (token) {
            store.restoreUser();

            try {
                await userService.getMe();
            } catch (error) {
                store.clearAuth();
            }
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});
