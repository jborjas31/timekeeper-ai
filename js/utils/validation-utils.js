class ValidationUtils {
    static sanitizeHTML(str) {
        if (!str || typeof str !== 'string') return '';
        
        // Escape HTML entities to prevent XSS
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    static escapeForAttribute(str) {
        if (!str || typeof str !== 'string') return '';
        
        // Additional escaping for HTML attributes
        return str
            .replace(/&/g, '&amp;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    static validateTaskName(name) {
        if (!name || name.trim().length === 0) {
            return { valid: false, error: 'Please enter a task name' };
        }
        if (name.trim().length > 100) {
            return { valid: false, error: 'Task name must be less than 100 characters' };
        }
        return { valid: true };
    }

    static validateTaskTime(time) {
        if (!time) {
            return { valid: false, error: 'Please select a time' };
        }
        return { valid: true };
    }

    static validateDuration(duration) {
        if (duration < AppConfig.VALIDATION.MIN_DURATION || duration > AppConfig.VALIDATION.MAX_DURATION) {
            return { 
                valid: false, 
                error: `Duration must be between ${AppConfig.VALIDATION.MIN_DURATION} and ${AppConfig.VALIDATION.MAX_DURATION} minutes` 
            };
        }
        return { valid: true };
    }

    static validateBufferTime(bufferTime) {
        if (bufferTime < AppConfig.VALIDATION.MIN_BUFFER_TIME || bufferTime > AppConfig.VALIDATION.MAX_BUFFER_TIME) {
            return { 
                valid: false, 
                error: `Buffer time must be between ${AppConfig.VALIDATION.MIN_BUFFER_TIME} and ${AppConfig.VALIDATION.MAX_BUFFER_TIME} minutes` 
            };
        }
        return { valid: true };
    }

    static validateTaskData(taskData) {
        const validations = [
            this.validateTaskName(taskData.name),
            this.validateTaskTime(taskData.time),
            this.validateDuration(taskData.duration),
            this.validateBufferTime(taskData.bufferTime)
        ];

        const firstError = validations.find(v => !v.valid);
        return firstError || { valid: true };
    }

    static generateUUID() {
        // Use crypto.randomUUID if available (modern browsers)
        if (crypto && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        
        // Fallback to custom UUID v4 generation
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    static generateTaskId() {
        // Generate a shorter, more readable ID for tasks
        const timestamp = Date.now().toString(36);
        const randomPart = Math.random().toString(36).substr(2, 5);
        return `task_${timestamp}_${randomPart}`;
    }
}

window.ValidationUtils = ValidationUtils;