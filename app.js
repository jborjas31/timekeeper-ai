// Pure scheduling logic - no DOM manipulation
class ScheduleEngine {
    constructor() {
        this.tasks = [];
        this.completions = {};
    }

    // Calculate complete day schedule with all metadata
    calculateDaySchedule(date = new Date()) {
        const dayData = {
            date: date,
            slots: this.createEmptySlots(),
            conflicts: [],
            gaps: [],
            stats: {
                totalTasks: 0,
                completedTasks: 0,
                requiredTasks: 0,
                overdueCount: 0
            }
        };

        // Generate all task instances for this day
        const taskInstances = this.generateAllTaskInstances(date);
        
        // Place tasks in time slots and detect conflicts
        taskInstances.forEach(instance => {
            this.placeTaskInSchedule(instance, dayData);
        });

        // Calculate gaps and statistics
        this.calculateGaps(dayData);
        this.calculateStats(dayData);

        return dayData;
    }

    createEmptySlots() {
        const slots = [];
        for (let hour = 0; hour < 24; hour++) {
            slots.push({
                hour: hour,
                tasks: [],
                hasConflict: false,
                utilizationPercent: 0
            });
        }
        return slots;
    }

    generateAllTaskInstances(date) {
        const instances = [];
        
        this.tasks.forEach(task => {
            if (this.shouldTaskOccurToday(task, date)) {
                const instance = this.createTaskInstance(task, date);
                if (instance) {
                    instances.push(instance);
                }
            }
        });

        return instances.sort((a, b) => a.startTime.hour - b.startTime.hour);
    }

    shouldTaskOccurToday(task, date) {
        switch (task.frequency) {
            case 'once': return this.isToday(date);
            case 'daily': return true;
            case 'weekly': return date.getDay() === 1; // Monday
            case 'monthly': return date.getDate() === 1;
            default: return false;
        }
    }

    createTaskInstance(task, date) {
        // Calculate actual start time considering dependencies
        const actualStartTime = this.calculateDependentTime(task, date);
        const originalTime = this.parseTaskTime(task.time);
        
        // Handle required task movement logic
        let finalStartTime = actualStartTime;
        let isMoved = false;
        
        if (task.required && !this.isTaskCompleted(task, date) && this.isToday(date)) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            if (currentHour > actualStartTime.hour || 
                (currentHour === actualStartTime.hour && currentMinute > actualStartTime.minute)) {
                finalStartTime = { hour: currentHour, minute: currentMinute };
                isMoved = true;
            }
        }

