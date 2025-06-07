class AppConfig {
    static get SCHEDULE() {
        return {
            MAX_DEPENDENCY_DEPTH: 10,
            DEFAULT_DURATION: 30,
            DEFAULT_BUFFER_TIME: 5,
            HOURS_PER_DAY: 24,
            MINUTES_PER_HOUR: 60
        };
    }

    static get STORAGE() {
        return {
            // Legacy localStorage keys (for migration)
            TASKS_KEY: 'timekeeper-tasks',
            COMPLETIONS_KEY: 'timekeeper-completions',
            COMPLETION_RETENTION_DAYS: 30,
            
            // Firestore settings (optimized for single-user offline-first operation)
            USE_FIRESTORE: true,
            FIRESTORE_TIMEOUT: 10000, // 10 seconds (more reliable for sync operations)
            OFFLINE_CACHE_SIZE: 40 * 1024 * 1024, // 40MB
            SYNC_RETRY_DELAY: 1000, // 1 second (faster retry for single user)
            OFFLINE_FIRST: true, // Always save to localStorage first
            BACKGROUND_SYNC: true, // Sync to Firestore in background when online
            MAX_RETRY_ATTEMPTS: 3 // Limit retry attempts to avoid blocking
        };
    }

    static get UPDATE_INTERVALS() {
        return {
            TIME_UPDATE: 60000,
            GRID_REFRESH: 300000
        };
    }

    static get TASK_FREQUENCIES() {
        return {
            ONCE: 'once',
            DAILY: 'daily', 
            WEEKLY: 'weekly',
            MONTHLY: 'monthly'
        };
    }

    static get DAYS_OF_WEEK() {
        return {
            0: 'Sunday',
            1: 'Monday', 
            2: 'Tuesday',
            3: 'Wednesday',
            4: 'Thursday',
            5: 'Friday',
            6: 'Saturday'
        };
    }

    static get MONTHLY_PATTERNS() {
        return {
            FIRST: 'first',           // First day of month
            LAST: 'last',             // Last day of month
            DATE: 'date',             // Specific date (1-31)
            WEEKDAY: 'weekday'        // Specific weekday (e.g., first Monday)
        };
    }

    static get VALIDATION() {
        return {
            MIN_DURATION: 5,
            MAX_DURATION: 480,
            MIN_BUFFER_TIME: 0,
            MAX_BUFFER_TIME: 60
        };
    }
}

window.AppConfig = AppConfig;