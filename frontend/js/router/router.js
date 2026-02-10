import { store } from '../state/store.js';

class Router {
    constructor() {
        this.routes = new Map();
        this.currentPage = null;
        this.params = {};
    }

    register(path, pageModule, options = {}) {
        this.routes.set(path, { pageModule, ...options });
    }

    extractParams(pattern, path) {
        const patternParts = pattern.split('/').filter(Boolean);
        const pathParts = path.split('/').filter(Boolean);

        if (patternParts.length !== pathParts.length) {
            return null;
        }

        const params = {};
        for (let i = 0; i < patternParts.length; i++) {
            if (patternParts[i].startsWith(':')) {
                params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
            } else if (patternParts[i] !== pathParts[i]) {
                return null;
            }
        }
        return params;
    }

    matchRoute(hash) {
        const path = hash.slice(1) || '/';
        const [basePath, queryString] = path.split('?');

        const query = {};
        if (queryString) {
            const searchParams = new URLSearchParams(queryString);
            searchParams.forEach((value, key) => {
                query[key] = value;
            });
        }

        if (this.routes.has(basePath)) {
            return {
                config: this.routes.get(basePath),
                params: {},
                query,
                path: basePath
            };
        }

        for (const [pattern, config] of this.routes) {
            const params = this.extractParams(pattern, basePath);
            if (params !== null) {
                return { config, params, query, path: pattern };
            }
        }

        return null;
    }

    navigate(path) {
        window.location.hash = path;
    }

    async handleRoute() {
        const hash = window.location.hash || '#/';
        const match = this.matchRoute(hash);

        if (!match) {
            this.navigate('/');
            return;
        }

        const { config, params, query } = match;
        this.params = params;

        if (config.protected && !store.isAuthenticated()) {
            this.navigate('/login');
            return;
        }

        if (config.guestOnly && store.isAuthenticated()) {
            this.navigate('/');
            return;
        }

        if (this.currentPage?.destroy) {
            this.currentPage.destroy();
        }

        this.currentPage = config.pageModule;

        try {
            await config.pageModule.init(params, query);
        } catch (error) {
            console.error('Error initializing page:', error);
            this.showError('An error occurred while loading the page.');
        }
    }

    showError(message) {
        const app = document.getElementById('app');
        app.innerHTML = `
            <div class="container" style="padding-top: 40px; text-align: center;">
                <h2>Error</h2>
                <p class="text-muted">${message}</p>
                <a href="#/" class="btn btn--primary" style="margin-top: 20px;">Go Home</a>
            </div>
        `;
    }

    init() {
        window.addEventListener('hashchange', () => this.handleRoute());
        window.addEventListener('load', () => this.handleRoute());
    }

    getParams() {
        return this.params;
    }
}

export const router = new Router();
