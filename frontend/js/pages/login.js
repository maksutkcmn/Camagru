// Login Page
import { authService } from '../services/auth.service.js';
import { router } from '../router/router.js';
import { $, render } from '../utils/dom.js';
import { validators, validateForm, showFieldError, clearFormErrors, showFormError } from '../utils/validation.js';

export const loginPage = {
    init() {
        this.render();
        this.attachEvents();
    },

    render() {
        const html = `
            <div class="auth-page">
                <div class="auth-card">
                    <h1 class="auth-card__title">Camagru</h1>

                    <form id="login-form" class="auth-form">
                        <div class="form-group">
                            <label for="username">Username</label>
                            <input
                                type="text"
                                id="username"
                                name="username"
                                required
                                autocomplete="username"
                                placeholder="Enter your username"
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
                                autocomplete="current-password"
                                placeholder="Enter your password"
                            />
                            <span class="form-error" id="password-error"></span>
                        </div>

                        <div id="form-error" class="alert alert--error hidden"></div>

                        <button type="submit" class="btn btn--primary btn--block" id="submit-btn">
                            Log In
                        </button>
                    </form>

                    <div class="form-divider">or</div>

                    <div class="text-center">
                        <a href="#/forgot-password" class="form-link">Forgot password?</a>
                    </div>

                    <div class="auth-card__footer">
                        <span>Don't have an account?</span>
                        <a href="#/register">Sign up</a>
                    </div>
                </div>
            </div>
        `;

        render('#app', html);
    },

    attachEvents() {
        const form = $('#login-form');
        if (!form) return;

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleSubmit(form);
        });
    },

    async handleSubmit(form) {
        const username = form.username.value.trim();
        const password = form.password.value;

        // Clear previous errors
        clearFormErrors(form);

        // Validate
        const { isValid, errors } = validateForm(
            { username, password },
            {
                username: [validators.required],
                password: [validators.required]
            }
        );

        if (!isValid) {
            Object.entries(errors).forEach(([field, message]) => {
                showFieldError(field, message);
            });
            return;
        }

        // Submit
        const submitBtn = $('#submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Logging in...';

        try {
            await authService.login(username, password);
            router.navigate('/');
        } catch (error) {
            showFormError(form, error.message || 'Login failed. Please try again.');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Log In';
        }
    },

    destroy() {
        // Cleanup if needed
    }
};
