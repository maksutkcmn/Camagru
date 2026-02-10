import { api } from './api.js';
import { store } from '../state/store.js';

export const userService = {
    async getMe() {
        const response = await api.get('/api/get/me');

        if (response.success && response.data) {
            store.setUser(response.data);
        }

        return response;
    },

    async getUser(username) {
        return api.get(`/api/get/user/${encodeURIComponent(username)}`);
    },

    async updateUsername(username) {
        const response = await api.patch('/api/set/username', { username });

        if (response.success) {
            const currentUser = store.getUser();
            store.setUser({ ...currentUser, username });
        }

        return response;
    },

    async updateEmail(email) {
        const response = await api.patch('/api/set/email', { email });

        if (response.success) {
            const currentUser = store.getUser();
            store.setUser({ ...currentUser, email, is_verified: false });
        }

        return response;
    },

    async updatePassword(currentPassword, newPassword) {
        return api.patch('/api/set/password', {
            current_password: currentPassword,
            new_password: newPassword
        });
    },

    async toggleNotifications() {
        const response = await api.patch('/api/set/notifications', {});

        if (response.success) {
            const currentUser = store.getUser();
            store.setUser({ ...currentUser, notifications: !currentUser.notifications });
        }

        return response;
    }
};