        return {
            id: `${task.id}-${date.toDateString()}`,
            taskId: task.id,
            name: task.name,
            startTime: finalStartTime,
            endTime: this.calculateEndTime(finalStartTime, task.duration),
            originalTime: originalTime,
            duration: task.duration,
            required: task.required,
            dependsOn: task.dependsOn,
            bufferTime: task.bufferTime || 5,
            date: date,
            completed: this.isTaskCompleted(task, date),
            overdue: isMoved,
            spans: this.calculateSpannedHours(finalStartTime, task.duration)
        };
    }

    calculateSpannedHours(startTime, duration) {
        const spans = [];
        let currentMinute = startTime.hour * 60 + startTime.minute;
        const endMinute = currentMinute + duration;
        
        while (currentMinute < endMinute) {
            const hour = Math.floor(currentMinute / 60) % 24;
            const minutesInThisHour = Math.min(60 - (currentMinute % 60), endMinute - currentMinute);
            
            spans.push({
                hour: hour,
                startMinute: currentMinute % 60,
                duration: minutesInThisHour,
                utilizationPercent: (minutesInThisHour / 60) * 100
            });
            
            currentMinute += minutesInThisHour;
        }
        
        return spans;
    }

    placeTaskInSchedule(instance, dayData) {
        instance.spans.forEach(span => {
            const slot = dayData.slots[span.hour];
            slot.tasks.push({
                ...instance,
                slotStartMinute: span.startMinute,
                slotDuration: span.duration,
                slotUtilization: span.utilizationPercent
            });
            
            slot.utilizationPercent += span.utilizationPercent;
            
            // Detect conflicts (more than 100% utilization)
            if (slot.utilizationPercent > 100) {
                slot.hasConflict = true;
                this.addConflict(dayData, span.hour, slot.tasks);
            }
        });
        
        dayData.stats.totalTasks++;
        if (instance.completed) dayData.stats.completedTasks++;
        if (instance.required) dayData.stats.requiredTasks++;
        if (instance.overdue) dayData.stats.overdueCount++;
    }

    addConflict(dayData, hour, conflictingTasks) {
        const existing = dayData.conflicts.find(c => c.hour === hour);
        if (!existing) {
            dayData.conflicts.push({
                hour: hour,
                tasks: conflictingTasks.map(t => ({
                    name: t.name,
                    startTime: t.startTime,
                    endTime: t.endTime
                })),
                severity: conflictingTasks.length
            });
        }
    }

    calculateGaps(dayData) {
        let gapStart = null;
        
        dayData.slots.forEach((slot, hour) => {
            if (slot.tasks.length === 0) {
                if (gapStart === null) gapStart = hour;
            } else {
                if (gapStart !== null) {
                    dayData.gaps.push({
                        startHour: gapStart,
                        endHour: hour - 1,
                        duration: hour - gapStart
                    });
                    gapStart = null;
                }
            }
        });
        
        // Handle gap at end of day
        if (gapStart !== null) {
            dayData.gaps.push({
                startHour: gapStart,
                endHour: 23,
                duration: 24 - gapStart
            });
        }
    }

    calculateStats(dayData) {
        const busySlots = dayData.slots.filter(slot => slot.tasks.length > 0).length;
        dayData.stats.busyHours = busySlots;
        dayData.stats.freeHours = 24 - busySlots;
        dayData.stats.conflictHours = dayData.conflicts.length;
        dayData.stats.completionRate = dayData.stats.totalTasks > 0 ? 
            (dayData.stats.completedTasks / dayData.stats.totalTasks * 100).toFixed(1) : 0;
    }

    calculateEndTime(startTime, duration) {
        const totalMinutes = startTime.hour * 60 + startTime.minute + duration;
        return {
            hour: Math.floor(totalMinutes / 60) % 24,
            minute: totalMinutes % 60
        };
    }

    // Helper methods (keeping existing logic)
    calculateDependentTime(task, date, depth = 0) {
        if (depth > 10) {
            console.warn('Dependency chain too deep, using original time for:', task.name);
            return this.parseTaskTime(task.time);
        }
        
        if (!task.dependsOn) {
            return this.parseTaskTime(task.time);
        }
        
        const parentTask = this.tasks.find(t => t.id === task.dependsOn);
        if (!parentTask) {
            return this.parseTaskTime(task.time);
        }
        
        const parentTime = this.calculateDependentTime(parentTask, date, depth + 1);
        const startMinutes = parentTime.hour * 60 + parentTime.minute + 
                           (parentTask.duration || 30) + (task.bufferTime || 5);
        
        const totalMinutes = startMinutes % (24 * 60);
        
        return {
            hour: Math.floor(totalMinutes / 60),
            minute: totalMinutes % 60
        };
    }

    parseTaskTime(timeString) {
        try {
            const parts = timeString.trim().split(' ');
            if (parts.length !== 2) throw new Error('Invalid time format');
            
            const [time, period] = parts;
            const timeParts = time.split(':');
            if (timeParts.length !== 2) throw new Error('Invalid time format');
            
            let hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            
            if (isNaN(hour) || isNaN(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) {
                throw new Error('Invalid time values');
            }
            
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
            
            return { hour, minute };
        } catch (e) {
            console.error('Error parsing time:', timeString, e);
            return { hour: 9, minute: 0 };
        }
    }

    isTaskCompleted(task, date) {
        const dateStr = this.formatDateKey(date);
        const completionKey = `${task.id}-${dateStr}`;
        return this.completions[completionKey] === true;
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }
}

// Clean visual rendering - no scheduling logic
class TimeGridRenderer {
    constructor() {
        this.container = null;
    }

    setContainer(element) {
        this.container = element;
    }

