import { authService } from '../services/auth.service.js';
import { $, render } from '../utils/dom.js';
import { validators, validateForm, showFieldError, clearFormErrors, showFormError } from '../utils/validation.js';

export const forgotPasswordPage = {
    init() {
        this.render();
        this.attachEvents();
    },

    render() {
        const html = `
            <div class="reset-password-page">
                <div class="reset-password-card">
                    <h1 class="reset-password-card__title">Forgot Password</h1>
                    <p class="reset-password-card__description">
                        Enter your email address and we'll send you a link to reset your password.
                    </p>

                    <form id="forgot-form">
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                required
                                autocomplete="email"
                                placeholder="Enter your email"
                            />
                            <span class="form-error" id="email-error"></span>
                        </div>

                        <div id="form-error" class="alert alert--error hidden"></div>

                        <button type="submit" class="btn btn--primary btn--block" id="submit-btn">
                            Send Reset Link
                        </button>
                    </form>

                    <div class="text-center mt-lg">
                        <a href="#/login" class="form-link">Back to Login</a>
                    </div>
                </div>
            </div>
        `;

        render('#app', html);
    },

    attachEvents() {
        const form = $('#forgot-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(form);
        });
    },

    async handleSubmit(form) {
        const email = form.email.value.trim();

        clearFormErrors(form);

        const { isValid, errors } = validateForm(
            { email },
            {
                email: [validators.required, validators.email]
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
        submitBtn.textContent = 'Sending...';

        try {
            await authService.forgotPassword(email);
            this.showSuccess(email);
        } catch (error) {
            showFormError(form, error.message || 'Failed to send reset link. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Send Reset Link';
        }
    },

    showSuccess(email) {
        const html = `
            <div class="reset-password-page">
                <div class="reset-password-card">
                    <div class="auth-success">
                        <div class="auth-success__icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="5" width="18" height="14" rx="2" ry="2"></rect>
                                <polyline points="3 7 12 13 21 7"></polyline>
                            </svg>
                        </div>
                        <h2 class="auth-success__title">Check your email</h2>
                        <p class="auth-success__message">
                            We've sent a password reset link to ${email}.
                            Please check your inbox.
                        </p>
                        <a href="#/login" class="btn btn--primary">Back to Login</a>
                    </div>
                </div>
            </div>
        `;

        render('#app', html);
    }
};
