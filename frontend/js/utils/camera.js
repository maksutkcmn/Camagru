import { CONFIG } from '../config.js';

class CameraManager {
    constructor() {
        this.stream = null;
        this.video = null;
        this.canvas = null;
        this.ctx = null;
        this.selectedFilter = null;
        this.filterImages = new Map();
        this.isRunning = false;
        this.animationId = null;

        this.filters = [
            { name: 'fire.png', label: 'Fire' },
            { name: 'thumbs-up.png', label: 'Thumbs Up' },
            { name: 'camera.png', label: 'Camera' },
            { name: 'lightning.png', label: 'Lightning' },
            { name: 'cool.png', label: 'Cool' },
            { name: 'heart.png', label: 'Heart' },
            { name: 'star.png', label: 'Star' },
            { name: 'smile.png', label: 'Smile' }
        ];
    }

    async init(videoElement, canvasElement) {
        this.video = videoElement;
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                },
                audio: false
            });

            this.video.srcObject = this.stream;
            await this.video.play();

            await new Promise(resolve => {
                this.video.onloadedmetadata = resolve;
            });

            this.canvas.width = this.video.videoWidth;
            this.canvas.height = this.video.videoHeight;

            await this.preloadFilters();

            this.isRunning = true;
            this.startPreview();

            return true;
        } catch (error) {
            throw new Error('Unable to access camera. Please grant permission.');
        }
    }

    async preloadFilters() {
        const loadPromises = this.filters.map(filter => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    this.filterImages.set(filter.name, img);
                    resolve();
                };
                img.onerror = () => resolve();
                img.src = `${CONFIG.API_URL}${CONFIG.FILTERS_PATH}/${filter.name}`;
            });
        });

        await Promise.all(loadPromises);
    }

    startPreview() {
        const draw = () => {
            if (!this.isRunning) return;

            this.ctx.save();
            this.ctx.scale(-1, 1);
            this.ctx.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
            this.ctx.restore();

            if (this.selectedFilter) {
                const filterImg = this.filterImages.get(this.selectedFilter);
                if (filterImg) {
                    const x = (this.canvas.width - filterImg.width) / 2;
                    const y = (this.canvas.height - filterImg.height) / 2;
                    this.ctx.drawImage(filterImg, x, y);
                }
            }

            this.animationId = requestAnimationFrame(draw);
        };

        draw();
    }

    setFilter(filterName) {
        this.selectedFilter = filterName || null;
    }

    capture() {
        this.ctx.save();
        this.ctx.scale(-1, 1);
        this.ctx.drawImage(this.video, -this.canvas.width, 0, this.canvas.width, this.canvas.height);
        this.ctx.restore();

        return this.canvas.toDataURL('image/png');
    }

    initCanvasForUpload(canvasElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
    }

    async ensureCanvasReady() {
        if (!this.canvas || !this.ctx) {
            const canvasEl = document.getElementById('camera-canvas');
            if (canvasEl) {
                this.canvas = canvasEl;
                this.ctx = canvasEl.getContext('2d');
            }
        }
        if (this.filterImages.size === 0) {
            await this.preloadFilters();
        }
    }

    async loadFromFile(file) {
        await this.ensureCanvasReady();

        if (!this.canvas || !this.ctx) {
            throw new Error('Canvas not available');
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const maxWidth = 640;
                    const maxHeight = 480;
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height = (maxWidth / width) * height;
                        width = maxWidth;
                    }
                    if (height > maxHeight) {
                        width = (maxHeight / height) * width;
                        height = maxHeight;
                    }

                    this.canvas.width = width;
                    this.canvas.height = height;

                    this.ctx.drawImage(img, 0, 0, width, height);

                    resolve(this.canvas.toDataURL('image/png'));
                };
                img.onerror = reject;
                img.src = e.target.result;
            };

            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async redrawWithFilter(imageDataUrl) {
        await this.ensureCanvasReady();

        if (!this.canvas || !this.ctx) {
            throw new Error('Canvas not available');
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);

                if (this.selectedFilter) {
                    const filterImg = this.filterImages.get(this.selectedFilter);
                    if (filterImg) {
                        const x = (this.canvas.width - filterImg.width) / 2;
                        const y = (this.canvas.height - filterImg.height) / 2;
                        this.ctx.drawImage(filterImg, x, y);
                    }
                }

                resolve(this.canvas.toDataURL('image/png'));
            };
            img.onerror = reject;
            img.src = imageDataUrl;
        });
    }

    stop() {
        this.isRunning = false;

        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }

        if (this.video) {
            this.video.srcObject = null;
        }
    }

    getFilters() {
        return this.filters;
    }

    isSupported() {
        return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    }
}

export const Camera = new CameraManager();
