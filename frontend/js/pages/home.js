// Home/Feed Page
import { postService } from '../services/post.service.js';
import { $, render, showLoading } from '../utils/dom.js';
import { PostCard } from '../components/post-card.js';
import { CONFIG } from '../config.js';

export const homePage = {
    currentPage: 1,
    totalPages: 1,
    isLoading: false,
    posts: [],

    async init() {
        this.currentPage = 1;
        this.posts = [];
        this.render();
        await this.loadPosts();
    },

    render() {
        const html = `
            <div class="home-page">
                <div class="home-page__container">
                    <div id="posts-container" class="gallery">
                        <!-- Posts will be loaded here -->
                    </div>
                    <div id="pagination" class="pagination hidden">
                        <button id="prev-btn" class="pagination__btn" disabled>Previous</button>
                        <span id="page-info" class="pagination__info">Page 1 of 1</span>
                        <button id="next-btn" class="pagination__btn">Next</button>
                    </div>
                    <div id="empty-state" class="empty-state hidden">
                        <div class="empty-state__icon">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                <polyline points="21 15 16 10 5 21"></polyline>
                            </svg>
                        </div>
                        <h2 class="empty-state__title">No posts yet</h2>
                        <p class="empty-state__message">Be the first to share a photo!</p>
                        <a href="#/camera" class="btn btn--primary">Create Post</a>
                    </div>
                </div>
            </div>
        `;

        render('#app', html);
        this.attachEvents();
    },

    attachEvents() {
        const prevBtn = $('#prev-btn');
        const nextBtn = $('#next-btn');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => this.goToPage(this.currentPage - 1));
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => this.goToPage(this.currentPage + 1));
        }
    },

    async loadPosts() {
        if (this.isLoading) return;

        this.isLoading = true;
        const container = $('#posts-container');

        if (this.currentPage === 1) {
            showLoading(container);
        }

        try {
            const response = await postService.getFeed(this.currentPage, CONFIG.DEFAULT_PAGE_SIZE);

            if (response.success && response.data) {
                this.posts = response.data.posts || [];
                this.totalPages = response.data.pagination?.total_pages || 1;
                this.renderPosts();
            }
        } catch (error) {
            console.error('Failed to load posts:', error);
            container.innerHTML = `
                <div class="alert alert--error">
                    Failed to load posts. Please try again.
                </div>
            `;
        } finally {
            this.isLoading = false;
        }
    },

    renderPosts() {
        const container = $('#posts-container');
        const pagination = $('#pagination');
        const emptyState = $('#empty-state');

        if (!this.posts || this.posts.length === 0) {
            container.innerHTML = '';
            container.classList.add('hidden');
            emptyState.classList.remove('hidden');
            pagination.classList.add('hidden');
            return;
        }

        emptyState.classList.add('hidden');
        container.classList.remove('hidden');

        // Render grid items
        container.innerHTML = this.posts.map(post => PostCard.renderGridItem(post)).join('');

        // Attach events
        PostCard.attachEvents(container);

        // Update pagination
        this.updatePagination();
    },

    updatePagination() {
        const pagination = $('#pagination');
        const pageInfo = $('#page-info');
        const prevBtn = $('#prev-btn');
        const nextBtn = $('#next-btn');

        if (this.totalPages <= 1) {
            pagination.classList.add('hidden');
            return;
        }

        pagination.classList.remove('hidden');
        pageInfo.textContent = `Page ${this.currentPage} of ${this.totalPages}`;
        prevBtn.disabled = this.currentPage <= 1;
        nextBtn.disabled = this.currentPage >= this.totalPages;
    },

    async goToPage(page) {
        if (page < 1 || page > this.totalPages || this.isLoading) return;

        this.currentPage = page;
        await this.loadPosts();

        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },

    destroy() {
        // Cleanup if needed
    }
};
