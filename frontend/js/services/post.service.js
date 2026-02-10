import { api } from './api.js';
import { CONFIG } from '../config.js';

export const postService = {
    async getFeed(page = 1, limit = CONFIG.DEFAULT_PAGE_SIZE) {
        return api.get(`/api/get/feed?page=${page}&limit=${limit}`);
    },

    async getUserPosts() {
        return api.get('/api/get/posts');
    },

    async createPost(imageData, filterName = '') {
        return api.post('/api/create/post', {
            image: imageData,
            filter: filterName
        });
    },

    async deletePost(postId) {
        return api.get(`/api/delete/post/${postId}`);
    },

    async likePost(postId) {
        return api.get(`/api/like/post/${postId}`);
    },

    async addComment(postId, comment) {
        return api.post('/api/comment/post', {
            postid: parseInt(postId),
            comment: comment
        });
    },

    async getComments(postId) {
        return api.get(`/api/get/post/comments/${postId}`);
    },

    async deleteComment(commentId) {
        return api.get(`/api/delete/comment/${commentId}`);
    },

    getImageUrl(imagePath) {
        if (!imagePath) return '';
        if (imagePath.startsWith('http')) return imagePath;
        return `${CONFIG.API_URL}/${imagePath}`;
    }
};
