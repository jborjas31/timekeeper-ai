class SimpleTimeGridRenderer {
    constructor() {
        this.container = null;
        this.eventListeners = []; // Track event listeners for cleanup
    }

    setContainer(element) {
        this.container = element;
    }

    render(scheduleData) {
        if (!this.container) return;
        
        // Cleanup previous event listeners
        this.cleanup();
        
        this.container.innerHTML = '';
        
        // Create simple table structure
        const table = document.createElement('table');
        table.className = 'simple-time-grid';
        table.style.cssText = `
            width: 100%;
            border-collapse: collapse;
            font-family: monospace;
            font-size: 14px;
        `;
        
        scheduleData.slots.forEach((slot, hour) => {
            const row = this.createTimeSlotRow(slot, hour);
            table.appendChild(row);
        });
        
        this.container.appendChild(table);
    }

    createTimeSlotRow(slot, hour) {
        const row = document.createElement('tr');
        const isCurrentHour = hour === TimeUtils.getStableCurrentHour();
        
        if (isCurrentHour) {
            row.style.backgroundColor = '#e0f2fe';
        }
        
        // Time column
        const timeCell = document.createElement('td');
        timeCell.style.cssText = `
            padding: 8px;
            border: 1px solid #ddd;
            font-weight: bold;
            width: 80px;
            text-align: center;
            background: #f5f5f5;
        `;
        timeCell.textContent = TimeUtils.formatHourLabel(hour);
        
        // Tasks column
        const tasksCell = document.createElement('td');
        tasksCell.style.cssText = `
            padding: 8px;
            border: 1px solid #ddd;
            min-height: 40px;
            vertical-align: top;
        `;
        
        if (slot.tasks.length === 0) {
            tasksCell.innerHTML = '<span style="color: #999; font-style: italic;">— free —</span>';
        } else {
            const tasksContainer = document.createElement('div');
            slot.tasks.forEach(task => {
                const taskElement = this.createSimpleTaskElement(task);
                tasksContainer.appendChild(taskElement);
            });
            tasksCell.appendChild(tasksContainer);
        }
        
        // Utilization indicator
        if (slot.utilizationPercent > 0) {
            const utilizationBar = document.createElement('div');
            utilizationBar.style.cssText = `
                height: 3px;
                background: linear-gradient(to right, 
                    #22c55e 0%, 
                    #22c55e ${Math.min(100, slot.utilizationPercent)}%, 
                    #e5e7eb ${Math.min(100, slot.utilizationPercent)}%);
                margin-top: 4px;
            `;
            tasksCell.appendChild(utilizationBar);
        }
        
        row.appendChild(timeCell);
        row.appendChild(tasksCell);
        
        return row;
    }

    createSimpleTaskElement(task) {
        // Validate required task properties
        if (!task || !task.taskId || !task.name) {
            console.error('❌ Invalid task object:', task);
            return document.createElement('div'); // Return empty div as fallback
        }
        
        const container = document.createElement('div');
        container.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 4px 8px;
            margin: 2px 0;
            border-radius: 4px;
            background: ${task.completed ? '#dcfce7' : (task.required ? '#fef3c7' : '#f1f5f9')};
            border-left: 3px solid ${task.completed ? '#22c55e' : (task.required ? '#f59e0b' : '#64748b')};
        `;
        
        // Completion checkbox
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.style.cssText = `
            cursor: pointer;
            width: 18px;
            height: 18px;
            margin: 2px;
            touch-action: manipulation;
        `;
        
        // Touch feedback handled by CSS
        
        const changeHandler = (e) => {
            e.stopPropagation();
            const isCompleted = e.target.checked;
            
            // Visual feedback and haptic response
            
            // Find the name element for visual updates
            const nameElement = container.querySelector('div > div:first-child');
            this.updateTaskVisualState(container, nameElement, isCompleted, task.required);
            
            // Add haptic feedback for supported devices
            if (navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            // Dispatch the completion event with proper date handling
            const completionDate = task.date || new Date();
            const eventDetail = { 
                taskId: task.taskId, 
                date: completionDate, 
                completed: isCompleted,
                timestamp: Date.now()
            };
            
            // Direct method call - more reliable than events
            if (window.app && window.app.uiController && window.app.uiController.handleTaskCompletion) {
                window.app.uiController.handleTaskCompletion(eventDetail);
            } else {
                console.error('UI Controller not available for task completion');
            }
        };
        
        checkbox.addEventListener('change', changeHandler);
        this.eventListeners.push({ element: checkbox, event: 'change', handler: changeHandler });
        
        // Task info
        const info = document.createElement('div');
        info.style.cssText = 'flex: 1; min-width: 0;';
        
        const name = document.createElement('div');
        name.style.cssText = `
            font-weight: ${task.required ? 'bold' : 'normal'};
            color: ${task.completed ? '#16a34a' : '#374151'};
            text-decoration: ${task.completed ? 'line-through' : 'none'};
        `;
        name.textContent = task.name;
        
        const timeRange = document.createElement('div');
        timeRange.style.cssText = 'font-size: 11px; color: #6b7280;';
        timeRange.textContent = `${TimeUtils.format12Hour(task.startTime)} - ${TimeUtils.format12Hour(task.endTime)}`;
        
        info.appendChild(name);
        info.appendChild(timeRange);
        
        // Edit button
        const editBtn = document.createElement('button');
        editBtn.textContent = '✏️';
        editBtn.style.cssText = `
            background: none;
            border: 1px solid transparent;
            cursor: pointer;
            font-size: 14px;
            padding: 6px 8px;
            border-radius: 4px;
            min-width: 32px;
            min-height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            touch-action: manipulation;
            transition: all 0.15s ease;
        `;
        editBtn.title = 'Edit task';
        
        const clickHandler = (e) => {
            e.stopPropagation();
            const actualTask = window.app.scheduleCalculator.tasks.find(t => t.id === task.taskId);
            if (actualTask) {
                window.app.taskController.openTaskModal(actualTask);
            }
        };
        
        editBtn.addEventListener('click', clickHandler);
        this.eventListeners.push({ element: editBtn, event: 'click', handler: clickHandler });
        
        container.appendChild(checkbox);
        container.appendChild(info);
        container.appendChild(editBtn);
        
        return container;
    }

    updateTaskVisualState(container, nameElement, isCompleted, isRequired = true) {
        if (!container || !container.parentNode || !nameElement || !nameElement.parentNode) {
            return;
        }
        
        try {
            if (isCompleted) {
                container.style.background = '#dcfce7';
                container.style.borderLeft = '3px solid #22c55e';
            } else {
                container.style.background = isRequired ? '#fef3c7' : '#f1f5f9';
                container.style.borderLeft = `3px solid ${isRequired ? '#f59e0b' : '#64748b'}`;
            }
            
            nameElement.style.color = isCompleted ? '#16a34a' : '#374151';
            nameElement.style.textDecoration = isCompleted ? 'line-through' : 'none';
        } catch (error) {
            console.error('Error updating visual state:', error);
        }
    }

    cleanup() {
        // Remove all tracked event listeners
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

window.SimpleTimeGridRenderer = SimpleTimeGridRenderer;