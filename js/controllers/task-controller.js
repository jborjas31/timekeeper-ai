class TaskController {
    constructor(scheduleCalculator) {
        this.scheduleCalculator = scheduleCalculator;
        this.currentEditingId = null;
    }

    openTaskModal(taskId = null) {
        this.currentEditingId = taskId;
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        
        this.populateDependencyOptions(taskId);
        
        if (taskId) {
            const task = this.scheduleCalculator.tasks.find(t => t.id === taskId);
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
        document.getElementById('taskForm').reset();
    }

    populateDependencyOptions(excludeTaskId) {
        const select = document.getElementById('taskDependsOn');
        if (!select) {
            console.warn('taskDependsOn element not found');
            return;
        }
        
        select.innerHTML = '<option value="">No dependency</option>';
        
        this.scheduleCalculator.tasks.forEach(task => {
            if (task.id !== excludeTaskId) {
                const option = document.createElement('option');
                option.value = task.id;
                option.textContent = task.name;
                select.appendChild(option);
            }
        });
    }

    fillForm(task) {
        const safeSetValue = (elementId, value) => {
            const element = document.getElementById(elementId);
            if (element) {
                if (element.type === 'checkbox') {
                    element.checked = value;
                } else {
                    element.value = value;
                }
            } else {
                console.warn(`Form element not found: ${elementId}`);
            }
        };
        
        safeSetValue('taskName', task.name);
        safeSetValue('taskTime', TimeUtils.convertTo24Hour(task.time));
        safeSetValue('taskDuration', task.duration);
        safeSetValue('taskFrequency', task.frequency);
        safeSetValue('taskRequired', task.required);
        safeSetValue('taskDependsOn', task.dependsOn || '');
        safeSetValue('taskBufferTime', task.bufferTime || AppConfig.SCHEDULE.DEFAULT_BUFFER_TIME);
    }

    saveTask(e) {
        e.preventDefault();
        
        const name = document.getElementById('taskName').value.trim();
        const time = document.getElementById('taskTime').value;
        const duration = parseInt(document.getElementById('taskDuration').value);
        const frequency = document.getElementById('taskFrequency').value;
        const required = document.getElementById('taskRequired').checked;
        const dependsOn = document.getElementById('taskDependsOn').value || null;
        const bufferTime = parseInt(document.getElementById('taskBufferTime').value) || AppConfig.SCHEDULE.DEFAULT_BUFFER_TIME;
        
        const taskData = { name, time, duration, bufferTime };
        const validation = ValidationUtils.validateTaskData(taskData);
        
        if (!validation.valid) {
            ErrorHandler.showNotification(validation.error, 'error');
            return null;
        }
        
        if (dependsOn && this.wouldCreateCycle(this.currentEditingId || ValidationUtils.generateTaskId(), dependsOn)) {
            ErrorHandler.showNotification('Cannot create dependency: this would create a circular dependency', 'error');
            return null;
        }
        
        const task = {
            id: this.currentEditingId || ValidationUtils.generateTaskId(),
            name: name,
            time: TimeUtils.convertTo12Hour(time),
            duration: duration,
            frequency: frequency,
            required: required,
            dependsOn: dependsOn,
            bufferTime: bufferTime
        };
        
        // Only add createdDate for new tasks (avoid undefined values)
        if (!this.currentEditingId) {
            task.createdDate = new Date().toISOString();
        }
        
        DebugUtils.logTaskOperation(this.currentEditingId ? 'updated' : 'created', task);
        
        if (this.currentEditingId) {
            const index = this.scheduleCalculator.tasks.findIndex(t => t.id === this.currentEditingId);
            this.scheduleCalculator.tasks[index] = task;
        } else {
            this.scheduleCalculator.tasks.push(task);
        }
        
        this.closeModal();
        return task;
    }

    deleteTask(taskId) {
        const dependentTasks = this.getDependentTasks(taskId);
        
        let confirmMessage = 'Delete this task?';
        if (dependentTasks.length > 0) {
            const dependentNames = dependentTasks.map(t => t.name).join(', ');
            confirmMessage = `Delete this task? The following tasks depend on it and will revert to their original times: ${dependentNames}`;
        }
        
        return new Promise((resolve) => {
            ErrorHandler.showConfirmDialog(
                confirmMessage,
                () => {
                    this.scheduleCalculator.tasks = this.scheduleCalculator.tasks.filter(t => t.id !== taskId);
                    
                    this.scheduleCalculator.tasks.forEach(task => {
                        if (task.dependsOn === taskId) {
                            task.dependsOn = null;
                        }
                    });
                    
                    ErrorHandler.showNotification('Task deleted successfully', 'success', 3000);
                    resolve(true);
                },
                () => resolve(false)
            );
        });
    }

    renderTaskList() {
        const container = document.getElementById('taskList');
        if (!container) {
            console.warn('taskList element not found');
            return;
        }
        
        if (this.scheduleCalculator.tasks.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 2rem;">No tasks yet. Add your first task!</p>';
            return;
        }
        
        container.innerHTML = this.scheduleCalculator.tasks.map(task => {
            let dependencyInfo = '';
            if (task.dependsOn) {
                const parentTask = this.scheduleCalculator.tasks.find(t => t.id === task.dependsOn);
                if (parentTask) {
                    dependencyInfo = ` • depends on "${ValidationUtils.sanitizeHTML(parentTask.name)}"`;
                }
            }
            
            return `
                <div class="task-item ${task.dependsOn ? 'has-dependency' : ''}">
                    <div class="task-info">
                        <h3>${ValidationUtils.sanitizeHTML(task.name)} ${task.dependsOn ? '🔗' : ''}</h3>
                        <p>${task.time} • ${task.duration} min • ${task.frequency} • ${task.required ? 'Required' : 'Optional'}${dependencyInfo}</p>
                    </div>
                    <div class="task-actions">
                        <button class="edit-btn" onclick="app.taskController.openTaskModal('${ValidationUtils.escapeForAttribute(task.id)}'); app.regenerateUI();">Edit</button>
                        <button class="delete-btn" onclick="app.taskController.deleteTask('${ValidationUtils.escapeForAttribute(task.id)}').then(deleted => { if(deleted) app.saveAndRefresh(); })">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }

    getDependentTasks(taskId) {
        return this.scheduleCalculator.tasks.filter(task => task.dependsOn === taskId);
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
            
            const task = this.scheduleCalculator.tasks.find(t => t.id === currentId);
            if (task && task.dependsOn) {
                stack.push(task.dependsOn);
            }
        }
        
        return false;
    }
}

window.TaskController = TaskController;