import { $ } from '../utils/dom.js';

export const Modal = {
    show(content, options = {}) {
        const { title = '', onClose, size = 'normal' } = options;

        const modalHtml = `
            <div class="modal-overlay">
                <div class="modal ${size === 'large' ? 'modal--large' : ''}">
                    ${title ? `
                        <div class="modal__header">
                            <h2 class="modal__title">${title}</h2>
                            <button class="modal__close" aria-label="Close">&times;</button>
                        </div>
                    ` : `
                        <button class="modal__close modal__close--absolute" aria-label="Close">&times;</button>
                    `}
                    <div class="modal__body">
                        ${content}
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        document.body.style.overflow = 'hidden';

        const overlay = $('.modal-overlay');
        const closeBtn = overlay.querySelector('.modal__close');

        const close = () => {
            overlay.remove();
            document.body.style.overflow = '';
            if (onClose) onClose();
        };

        closeBtn.addEventListener('click', close);
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) close();
        });

        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                close();
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);

        return { close, element: overlay };
    },

    confirm(message, options = {}) {
        const { title = 'Confirm', confirmText = 'Confirm', cancelText = 'Cancel' } = options;

        return new Promise((resolve) => {
            const content = `
                <p style="margin-bottom: var(--spacing-lg);">${message}</p>
                <div class="modal__footer" style="border-top: none; padding-top: 0;">
                    <button class="btn btn--secondary modal__cancel">${cancelText}</button>
                    <button class="btn btn--primary modal__confirm">${confirmText}</button>
                </div>
            `;

            const modal = this.show(content, { title });

            modal.element.querySelector('.modal__cancel').addEventListener('click', () => {
                modal.close();
                resolve(false);
            });

            modal.element.querySelector('.modal__confirm').addEventListener('click', () => {
                modal.close();
                resolve(true);
            });
        });
    },

    alert(message, options = {}) {
        const { title = 'Alert', buttonText = 'OK' } = options;

        return new Promise((resolve) => {
            const content = `
                <p style="margin-bottom: var(--spacing-lg);">${message}</p>
                <div class="modal__footer" style="border-top: none; padding-top: 0;">
                    <button class="btn btn--primary modal__ok">${buttonText}</button>
                </div>
            `;

            const modal = this.show(content, { title });

            modal.element.querySelector('.modal__ok').addEventListener('click', () => {
                modal.close();
                resolve();
            });
        });
    },

    closeAll() {
        document.querySelectorAll('.modal-overlay').forEach(el => el.remove());
        document.body.style.overflow = '';
    }
};