    render(scheduleData) {
        if (!this.container) return;
        
        this.container.innerHTML = '';
        
        scheduleData.slots.forEach((slot, hour) => {
            const slotElement = this.createSlotElement(slot, hour);
            this.container.appendChild(slotElement);
        });
    }

    createSlotElement(slot, hour) {
        const slotEl = document.createElement('div');
        slotEl.className = 'time-slot';
        
        // Add current hour highlighting
        if (hour === new Date().getHours()) {
            slotEl.classList.add('current');
        }
        
        // Add conflict indicator
        if (slot.hasConflict) {
            slotEl.classList.add('conflict');
        }
        
        // Create time label
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = this.formatHour(hour);
        
        // Create content area
        const content = document.createElement('div');
        content.className = 'time-content';
        
        // Add tasks to this slot
        slot.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            content.appendChild(taskElement);
        });
        
        // Add utilization indicator
        if (slot.utilizationPercent > 0) {
            slotEl.style.setProperty('--utilization', `${Math.min(100, slot.utilizationPercent)}%`);
        }
        
        slotEl.appendChild(timeLabel);
        slotEl.appendChild(content);
        
        return slotEl;
    }

    createTaskElement(task) {
        const element = document.createElement('div');
        element.className = 'slot-task';
        
        // Add status classes
        if (task.required) element.classList.add('required');
        else element.classList.add('optional');
        
        if (task.overdue) element.classList.add('overdue');
        if (task.completed) element.classList.add('completed');
        if (task.dependsOn) element.classList.add('has-dependency');
        
        // Create task content structure
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        taskInfo.textContent = task.name;
        
        const timeRange = document.createElement('div');
        timeRange.className = 'task-time-range';
        timeRange.textContent = `${this.formatTime(task.startTime)} - ${this.formatTime(task.endTime)}`;
        
        // Add dependency info if present
        if (task.dependsOn) {
            const dependencyInfo = document.createElement('div');
            dependencyInfo.className = 'task-dependency';
            dependencyInfo.textContent = `← linked task`;
            taskContent.appendChild(dependencyInfo);
        }
        
        taskContent.appendChild(taskInfo);
        taskContent.appendChild(timeRange);
        
        // Create completion button
        const completeBtn = document.createElement('button');
        completeBtn.className = 'complete-btn';
        completeBtn.innerHTML = task.completed ? '✓' : '○';
        completeBtn.title = task.completed ? 'Mark incomplete' : 'Mark complete';
        completeBtn.onclick = (e) => {
            e.stopPropagation();
            // Dispatch custom event for completion toggle
            const event = new CustomEvent('taskCompletion', {
                detail: { taskId: task.taskId, date: task.date, completed: task.completed }
            });
            document.dispatchEvent(event);
        };
        
        element.appendChild(completeBtn);
        element.appendChild(taskContent);
        
        return element;
    }

    formatHour(hour) {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    }

    formatTime(timeObj) {
        const { hour, minute } = timeObj;
        let displayHour = hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        
        if (hour === 0) displayHour = 12;
        else if (hour > 12) displayHour = hour - 12;
        
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    }
}

class TimeKeeper {
    constructor() {
        this.currentEditingId = null;
        this.currentHour = new Date().getHours();
        
        // Initialize new architecture components
        this.scheduleEngine = new ScheduleEngine();
        this.timeGridRenderer = new TimeGridRenderer();
        
        this.init();
    }

    init() {
        this.loadTasks();
        this.loadCompletions();
        this.bindEvents();
        this.updateTime();
        this.generateTimeGrid();
        this.scheduleUpdates();
    }

    bindEvents() {
        // Navigation
        document.getElementById('scheduleTab').onclick = () => this.showScreen('schedule');
        document.getElementById('tasksTab').onclick = () => this.showScreen('tasks');
        
        // Task management
        document.getElementById('addTaskBtn').onclick = () => this.openTaskModal();
        document.getElementById('cancelBtn').onclick = () => this.closeModal();
        document.getElementById('taskForm').onsubmit = (e) => this.saveTask(e);
        
        // Modal close on background click
        document.getElementById('taskModal').onclick = (e) => {
            if (e.target.id === 'taskModal') this.closeModal();
        };
        
        // Listen for task completion events from renderer
        document.addEventListener('taskCompletion', (e) => {
            this.handleTaskCompletion(e.detail);
        });
    }

