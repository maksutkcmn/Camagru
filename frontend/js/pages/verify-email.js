import { $, render } from '../utils/dom.js';
import { CONFIG } from '../config.js';

export const verifyEmailPage = {
    async init(params, query) {
        const token = query.token;

        if (!token) {
            this.renderError('Invalid verification link');
            return;
        }

        this.renderLoading();

        try {
            const response = await fetch(`${CONFIG.API_URL}/verify?token=${token}`);
            const text = await response.text();

            if (response.ok) {
                this.renderSuccess();
            } else {
                this.renderError(text || 'Verification failed');
            }
        } catch (error) {
            this.renderError('An error occurred during verification');
        }
    },

    renderLoading() {
        const html = `
            <div class="verify-page">
                <div class="loading">
                    <div class="loading__spinner"></div>
                    <p>Verifying your email...</p>
                </div>
            </div>
        `;

        render('#app', html);
    },

    renderSuccess() {
        const html = `
            <div class="verify-page">
                <div class="verify-page__icon verify-page__icon--success">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                </div>
                <h1 class="verify-page__title">Email Verified!</h1>
                <p class="verify-page__message">
                    Your email has been successfully verified. You can now log in to your account.
                </p>
                <a href="#/login" class="btn btn--primary">Log In</a>
            </div>
        `;

        render('#app', html);
    },

    renderError(message) {
        const html = `
            <div class="verify-page">
                <div class="verify-page__icon verify-page__icon--error">
                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <circle cx="12" cy="12" r="10"></circle>
                        <line x1="15" y1="9" x2="9" y2="15"></line>
                        <line x1="9" y1="9" x2="15" y2="15"></line>
                    </svg>
                </div>
                <h1 class="verify-page__title">Verification Failed</h1>
                <p class="verify-page__message">${message}</p>
                <a href="#/login" class="btn btn--secondary">Go to Login</a>
            </div>
        `;

        render('#app', html);
    }
};
