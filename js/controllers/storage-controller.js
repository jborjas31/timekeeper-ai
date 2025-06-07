class StorageController {
    constructor(scheduleCalculator) {
        this.scheduleCalculator = scheduleCalculator;
        this.saveQueue = [];
        this.saving = false;
        this.saveDebounceTimer = null;
        this.isOnline = navigator.onLine;
        this.pendingWrites = new Map();
        this.syncRetryCount = 0;
        this.lastSyncAttempt = 0;
        this.offlineMode = false; // True when Firebase is unavailable
        this.syncingTasks = false; // Prevent multiple task syncs
        this.syncingCompletions = false; // Prevent multiple completion syncs
        
        // Setup online/offline listeners
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.offlineMode = false;
            console.log('🌐 Back online - syncing pending changes');
            this.syncPendingWrites();
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('📴 Offline mode - all changes saved locally');
        });
    }

    // Single-user mode - no authentication needed
    async initializeFirestore() {
        try {
            if (!firebaseDb) {
                throw new Error('Firestore not initialized');
            }
            console.log('✅ Single-user Firestore ready');
            return true;
        } catch (error) {
            console.error('Firestore initialization failed:', error);
            this.fallbackToLocalStorage();
            return false;
        }
    }

    fallbackToLocalStorage() {
        this.offlineMode = true;
        console.log('💾 Operating in offline-first mode');
        if (!FirebaseConfig.isConfigured()) {
            console.log('🔧 Firebase not configured - using localStorage only');
        } else {
            ErrorHandler.showNotification(
                'Offline mode: All changes saved locally and will sync when online.',
                'info',
                4000
            );
        }
        // Use the old localStorage methods as fallback
        this.loadTasksFromLocalStorage();
        this.loadCompletionsFromLocalStorage();
    }

    async saveTasks() {
        // Always save to localStorage first for offline reliability
        const localSaveSuccess = this.saveTasksToLocalStorage();
        
        if (!AppConfig.STORAGE.USE_FIRESTORE || this.offlineMode) {
            return localSaveSuccess;
        }

        // Background sync to Firestore if online and configured
        if (AppConfig.STORAGE.BACKGROUND_SYNC && this.isOnline) {
            this.backgroundSyncTasks();
        }

        return localSaveSuccess;
    }

    async backgroundSyncTasks() {
        // Prevent multiple simultaneous syncs
        if (this.syncingTasks) return;
        this.syncingTasks = true;
        
        // Add to pending writes to show sync status
        this.pendingWrites.set('tasks', { syncing: true });
        
        try {
            const initialized = await this.initializeFirestore();
            if (!initialized) {
                this.pendingWrites.delete('tasks');
                return;
            }

            // Sanitize tasks data to remove undefined values before sending to Firestore
            const sanitizedTasks = this.scheduleCalculator.tasks.map(task => {
                const cleanTask = {};
                Object.keys(task).forEach(key => {
                    if (task[key] !== undefined) {
                        cleanTask[key] = task[key];
                    }
                });
                return cleanTask;
            });

            const tasksData = {
                tasks: sanitizedTasks,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                version: Date.now()
            };

            // Simple single-user structure - no nested collections
            const docRef = firebaseDb.collection(FirebaseConfig.COLLECTIONS.TASKS).doc('userTasks');

            // Use timeout to prevent blocking
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firestore timeout')), AppConfig.STORAGE.FIRESTORE_TIMEOUT)
            );

            try {
                await Promise.race([
                    docRef.set(tasksData, { merge: true }),
                    timeoutPromise
                ]);
            } catch (timeoutError) {
                if (timeoutError.message === 'Firestore timeout') {
                    throw new Error('Sync timeout - operation taking too long');
                }
                throw timeoutError;
            }

            console.log('🔄 Tasks synced to Firestore in background');
            this.syncRetryCount = 0; // Reset retry count on success
            
            // Clear pending writes for tasks since sync was successful
            this.pendingWrites.delete('tasks');
            
            // Update sync status indicator
            if (window.app && window.app.updateSyncStatus) {
                window.app.updateSyncStatus();
            }

        } catch (error) {
            console.warn('Background sync failed:', error.message);
            this.handleSyncFailure('tasks', {
                tasks: this.scheduleCalculator.tasks,
                updatedAt: new Date().toISOString(),
                version: Date.now()
            });
        } finally {
            this.syncingTasks = false;
            // Ensure pending write is cleared even on error
            if (this.pendingWrites.has('tasks') && this.pendingWrites.get('tasks').syncing) {
                this.pendingWrites.delete('tasks');
            }
        }
    }

    async loadTasks() {
        // Always load from localStorage first for immediate availability
        this.loadTasksFromLocalStorage();
        
        if (!AppConfig.STORAGE.USE_FIRESTORE || this.offlineMode || !this.isOnline) {
            console.log('💾 Tasks loaded from localStorage (offline mode)');
            return;
        }

        // Try to sync with Firestore in background for single-user setup
        this.backgroundLoadTasks();
    }

    async backgroundLoadTasks() {
        try {
            const initialized = await this.initializeFirestore();
            if (!initialized) return;

            // Simple single-user structure
            const docRef = firebaseDb.collection(FirebaseConfig.COLLECTIONS.TASKS).doc('userTasks');

            // Use timeout to prevent blocking
            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firestore timeout')), AppConfig.STORAGE.FIRESTORE_TIMEOUT)
            );

            const doc = await Promise.race([
                docRef.get(),
                timeoutPromise
            ]);
            
            if (doc.exists) {
                const data = doc.data();
                if (data.tasks && Array.isArray(data.tasks)) {
                    const firestoreTasks = data.tasks.filter(task => 
                        task.id && task.name && task.time && task.duration && task.frequency !== undefined
                    ).map(task => ({
                        ...task,
                        dependsOn: task.dependsOn || null,
                        bufferTime: task.bufferTime || AppConfig.SCHEDULE.DEFAULT_BUFFER_TIME
                    }));
                    
                    // Only update if Firestore has different data
                    if (JSON.stringify(this.scheduleCalculator.tasks) !== JSON.stringify(firestoreTasks)) {
                        this.scheduleCalculator.tasks = firestoreTasks;
                        this.saveTasksToLocalStorage(); // Keep localStorage in sync
                        console.log(`🔄 Tasks synced from Firestore (${firestoreTasks.length} tasks)`);
                        
                        // Regenerate UI if needed
                        if (window.app && window.app.regenerateUI) {
                            window.app.regenerateUI();
                        }
                    }
                }
            } else if (this.scheduleCalculator.tasks.length > 0) {
                // Migrate local data to Firestore
                console.log('📤 Uploading local tasks to Firestore');
                this.backgroundSyncTasks();
            }

            // Set up listener only after successful connection and if not already set up
            if (!this.tasksUnsubscribe) {
                this.setupTasksListener(docRef);
            }

        } catch (error) {
            console.warn('Background Firestore load failed:', error.message);
            // App continues working with localStorage data
        }
    }

    setupTasksListener(docRef) {
        try {
            this.tasksUnsubscribe = docRef.onSnapshot((doc) => {
                // Skip our own writes to prevent loops
                if (doc.exists && !doc.metadata.hasPendingWrites && !doc.metadata.fromCache) {
                    const data = doc.data();
                    if (data.tasks && Array.isArray(data.tasks)) {
                        const newTasks = data.tasks.filter(task => 
                            task.id && task.name && task.time && task.duration && task.frequency !== undefined
                        ).map(task => ({
                            ...task,
                            dependsOn: task.dependsOn || null,
                            bufferTime: task.bufferTime || AppConfig.SCHEDULE.DEFAULT_BUFFER_TIME
                        }));
                        
                        // Only update if tasks actually changed AND this isn't our own write
                        if (JSON.stringify(this.scheduleCalculator.tasks) !== JSON.stringify(newTasks)) {
                            this.scheduleCalculator.tasks = newTasks;
                            this.saveTasksToLocalStorage(); // Keep localStorage in sync
                            console.log('🔄 Tasks updated from Firestore (external change)');
                            
                            // Regenerate UI without triggering saves
                            if (window.app && window.app.regenerateUI) {
                                window.app.regenerateUI();
                            }
                        }
                    }
                }
            }, (error) => {
                console.error('Tasks listener error:', error);
            });
        } catch (error) {
            console.error('Error setting up tasks listener:', error);
        }
    }

    async loadCompletions() {
        // Always load from localStorage first
        this.loadCompletionsFromLocalStorage();
        
        if (!AppConfig.STORAGE.USE_FIRESTORE || this.offlineMode || !this.isOnline) {
            console.log('💾 Completions loaded from localStorage (offline mode)');
            return;
        }

        // Background sync with Firestore
        this.backgroundLoadCompletions();
    }

    async backgroundLoadCompletions() {
        try {
            const initialized = await this.initializeFirestore();
            if (!initialized) return;

            // Simple single-user structure
            const docRef = firebaseDb.collection(FirebaseConfig.COLLECTIONS.COMPLETIONS).doc('userCompletions');

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firestore timeout')), AppConfig.STORAGE.FIRESTORE_TIMEOUT)
            );

            const doc = await Promise.race([
                docRef.get(),
                timeoutPromise
            ]);
            
            if (doc.exists) {
                const data = doc.data();
                const firestoreCompletions = data.completions || {};
                
                // Only update if different from local data
                if (JSON.stringify(this.scheduleCalculator.completions) !== JSON.stringify(firestoreCompletions)) {
                    this.scheduleCalculator.completions = firestoreCompletions;
                    this.cleanOldCompletions();
                    this.saveCompletionsToLocalStorage(); // Keep localStorage in sync
                    console.log('🔄 Completions synced from Firestore');
                    
                    // Regenerate UI if needed
                    if (window.app && window.app.generateTimeGrid) {
                        window.app.generateTimeGrid();
                    }
                }
            } else if (Object.keys(this.scheduleCalculator.completions).length > 0) {
                // Migrate local data to Firestore
                console.log('📤 Uploading local completions to Firestore');
                this.backgroundSyncCompletions();
            }

            // Set up listener only after successful connection and if not already set up
            if (!this.completionsUnsubscribe) {
                this.setupCompletionsListener(docRef);
            }

        } catch (error) {
            console.warn('Background completions load failed:', error.message);
            // App continues working with localStorage data
        }
    }

    setupCompletionsListener(docRef) {
        try {
            this.completionsUnsubscribe = docRef.onSnapshot((doc) => {
                // Skip our own writes to prevent loops
                if (doc.exists && !doc.metadata.hasPendingWrites && !doc.metadata.fromCache) {
                    const data = doc.data();
                    if (data.completions) {
                        const firestoreCompletions = data.completions;
                        
                        // Only update if completions actually changed
                        if (JSON.stringify(this.scheduleCalculator.completions) !== JSON.stringify(firestoreCompletions)) {
                            this.scheduleCalculator.completions = firestoreCompletions;
                            this.cleanOldCompletions();
                            this.saveCompletionsToLocalStorage(); // Keep localStorage in sync
                            console.log('🔄 Completions updated from Firestore (external change)');
                            
                            // Regenerate UI without triggering saves
                            if (window.app && window.app.generateTimeGrid) {
                                window.app.generateTimeGrid();
                            }
                        }
                    }
                }
            }, (error) => {
                console.error('Completions listener error:', error);
            });
        } catch (error) {
            console.error('Error setting up completions listener:', error);
        }
    }

    async saveCompletions() {
        this.debouncedSaveCompletions();
    }

    debouncedSaveCompletions() {
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }
        
        this.saveDebounceTimer = setTimeout(() => {
            this.saveCompletionsImmediate();
        }, 300);
    }

    async saveCompletionsImmediate() {
        // Always save to localStorage first
        this.saveCompletionsToLocalStorage();
        
        if (!AppConfig.STORAGE.USE_FIRESTORE || this.offlineMode || this.saving) {
            if (this.saving) {
                this.saveQueue.push('completions');
            }
            return;
        }
        
        // Background sync to Firestore
        if (AppConfig.STORAGE.BACKGROUND_SYNC && this.isOnline) {
            this.backgroundSyncCompletions();
        }
    }

    async backgroundSyncCompletions() {
        // Prevent multiple simultaneous syncs
        if (this.syncingCompletions || this.saving) return;
        this.syncingCompletions = true;
        this.saving = true;
        
        // Add to pending writes to show sync status
        this.pendingWrites.set('completions', { syncing: true });
        
        try {
            const initialized = await this.initializeFirestore();
            if (!initialized) {
                this.saving = false;
                this.syncingCompletions = false;
                this.pendingWrites.delete('completions');
                return;
            }

            const completionsData = {
                completions: this.scheduleCalculator.completions,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            // Simple single-user structure
            const docRef = firebaseDb.collection(FirebaseConfig.COLLECTIONS.COMPLETIONS).doc('userCompletions');

            const timeoutPromise = new Promise((_, reject) => 
                setTimeout(() => reject(new Error('Firestore timeout')), AppConfig.STORAGE.FIRESTORE_TIMEOUT)
            );

            await Promise.race([
                docRef.set(completionsData, { merge: true }),
                timeoutPromise
            ]);

            console.log('🔄 Completions synced to Firestore in background');
            
            // Clear pending writes for completions since sync was successful
            this.pendingWrites.delete('completions');
            
            // Update sync status indicator
            if (window.app && window.app.updateSyncStatus) {
                window.app.updateSyncStatus();
            }

        } catch (error) {
            console.warn('Background completions sync failed:', error.message);
            this.handleSyncFailure('completions', {
                completions: this.scheduleCalculator.completions,
                updatedAt: new Date().toISOString()
            });
        } finally {
            this.saving = false;
            this.syncingCompletions = false;
            
            // Ensure pending write is cleared even on error
            if (this.pendingWrites.has('completions') && this.pendingWrites.get('completions').syncing) {
                this.pendingWrites.delete('completions');
            }
            
            if (this.saveQueue.length > 0) {
                this.saveQueue.shift();
                setTimeout(() => this.backgroundSyncCompletions(), 50);
            }
        }
    }

    handleSyncFailure(type, data) {
        this.syncRetryCount++;
        
        if (this.syncRetryCount <= AppConfig.STORAGE.MAX_RETRY_ATTEMPTS) {
            // Store for retry when online
            this.pendingWrites.set(type, data);
            console.log(`📝 ${type} queued for retry (attempt ${this.syncRetryCount})`);
        } else {
            console.warn(`❌ Max retry attempts reached for ${type} sync`);
            this.syncRetryCount = 0; // Reset for next time
        }
    }

    async syncPendingWrites() {
        if (this.pendingWrites.size === 0) return;

        console.log(`🔄 Syncing ${this.pendingWrites.size} pending writes`);

        for (const [type, data] of this.pendingWrites.entries()) {
            try {
                if (type === 'tasks') {
                    const docRef = firebaseDb.collection(FirebaseConfig.COLLECTIONS.TASKS).doc('userTasks');
                    await docRef.set(data, { merge: true });
                    console.log('✅ Synced tasks');
                } else if (type === 'completions') {
                    const docRef = firebaseDb.collection(FirebaseConfig.COLLECTIONS.COMPLETIONS).doc('userCompletions');
                    await docRef.set(data, { merge: true });
                    console.log('✅ Synced completions');
                }
                
                this.pendingWrites.delete(type);
            } catch (error) {
                console.error(`Failed to sync ${type}:`, error);
            }
        }
    }

    cleanOldCompletions() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - AppConfig.STORAGE.COMPLETION_RETENTION_DAYS);
        const cutoffDateStr = TimeUtils.formatDateKey(cutoffDate);
        
        Object.keys(this.scheduleCalculator.completions).forEach(key => {
            const dateStr = key.split('-').slice(-3).join('-');
            if (dateStr < cutoffDateStr) {
                delete this.scheduleCalculator.completions[key];
            }
        });
    }

    async markTaskComplete(task, date) {
        const dateStr = TimeUtils.formatDateKey(date);
        const completionKey = `${task.id}-${dateStr}`;
        this.scheduleCalculator.completions[completionKey] = true;
        this.saveCompletions();
        
        DebugUtils.logTaskOperation('completed', { name: task.name, date: dateStr });
    }

    async markTaskIncomplete(task, date) {
        const dateStr = TimeUtils.formatDateKey(date);
        const completionKey = `${task.id}-${dateStr}`;
        delete this.scheduleCalculator.completions[completionKey];
        this.saveCompletions();
        
        DebugUtils.logTaskOperation('uncompleted', { name: task.name, date: dateStr });
    }

    // Legacy localStorage methods for fallback
    saveTasksToLocalStorage() {
        try {
            const tasksData = JSON.stringify(this.scheduleCalculator.tasks);
            localStorage.setItem(AppConfig.STORAGE.TASKS_KEY, tasksData);
            return true;
        } catch (e) {
            console.error('Error saving tasks to localStorage:', e);
            return false;
        }
    }

    loadTasksFromLocalStorage() {
        try {
            const saved = localStorage.getItem(AppConfig.STORAGE.TASKS_KEY);
            if (saved) {
                const tasks = JSON.parse(saved);
                this.scheduleCalculator.tasks = tasks.filter(task => 
                    task.id && task.name && task.time && task.duration && task.frequency !== undefined
                ).map(task => ({
                    ...task,
                    dependsOn: task.dependsOn || null,
                    bufferTime: task.bufferTime || AppConfig.SCHEDULE.DEFAULT_BUFFER_TIME
                }));
            } else {
                this.scheduleCalculator.tasks = [];
            }
        } catch (e) {
            console.error('Error loading tasks from localStorage:', e);
            this.scheduleCalculator.tasks = [];
        }
    }

    saveCompletionsToLocalStorage() {
        try {
            localStorage.setItem(AppConfig.STORAGE.COMPLETIONS_KEY, JSON.stringify(this.scheduleCalculator.completions));
        } catch (e) {
            console.error('Error saving completions to localStorage:', e);
        }
    }

    loadCompletionsFromLocalStorage() {
        try {
            const saved = localStorage.getItem(AppConfig.STORAGE.COMPLETIONS_KEY);
            if (saved) {
                this.scheduleCalculator.completions = JSON.parse(saved);
                this.cleanOldCompletions();
            } else {
                this.scheduleCalculator.completions = {};
            }
        } catch (e) {
            console.error('Error loading completions from localStorage:', e);
            this.scheduleCalculator.completions = {};
        }
    }

    destroy() {
        // Clean up listeners
        if (this.tasksUnsubscribe) {
            this.tasksUnsubscribe();
        }
        if (this.completionsUnsubscribe) {
            this.completionsUnsubscribe();
        }
        
        // Clear timers
        if (this.saveDebounceTimer) {
            clearTimeout(this.saveDebounceTimer);
        }
    }

    // Utility methods for debugging and management
    async getStorageInfo() {
        if (!AppConfig.STORAGE.USE_FIRESTORE || this.offlineMode) {
            return this.getLocalStorageInfo();
        }

        try {
            const tasksDoc = await firebaseDb.collection(FirebaseConfig.COLLECTIONS.TASKS).doc('userTasks').get();
            const completionsDoc = await firebaseDb.collection(FirebaseConfig.COLLECTIONS.COMPLETIONS).doc('userCompletions').get();

            return {
                type: 'firestore-single-user',
                tasks: {
                    exists: tasksDoc.exists,
                    count: tasksDoc.exists ? (tasksDoc.data().tasks || []).length : 0,
                    lastUpdated: tasksDoc.exists ? tasksDoc.data().updatedAt : null
                },
                completions: {
                    exists: completionsDoc.exists,
                    count: completionsDoc.exists ? Object.keys(completionsDoc.data().completions || {}).length : 0,
                    lastUpdated: completionsDoc.exists ? completionsDoc.data().updatedAt : null
                },
                isOnline: this.isOnline,
                offlineMode: this.offlineMode,
                pendingWrites: this.pendingWrites.size
            };
        } catch (error) {
            console.error('Error getting Firestore storage info:', error);
            return this.getLocalStorageInfo();
        }
    }

    getLocalStorageInfo() {
        try {
            let totalSize = 0;
            const breakdown = {};
            
            for (let key in localStorage) {
                if (localStorage.hasOwnProperty(key)) {
                    const size = localStorage[key].length + key.length;
                    totalSize += size;
                    
                    if (key.startsWith('timekeeper-')) {
                        breakdown[key] = size;
                    }
                }
            }
            
            return {
                type: 'localStorage',
                totalSize: totalSize,
                breakdown: breakdown,
                estimatedLimit: 5 * 1024 * 1024,
                percentUsed: (totalSize / (5 * 1024 * 1024)) * 100
            };
        } catch (e) {
            console.error('Error getting localStorage info:', e);
            return null;
        }
    }
}

window.StorageController = StorageController;