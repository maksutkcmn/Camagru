import { postService } from '../services/post.service.js';
import { store } from '../state/store.js';
import { formatDate, escapeHtml } from '../utils/dom.js';
import { Modal } from './modal.js';

export const PostCard = {
    renderFeedItem(post, options = {}) {
        const { showDelete = false } = options;
        const imageUrl = postService.getImageUrl(post.image_path);
        const isLiked = post.is_liked || false;

        return `
            <article class="feed-card" data-post-id="${post.id}">
                <div class="feed-card__header">
                    <a href="#/profile/${escapeHtml(post.username)}" class="feed-card__author">
                        <div class="feed-card__avatar">${post.username ? post.username[0].toUpperCase() : 'U'}</div>
                        <span class="feed-card__username">${escapeHtml(post.username || 'User')}</span>
                    </a>
                    ${showDelete ? `
                        <button class="feed-card__menu-btn feed-card__delete-btn" data-post-id="${post.id}" aria-label="Delete post">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>

                <div class="feed-card__image-wrapper">
                    <img
                        src="${imageUrl}"
                        alt="Post by ${escapeHtml(post.username)}"
                        class="feed-card__image"
                        loading="lazy"
                    />
                </div>

                <div class="feed-card__actions">
                    <div class="feed-card__actions-left">
                        <button class="feed-card__action feed-card__like-btn ${isLiked ? 'feed-card__like-btn--liked' : ''}" data-post-id="${post.id}" aria-label="${isLiked ? 'Unlike' : 'Like'}">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="${isLiked ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                        </button>
                        <button class="feed-card__action feed-card__comment-btn" data-post-id="${post.id}" aria-label="Comment">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                            </svg>
                        </button>
                    </div>
                </div>

                <div class="feed-card__info">
                    <div class="feed-card__likes">${post.like_count || 0} likes</div>
                    <div class="feed-card__comments-count">
                        <button class="feed-card__view-comments" data-post-id="${post.id}">
                            View all ${post.comment_count || 0} comments
                        </button>
                    </div>
                    <div class="feed-card__time">${formatDate(post.created_at)}</div>
                </div>
            </article>
        `;
    },

    attachFeedEvents(container, options = {}) {
        const { onDelete, onLike } = options;

        container.querySelectorAll('.feed-card__like-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                const postId = btn.dataset.postId;

                try {
                    const response = await postService.likePost(postId);

                    if (response.success) {
                        const svg = btn.querySelector('svg');
                        if (response.data?.action === 'liked') {
                            btn.classList.add('feed-card__like-btn--liked');
                            svg.setAttribute('fill', 'currentColor');
                        } else {
                            btn.classList.remove('feed-card__like-btn--liked');
                            svg.setAttribute('fill', 'none');
                        }

                        const card = btn.closest('.feed-card');
                        const likesDiv = card.querySelector('.feed-card__likes');
                        if (likesDiv && response.data?.like_count !== undefined) {
                            likesDiv.textContent = `${response.data.like_count} likes`;
                        }

                        if (onLike) onLike(postId, response.data);
                    }
                } catch (error) {
                    console.error('Like failed:', error);
                }
            });
        });

        container.querySelectorAll('.feed-card__comment-btn, .feed-card__view-comments').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = btn.dataset.postId;
                this.showCommentsModal(postId);
            });
        });

        container.querySelectorAll('.feed-card__delete-btn').forEach(btn => {
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
                        const feedCard = btn.closest('.feed-card');
                        if (feedCard) feedCard.remove();
                        if (onDelete) onDelete(postId);
                    } catch (error) {
                        console.error('Delete failed:', error);
                        Modal.alert('Failed to delete post. Please try again.');
                    }
                }
            });
        });
    },

    async showCommentsModal(postId) {
        try {
            const response = await postService.getComments(postId);
            const comments = response.data?.comments || [];
            const currentUser = store.getUser();

            const commentsHtml = comments.length > 0
                ? comments.map(c => {
                    const isOwnComment = currentUser && currentUser.user_id === c.user_id;
                    return `
                        <div class="comment-item" data-comment-id="${c.id}">
                            <div class="comment-item__header">
                                <a href="#/profile/${escapeHtml(c.username)}" class="comment-item__username">${escapeHtml(c.username)}</a>
                                <span class="comment-item__time">${formatDate(c.created_at)}</span>
                                ${isOwnComment ? `
                                    <button class="comment-item__delete" data-comment-id="${c.id}" aria-label="Delete comment">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <line x1="18" y1="6" x2="6" y2="18"></line>
                                            <line x1="6" y1="6" x2="18" y2="18"></line>
                                        </svg>
                                    </button>
                                ` : ''}
                            </div>
                            <p class="comment-item__text">${escapeHtml(c.comment)}</p>
                        </div>
                    `;
                }).join('')
                : '<p class="text-muted text-center">No comments yet</p>';

            const content = `
                <div class="comment-list" id="comment-list">
                    ${commentsHtml}
                </div>
                <form class="comment-form" id="comment-form">
                    <input type="text" name="comment" placeholder="Add a comment..." maxlength="255" required />
                    <button type="submit" class="btn btn--primary">Post</button>
                </form>
            `;

            const modal = Modal.show(content, { title: 'Comments', size: 'large' });

            const form = modal.element.querySelector('#comment-form');
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const commentText = form.comment.value.trim();

                if (commentText) {
                    try {
                        await postService.addComment(postId, commentText);
                        form.comment.value = '';
                        modal.close();
                        this.showCommentsModal(postId);
                    } catch (error) {
                        console.error('Comment failed:', error);
                    }
                }
            });

            modal.element.querySelectorAll('.comment-item__delete').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    e.preventDefault();
                    const commentId = btn.dataset.commentId;

                    try {
                        await postService.deleteComment(commentId);
                        const commentItem = btn.closest('.comment-item');
                        if (commentItem) commentItem.remove();

                        const commentList = modal.element.querySelector('#comment-list');
                        if (!commentList.querySelector('.comment-item')) {
                            commentList.innerHTML = '<p class="text-muted text-center">No comments yet</p>';
                        }
                    } catch (error) {
                        console.error('Delete comment failed:', error);
                        Modal.alert('Failed to delete comment.');
                    }
                });
            });

        } catch (error) {
            console.error('Failed to load comments:', error);
            Modal.alert('Failed to load comments. Please try again.');
        }
    },

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

    renderGridItem(post, options = {}) {
        const { showDelete = false } = options;
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
                    ${showDelete ? `
                        <button class="gallery__delete-btn" data-post-id="${post.id}" aria-label="Delete post">
                            <svg viewBox="0 0 24 24" fill="white" width="20" height="20">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                            </svg>
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    },

    attachEvents(container, options = {}) {
        const { onDelete, onLike } = options;

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

        container.querySelectorAll('.post-card__comment-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const postId = btn.dataset.postId;
                this.showCommentsModal(postId);
            });
        });

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

        container.querySelectorAll('.gallery__item').forEach(item => {
            item.addEventListener('click', (e) => {
                if (e.target.closest('.gallery__delete-btn')) return;
                const postId = item.dataset.postId;
                this.showCommentsModal(postId);
            });
        });

        container.querySelectorAll('.gallery__delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                const postId = btn.dataset.postId;

                const confirmed = await Modal.confirm('Are you sure you want to delete this post?', {
                    title: 'Delete Post',
                    confirmText: 'Delete',
                    cancelText: 'Cancel'
                });

                if (confirmed) {
                    try {
                        await postService.deletePost(postId);
                        const galleryItem = btn.closest('.gallery__item');
                        if (galleryItem) galleryItem.remove();
                        if (onDelete) onDelete(postId);
                    } catch (error) {
                        console.error('Delete failed:', error);
                        Modal.alert('Failed to delete post. Please try again.');
                    }
                }
            });
        });
    }
};