    handleTaskCompletion(detail) {
        const { taskId, date, completed } = detail;
        const task = this.scheduleEngine.tasks.find(t => t.id === taskId);
        
        if (!task) return;
        
        if (completed) {
            this.markTaskIncomplete(task, date);
        } else {
            this.markTaskComplete(task, date);
        }
    }

    showScreen(screenName) {
        // Update navigation
        document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.screen').forEach(screenEl => screenEl.classList.remove('active'));
        
        if (screenName === 'schedule') {
            document.getElementById('scheduleTab').classList.add('active');
            document.getElementById('scheduleScreen').classList.add('active');
            this.generateTimeGrid();
        } else {
            document.getElementById('tasksTab').classList.add('active');
            document.getElementById('tasksScreen').classList.add('active');
            this.renderTaskList();
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
        
        document.getElementById('currentTime').textContent = timeString;
        document.getElementById('currentDate').textContent = dateString;
        
        // Update current hour if changed
        if (now.getHours() !== this.currentHour) {
            this.currentHour = now.getHours();
            this.generateTimeGrid();
        }
    }

    generateTimeGrid() {
        // Set up renderer with container
        const grid = document.getElementById('timeGrid');
        this.timeGridRenderer.setContainer(grid);
        
        // Get schedule data from engine
        const scheduleData = this.scheduleEngine.calculateDaySchedule(new Date());
        
        // Render the grid
        this.timeGridRenderer.render(scheduleData);
        
        // Optional: Log schedule insights for debugging
        if (scheduleData.conflicts.length > 0) {
            console.warn('Schedule conflicts detected:', scheduleData.conflicts);
        }
    }

    formatHour(hour) {
        if (hour === 0) return '12 AM';
        if (hour < 12) return `${hour} AM`;
        if (hour === 12) return '12 PM';
        return `${hour - 12} PM`;
    }

    formatTime(timeObj) {
        const { hour, minute } = timeObj;
        let displayHour = hour;
        const period = hour >= 12 ? 'PM' : 'AM';
        
        if (hour === 0) displayHour = 12;
        else if (hour > 12) displayHour = hour - 12;
        
        return `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`;
    }

    getTasksForHour(hour) {
        const today = new Date();
        const tasks = [];
        
        this.tasks.forEach(task => {
            const instances = this.generateTaskInstances(task, today);
            instances.forEach(instance => {
                if (instance.scheduledHour === hour) {
                    tasks.push({
                        ...task,
                        ...instance,
                        isOverdue: this.isTaskOverdue(instance, hour)
                    });
                }
            });
        });
        
        return tasks;
    }

    generateTaskInstances(task, date) {
        const instances = [];
        const taskTime = this.parseTaskTime(task.time);
        
        // Check if task should occur today based on frequency
        let shouldOccurToday = false;
        
        switch (task.frequency) {
            case 'once':
                shouldOccurToday = this.isToday(date);
                break;
            case 'daily':
                shouldOccurToday = true;
                break;
            case 'weekly':
                // For now, assume weekly tasks occur every Monday (we can make this configurable later)
                shouldOccurToday = date.getDay() === 1; // Monday = 1
                break;
            case 'monthly':
                // For now, assume monthly tasks occur on the 1st of each month
                shouldOccurToday = date.getDate() === 1;
                break;
        }
        
        if (shouldOccurToday) {
            // Calculate actual scheduled time considering dependencies
            const actualTime = this.calculateDependentTime(task, date);
            let scheduledHour = actualTime.hour;
            
            // Required task logic: if past scheduled time and not completed, move to current hour
            if (task.required && !this.isTaskCompleted(task, date) && this.isToday(date)) {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                
                // Move task if we're past the scheduled time
                if (currentHour > actualTime.hour || 
                    (currentHour === actualTime.hour && currentMinute > actualTime.minute)) {
                    scheduledHour = currentHour;
                }
            }
            
            instances.push({
                id: `${task.id}-${date.toDateString()}`,
                scheduledHour: scheduledHour,
                originalHour: taskTime.hour,
                date: date
            });
        }
        
        return instances;
    }

    parseTaskTime(timeString) {
        try {
            const parts = timeString.trim().split(' ');
            if (parts.length !== 2) {
                throw new Error('Invalid time format');
            }
            
            const [time, period] = parts;
            const timeParts = time.split(':');
            if (timeParts.length !== 2) {
                throw new Error('Invalid time format');
            }
            
            let hour = parseInt(timeParts[0]);
            const minute = parseInt(timeParts[1]);
            
            // Validate inputs
            if (isNaN(hour) || isNaN(minute) || hour < 1 || hour > 12 || minute < 0 || minute > 59) {
                throw new Error('Invalid time values');
            }
            
            if (period === 'PM' && hour !== 12) hour += 12;
            if (period === 'AM' && hour === 12) hour = 0;
            
            return { hour, minute };
        } catch (e) {
            console.error('Error parsing time:', timeString, e);
            // Return default time as fallback
            return { hour: 9, minute: 0 }; // 9:00 AM default
        }
    }

    isTaskOverdue(instance, currentDisplayHour) {
        const now = new Date();
        const currentHour = now.getHours();
        
        // Task is overdue if:
        // 1. It was moved from its original time (scheduledHour !== originalHour)
        // 2. AND we're displaying the current hour or later
        // 3. AND the current time is past the original scheduled time
        return (instance.scheduledHour !== instance.originalHour && 
                currentDisplayHour >= currentHour && 
                currentHour > instance.originalHour);
    }

    isTaskCompleted(task, date) {
        const dateStr = this.formatDateKey(date);
        const completionKey = `${task.id}-${dateStr}`;
        return this.completions[completionKey] === true;
    }

    markTaskComplete(task, date) {
        const dateStr = this.formatDateKey(date);
        const completionKey = `${task.id}-${dateStr}`;
        this.completions[completionKey] = true;
        this.saveCompletions();
        
        // Trigger dependent tasks to recalculate their times
        this.updateDependentTasks(task.id);
        
        this.generateTimeGrid(); // Refresh the display
    }

    updateDependentTasks(completedTaskId) {
        const dependentTasks = this.getDependentTasks(completedTaskId);
        
        dependentTasks.forEach(depTask => {
            // Recalculate timing for dependent tasks
            // This will be handled automatically by calculateDependentTime
            // when the grid regenerates, but we could add specific logic here
            console.log(`Task "${depTask.name}" can now be scheduled after completion of its dependency`);
        });
    }

    markTaskIncomplete(task, date) {
        const dateStr = this.formatDateKey(date);
        const completionKey = `${task.id}-${dateStr}`;
        delete this.completions[completionKey];
        this.saveCompletions();
        this.generateTimeGrid(); // Refresh the display
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    }

    // Dependency Management
    wouldCreateCycle(taskId, dependsOnId) {
        if (!dependsOnId || taskId === dependsOnId) return true;
        
        const visited = new Set();
        const stack = [dependsOnId];
        
        while (stack.length > 0) {
            const currentId = stack.pop();
            
            if (currentId === taskId) return true;
            if (visited.has(currentId)) continue;
            
            visited.add(currentId);
            
            const task = this.tasks.find(t => t.id === currentId);
            if (task && task.dependsOn) {
                stack.push(task.dependsOn);
            }
        }
        
        return false;
    }

    getDependentTasks(taskId) {
        return this.tasks.filter(task => task.dependsOn === taskId);
    }

    calculateDependentTime(task, date, depth = 0) {
        // Prevent infinite recursion with very deep chains
        if (depth > 10) {
            console.warn('Dependency chain too deep, using original time for:', task.name);
            return this.parseTaskTime(task.time);
        }
        
        if (!task.dependsOn) {
            return this.parseTaskTime(task.time);
        }
        
        const parentTask = this.tasks.find(t => t.id === task.dependsOn);
        if (!parentTask) {
            return this.parseTaskTime(task.time); // Fallback to original time
        }
        
        // Calculate parent's effective time (considering its own dependencies)
        const parentTime = this.calculateDependentTime(parentTask, date, depth + 1);
        
        // Schedule this task after parent's time + parent's duration + buffer
        const startMinutes = parentTime.hour * 60 + parentTime.minute + 
                           (parentTask.duration || 30) + (task.bufferTime || 5);
        
        // Handle day overflow gracefully
        const totalMinutes = startMinutes % (24 * 60);
        
        return {
            hour: Math.floor(totalMinutes / 60),
            minute: totalMinutes % 60
        };
    }

    isToday(date) {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    }

    createTaskElement(task) {
        const element = document.createElement('div');
        element.className = 'slot-task';
        
        if (task.required) {
            element.classList.add('required');
        } else {
            element.classList.add('optional');
        }
        
        if (task.isOverdue) {
            element.classList.add('overdue');
        }
        
        const isCompleted = this.isTaskCompleted(task, task.date);
        if (isCompleted) {
            element.classList.add('completed');
        }
        
        // Calculate start and end times
        const actualTime = this.calculateDependentTime(task, task.date);
        const startTime = this.formatTime(actualTime);
        const endMinutes = actualTime.hour * 60 + actualTime.minute + task.duration;
        const endTime = this.formatTime({
            hour: Math.floor(endMinutes / 60) % 24,
            minute: endMinutes % 60
        });
        
        // Create task content
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        // Create main task info
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        taskInfo.textContent = task.name;
        
        // Create time range
        const timeRange = document.createElement('div');
        timeRange.className = 'task-time-range';
        timeRange.textContent = `${startTime} - ${endTime}`;
        
        // Add dependency indicator
        if (task.dependsOn) {
            const parentTask = this.tasks.find(t => t.id === task.dependsOn);
            if (parentTask) {
                const dependencyInfo = document.createElement('div');
                dependencyInfo.className = 'task-dependency';
                dependencyInfo.textContent = `← after ${parentTask.name}`;
                taskContent.appendChild(dependencyInfo);
                element.classList.add('has-dependency');
            }
        }
        
        taskContent.appendChild(taskInfo);
        taskContent.appendChild(timeRange);
        
        // Create completion button
        const completeBtn = document.createElement('button');
        completeBtn.className = 'complete-btn';
        completeBtn.innerHTML = isCompleted ? '✓' : '○';
        completeBtn.title = isCompleted ? 'Mark incomplete' : 'Mark complete';
        completeBtn.onclick = (e) => {
            e.stopPropagation();
            if (isCompleted) {
                this.markTaskIncomplete(task, task.date);
            } else {
                this.markTaskComplete(task, task.date);
            }
        };
        
        element.appendChild(completeBtn);
        element.appendChild(taskContent);
        
        return element;
    }

    // Task Management
    openTaskModal(taskId = null) {
        this.currentEditingId = taskId;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        
        // Populate dependency options
        this.populateDependencyOptions(taskId);
        
        if (taskId) {
            const task = this.scheduleEngine.tasks.find(t => t.id === taskId);
            this.fillForm(task);
            document.getElementById('modalTitle').textContent = 'Edit Task';
        } else {
            form.reset();
            document.getElementById('modalTitle').textContent = 'Add Task';
            document.getElementById('taskRequired').checked = true;
            document.getElementById('taskBufferTime').value = 5;
        }
        
        modal.style.display = 'block';
    }

    closeModal() {
        document.getElementById('taskModal').style.display = 'none';
        this.currentEditingId = null;
        // Reset form to clear any values
        document.getElementById('taskForm').reset();
    }

    populateDependencyOptions(excludeTaskId) {
        const select = document.getElementById('taskDependsOn');
        select.innerHTML = '<option value="">No dependency</option>';
        
        this.scheduleEngine.tasks.forEach(task => {
            if (task.id !== excludeTaskId) {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.name;
                select.appendChild(option);
            }
        });
    }

    fillForm(task) {
        document.getElementById('taskName').value = task.name;
        document.getElementById('taskTime').value = this.convertTo24Hour(task.time);
        document.getElementById('taskDuration').value = task.duration;
        document.getElementById('taskFrequency').value = task.frequency;
        document.getElementById('taskRequired').checked = task.required;
        document.getElementById('taskDependsOn').value = task.dependsOn || '';
        document.getElementById('taskBufferTime').value = task.bufferTime || 5;
    }

    convertTo24Hour(time12h) {
        const [time, period] = time12h.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours);
        
        if (period === 'AM' && hours === 12) hours = 0;
        if (period === 'PM' && hours !== 12) hours += 12;
        
        return `${hours.toString().padStart(2, '0')}:${minutes}`;
    }

