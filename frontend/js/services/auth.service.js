// Authentication Service
import { api } from './api.js';
import { store } from '../state/store.js';

export const authService = {
    async login(username, password) {
        const response = await api.post('/api/login', { username, password });

        if (response.success && response.data?.token) {
            store.setAuth(response.data.token, {
                user_id: response.data.user_id,
                username: response.data.username
            });
        }

        return response;
    },

    async register(username, email, password) {
        return api.post('/api/register', { username, email, password });
    },

    async forgotPassword(email) {
        return api.post('/api/forgot-password', { email });
    },

    async resetPassword(token, newPassword) {
        return api.post(`/api/reset-password?token=${token}`, {
            new_password: newPassword
        });
    },

    logout() {
        store.clearAuth();
    },

    isAuthenticated() {
        return store.isAuthenticated();
    }
};
