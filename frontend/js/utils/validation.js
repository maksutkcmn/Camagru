// Form Validation Utilities

export const validators = {
    required: (value) => {
        if (!value || value.trim() === '') {
            return 'This field is required';
        }
        return null;
    },

    email: (value) => {
        if (!value) return null;
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            return 'Please enter a valid email address';
        }
        return null;
    },

    minLength: (min) => (value) => {
        if (!value) return null;
        if (value.length < min) {
            return `Must be at least ${min} characters`;
        }
        return null;
    },

    maxLength: (max) => (value) => {
        if (!value) return null;
        if (value.length > max) {
            return `Must be no more than ${max} characters`;
        }
        return null;
    },

    username: (value) => {
        if (!value) return null;
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(value)) {
            return 'Username can only contain letters, numbers, and underscores';
        }
        if (value.length < 3) {
            return 'Username must be at least 3 characters';
        }
        if (value.length > 30) {
            return 'Username must be no more than 30 characters';
        }
        return null;
    },

    password: (value) => {
        if (!value) return null;
        if (value.length < 6) {
            return 'Password must be at least 6 characters';
        }
        return null;
    },

    passwordMatch: (password) => (value) => {
        if (!value) return null;
        if (value !== password) {
            return 'Passwords do not match';
        }
        return null;
    }
};

// Validate a single field
export function validateField(value, rules = []) {
    for (const rule of rules) {
        const error = rule(value);
        if (error) {
            return error;
        }
    }
    return null;
}

// Validate entire form
export function validateForm(formData, validationRules) {
    const errors = {};
    let isValid = true;

    Object.entries(validationRules).forEach(([field, rules]) => {
        const value = formData[field];
        const error = validateField(value, rules);
        if (error) {
            errors[field] = error;
            isValid = false;
        }
    });

    return { isValid, errors };
}

// Show field error in UI
export function showFieldError(fieldName, message) {
    const input = document.getElementById(fieldName);
    const errorEl = document.getElementById(`${fieldName}-error`);

    if (input) {
        input.classList.add('input--error');
    }
    if (errorEl) {
        errorEl.textContent = message || '';
    }
}

// Clear field error in UI
export function clearFieldError(fieldName) {
    const input = document.getElementById(fieldName);
    const errorEl = document.getElementById(`${fieldName}-error`);

    if (input) {
        input.classList.remove('input--error');
    }
    if (errorEl) {
        errorEl.textContent = '';
    }
}

// Clear all form errors
export function clearFormErrors(form) {
    form.querySelectorAll('.input--error').forEach(el => {
        el.classList.remove('input--error');
    });
    form.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
    });
    const formError = form.querySelector('#form-error');
    if (formError) {
        formError.classList.add('hidden');
        formError.textContent = '';
    }
}

// Show form-level error
export function showFormError(form, message) {
    const errorDiv = form.querySelector('#form-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
    }
}
