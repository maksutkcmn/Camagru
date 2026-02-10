import { CONFIG } from '../config.js';

class Store {
    constructor() {
        this.state = {
            user: null,
            token: localStorage.getItem(CONFIG.JWT_STORAGE_KEY),
            isLoading: false,
            error: null
        };
        this.listeners = new Map();
    }

    getState() {
        return { ...this.state };
    }

    setState(updates) {
        const prevState = { ...this.state };
        this.state = { ...this.state, ...updates };

        Object.keys(updates).forEach(key => {
            if (this.listeners.has(key)) {
                this.listeners.get(key).forEach(callback => {
                    callback(this.state[key], prevState[key]);
                });
            }
        });
    }

    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);

        return () => this.listeners.get(key).delete(callback);
    }

    isAuthenticated() {
        return !!this.state.token;
    }

    setAuth(token, user) {
        localStorage.setItem(CONFIG.JWT_STORAGE_KEY, token);
        if (user) {
            localStorage.setItem(CONFIG.USER_STORAGE_KEY, JSON.stringify(user));
        }
        this.setState({ token, user });
    }

    clearAuth() {
        localStorage.removeItem(CONFIG.JWT_STORAGE_KEY);
        localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
        this.setState({ token: null, user: null });
    }

    getToken() {
        return this.state.token;
    }

    getUser() {
        return this.state.user;
    }

    setUser(user) {
        localStorage.setItem(CONFIG.USER_STORAGE_KEY, JSON.stringify(user));
        this.setState({ user });
    }

    restoreUser() {
        const userJson = localStorage.getItem(CONFIG.USER_STORAGE_KEY);
        if (userJson) {
            try {
                const user = JSON.parse(userJson);
                this.setState({ user });
                return user;
            } catch (e) {
                localStorage.removeItem(CONFIG.USER_STORAGE_KEY);
            }
        }
        return null;
    }

    setLoading(isLoading) {
        this.setState({ isLoading });
    }

    isLoading() {
        return this.state.isLoading;
    }

    setError(error) {
        this.setState({ error });
    }

    getError() {
        return this.state.error;
    }

    clearError() {
        this.setState({ error: null });
    }
}

export const store = new Store();
