class DebugUtils {
    static get isEnabled() {
        return window.location.search.includes('debug=true') || 
               localStorage.getItem('timekeeper-debug') === 'true';
    }

    static logSchedule(scheduleData) {
        if (!this.isEnabled) return;
        
        console.group('📅 Schedule Debug Info');
        console.table(scheduleData.stats);
        
        if (scheduleData.conflicts.length > 0) {
            console.warn('⚠️ Conflicts detected:', scheduleData.conflicts);
        }
        
        if (scheduleData.gaps.length > 0) {
            console.info('⏰ Available time gaps:', scheduleData.gaps);
        }
        
        console.groupEnd();
        
        window.scheduleData = scheduleData;
    }

    static logTaskOperation(operation, taskData) {
        if (!this.isEnabled) return;
        console.log(`🔧 Task ${operation}:`, taskData);
    }

    static enableDebugging() {
        localStorage.setItem('timekeeper-debug', 'true');
        console.log('🐛 Debug mode enabled. Refresh to see debug info.');
    }

    static disableDebugging() {
        localStorage.removeItem('timekeeper-debug');
        console.log('🐛 Debug mode disabled.');
    }

    static forceOfflineMode() {
        if (window.app && window.app.storageController) {
            window.app.storageController.offlineMode = true;
            console.log('📴 Forced offline mode enabled');
        }
    }

    static forceOnlineMode() {
        if (window.app && window.app.storageController) {
            window.app.storageController.offlineMode = false;
            console.log('🌐 Forced online mode enabled');
        }
    }

    static getStorageStatus() {
        if (window.app && window.app.storageController) {
            const sc = window.app.storageController;
            return {
                isOnline: sc.isOnline,
                offlineMode: sc.offlineMode,
                pendingWrites: sc.pendingWrites.size,
                syncRetryCount: sc.syncRetryCount,
                mode: 'single-user'
            };
        }
        return null;
    }
}

window.DebugUtils = DebugUtils;