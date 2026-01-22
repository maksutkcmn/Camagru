// Profile Page
import { userService } from '../services/user.service.js';
import { postService } from '../services/post.service.js';
import { store } from '../state/store.js';
import { $, render, showLoading, escapeHtml } from '../utils/dom.js';
import { PostCard } from '../components/post-card.js';

export const profilePage = {
    username: null,
    user: null,
    posts: [],
    isOwnProfile: false,

    async init(params) {
        this.username = params.username;
        this.user = null;
        this.posts = [];

        const currentUser = store.getUser();
        this.isOwnProfile = currentUser?.username === this.username;

        this.renderLoading();
        await this.loadProfile();
    },

    renderLoading() {
        const html = `
            <div class="profile-page">
                <div class="loading">
                    <div class="loading__spinner"></div>
                    <p>Loading profile...</p>
                </div>
            </div>
        `;
        render('#app', html);
    },

    async loadProfile() {
        try {
            // Load user data
            const userResponse = await userService.getUser(this.username);

            if (!userResponse.success || !userResponse.data) {
                this.renderNotFound();
                return;
            }

            this.user = userResponse.data;

            // Load user posts if own profile
            if (this.isOwnProfile) {
                const postsResponse = await postService.getUserPosts();
                this.posts = postsResponse.data?.posts || [];
            }

            this.render();
        } catch (error) {
            console.error('Failed to load profile:', error);
            this.renderNotFound();
        }
    },

    render() {
        const html = `
            <div class="profile-page">
                <div class="profile-header">
                    <div class="profile-header__avatar">
                        <div class="profile-header__avatar-img">
                            ${this.user.username ? this.user.username[0].toUpperCase() : 'U'}
                        </div>
                    </div>

                    <div class="profile-header__info">
                        <div class="profile-header__top">
                            <h1 class="profile-header__username">${escapeHtml(this.user.username)}</h1>
                            ${this.isOwnProfile ? `
                                <div class="profile-header__actions">
                                    <a href="#/settings" class="btn btn--secondary">Edit Profile</a>
                                </div>
                            ` : ''}
                        </div>

                        <div class="profile-header__stats">
                            <div class="profile-header__stat">
                                <span class="profile-header__stat-value">${this.posts.length}</span> posts
                            </div>
                        </div>

                        <div class="profile-header__bio">
                            <p>Member since ${this.formatDate(this.user.created_at)}</p>
                            ${this.user.is_verified ? '<p style="color: var(--success);">Verified</p>' : '<p style="color: var(--text-muted);">Not verified</p>'}
                        </div>
                    </div>
                </div>

                ${this.isOwnProfile ? `
                    <div class="profile-tabs">
                        <button class="profile-tab profile-tab--active">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="3" y="3" width="7" height="7"></rect>
                                <rect x="14" y="3" width="7" height="7"></rect>
                                <rect x="14" y="14" width="7" height="7"></rect>
                                <rect x="3" y="14" width="7" height="7"></rect>
                            </svg>
                            Posts
                        </button>
                    </div>

                    <div class="profile-content">
                        ${this.posts.length > 0 ? `
                            <div class="gallery" id="posts-grid">
                                ${this.posts.map(post => PostCard.renderGridItem(post)).join('')}
                            </div>
                        ` : `
                            <div class="empty-state">
                                <div class="empty-state__icon">
                                    <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                        <polyline points="21 15 16 10 5 21"></polyline>
                                    </svg>
                                </div>
                                <h2 class="empty-state__title">No Posts Yet</h2>
                                <p class="empty-state__message">Share your first photo!</p>
                                <a href="#/camera" class="btn btn--primary">Create Post</a>
                            </div>
                        `}
                    </div>
                ` : `
                    <div class="profile-content">
                        <div class="empty-state">
                            <p class="text-muted">Posts are only visible on your own profile.</p>
                        </div>
                    </div>
                `}
            </div>
        `;

        render('#app', html);
        this.attachEvents();
    },

    attachEvents() {
        const postsGrid = $('#posts-grid');
        if (postsGrid) {
            PostCard.attachEvents(postsGrid, {
                onDelete: (postId) => {
                    this.posts = this.posts.filter(p => p.id !== parseInt(postId));
                }
            });
        }
    },

    renderNotFound() {
        const html = `
            <div class="profile-page">
                <div class="profile-not-found">
                    <h1 class="profile-not-found__title">User Not Found</h1>
                    <p class="profile-not-found__message">
                        The user you're looking for doesn't exist or has been removed.
                    </p>
                    <a href="#/" class="btn btn--primary">Go Home</a>
                </div>
            </div>
        `;
        render('#app', html);
    },

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric'
        });
    },

    destroy() {
        // Cleanup if needed
    }
};
