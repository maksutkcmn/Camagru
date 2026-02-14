import { CONFIG } from '../config.js';
import { store } from '../state/store.js';
import { router } from '../router/router.js';

class ApiService {
    constructor(baseURL) {
        this.baseURL = baseURL;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;

        const headers = {
            'Content-Type': 'application/json',
            ...options.headers
        };

        const token = store.getToken();
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            const isAuthEndpoint = endpoint.includes('/login') || endpoint.includes('/register');
            const isSessionCheck = endpoint.includes('/get/me');
            if (response.status === 401 && !isAuthEndpoint) {
                if (store.getToken()) {
                    store.clearAuth();
                    if (!isSessionCheck) {
                        router.navigate('/login');
                    }
                    throw new Error('Session expired. Please login again.');
                }
                throw new Error('Please log in to perform this action.');
            }

            const contentType = response.headers.get('content-type');
            let data;

            if (contentType?.includes('application/json')) {
                data = await response.json();
            } else {
                data = await response.text();
            }

            if (!response.ok) {
                throw new Error(data.message || data || 'Request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    }

    post(endpoint, body) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    patch(endpoint, body) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(body)
        });
    }

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
}

export const api = new ApiService(CONFIG.API_URL);
