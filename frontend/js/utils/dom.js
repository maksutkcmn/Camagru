export function $(selector) {
    return document.querySelector(selector);
}

export function $$(selector) {
    return document.querySelectorAll(selector);
}

export function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.entries(value).forEach(([dataKey, dataValue]) => {
                element.dataset[dataKey] = dataValue;
            });
        } else if (key.startsWith('on') && typeof value === 'function') {
            const event = key.slice(2).toLowerCase();
            element.addEventListener(event, value);
        } else {
            element.setAttribute(key, value);
        }
    });

    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else if (child instanceof Node) {
            element.appendChild(child);
        }
    });

    return element;
}

export function render(container, html) {
    if (typeof container === 'string') {
        container = $(container);
    }
    if (container) {
        container.innerHTML = html;
    }
}

export function showLoading(container) {
    if (typeof container === 'string') {
        container = $(container);
    }
    if (container) {
        container.innerHTML = `
            <div class="loading">
                <div class="loading__spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    }
}

export function formatDate(dateString) {
    const isoString = dateString.replace(' ', 'T') + 'Z';
    const date = new Date(isoString);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) {
        return 'Just now';
    }

    if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes}m ago`;
    }

    if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours}h ago`;
    }

    if (diff < 604800000) {
        const days = Math.floor(diff / 86400000);
        return `${days}d ago`;
    }

    return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
}

export function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
