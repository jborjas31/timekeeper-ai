class ScheduleCalculator {
    constructor() {
        this.tasks = [];
        this.completions = {};
    }

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

        const taskInstances = this.generateAllTaskInstances(date);
        
        taskInstances.forEach(instance => {
            this.placeTaskInSchedule(instance, dayData);
        });

        this.calculateGaps(dayData);
        this.calculateStats(dayData);

        return dayData;
    }

    createEmptySlots() {
        const slots = [];
        for (let hour = 0; hour < AppConfig.SCHEDULE.HOURS_PER_DAY; hour++) {
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

        return instances.sort((a, b) => {
            const timeA = a.startTime.hour * 60 + a.startTime.minute;
            const timeB = b.startTime.hour * 60 + b.startTime.minute;
            return timeA - timeB;
        });
    }

    shouldTaskOccurToday(task, date) {
        switch (task.frequency) {
            case AppConfig.TASK_FREQUENCIES.ONCE: 
                return TimeUtils.isToday(date);
            case AppConfig.TASK_FREQUENCIES.DAILY: 
                return true;
            case AppConfig.TASK_FREQUENCIES.WEEKLY: 
                return this.shouldWeeklyTaskOccur(task, date);
            case AppConfig.TASK_FREQUENCIES.MONTHLY: 
                return this.shouldMonthlyTaskOccur(task, date);
            default: 
                console.warn('Unknown task frequency:', task.frequency);
                return false;
        }
    }

    shouldWeeklyTaskOccur(task, date) {
        // If task has specific weekday preference, use it
        if (task.weekday !== undefined && task.weekday !== null) {
            return date.getDay() === task.weekday;
        }
        
        // For backward compatibility, if no weekday specified:
        // - Show weekly tasks on the day they were created (stored in task.createdDate)
        // - If no creation date, default to Monday (day 1)
        if (task.createdDate) {
            try {
                const createdDate = new Date(task.createdDate);
                return date.getDay() === createdDate.getDay();
            } catch (e) {
                console.warn('Invalid createdDate for task:', task.name);
            }
        }
        
        // Default to Monday for backward compatibility
        return date.getDay() === 1;
    }

    shouldMonthlyTaskOccur(task, date) {
        // If task has specific monthly pattern, use it
        if (task.monthlyPattern) {
            return this.evaluateMonthlyPattern(task, date);
        }
        
        // For backward compatibility, if no pattern specified:
        // - Show monthly tasks on the same date they were created
        // - If no creation date, default to 1st of month
        if (task.createdDate) {
            try {
                const createdDate = new Date(task.createdDate);
                return date.getDate() === createdDate.getDate();
            } catch (e) {
                console.warn('Invalid createdDate for task:', task.name);
            }
        }
        
        // Default to 1st of month for backward compatibility
        return date.getDate() === 1;
    }

    evaluateMonthlyPattern(task, date) {
        const pattern = task.monthlyPattern;
        
        switch (pattern.type) {
            case AppConfig.MONTHLY_PATTERNS.FIRST:
                return date.getDate() === 1;
                
            case AppConfig.MONTHLY_PATTERNS.LAST:
                // Check if this is the last day of the month
                const nextDay = new Date(date);
                nextDay.setDate(date.getDate() + 1);
                return nextDay.getMonth() !== date.getMonth();
                
            case AppConfig.MONTHLY_PATTERNS.DATE:
                // Specific date of month (handle months with fewer days)
                const targetDate = Math.min(pattern.date, this.getDaysInMonth(date));
                return date.getDate() === targetDate;
                
            case AppConfig.MONTHLY_PATTERNS.WEEKDAY:
                // Specific weekday occurrence (e.g., "first Monday", "third Friday")
                return this.isNthWeekdayOfMonth(date, pattern.weekday, pattern.occurrence);
                
            default:
                console.warn('Unknown monthly pattern type:', pattern.type);
                return false;
        }
    }

    getDaysInMonth(date) {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    }

    isNthWeekdayOfMonth(date, targetWeekday, occurrence) {
        // Check if date is the nth occurrence of targetWeekday in its month
        if (date.getDay() !== targetWeekday) return false;
        
        const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
        const firstTargetWeekday = new Date(firstOfMonth);
        
        // Find first occurrence of target weekday
        while (firstTargetWeekday.getDay() !== targetWeekday) {
            firstTargetWeekday.setDate(firstTargetWeekday.getDate() + 1);
        }
        
        // Calculate which occurrence this date represents
        const daysDiff = date.getDate() - firstTargetWeekday.getDate();
        const currentOccurrence = Math.floor(daysDiff / 7) + 1;
        
        return currentOccurrence === occurrence;
    }

    createTaskInstance(task, date) {
        const actualStartTime = this.calculateDependentTime(task, date);
        const originalTime = TimeUtils.parse12Hour(task.time);
        
        let finalStartTime = actualStartTime;
        let isMoved = false;
        
        if (task.required && !this.isTaskCompleted(task, date) && TimeUtils.isToday(date)) {
            const now = new Date();
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const currentSeconds = now.getSeconds();
            
            // Calculate current time in minutes for comparison
            const currentTimeInMinutes = currentHour * 60 + currentMinute + (currentSeconds > 0 ? 1 : 0);
            const scheduledTimeInMinutes = actualStartTime.hour * 60 + actualStartTime.minute;
            
            if (currentTimeInMinutes > scheduledTimeInMinutes) {
                // Round up to next minute if we have seconds
                let adjustedMinute = currentSeconds > 0 ? currentMinute + 1 : currentMinute;
                let adjustedHour = currentHour;
                
                if (adjustedMinute >= 60) {
                    adjustedMinute = adjustedMinute - 60;
                    adjustedHour = currentHour + 1;
                }
                
                if (adjustedHour >= 24) {
                    adjustedHour = 0;
                }
                
                finalStartTime = { hour: adjustedHour, minute: adjustedMinute };
                isMoved = true;
            }
        }

        return {
            id: `${task.id}-${date.toDateString()}`,
            taskId: task.id,
            name: task.name,
            startTime: finalStartTime,
            endTime: TimeUtils.addMinutes(finalStartTime, task.duration),
            originalTime: originalTime,
            duration: task.duration,
            required: task.required,
            dependsOn: task.dependsOn,
            bufferTime: task.bufferTime || AppConfig.SCHEDULE.DEFAULT_BUFFER_TIME,
            date: date,
            completed: this.isTaskCompleted(task, date),
            overdue: isMoved,
            spans: this.calculateSpannedHours(finalStartTime, task.duration)
        };
    }

    calculateSpannedHours(startTime, duration) {
        const spans = [];
        let currentMinute = TimeUtils.timeToMinutes(startTime);
        const endMinute = currentMinute + duration;
        
        while (currentMinute < endMinute) {
            const hour = Math.floor(currentMinute / AppConfig.SCHEDULE.MINUTES_PER_HOUR) % AppConfig.SCHEDULE.HOURS_PER_DAY;
            
            // Validate hour is within bounds
            if (hour < 0 || hour >= AppConfig.SCHEDULE.HOURS_PER_DAY) {
                console.error('Hour calculation out of bounds:', hour, 'currentMinute:', currentMinute);
                break; // Exit to prevent array bounds violation
            }
            
            const minutesInThisHour = Math.min(
                AppConfig.SCHEDULE.MINUTES_PER_HOUR - (currentMinute % AppConfig.SCHEDULE.MINUTES_PER_HOUR), 
                endMinute - currentMinute
            );
            
            // Validate minutesInThisHour is positive
            if (minutesInThisHour <= 0) {
                console.error('Invalid minutesInThisHour:', minutesInThisHour);
                break;
            }
            
            // Use integer math to avoid floating point precision errors
            const utilizationPercent = Math.round((minutesInThisHour * 100) / AppConfig.SCHEDULE.MINUTES_PER_HOUR * 100) / 100;
            
            spans.push({
                hour: hour,
                startMinute: currentMinute % AppConfig.SCHEDULE.MINUTES_PER_HOUR,
                duration: minutesInThisHour,
                utilizationPercent: utilizationPercent
            });
            
            currentMinute += minutesInThisHour;
        }
        
        return spans;
    }

    placeTaskInSchedule(instance, dayData) {
        instance.spans.forEach(span => {
            // Validate hour is within bounds
            if (span.hour < 0 || span.hour >= dayData.slots.length) {
                console.error('Invalid hour in span:', span.hour, 'slots length:', dayData.slots.length);
                return; // Skip this span to prevent array bounds violation
            }
            
            const slot = dayData.slots[span.hour];
            if (!slot) {
                console.error('Slot not found for hour:', span.hour);
                return;
            }
            
            slot.tasks.push({
                ...instance,
                slotStartMinute: span.startMinute,
                slotDuration: span.duration,
                slotUtilization: span.utilizationPercent
            });
            
            slot.utilizationPercent += span.utilizationPercent;
            
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
            Math.round((dayData.stats.completedTasks / dayData.stats.totalTasks * 100) * 10) / 10 : 0;
    }

    calculateDependentTime(task, date, depth = 0, visited = new Set()) {
        if (depth > AppConfig.SCHEDULE.MAX_DEPENDENCY_DEPTH) {
            console.warn('Dependency chain too deep, using original time for:', task.name);
            return TimeUtils.parse12Hour(task.time);
        }
        
        // Check for circular dependency
        if (visited.has(task.id)) {
            console.error('Circular dependency detected for task:', task.name, 'visited:', Array.from(visited));
            return TimeUtils.parse12Hour(task.time);
        }
        
        if (!task.dependsOn) {
            return TimeUtils.parse12Hour(task.time);
        }
        
        const parentTask = this.tasks.find(t => t.id === task.dependsOn);
        if (!parentTask) {
            console.warn('Parent task not found for dependency:', task.dependsOn, 'in task:', task.name);
            return TimeUtils.parse12Hour(task.time);
        }
        
        // Add current task to visited set
        const newVisited = new Set(visited);
        newVisited.add(task.id);
        
        const parentTime = this.calculateDependentTime(parentTask, date, depth + 1, newVisited);
        const parentDuration = parentTask.duration || AppConfig.SCHEDULE.DEFAULT_DURATION;
        const bufferTime = task.bufferTime || AppConfig.SCHEDULE.DEFAULT_BUFFER_TIME;
        
        return TimeUtils.addMinutes(parentTime, parentDuration + bufferTime);
    }

    isTaskCompleted(task, date) {
        const dateStr = TimeUtils.formatDateKey(date);
        const completionKey = `${task.id}-${dateStr}`;
        return this.completions[completionKey] === true;
    }
}

window.ScheduleCalculator = ScheduleCalculator;