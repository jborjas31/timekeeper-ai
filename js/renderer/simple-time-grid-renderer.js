class SimpleTimeGridRenderer {
    constructor() {
        this.container = null;
    }

    setContainer(element) {
        this.container = element;
    }

    render(scheduleData) {
        if (!this.container) return;
        
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
        checkbox.style.cssText = 'cursor: pointer;';
        
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            const isCompleted = e.target.checked;
            
            this.updateTaskVisualState(container, name, isCompleted, task.required);
            
            const event = new CustomEvent('taskCompletion', {
                detail: { 
                    taskId: task.taskId, 
                    date: task.date, 
                    completed: isCompleted 
                }
            });
            document.dispatchEvent(event);
        });
        
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
            border: none;
            cursor: pointer;
            font-size: 12px;
            padding: 2px 4px;
            border-radius: 2px;
        `;
        editBtn.title = 'Edit task';
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const actualTask = window.app.scheduleCalculator.tasks.find(t => t.id === task.taskId);
            if (actualTask) {
                window.app.taskController.openTaskModal(actualTask);
            }
        });
        
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
        // No complex cleanup needed for simple renderer
    }

    destroy() {
        this.cleanup();
        this.container = null;
    }
}

window.SimpleTimeGridRenderer = SimpleTimeGridRenderer;