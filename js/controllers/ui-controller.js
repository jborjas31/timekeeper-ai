class UIController {
    constructor(scheduleCalculator, timeGridRenderer, taskController) {
        this.scheduleCalculator = scheduleCalculator;
        this.timeGridRenderer = timeGridRenderer;
        this.taskController = taskController;
        this.currentHour = TimeUtils.getStableCurrentHour();
        this.currentDate = new Date(); // Track selected date for time grid
        this.intervals = [];
        this.boundHandlers = {};
        this.lastUserInteractionTime = 0;
    }

    bindEvents() {
        // Helper function to safely bind events (reverted to working approach)
        const safeBindEvent = (elementId, event, handler) => {
            const element = document.getElementById(elementId);
            if (element) {
                element[event] = handler;
            } else {
                console.warn(`Element not found: ${elementId}`);
            }
        };
        
        // Simple event binding (mobile CSS handles touch targets)
        safeBindEvent('scheduleTab', 'onclick', () => this.showScreen('schedule'));
        safeBindEvent('tasksTab', 'onclick', () => this.showScreen('tasks'));
        safeBindEvent('addTaskBtn', 'onclick', () => this.taskController.openTaskModal());
        safeBindEvent('cancelBtn', 'onclick', () => this.taskController.closeModal());
        
        // Date navigation controls
        safeBindEvent('prevDayBtn', 'onclick', () => this.previousDay());
        safeBindEvent('nextDayBtn', 'onclick', () => this.nextDay());
        safeBindEvent('todayBtn', 'onclick', () => this.goToToday());
        
        const datePicker = document.getElementById('datePicker');
        if (datePicker) {
            datePicker.onchange = (e) => {
                if (e.target.value) {
                    this.setDate(new Date(e.target.value));
                }
            };
        }
        
        const taskForm = document.getElementById('taskForm');
        if (taskForm) {
            taskForm.onsubmit = (e) => {
                const task = this.taskController.saveTask(e);
                if (task && window.app) {
                    window.app.saveAndRefresh();
                }
            };
        }
        
        const taskModal = document.getElementById('taskModal');
        if (taskModal) {
            taskModal.onclick = (e) => {
                if (e.target.id === 'taskModal') this.taskController.closeModal();
            };
        }
        
        // Task completion handler - using direct method calls for reliability
        const taskCompletionHandler = (e) => {
            this.handleTaskCompletion(e.detail);
        };
        
        document.addEventListener('taskCompletion', taskCompletionHandler);
        this.boundHandlers.taskCompletion = taskCompletionHandler;
    }

    handleTaskCompletion(detail) {
        try {
            const { taskId, date, completed } = detail;
            const task = this.scheduleCalculator.tasks.find(t => t.id === taskId);
            
            if (!task || !window.app?.storageController) return;
            
            // Mark this as a user interaction to prevent automatic refresh conflicts
            this.lastUserInteractionTime = Date.now();
            
            // Update completion state immediately and synchronously
            const dateStr = TimeUtils.formatDateKey(date);
            const completionKey = `${task.id}-${dateStr}`;
            
            if (completed) {
                // Update schedule calculator state immediately
                this.scheduleCalculator.completions[completionKey] = true;
                // Save to storage
                window.app.storageController.markTaskComplete(task, date);
            } else {
                // Update schedule calculator state immediately
                delete this.scheduleCalculator.completions[completionKey];
                // Save to storage
                window.app.storageController.markTaskIncomplete(task, date);
            }
            
            // Regenerate grid with updated completion state
            this.generateTimeGrid();
            
            DebugUtils.logTaskOperation(completed ? 'completed' : 'uncompleted', { 
                name: task.name, 
                date: dateStr,
                immediate: true 
            });
        } catch (error) {
            console.error('Error in handleTaskCompletion:', error);
        }
    }

    handleTaskEdit(detail) {
        const { taskId } = detail;
        const task = this.scheduleCalculator.tasks.find(t => t.id === taskId);
        
        if (task) {
            this.taskController.openTaskModal(task);
        }
    }

    showScreen(screenName) {
        // Safely remove active classes
        try {
            document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
            document.querySelectorAll('.screen').forEach(screenEl => screenEl.classList.remove('active'));
        } catch (e) {
            console.warn('Error updating navigation classes:', e);
        }
        
        if (screenName === 'schedule') {
            const scheduleTab = document.getElementById('scheduleTab');
            const scheduleScreen = document.getElementById('scheduleScreen');
            
            if (scheduleTab) scheduleTab.classList.add('active');
            if (scheduleScreen) scheduleScreen.classList.add('active');
            
            this.generateTimeGrid();
        } else {
            const tasksTab = document.getElementById('tasksTab');
            const tasksScreen = document.getElementById('tasksScreen');
            
            if (tasksTab) tasksTab.classList.add('active');
            if (tasksScreen) tasksScreen.classList.add('active');
            
            this.taskController.renderTaskList();
        }
    }

    updateTime() {
        const now = new Date();
        const timeString = now.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: true 
        });
        
        const currentTimeEl = document.getElementById('currentTime');
        if (currentTimeEl) currentTimeEl.textContent = timeString;
        
        // Update date display separately using selected date
        this.updateDateDisplay();
        
        const stableCurrentHour = TimeUtils.getStableCurrentHour();
        if (stableCurrentHour !== this.currentHour) {
            this.currentHour = stableCurrentHour;
            this.generateTimeGrid();
        }
    }

    generateTimeGrid() {
        const grid = document.getElementById('timeGrid');
        if (!grid) {
            console.warn('timeGrid element not found');
            return;
        }
        
        try {
            this.timeGridRenderer.setContainer(grid);
            
            const scheduleData = this.scheduleCalculator.calculateDaySchedule(this.currentDate);
            
            DebugUtils.logSchedule(scheduleData);
            
            this.timeGridRenderer.render(scheduleData);
        } catch (e) {
            console.error('Error generating time grid:', e);
            ErrorHandler.showNotification('Error updating schedule display', 'error', 3000);
        }
    }

    // Date navigation methods
    previousDay() {
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() - 1);
        this.setDate(newDate);
    }

    nextDay() {
        const newDate = new Date(this.currentDate);
        newDate.setDate(newDate.getDate() + 1);
        this.setDate(newDate);
    }

    goToToday() {
        this.setDate(new Date());
    }

    setDate(date) {
        this.currentDate = new Date(date);
        this.updateDateDisplay();
        this.generateTimeGrid();
    }

    regenerateUI() {
        this.generateTimeGrid();
        if (document.getElementById('tasksScreen').classList.contains('active')) {
            this.taskController.renderTaskList();
        }
    }

    updateDateDisplay() {
        const currentDateEl = document.getElementById('currentDate');
        if (currentDateEl) {
            const dateString = this.currentDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
            });
            currentDateEl.textContent = dateString;
        }
        
        // Keep date picker in sync
        const datePicker = document.getElementById('datePicker');
        if (datePicker) {
            const year = this.currentDate.getFullYear();
            const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
            const day = String(this.currentDate.getDate()).padStart(2, '0');
            datePicker.value = `${year}-${month}-${day}`;
        }
    }

    scheduleUpdates() {
        // Clear existing intervals to prevent duplicates
        this.destroy();
        
        this.intervals.push(setInterval(() => this.updateTime(), AppConfig.UPDATE_INTERVALS.TIME_UPDATE));
        this.intervals.push(setInterval(() => {
            // Don't auto-refresh if user recently interacted with completion state
            const timeSinceLastInteraction = Date.now() - this.lastUserInteractionTime;
            if (timeSinceLastInteraction >= 3000) {
                this.generateTimeGrid();
            }
        }, AppConfig.UPDATE_INTERVALS.GRID_REFRESH));
    }

    destroy() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        
        // Clean up document-level event listeners
        if (this.boundHandlers.taskCompletion) {
            document.removeEventListener('taskCompletion', this.boundHandlers.taskCompletion);
            delete this.boundHandlers.taskCompletion;
        }
    }
}

window.UIController = UIController;