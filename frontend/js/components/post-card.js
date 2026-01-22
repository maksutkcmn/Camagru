// Post Card Component
import { postService } from '../services/post.service.js';
import { store } from '../state/store.js';
import { formatDate, escapeHtml } from '../utils/dom.js';
import { Modal } from './modal.js';

export const PostCard = {
    // Render a post card (for feed view)
    render(post, options = {}) {
        const { showDelete = false } = options;
        const imageUrl = postService.getImageUrl(post.image_path);

        return `
            <article class="post-card" data-post-id="${post.id}">
                <div class="post-card__header">
                    <a href="#/profile/${escapeHtml(post.username)}" class="post-card__author">
                        <div class="post-card__avatar">${post.username ? post.username[0].toUpperCase() : 'U'}</div>
                        <span class="post-card__username">${escapeHtml(post.username || 'User')}</span>
                    </a>
                    <span class="post-card__time">${formatDate(post.created_at)}</span>
                </div>

                <div class="post-card__image-wrapper">
                    <img
                        src="${imageUrl}"
                        alt="Post by ${escapeHtml(post.username)}"
                        class="post-card__image"
                        loading="lazy"
                    />
                </div>

                <div class="post-card__actions">
                    <button class="post-card__action post-card__like-btn" data-post-id="${post.id}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        <span class="like-count">${post.like_count || 0}</span>
                    </button>

                    <button class="post-card__action post-card__comment-btn" data-post-id="${post.id}">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        <span class="comment-count">${post.comment_count || 0}</span>
                    </button>

                    ${showDelete ? `
                        <button class="post-card__action post-card__delete-btn" data-post-id="${post.id}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>

                <div class="post-card__content">
                    <div class="post-card__likes">${post.like_count || 0} likes</div>
                </div>
            </article>
        `;
    },

    // Render for grid view
    renderGridItem(post) {
        const imageUrl = postService.getImageUrl(post.image_path);

        return `
            <div class="gallery__item" data-post-id="${post.id}">
                <img src="${imageUrl}" alt="Post" loading="lazy" />
                <div class="gallery__overlay">
                    <span class="gallery__stat">
                        <svg viewBox="0 0 24 24" fill="white">
                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                        </svg>
                        ${post.like_count || 0}
                    </span>
                    <span class="gallery__stat">
                        <svg viewBox="0 0 24 24" fill="white">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                        </svg>
                        ${post.comment_count || 0}
                    </span>
                </div>
            </div>
        `;
    },

    // Attach event listeners
    attachEvents(container, options = {}) {
        const { onDelete, onLike } = options;

        // Like buttons
        container.querySelectorAll('.post-card__like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const postId = btn.dataset.postId;

                try {
                    const response = await postService.likePost(postId);
                    const countSpan = btn.querySelector('.like-count');

                    if (response.success) {
                        if (response.data?.action === 'liked') {
                            btn.classList.add('post-card__like-btn--liked');
                        } else {
                            btn.classList.remove('post-card__like-btn--liked');
                        }

                        // Update count
                        if (countSpan && response.data?.like_count !== undefined) {
                            countSpan.textContent = response.data.like_count;
                        }

                        if (onLike) onLike(postId, response.data);
                    }
                } catch (error) {
                    console.error('Like failed:', error);
                }
            });
        });

        // Comment buttons
        container.querySelectorAll('.post-card__comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = btn.dataset.postId;
                this.showPostModal(postId);
            });
        });

        // Delete buttons
        container.querySelectorAll('.post-card__delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const postId = btn.dataset.postId;

                const confirmed = await Modal.confirm('Are you sure you want to delete this post?', {
                    title: 'Delete Post',
                    confirmText: 'Delete',
                    cancelText: 'Cancel'
                });

                if (confirmed) {
                    try {
                        await postService.deletePost(postId);
                        const postCard = btn.closest('.post-card');
                        if (postCard) postCard.remove();
                        if (onDelete) onDelete(postId);
                    } catch (error) {
                        console.error('Delete failed:', error);
                        Modal.alert('Failed to delete post. Please try again.');
                    }
                }
            });
        });

        // Grid items
        container.querySelectorAll('.gallery__item').forEach(item => {
            item.addEventListener('click', () => {
                const postId = item.dataset.postId;
                this.showPostModal(postId);
            });
        });
    },

    // Show post detail modal
    async showPostModal(postId) {
        // For now, just show comments
        try {
            const response = await postService.getComments(postId);
            const comments = response.data?.comments || [];

            const commentsHtml = comments.length > 0
                ? comments.map(c => `
                    <div class="comment-item">
                        <div class="comment-item__header">
                            <span class="comment-item__username">${escapeHtml(c.username || 'User ' + c.user_id)}</span>
                            <span class="comment-item__time">${formatDate(c.created_at)}</span>
                        </div>
                        <p class="comment-item__text">${escapeHtml(c.comment)}</p>
                    </div>
                `).join('')
                : '<p class="text-muted text-center">No comments yet</p>';

            const content = `
                <div class="comment-list" style="max-height: 300px; overflow-y: auto; margin-bottom: var(--spacing-md);">
                    ${commentsHtml}
                </div>
                <form class="comment-form" id="comment-form" style="display: flex; gap: var(--spacing-sm);">
                    <input type="text" name="comment" placeholder="Add a comment..." maxlength="255" required style="flex: 1; padding: var(--spacing-sm); background: var(--bg-secondary); border: 1px solid var(--border); border-radius: var(--radius-md); color: var(--text-primary);" />
                    <button type="submit" class="btn btn--primary">Post</button>
                </form>
            `;

            const modal = Modal.show(content, { title: 'Comments' });

            const form = modal.element.querySelector('#comment-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const commentText = form.comment.value.trim();

                if (commentText) {
                    try {
                        await postService.addComment(postId, commentText);
                        form.comment.value = '';
                        // Refresh modal
                        modal.close();
                        this.showPostModal(postId);
                    } catch (error) {
                        console.error('Comment failed:', error);
                    }
                }
            });
        } catch (error) {
            console.error('Failed to load comments:', error);
            Modal.alert('Failed to load comments. Please try again.');
        }
    }
};
