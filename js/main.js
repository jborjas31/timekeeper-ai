class TimeKeeper {
    constructor() {
        this.scheduleCalculator = new ScheduleCalculator();
        this.timeGridRenderer = new SimpleTimeGridRenderer();
        this.taskController = new TaskController(this.scheduleCalculator);
        this.storageController = new StorageController(this.scheduleCalculator);
        this.uiController = new UIController(
            this.scheduleCalculator, 
            this.timeGridRenderer, 
            this.taskController
        );
        
        this.init();
    }

    async init() {
        // Initialize storage (which will handle auth)
        await this.storageController.loadTasks();
        await this.storageController.loadCompletions();
        
        this.uiController.bindEvents();
        this.uiController.updateTime();
        this.uiController.generateTimeGrid();
        this.uiController.scheduleUpdates();
        
        // Add status indicators for single-user mode
        this.addStatusIndicator();
    }

    addStatusIndicator() {
        // Single-user mode - only show offline status indicator
        this.addOfflineIndicator();
    }

    addOfflineIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'offlineIndicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: #ef4444;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            font-size: 0.85rem;
            z-index: 1000;
            display: none;
        `;
        
        const updateIndicator = () => {
            if (!navigator.onLine) {
                indicator.innerHTML = '📴 Offline';
                indicator.style.display = 'block';
            } else {
                indicator.style.display = 'none';
            }
        };

        window.addEventListener('online', updateIndicator);
        window.addEventListener('offline', updateIndicator);
        updateIndicator();
        
        document.body.appendChild(indicator);
    }

    saveAndRefresh() {
        this.storageController.saveTasks();
        this.uiController.generateTimeGrid();
        if (document.getElementById('tasksScreen').classList.contains('active')) {
            this.taskController.renderTaskList();
        }
    }

    regenerateUI() {
        // Only regenerate UI without triggering saves (to avoid listener loops)
        this.uiController.generateTimeGrid();
        if (document.getElementById('tasksScreen').classList.contains('active')) {
            this.taskController.renderTaskList();
        }
    }

    generateTimeGrid() {
        this.uiController.generateTimeGrid();
    }
}

class ErrorHandler {
    static handleError(error, context = 'Unknown', recoveryAction = null) {
        console.error(`TimeKeeper Error in ${context}:`, error);
        
        if (DebugUtils.isEnabled) {
            console.group('🚨 Error Debug Info');
            console.error('Stack trace:', error.stack);
            console.error('Context:', context);
            console.groupEnd();
        }
        
        // Attempt recovery if provided
        if (recoveryAction && typeof recoveryAction === 'function') {
            try {
                console.log('Attempting error recovery...');
                recoveryAction();
            } catch (recoveryError) {
                console.error('Recovery failed:', recoveryError);
                this.showErrorNotification('An error occurred and recovery failed. Please refresh the page.');
            }
        }
        
        // Store error for debugging
        this.logError(error, context);
    }

    static logError(error, context) {
        try {
            const errorLog = {
                timestamp: new Date().toISOString(),
                context: context,
                message: error.message,
                stack: error.stack,
                userAgent: navigator.userAgent
            };
            
            // Store in localStorage for debugging (with size limit)
            const existingLogs = JSON.parse(localStorage.getItem('timekeeper-error-logs') || '[]');
            existingLogs.push(errorLog);
            
            // Keep only last 10 errors to prevent storage bloat
            if (existingLogs.length > 10) {
                existingLogs.splice(0, existingLogs.length - 10);
            }
            
            localStorage.setItem('timekeeper-error-logs', JSON.stringify(existingLogs));
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }
    }

    static showNotification(message, type = 'error', duration = 5000) {
        // Create a non-blocking notification
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const colors = {
            error: '#ef4444',
            warning: '#f59e0b',
            success: '#10b981',
            info: '#3b82f6'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type] || colors.error};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 10000;
            max-width: 400px;
            word-wrap: break-word;
            animation: slideIn 0.3s ease-out;
        `;
        
        // Add CSS animation
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOut {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        notification.textContent = message;
        document.body.appendChild(notification);
        
        // Auto-remove after specified duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        }, duration);
    }

    static showErrorNotification(message) {
        this.showNotification(message, 'error');
    }

    static showConfirmDialog(message, onConfirm, onCancel = null) {
        // Create a non-blocking confirmation dialog
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        
        const dialog = document.createElement('div');
        dialog.style.cssText = `
            background: white;
            padding: 2rem;
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.3);
            max-width: 400px;
            text-align: center;
        `;
        
        const messageEl = document.createElement('p');
        messageEl.textContent = message;
        messageEl.style.marginBottom = '1.5rem';
        
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = 'display: flex; gap: 1rem; justify-content: center;';
        
        const confirmBtn = document.createElement('button');
        confirmBtn.textContent = 'Confirm';
        confirmBtn.style.cssText = `
            background: #ef4444;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
        `;
        
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Cancel';
        cancelBtn.style.cssText = `
            background: #6b7280;
            color: white;
            border: none;
            padding: 0.5rem 1rem;
            border-radius: 6px;
            cursor: pointer;
        `;
        
        const closeDialog = () => {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
        };
        
        confirmBtn.onclick = () => {
            closeDialog();
            if (onConfirm) onConfirm();
        };
        
        cancelBtn.onclick = () => {
            closeDialog();
            if (onCancel) onCancel();
        };
        
        overlay.onclick = (e) => {
            if (e.target === overlay) {
                closeDialog();
                if (onCancel) onCancel();
            }
        };
        
        buttonContainer.appendChild(cancelBtn);
        buttonContainer.appendChild(confirmBtn);
        dialog.appendChild(messageEl);
        dialog.appendChild(buttonContainer);
        overlay.appendChild(dialog);
        document.body.appendChild(overlay);
    }

    static withErrorBoundary(fn, context, recoveryAction = null) {
        return function(...args) {
            try {
                return fn.apply(this, args);
            } catch (error) {
                ErrorHandler.handleError(error, context, recoveryAction);
                return null; // Safe fallback
            }
        };
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    const initializeApp = async () => {
        app = new TimeKeeper();
        
        // Make app globally available for UI callbacks
        window.app = app;
        
        if (DebugUtils.isEnabled) {
            window.TimeKeeperDebug = {
                enableDebug: DebugUtils.enableDebugging,
                disableDebug: DebugUtils.disableDebugging,
                logSchedule: () => DebugUtils.logSchedule(app.scheduleCalculator.calculateDaySchedule()),
                app: app,
                scheduleCalculator: app.scheduleCalculator,
                timeUtils: TimeUtils,
                config: AppConfig
            };
            console.log('🐛 Debug utilities available at window.TimeKeeperDebug');
        }
    };
    
    const recoveryAction = () => {
        // Try to reinitialize with fresh state
        if (app && app.uiController && app.uiController.destroy) {
            app.uiController.destroy();
        }
        initializeApp();
    };
    
    (async () => {
        try {
            await initializeApp();
        } catch (error) {
            ErrorHandler.handleError(error, 'App Initialization', recoveryAction);
            if (!app) {
                document.body.innerHTML = '<div style="padding: 2rem; text-align: center; color: #ef4444;">Failed to load TimeKeeper. <button onclick="location.reload()">Refresh Page</button></div>';
            }
        }
    })();
});