// Camera/Create Page
import { Camera } from '../utils/camera.js';
import { postService } from '../services/post.service.js';
import { router } from '../router/router.js';
import { $, render } from '../utils/dom.js';
import { Modal } from '../components/modal.js';
import { CONFIG } from '../config.js';

export const cameraPage = {
    capturedImage: null,
    uploadedImage: null,
    mode: 'camera', // 'camera' or 'upload'

    async init() {
        this.capturedImage = null;
        this.uploadedImage = null;
        this.mode = 'camera';

        this.render();
        this.attachEvents();

        // Check camera support
        if (!Camera.isSupported()) {
            this.showCameraError('Your browser does not support camera access.');
            return;
        }

        // Initialize camera
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

                <div class="camera-preview" id="camera-preview">
                    <video id="camera-video" class="camera-preview__video" autoplay playsinline muted></video>
                    <canvas id="camera-canvas" class="camera-preview__canvas"></canvas>
                </div>

                <div class="filters-section">
                    <h3 class="filters-section__title">Select Filter (Optional)</h3>
                    <div class="filter-grid">
                        <button class="filter-btn filter-btn--active" data-filter="">
                            <div style="width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: var(--bg-secondary); border-radius: var(--radius-md);">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
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
                    <div class="camera-controls__main">
                        <button id="capture-btn" class="capture-btn" title="Capture Photo"></button>
                    </div>

                    <div class="camera-controls__upload">
                        <span>or</span>
                        <label class="upload-label">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                <polyline points="17 8 12 3 7 8"></polyline>
                                <line x1="12" y1="3" x2="12" y2="15"></line>
                            </svg>
                            Upload Image
                            <input type="file" id="file-input" accept="image/*" />
                        </label>
                    </div>
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
        `;

        render('#app', html);
    },

    attachEvents() {
        // Filter selection
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.filter-btn').forEach(b =>
                    b.classList.remove('filter-btn--active')
                );
                e.currentTarget.classList.add('filter-btn--active');
                Camera.setFilter(e.currentTarget.dataset.filter || null);

                // If we have an uploaded image, redraw with new filter
                if (this.uploadedImage) {
                    this.redrawUploadedImage();
                }
            });
        });

        // Capture button
        const captureBtn = $('#capture-btn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.capturePhoto());
        }

        // File upload
        const fileInput = $('#file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        }

        // Retake button
        const retakeBtn = $('#retake-btn');
        if (retakeBtn) {
            retakeBtn.addEventListener('click', () => this.retake());
        }

        // Post button
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
            this.showPreview(this.capturedImage);
        } catch (error) {
            Modal.alert('Failed to load image. Please try another file.');
        }
    },

    async redrawUploadedImage() {
        if (!this.uploadedImage) return;

        try {
            this.capturedImage = await Camera.redrawWithFilter(this.uploadedImage);
            const previewImg = $('#captured-preview-img');
            if (previewImg) {
                previewImg.src = this.capturedImage;
            }
        } catch (error) {
            console.error('Failed to redraw image:', error);
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

        // Reset file input
        const fileInput = $('#file-input');
        if (fileInput) {
            fileInput.value = '';
        }
    },

    async submitPost() {
        if (!this.capturedImage) return;

        const postBtn = $('#post-btn');
        postBtn.disabled = true;
        postBtn.textContent = 'Posting...';

        try {
            const selectedFilter = document.querySelector('.filter-btn--active')?.dataset.filter || '';

            await postService.createPost(this.capturedImage, selectedFilter);

            Modal.alert('Your post has been created!', { title: 'Success' }).then(() => {
                router.navigate('/');
            });
        } catch (error) {
            Modal.alert(error.message || 'Failed to create post. Please try again.');
            postBtn.disabled = false;
            postBtn.textContent = 'Post';
        }
    },

    showCameraError(message) {
        const preview = $('#camera-preview');
        if (preview) {
            // Keep canvas hidden but available for file upload
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
            // Initialize canvas for file upload after DOM update
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