    saveTask(e) {
        e.preventDefault();
        
        // Get form values directly (more reliable than FormData)
        const name = document.getElementById('taskName').value.trim();
        const time = document.getElementById('taskTime').value;
        const duration = parseInt(document.getElementById('taskDuration').value);
        const frequency = document.getElementById('taskFrequency').value;
        const required = document.getElementById('taskRequired').checked;
        
        // Validation
        if (!name) {
            alert('Please enter a task name');
            return;
        }
        
        if (!time) {
            alert('Please select a time');
            return;
        }
        
        if (duration < 5 || duration > 480) {
            alert('Duration must be between 5 and 480 minutes');
            return;
        }
        
        const dependsOn = document.getElementById('taskDependsOn').value || null;
        const bufferTime = parseInt(document.getElementById('taskBufferTime').value) || 5;
        
        // Validate buffer time
        if (bufferTime < 0 || bufferTime > 60) {
            alert('Buffer time must be between 0 and 60 minutes');
            return;
        }
        
        // Validate dependency doesn't create a cycle
        if (dependsOn && this.wouldCreateCycle(this.currentEditingId || Date.now().toString(), dependsOn)) {
            alert('Cannot create dependency: this would create a circular dependency');
            return;
        }
        
        const task = {
            id: this.currentEditingId || Date.now().toString(),
            name: name,
            time: this.convertTo12Hour(time),
            duration: duration,
            frequency: frequency,
            required: required,
            dependsOn: dependsOn,
            bufferTime: bufferTime
        };
        
        if (this.currentEditingId) {
            const index = this.scheduleEngine.tasks.findIndex(t => t.id === this.currentEditingId);
            this.scheduleEngine.tasks[index] = task;
        } else {
            this.scheduleEngine.tasks.push(task);
        }
        
        this.saveTasks();
        this.closeModal();
        this.generateTimeGrid();
        // Also refresh the task list if we're on that screen
        if (document.getElementById('tasksScreen').classList.contains('active')) {
            this.renderTaskList();
        }
    }

