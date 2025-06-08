# Tasks Page Redesign Implementation Plan

## Goal
Reorganize the Tasks page into three sections: Recurring Tasks, One-off Tasks (grouped by date), and Completed Tasks (collapsible, last 7 days).

## Final Layout Design

```
RECURRING TASKS (3)
├── Daily: Morning routine, Exercise  
├── Weekly: Grocery shopping
└── Monthly: Bill review

ONE-OFF TASKS (5)
├── TODAY (2)
│   ├── Doctor appointment (2:00 PM)
│   └── Call dentist (4:30 PM)
├── TOMORROW (1)
│   └── Team meeting (10:00 AM)
└── FUTURE (2)
│   ├── Jan 15: Project deadline
│   └── Jan 20: Birthday party

▼ COMPLETED TASKS (4) - Last 7 Days
├── Exercise (completed 2 hours ago)
├── Morning routine (completed today 8:00 AM)
└── Grocery shopping (completed yesterday)
```

## Implementation Steps

### 1. Data Structure Updates

**File: js/controllers/storage-controller.js**
- Change completion tracking from boolean to timestamp object
- Update `markTaskComplete()` method:
  ```javascript
  // Before: completions[key] = true
  // After: completions[key] = { completed: true, completedAt: Date.now() }
  ```
- Ensure backward compatibility with existing boolean completions

### 2. TaskController Logic Updates

**File: js/controllers/task-controller.js**

**Update `renderTaskList()` method:**

```javascript
renderTaskList() {
    const container = document.getElementById('taskList');
    if (!container) return;

    // Group tasks
    const recurringTasks = this.scheduleCalculator.tasks.filter(t => t.frequency !== 'once');
    const oneOffTasks = this.scheduleCalculator.tasks.filter(t => t.frequency === 'once');
    const completedTasks = this.getCompletedTasksLast7Days();
    
    // Filter out completed one-off tasks
    const activeOneOffTasks = oneOffTasks.filter(t => !this.isTaskCompleted(t));
    
    // Group one-off tasks by date
    const today = activeOneOffTasks.filter(t => this.isTaskToday(t));
    const tomorrow = activeOneOffTasks.filter(t => this.isTaskTomorrow(t));
    const future = activeOneOffTasks.filter(t => this.isTaskFuture(t));
    
    // Render sections
    container.innerHTML = [
        this.renderRecurringSection(recurringTasks),
        this.renderOneOffSection(today, tomorrow, future),
        this.renderCompletedSection(completedTasks)
    ].join('');
}
```

**Add helper methods:**
```javascript
getCompletedTasksLast7Days() {
    // Get completed tasks from last 7 days, sorted by completion time (recent first)
}

isTaskToday(task) {
    // Check if task.scheduledDate is today
}

isTaskTomorrow(task) {
    // Check if task.scheduledDate is tomorrow  
}

isTaskFuture(task) {
    // Check if task.scheduledDate is after tomorrow
}

renderRecurringSection(tasks) {
    // Render recurring tasks section with header
}

renderOneOffSection(today, tomorrow, future) {
    // Render one-off tasks grouped by date with sub-headers
}

renderCompletedSection(tasks) {
    // Render collapsible completed tasks section
}
```

### 3. CSS Updates

**File: styles.css**

**Add section styling:**
```css
.task-section {
    margin-bottom: 2rem;
}

.task-section-header {
    background: #f8fafc;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    font-weight: 600;
    color: #374151;
    border: 1px solid #e2e8f0;
    margin-bottom: 0.75rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.task-section-count {
    background: #6366f1;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
}

.task-subsection {
    margin-left: 1rem;
    margin-bottom: 1rem;
}

.task-subsection-header {
    font-size: 0.9rem;
    font-weight: 600;
    color: #64748b;
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.completed-section {
    border-top: 1px solid #e2e8f0;
    padding-top: 1.5rem;
}

.completed-section.collapsed .task-list {
    display: none;
}

.completed-toggle {
    background: none;
    border: none;
    color: #64748b;
    cursor: pointer;
    font-size: 0.9rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.completed-task-item {
    opacity: 0.7;
    background: #f9fafb;
}

.completion-time {
    font-size: 0.75rem;
    color: #9ca3af;
    font-style: italic;
}
```

### 4. JavaScript for Collapsible Section

**File: js/controllers/task-controller.js**

**Add toggle functionality:**
```javascript
bindCompletedSectionToggle() {
    const toggleBtn = document.getElementById('completedToggle');
    if (toggleBtn) {
        toggleBtn.onclick = () => {
            const section = document.getElementById('completedSection');
            if (section) {
                section.classList.toggle('collapsed');
                const arrow = toggleBtn.querySelector('.arrow');
                if (arrow) {
                    arrow.textContent = section.classList.contains('collapsed') ? '▶' : '▼';
                }
            }
        };
    }
}
```

### 5. Backward Compatibility

**Ensure existing data works:**
- Check if completion data is boolean or object
- Convert boolean `true` to `{ completed: true, completedAt: null }`
- Handle null completedAt gracefully in sorting

### 6. Mobile Optimization

**Responsive considerations:**
- Touch-friendly section headers
- Adequate spacing between sections
- Collapsible sections work well on mobile
- Clear visual hierarchy

## Testing Checklist

- [ ] Recurring tasks appear in correct section
- [ ] One-off tasks group by date correctly
- [ ] Completed section is collapsible
- [ ] Completed tasks show last 7 days only
- [ ] Completion timestamps work correctly
- [ ] Existing tasks still display properly
- [ ] Mobile layout looks good
- [ ] Edit/delete buttons still work in all sections

## Files to Modify

1. `js/controllers/task-controller.js` - Main logic updates
2. `js/controllers/storage-controller.js` - Completion data structure
3. `styles.css` - Section styling
4. Test thoroughly on mobile and desktop

## Notes

- Keep existing Tasks tab behavior (show all tasks)
- Maintain all existing functionality (edit, delete, etc.)
- No changes to Schedule tab or time grid
- Focus on clean, scannable mobile-friendly design