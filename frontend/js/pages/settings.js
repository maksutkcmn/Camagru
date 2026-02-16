import { userService } from '../services/user.service.js';
import { authService } from '../services/auth.service.js';
import { store } from '../state/store.js';
import { router } from '../router/router.js';
import { $, render, showLoading } from '../utils/dom.js';
import { validators, validateForm, showFieldError, clearFormErrors, showFormError } from '../utils/validation.js';
import { Modal } from '../components/modal.js';

export const settingsPage = {
    user: null,

    async init() {
        this.renderLoading();
        await this.loadUser();
    },

    renderLoading() {
        const html = `
            <div class="settings-page">
                <div class="loading">
                    <div class="loading__spinner"></div>
                    <p>Loading settings...</p>
                </div>
            </div>
        `;
        render('#app', html);
    },

    async loadUser() {
        try {
            const response = await userService.getMe();
            if (response.success && response.data) {
                this.user = response.data;
                this.render();
            }
        } catch (error) {
            router.navigate('/login');
        }
    },

    render() {
        const html = `
            <div class="settings-page">
                <h1 class="settings-page__title">Settings</h1>

                <div id="success-message" class="settings-success hidden"></div>

                <div class="settings-section">
                    <div class="settings-section__header">
                        <h2 class="settings-section__title">Username</h2>
                    </div>
                    <div class="settings-section__body">
                        <form id="username-form" class="settings-form">
                            <div class="form-group">
                                <label for="username">Username</label>
                                <input
                                    type="text"
                                    id="username"
                                    name="username"
                                    value="${this.user.username || ''}"
                                    placeholder="Enter username"
                                />
                                <span class="form-error" id="username-error"></span>
                            </div>
                            <div id="username-form-error" class="alert alert--error hidden"></div>
                            <div class="settings-form__actions">
                                <button type="submit" class="btn btn--primary">Save Username</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section__header">
                        <h2 class="settings-section__title">Email</h2>
                    </div>
                    <div class="settings-section__body">
                        <form id="email-form" class="settings-form">
                            <div class="form-group">
                                <label for="email">Email Address</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value="${this.user.email || ''}"
                                    placeholder="Enter email"
                                />
                                <span class="form-error" id="email-error"></span>
                                ${!this.user.is_verified ? '<p class="text-muted" style="margin-top: 4px; font-size: 12px;">Email not verified. Check your inbox for verification link.</p>' : ''}
                            </div>
                            <div id="email-form-error" class="alert alert--error hidden"></div>
                            <div class="settings-form__actions">
                                <button type="submit" class="btn btn--primary">Save Email</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section__header">
                        <h2 class="settings-section__title">Password</h2>
                    </div>
                    <div class="settings-section__body">
                        <form id="password-form" class="settings-form">
                            <div class="form-group">
                                <label for="currentPassword">Current Password</label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    name="currentPassword"
                                    placeholder="Enter current password"
                                />
                                <span class="form-error" id="currentPassword-error"></span>
                            </div>
                            <div class="form-group">
                                <label for="newPassword">New Password</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    name="newPassword"
                                    placeholder="Enter new password"
                                />
                                <span class="form-error" id="newPassword-error"></span>
                            </div>
                            <div class="form-group">
                                <label for="confirmPassword">Confirm New Password</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    placeholder="Confirm new password"
                                />
                                <span class="form-error" id="confirmPassword-error"></span>
                            </div>
                            <div id="password-form-error" class="alert alert--error hidden"></div>
                            <div class="settings-form__actions">
                                <button type="submit" class="btn btn--primary">Change Password</button>
                            </div>
                        </form>
                    </div>
                </div>

                <div class="settings-section">
                    <div class="settings-section__header">
                        <h2 class="settings-section__title">Notifications</h2>
                    </div>
                    <div class="settings-section__body">
                        <div class="settings-toggle">
                            <div class="settings-toggle__label">
                                <div class="settings-toggle__title">Email Notifications</div>
                                <div class="settings-toggle__description">
                                    Receive email notifications when someone likes or comments on your posts
                                </div>
                            </div>
                            <label class="toggle-switch">
                                <input type="checkbox" id="notifications-toggle" ${this.user.notifications ? 'checked' : ''} />
                                <span class="toggle-switch__slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="settings-section settings-danger">
                    <div class="settings-section__header">
                        <h2 class="settings-section__title">Account</h2>
                    </div>
                    <div class="settings-section__body">
                        <p class="settings-danger__warning">
                            Logging out will end your current session.
                        </p>
                        <button id="logout-btn" class="btn btn--danger">Logout</button>
                    </div>
                </div>
            </div>
        `;

        render('#app', html);
        this.attachEvents();
    },

    attachEvents() {
        const usernameForm = $('#username-form');
        if (usernameForm) {
            usernameForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleUsernameSubmit(usernameForm);
            });
        }

        const emailForm = $('#email-form');
        if (emailForm) {
            emailForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleEmailSubmit(emailForm);
            });
        }

        const passwordForm = $('#password-form');
        if (passwordForm) {
            passwordForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordSubmit(passwordForm);
            });
        }

        const notificationsToggle = $('#notifications-toggle');
        if (notificationsToggle) {
            notificationsToggle.addEventListener('change', () => {
                this.handleNotificationsToggle();
            });
        }

        const logoutBtn = $('#logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authService.logout();
                router.navigate('/login');
            });
        }
    },

    async handleUsernameSubmit(form) {
        const username = form.username.value.trim();

        clearFormErrors(form);

        const { isValid, errors } = validateForm(
            { username },
            { username: [validators.required, validators.username] }
        );

        if (!isValid) {
            Object.entries(errors).forEach(([field, message]) => {
                showFieldError(field, message);
            });
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            await userService.updateUsername(username);
            this.showSuccess('Username updated successfully');
            this.user.username = username;
        } catch (error) {
            const errorDiv = form.querySelector('#username-form-error');
            if (errorDiv) {
                errorDiv.textContent = error.message || 'Failed to update username';
                errorDiv.classList.remove('hidden');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Username';
        }
    },

    async handleEmailSubmit(form) {
        const email = form.email.value.trim();

        clearFormErrors(form);

        const { isValid, errors } = validateForm(
            { email },
            { email: [validators.required, validators.email] }
        );

        if (!isValid) {
            Object.entries(errors).forEach(([field, message]) => {
                showFieldError(field, message);
            });
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            await userService.updateEmail(email);
            this.showSuccess('Email updated. Please check your inbox for verification.');
            this.user.email = email;
            this.user.is_verified = false;
        } catch (error) {
            const errorDiv = form.querySelector('#email-form-error');
            if (errorDiv) {
                errorDiv.textContent = error.message || 'Failed to update email';
                errorDiv.classList.remove('hidden');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Save Email';
        }
    },

    async handlePasswordSubmit(form) {
        const currentPassword = form.currentPassword.value;
        const newPassword = form.newPassword.value;
        const confirmPassword = form.confirmPassword.value;

        clearFormErrors(form);

        const { isValid, errors } = validateForm(
            { currentPassword, newPassword, confirmPassword },
            {
                currentPassword: [validators.required],
                newPassword: [validators.required, validators.password],
                confirmPassword: [validators.required, validators.passwordMatch(newPassword)]
            }
        );

        if (!isValid) {
            Object.entries(errors).forEach(([field, message]) => {
                showFieldError(field, message);
            });
            return;
        }

        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Saving...';

        try {
            await userService.updatePassword(currentPassword, newPassword);
            this.showSuccess('Password updated successfully');
            form.reset();
        } catch (error) {
            const errorDiv = form.querySelector('#password-form-error');
            if (errorDiv) {
                errorDiv.textContent = error.message || 'Failed to update password';
                errorDiv.classList.remove('hidden');
            }
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Change Password';
        }
    },

    async handleNotificationsToggle() {
        const toggle = $('#notifications-toggle');

        try {
            await userService.toggleNotifications();
            this.user.notifications = toggle.checked;
            this.showSuccess(`Notifications ${toggle.checked ? 'enabled' : 'disabled'}`);
        } catch (error) {
            toggle.checked = !toggle.checked;
            Modal.alert('Failed to update notifications. Please try again.');
        }
    },

    showSuccess(message) {
        const successEl = $('#success-message');
        if (successEl) {
            successEl.textContent = message;
            successEl.classList.remove('hidden');

            setTimeout(() => {
                successEl.classList.add('hidden');
            }, 3000);
        }
    }
};
