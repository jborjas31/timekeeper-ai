class UIController {
    constructor(scheduleCalculator, timeGridRenderer, taskController) {
        this.scheduleCalculator = scheduleCalculator;
        this.timeGridRenderer = timeGridRenderer;
        this.taskController = taskController;
        this.currentHour = TimeUtils.getStableCurrentHour();
        this.intervals = [];
        this.boundHandlers = {};
    }

    bindEvents() {
        // Helper function to safely bind events
        const safeBindEvent = (elementId, event, handler) => {
            const element = document.getElementById(elementId);
            if (element) {
                element[event] = handler;
            } else {
                console.warn(`Element not found: ${elementId}`);
            }
        };
        
        safeBindEvent('scheduleTab', 'onclick', () => this.showScreen('schedule'));
        safeBindEvent('tasksTab', 'onclick', () => this.showScreen('tasks'));
        safeBindEvent('addTaskBtn', 'onclick', () => this.taskController.openTaskModal());
        safeBindEvent('cancelBtn', 'onclick', () => this.taskController.closeModal());
        
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
        
        // Task completion handler
        const taskCompletionHandler = (e) => {
            this.handleTaskCompletion(e.detail);
        };
        
        document.addEventListener('taskCompletion', taskCompletionHandler);
        this.boundHandlers.taskCompletion = taskCompletionHandler;
    }

    handleTaskCompletion(detail) {
        const { taskId, date, completed } = detail;
        const task = this.scheduleCalculator.tasks.find(t => t.id === taskId);
        
        if (!task || !window.app?.storageController) return;
        
        if (completed) {
            window.app.storageController.markTaskComplete(task, date);
        } else {
            window.app.storageController.markTaskIncomplete(task, date);
        }
        
        this.generateTimeGrid();
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
        const dateString = now.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric'
        });
        
        const currentTimeEl = document.getElementById('currentTime');
        const currentDateEl = document.getElementById('currentDate');
        
        if (currentTimeEl) currentTimeEl.textContent = timeString;
        if (currentDateEl) currentDateEl.textContent = dateString;
        
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
            
            const scheduleData = this.scheduleCalculator.calculateDaySchedule(new Date());
            
            DebugUtils.logSchedule(scheduleData);
            
            this.timeGridRenderer.render(scheduleData);
        } catch (e) {
            console.error('Error generating time grid:', e);
            ErrorHandler.showNotification('Error updating schedule display', 'error', 3000);
        }
    }

    scheduleUpdates() {
        // Clear existing intervals to prevent duplicates
        this.destroy();
        
        this.intervals.push(setInterval(() => this.updateTime(), AppConfig.UPDATE_INTERVALS.TIME_UPDATE));
        this.intervals.push(setInterval(() => this.generateTimeGrid(), AppConfig.UPDATE_INTERVALS.GRID_REFRESH));
    }

    destroy() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals = [];
        
        if (this.boundHandlers.taskCompletion) {
            document.removeEventListener('taskCompletion', this.boundHandlers.taskCompletion);
            delete this.boundHandlers.taskCompletion;
        }
        if (this.boundHandlers.taskEdit) {
            document.removeEventListener('taskEdit', this.boundHandlers.taskEdit);
            delete this.boundHandlers.taskEdit;
        }
    }
}

window.UIController = UIController;