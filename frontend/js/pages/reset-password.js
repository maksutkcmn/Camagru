import { authService } from '../services/auth.service.js';
import { router } from '../router/router.js';
import { $, render } from '../utils/dom.js';
import { validators, validateForm, showFieldError, clearFormErrors, showFormError } from '../utils/validation.js';

export const resetPasswordPage = {
    token: null,

    init(params, query) {
        this.token = query.token;

        if (!this.token) {
            this.renderError('Invalid reset link');
            return;
        }

        this.render();
        this.attachEvents();
    },

    render() {
        const html = `
            <div class="reset-password-page">
                <div class="reset-password-card">
                    <h1 class="reset-password-card__title">Reset Password</h1>
                    <p class="reset-password-card__description">
                        Enter your new password below.
                    </p>

                    <form id="reset-form">
                        <div class="form-group">
                            <label for="password">New Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                autocomplete="new-password"
                                placeholder="Enter new password"
                            />
                            <span class="form-error" id="password-error"></span>
                        </div>

                        <div class="form-group">
                            <label for="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                required
                                autocomplete="new-password"
                                placeholder="Confirm new password"
                            />
                            <span class="form-error" id="confirmPassword-error"></span>
                        </div>

                        <div id="form-error" class="alert alert--error hidden"></div>

                        <button type="submit" class="btn btn--primary btn--block" id="submit-btn">
                            Reset Password
                        </button>
                    </form>
                </div>
            </div>
        `;

        render('#app', html);
    },

    attachEvents() {
        const form = $('#reset-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(form);
        });
    },

    async handleSubmit(form) {
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        clearFormErrors(form);

        const { isValid, errors } = validateForm(
            { password, confirmPassword },
            {
                password: [validators.required, validators.password],
                confirmPassword: [validators.required, validators.passwordMatch(password)]
            }
        );

        if (!isValid) {
            Object.entries(errors).forEach(([field, message]) => {
                showFieldError(field, message);
            });
            return;
        }

        const submitBtn = $('#submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Resetting...';

        try {
            await authService.resetPassword(this.token, password);
            this.showSuccess();
        } catch (error) {
            showFormError(form, error.message || 'Failed to reset password. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Reset Password';
        }
    },

    showSuccess() {
        const html = `
            <div class="reset-password-page">
                <div class="reset-password-card">
                    <div class="auth-success">
                        <div class="auth-success__icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <h2 class="auth-success__title">Password Reset!</h2>
                        <p class="auth-success__message">
                            Your password has been successfully reset.
                            You can now log in with your new password.
                        </p>
                        <a href="#/login" class="btn btn--primary">Log In</a>
                    </div>
                </div>
            </div>
        `;

        render('#app', html);
    },

    renderError(message) {
        const html = `
            <div class="reset-password-page">
                <div class="reset-password-card">
                    <div class="auth-success">
                        <div class="auth-success__icon" style="color: var(--error);">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        <h2 class="auth-success__title">Invalid Link</h2>
                        <p class="auth-success__message">${message}</p>
                        <a href="#/forgot-password" class="btn btn--primary">Request New Link</a>
                    </div>
                </div>
            </div>
        `;

        render('#app', html);
    }
};
