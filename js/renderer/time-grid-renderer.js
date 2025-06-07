class TimeGridRenderer {
    constructor() {
        this.container = null;
        this.eventListeners = [];
    }

    setContainer(element) {
        this.container = element;
    }

    render(scheduleData) {
        if (!this.container) return;
        
        // Clean up previous event listeners
        this.cleanup();
        
        this.container.innerHTML = '';
        
        scheduleData.slots.forEach((slot, hour) => {
            const slotElement = this.createSlotElement(slot, hour);
            this.container.appendChild(slotElement);
        });
    }

    createSlotElement(slot, hour) {
        const slotEl = document.createElement('div');
        slotEl.className = 'time-slot';
        
        if (hour === TimeUtils.getStableCurrentHour()) {
            slotEl.classList.add('current');
        }
        
        if (slot.hasConflict) {
            slotEl.classList.add('conflict');
        }
        
        const timeLabel = document.createElement('div');
        timeLabel.className = 'time-label';
        timeLabel.textContent = TimeUtils.formatHourLabel(hour);
        
        const content = document.createElement('div');
        content.className = 'time-content';
        
        slot.tasks.forEach(task => {
            const taskElement = this.createTaskElement(task);
            content.appendChild(taskElement);
        });
        
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
        
        if (task.required) element.classList.add('required');
        else element.classList.add('optional');
        
        if (task.overdue) element.classList.add('overdue');
        if (task.completed) element.classList.add('completed');
        if (task.dependsOn) element.classList.add('has-dependency');
        
        const taskContent = document.createElement('div');
        taskContent.className = 'task-content';
        
        const taskInfo = document.createElement('div');
        taskInfo.className = 'task-info';
        taskInfo.textContent = task.name;
        
        const timeRange = document.createElement('div');
        timeRange.className = 'task-time-range';
        timeRange.textContent = `${TimeUtils.format12Hour(task.startTime)} - ${TimeUtils.format12Hour(task.endTime)}`;
        
        if (task.dependsOn) {
            const dependencyInfo = document.createElement('div');
            dependencyInfo.className = 'task-dependency';
            dependencyInfo.textContent = `← linked task`;
            taskContent.appendChild(dependencyInfo);
        }
        
        taskContent.appendChild(taskInfo);
        taskContent.appendChild(timeRange);
        
        const completeBtn = document.createElement('button');
        completeBtn.className = 'complete-btn';
        completeBtn.innerHTML = task.completed ? '✓' : '○';
        completeBtn.title = task.completed ? 'Mark incomplete' : 'Mark complete';
        
        const clickHandler = (e) => {
            e.stopPropagation();
            const event = new CustomEvent('taskCompletion', {
                detail: { taskId: task.taskId, date: task.date, completed: !task.completed }
            });
            document.dispatchEvent(event);
        };
        
        completeBtn.onclick = clickHandler;
        
        // Store reference for cleanup
        this.eventListeners.push({
            element: completeBtn,
            event: 'click',
            handler: clickHandler
        });
        
        element.appendChild(completeBtn);
        element.appendChild(taskContent);
        
        return element;
    }

    cleanup() {
        // Remove all stored event listeners
        this.eventListeners.forEach(({ element, event, handler }) => {
            if (element && element.removeEventListener) {
                element.removeEventListener(event, handler);
            }
        });
        this.eventListeners = [];
    }

    destroy() {
        this.cleanup();
        this.container = null;
    }
}

window.TimeGridRenderer = TimeGridRenderer;