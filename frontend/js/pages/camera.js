import { Camera } from '../utils/camera.js';
import { postService } from '../services/post.service.js';
import { $, render } from '../utils/dom.js';
import { Modal } from '../components/modal.js';
import { CONFIG } from '../config.js';

export const cameraPage = {
    capturedImage: null,
    uploadedImage: null,
    mode: 'camera',
    userPosts: [],

    async init() {
        this.capturedImage = null;
        this.uploadedImage = null;
        this.mode = 'camera';
        this.userPosts = [];
        Camera.setFilter(null);

        this.render();
        this.attachEvents();
        this.loadUserPhotos();

        if (!Camera.isSupported()) {
            this.showCameraError('Your browser does not support camera access.');
            return;
        }

        try {
            const video = $('#camera-video');
            const canvas = $('#camera-canvas');
            await Camera.init(video, canvas);
        } catch (error) {
            this.showCameraError(error.message);
        }
    },

    render() {
        const filters = Camera.getFilters();

        const html = `
            <div class="camera-page">
                <h1 class="camera-page__title">Create a Photo</h1>

                <div class="editor-layout">
                    <div class="editor-main">
                        <div class="camera-preview" id="camera-preview">
                            <video id="camera-video" class="camera-preview__video" autoplay playsinline muted></video>
                            <canvas id="camera-canvas" class="camera-preview__canvas"></canvas>
                        </div>

                        <div class="filters-section">
                            <h3 class="filters-section__title">Superposable Images</h3>
                            <div class="filter-grid">
                                <button class="filter-btn filter-btn--active" data-filter="">
                                    <div style="width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); border-radius: var(--radius-sm);">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                            <circle cx="12" cy="12" r="10"></circle>
                                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                                        </svg>
                                    </div>
                                    <span>None</span>
                                </button>
                                ${filters.map(f => `
                                    <button class="filter-btn" data-filter="${f.name}">
                                        <img src="${CONFIG.API_URL}${CONFIG.FILTERS_PATH}/${f.name}" alt="${f.label}" />
                                        <span>${f.label}</span>
                                    </button>
                                `).join('')}
                            </div>
                        </div>

                        <div class="camera-controls">
                            <button id="capture-btn" class="capture-btn" title="Capture Photo" disabled></button>
                            <label class="upload-label">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="17 8 12 3 7 8"></polyline>
                                    <line x1="12" y1="3" x2="12" y2="15"></line>
                                </svg>
                                Upload Image
                                <input type="file" id="file-input" accept="image/*" />
                            </label>
                        </div>

                        <div id="captured-section" class="captured-section hidden">
                            <h3 class="captured-section__title">Preview</h3>
                            <div class="captured-preview">
                                <img id="captured-preview-img" alt="Captured photo" />
                            </div>
                            <div class="captured-actions">
                                <button id="retake-btn" class="btn btn--secondary">Retake</button>
                                <button id="post-btn" class="btn btn--primary">Post</button>
                            </div>
                        </div>
                    </div>

                    <aside class="editor-side">
                        <div class="editor-side__header">History</div>
                        <div id="side-photo-list" class="editor-side__list">
                            <div class="side-section__empty">
                                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                                    <circle cx="8.5" cy="8.5" r="1.5"></circle>
                                    <polyline points="21 15 16 10 5 21"></polyline>
                                </svg>
                                <p>No photos yet.<br>Capture or upload one!</p>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        `;

        render('#app', html);
    },

    attachEvents() {
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b =>
                    b.classList.remove('filter-btn--active')
                );
                e.currentTarget.classList.add('filter-btn--active');

                const filterName = e.currentTarget.dataset.filter || null;
                Camera.setFilter(filterName);

                const captureBtn = $('#capture-btn');
                if (captureBtn) {
                    captureBtn.disabled = !filterName;
                }

                if (this.uploadedImage) {
                    this.redrawUploadedImage();
                }
            });
        });

        const captureBtn = $('#capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.capturePhoto());
        }

        const fileInput = $('#file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        const retakeBtn = $('#retake-btn');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => this.retake());
        }

        const postBtn = $('#post-btn');
        if (postBtn) {
            postBtn.addEventListener('click', () => this.submitPost());
        }
    },

    capturePhoto() {
        this.capturedImage = Camera.capture();
        this.mode = 'camera';
        this.showPreview(this.capturedImage);
    },

    async handleFileUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            this.uploadedImage = await Camera.loadFromFile(file);
            this.capturedImage = this.uploadedImage;
            this.mode = 'upload';
            const previewComposite = await Camera.redrawWithFilter(this.uploadedImage);
            this.showPreview(previewComposite);
        } catch (error) {
            Modal.alert('Failed to load image. Please try another file.');
        }
    },

    async redrawUploadedImage() {
        if (!this.uploadedImage) return;

        try {
            const composite = await Camera.redrawWithFilter(this.uploadedImage);
            const previewImg = $('#captured-preview-img');
            if (previewImg) {
                previewImg.src = composite;
            }
        } catch (error) {
        }
    },

    showPreview(imageData) {
        const capturedSection = $('#captured-section');
        const previewImg = $('#captured-preview-img');

        if (previewImg) {
            previewImg.src = imageData;
        }

        if (capturedSection) {
            capturedSection.classList.remove('hidden');
        }
    },

    retake() {
        this.capturedImage = null;
        this.uploadedImage = null;

        const capturedSection = $('#captured-section');
        if (capturedSection) {
            capturedSection.classList.add('hidden');
        }

        const fileInput = $('#file-input');
        if (fileInput) {
            fileInput.value = '';
        }
    },

    async loadUserPhotos() {
        try {
            const response = await postService.getUserPosts();
            this.userPosts = response.data?.posts || response.posts || [];
            this.renderSidePhotos();
        } catch (error) {
        }
    },

    renderSidePhotos() {
        const list = $('#side-photo-list');
        if (!list) return;

        if (!this.userPosts || this.userPosts.length === 0) {
            list.innerHTML = `
                <div class="side-section__empty">
                    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <p>No photos yet.<br>Capture or upload one!</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.userPosts.map(post => {
            const imgUrl = postService.getImageUrl(post.image_path || post.image);
            return `
                <div class="thumb-item" data-post-id="${post.id}">
                    <img class="thumb-item__img" src="${imgUrl}" alt="Photo" />
                    <button class="thumb-item__delete" data-delete-id="${post.id}" title="Delete photo">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>
            `;
        }).join('');

        list.querySelectorAll('.thumb-item__delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deletePhoto(btn.dataset.deleteId);
            });
        });
    },

    async deletePhoto(postId) {
        const confirmed = await Modal.confirm('Delete this photo?', {
            title: 'Confirm Delete',
            confirmText: 'Delete',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;

        try {
            await postService.deletePost(postId);
            this.userPosts = this.userPosts.filter(p => String(p.id) !== String(postId));
            this.renderSidePhotos();
        } catch (error) {
            Modal.alert(error.message || 'Failed to delete photo.');
        }
    },

    async submitPost() {
        if (!this.capturedImage) return;

        const selectedFilter = document.querySelector('.filter-btn--active')?.dataset.filter || '';
        if (!selectedFilter) {
            Modal.alert('Please select a filter before posting.', { title: 'Filter Required' });
            return;
        }

        const postBtn = $('#post-btn');
        postBtn.disabled = true;
        postBtn.textContent = 'Posting...';

        try {

            await postService.createPost(this.capturedImage, selectedFilter);

            this.retake();
            await this.loadUserPhotos();
            Modal.alert('Your post has been created!', { title: 'Success' });
        } catch (error) {
            Modal.alert(error.message || 'Failed to create post. Please try again.');
            postBtn.disabled = false;
            postBtn.textContent = 'Post';
        }
    },

    showCameraError(message) {
        const preview = $('#camera-preview');
        if (preview) {
            preview.innerHTML = `
                <canvas id="camera-canvas" style="display: none;"></canvas>
                <div class="camera-error">
                    <div class="camera-error__icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <line x1="1" y1="1" x2="23" y2="23"></line>
                        </svg>
                    </div>
                    <h3 class="camera-error__title">Camera Not Available</h3>
                    <p class="camera-error__message">${message}</p>
                    <p class="camera-error__message">You can still upload an image instead.</p>
                </div>
            `;
            const canvas = $('#camera-canvas');
            if (canvas) {
                Camera.initCanvasForUpload(canvas);
            }
        }
    },

    destroy() {
        Camera.stop();
    }
};
