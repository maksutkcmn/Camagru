import { authService } from '../services/auth.service.js';
import { router } from '../router/router.js';
import { $, render } from '../utils/dom.js';
import { validators, validateForm, showFieldError, clearFormErrors, showFormError } from '../utils/validation.js';

export const registerPage = {
    init() {
        this.render();
        this.attachEvents();
    },

    render() {
        const html = `
            <div class="auth-page">
                <div class="auth-card">
                    <h1 class="auth-card__title">Camagru</h1>
                    <p class="text-center text-muted mb-lg">Sign up to share photos with your friends</p>

                    <form id="register-form" class="auth-form">
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

                        <div class="form-group">
                            <label for="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                required
                                autocomplete="username"
                                placeholder="Choose a username"
                            />
                            <span class="form-error" id="username-error"></span>
                        </div>

                        <div class="form-group">
                            <label for="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                required
                                autocomplete="new-password"
                                placeholder="Create a password"
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
                                placeholder="Confirm your password"
                            />
                            <span class="form-error" id="confirmPassword-error"></span>
                        </div>

                        <div id="form-error" class="alert alert--error hidden"></div>

                        <button type="submit" class="btn btn--primary btn--block" id="submit-btn">
                            Sign Up
                        </button>
                    </form>

                    <div class="auth-card__footer">
                        <span>Have an account?</span>
                        <a href="#/login">Log in</a>
                    </div>
                </div>
            </div>
        `;

        render('#app', html);
    },

    attachEvents() {
        const form = $('#register-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(form);
        });
    },

    async handleSubmit(form) {
        const email = form.email.value.trim();
        const username = form.username.value.trim();
        const password = form.password.value;
        const confirmPassword = form.confirmPassword.value;

        clearFormErrors(form);

        const { isValid, errors } = validateForm(
            { email, username, password, confirmPassword },
            {
                email: [validators.required, validators.email],
                username: [validators.required, validators.username],
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
        submitBtn.textContent = 'Creating account...';

        try {
            await authService.register(username, email, password);
            this.showSuccess();
        } catch (error) {
            showFormError(form, error.message || 'Registration failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Sign Up';
        }
    },

    showSuccess() {
        const html = `
            <div class="auth-page">
                <div class="auth-card">
                    <div class="auth-success">
                        <div class="auth-success__icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                        </div>
                        <h2 class="auth-success__title">Check your email</h2>
                        <p class="auth-success__message">
                            We've sent a verification link to your email address.
                            Please click the link to verify your account.
                        </p>
                        <a href="#/login" class="btn btn--primary">Go to Login</a>
                    </div>
                </div>
            </div>
        `;

        render('#app', html);
    }
};