    convertTo12Hour(time24h) {
        let [hours, minutes] = time24h.split(':');
        hours = parseInt(hours);
        
        const period = hours >= 12 ? 'PM' : 'AM';
        if (hours === 0) hours = 12;
        if (hours > 12) hours -= 12;
        
        return `${hours}:${minutes} ${period}`;
    }

    deleteTask(taskId) {
        // Check if other tasks depend on this one
        const dependentTasks = this.getDependentTasks(taskId);
        
        let confirmMessage = 'Delete this task?';
        if (dependentTasks.length > 0) {
            const dependentNames = dependentTasks.map(t => t.name).join(', ');
            confirmMessage = `Delete this task? The following tasks depend on it and will revert to their original times: ${dependentNames}`;
        }
        
        if (confirm(confirmMessage)) {
            // Remove the task
            this.scheduleEngine.tasks = this.scheduleEngine.tasks.filter(t => t.id !== taskId);
            
            // Clean up any dependencies pointing to this task
            this.scheduleEngine.tasks.forEach(task => {
                if (task.dependsOn === taskId) {
                    task.dependsOn = null;
                }
            });
            
            this.saveTasks();
            this.renderTaskList();
            this.generateTimeGrid();
        }
    }

    renderTaskList() {
        const container = document.getElementById('taskList');
        
        if (this.scheduleEngine.tasks.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">No tasks yet. Add your first task!</p>';
            return;
        }
        
        container.innerHTML = this.scheduleEngine.tasks.map(task => {
            let dependencyInfo = '';
            if (task.dependsOn) {
                const parentTask = this.scheduleEngine.tasks.find(t => t.id === task.dependsOn);
                if (parentTask) {
                    dependencyInfo = ` • depends on "${parentTask.name}"`;
                }
            }
            
            return `
                <div class="task-item ${task.dependsOn ? 'has-dependency' : ''}">
                    <div class="task-info">
                        <h3>${task.name} ${task.dependsOn ? '🔗' : ''}</h3>
                        <p>${task.time} • ${task.duration} min • ${task.frequency} • ${task.required ? 'Required' : 'Optional'}${dependencyInfo}</p>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" onclick="app.openTaskModal('${task.id}')">Edit</button>
                        <button class="delete-btn" onclick="app.deleteTask('${task.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Data persistence with sync to ScheduleEngine
    saveTasks() {
        try {
            localStorage.setItem('timekeeper-tasks', JSON.stringify(this.scheduleEngine.tasks));
        } catch (e) {
            console.error('Error saving tasks:', e);
            alert('Could not save tasks. Storage may be full.');
        }
    }

    loadTasks() {
        try {
            const saved = localStorage.getItem('timekeeper-tasks');
            if (saved) {
                const tasks = JSON.parse(saved);
                // Validate loaded data and set defaults for new fields
                this.scheduleEngine.tasks = tasks.filter(task => 
                    task.id && task.name && task.time && task.duration && task.frequency !== undefined
                ).map(task => ({
                    ...task,
                    dependsOn: task.dependsOn || null,
                    bufferTime: task.bufferTime || 5
                }));
            } else {
                this.scheduleEngine.tasks = [];
            }
        } catch (e) {
            console.error('Error loading tasks:', e);
            this.scheduleEngine.tasks = [];
            alert('Could not load saved tasks. Starting fresh.');
        }
    }

    loadCompletions() {
        try {
            const saved = localStorage.getItem('timekeeper-completions');
            if (saved) {
                this.scheduleEngine.completions = JSON.parse(saved);
                // Clean up old completions (older than 30 days)
                this.cleanOldCompletions();
            } else {
                this.scheduleEngine.completions = {};
            }
        } catch (e) {
            console.error('Error loading completions:', e);
            this.scheduleEngine.completions = {};
        }
    }

    saveCompletions() {
        try {
            localStorage.setItem('timekeeper-completions', JSON.stringify(this.scheduleEngine.completions));
        } catch (e) {
            console.error('Error saving completions:', e);
        }
    }

    cleanOldCompletions() {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const cutoffDate = this.formatDateKey(thirtyDaysAgo);
        
        Object.keys(this.scheduleEngine.completions).forEach(key => {
            const dateStr = key.split('-').slice(-3).join('-'); // Get YYYY-MM-DD part
            if (dateStr < cutoffDate) {
                delete this.scheduleEngine.completions[key];
            }
        });
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    // Helper methods for compatibility
    getDependentTasks(taskId) {
        return this.scheduleEngine.tasks.filter(task => task.dependsOn === taskId);
    }

    wouldCreateCycle(taskId, dependsOnId) {
        if (!dependsOnId || taskId === dependsOnId) return true;
        
        const visited = new Set();
        const stack = [dependsOnId];
        
        while (stack.length > 0) {
            const currentId = stack.pop();
            
            if (currentId === taskId) return true;
            if (visited.has(currentId)) continue;
            
            visited.add(currentId);
            
            const task = this.scheduleEngine.tasks.find(t => t.id === currentId);
            if (task && task.dependsOn) {
                stack.push(task.dependsOn);
            }
        }
        
        return false;
    }

    markTaskComplete(task, date) {
        const dateStr = this.formatDateKey(date);
        const completionKey = `${task.id}-${dateStr}`;
        this.scheduleEngine.completions[completionKey] = true;
        this.saveCompletions();
        this.generateTimeGrid();
    }

    markTaskIncomplete(task, date) {
        const dateStr = this.formatDateKey(date);
        const completionKey = `${task.id}-${dateStr}`;
        delete this.scheduleEngine.completions[completionKey];
        this.saveCompletions();
        this.generateTimeGrid();
    }

    scheduleUpdates() {
        // Update time every minute
        setInterval(() => this.updateTime(), 60000);
        
        // Regenerate grid every 5 minutes to update task positions
        // (More frequent updates to ensure required tasks move properly)
        setInterval(() => this.generateTimeGrid(), 300000);
    }
}

// Initialize app
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TimeKeeper();
});