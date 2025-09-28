// Smart Study Planner App
class StudyPlanner {
    constructor() {
        this.tasks = JSON.parse(localStorage.getItem('studyTasks')) || [];
        this.schedules = JSON.parse(localStorage.getItem('studySchedules')) || [];
        this.goals = JSON.parse(localStorage.getItem('studyGoals')) || [];
        this.studySessions = JSON.parse(localStorage.getItem('studySessions')) || [];
        
        this.currentTab = 'dashboard';
        this.currentFilter = 'all';
        this.currentDate = new Date();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.renderDashboard();
        this.showTab('dashboard');
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Tab navigation
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const tab = e.target.closest('.tab-button').dataset.tab;
                this.showTab(tab);
            });
        });

        // Task management
        document.getElementById('addTaskBtn').addEventListener('click', () => this.showTaskModal());
        document.getElementById('taskForm').addEventListener('submit', (e) => this.saveTask(e));
        document.getElementById('cancelTask').addEventListener('click', () => this.hideModal('taskModal'));

        // Schedule management
        document.getElementById('addScheduleBtn').addEventListener('click', () => this.showScheduleModal());
        document.getElementById('scheduleForm').addEventListener('submit', (e) => this.saveSchedule(e));
        document.getElementById('cancelSchedule').addEventListener('click', () => this.hideModal('scheduleModal'));

        // Goal management
        document.getElementById('addGoalBtn').addEventListener('click', () => this.showGoalModal());
        document.getElementById('goalForm').addEventListener('submit', (e) => this.saveGoal(e));
        document.getElementById('cancelGoal').addEventListener('click', () => this.hideModal('goalModal'));

        // Task filters
        document.querySelectorAll('.filter-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const filter = e.target.dataset.filter;
                this.setTaskFilter(filter);
            });
        });

        // Calendar navigation
        document.getElementById('prevMonth').addEventListener('click', () => this.changeMonth(-1));
        document.getElementById('nextMonth').addEventListener('click', () => this.changeMonth(1));

        // Modal close buttons
        document.querySelectorAll('.close').forEach(button => {
            button.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                this.hideModal(modal.id);
            });
        });

        // Close modal on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }

    // Tab Management
    showTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load tab-specific content
        switch(tabName) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'tasks':
                this.renderTasks();
                break;
            case 'schedule':
                this.renderSchedule();
                this.renderCalendar();
                break;
            case 'goals':
                this.renderGoals();
                break;
        }
    }

    // Dashboard Methods
    renderDashboard() {
        this.renderTodayTasks();
        this.renderProgressOverview();
        this.renderStudyTime();
        this.renderStudyStreak();
    }

    renderTodayTasks() {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = this.tasks.filter(task => task.dueDate === today);
        
        const container = document.getElementById('todayTasks');
        if (todayTasks.length === 0) {
            container.innerHTML = '<p>No tasks due today</p>';
            return;
        }

        container.innerHTML = todayTasks.map(task => `
            <div class="task-summary-item">
                <div class="task-summary-title">${task.title}</div>
                <div class="task-summary-subject">${task.subject || 'General'}</div>
            </div>
        `).join('');
    }

    renderProgressOverview() {
        const totalTasks = this.tasks.length;
        const completedTasks = this.tasks.filter(task => task.completed).length;
        const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        document.getElementById('completedProgress').style.width = `${percentage}%`;
        document.getElementById('completedPercent').textContent = `${percentage}%`;
    }

    renderStudyTime() {
        const today = new Date().toISOString().split('T')[0];
        const todaySessions = this.studySessions.filter(session => 
            session.date === today
        );
        
        const totalMinutes = todaySessions.reduce((sum, session) => sum + session.duration, 0);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;
        
        document.querySelector('#studyTime .time-display').textContent = `${hours}h ${minutes}m`;
    }

    renderStudyStreak() {
        // Calculate study streak (simplified version)
        let streak = 0;
        const today = new Date();
        
        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateStr = checkDate.toISOString().split('T')[0];
            
            const hasStudy = this.studySessions.some(session => session.date === dateStr);
            if (hasStudy) {
                streak++;
            } else if (i > 0) {
                break;
            }
        }
        
        document.querySelector('.streak-number').textContent = streak;
    }

    // Task Management
    showTaskModal(task = null) {
        const modal = document.getElementById('taskModal');
        const form = document.getElementById('taskForm');
        const title = document.getElementById('taskModalTitle');
        
        if (task) {
            title.textContent = 'Edit Task';
            document.getElementById('taskTitle').value = task.title;
            document.getElementById('taskDescription').value = task.description || '';
            document.getElementById('taskSubject').value = task.subject || '';
            document.getElementById('taskDueDate').value = task.dueDate;
            document.getElementById('taskPriority').value = task.priority;
            form.dataset.editId = task.id;
        } else {
            title.textContent = 'Add New Task';
            form.reset();
            delete form.dataset.editId;
        }
        
        modal.style.display = 'block';
    }

    saveTask(e) {
        e.preventDefault();
        const form = e.target;
        const editId = form.dataset.editId;
        
        const taskData = {
            id: editId || Date.now().toString(),
            title: document.getElementById('taskTitle').value,
            description: document.getElementById('taskDescription').value,
            subject: document.getElementById('taskSubject').value,
            dueDate: document.getElementById('taskDueDate').value,
            priority: document.getElementById('taskPriority').value,
            completed: false,
            createdAt: new Date().toISOString()
        };

        if (editId) {
            const index = this.tasks.findIndex(task => task.id === editId);
            if (index !== -1) {
                this.tasks[index] = { ...this.tasks[index], ...taskData };
            }
        } else {
            this.tasks.push(taskData);
        }

        this.saveTasks();
        this.hideModal('taskModal');
        this.renderTasks();
        this.renderDashboard();
    }

    deleteTask(taskId) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.tasks = this.tasks.filter(task => task.id !== taskId);
            this.saveTasks();
            this.renderTasks();
            this.renderDashboard();
        }
    }

    toggleTask(taskId) {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.completed = !task.completed;
            this.saveTasks();
            this.renderTasks();
            this.renderDashboard();
        }
    }

    setTaskFilter(filter) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-filter="${filter}"]`).classList.add('active');
        this.currentFilter = filter;
        this.renderTasks();
    }

    renderTasks() {
        const container = document.getElementById('taskList');
        let filteredTasks = this.tasks;

        // Apply filter
        switch(this.currentFilter) {
            case 'pending':
                filteredTasks = this.tasks.filter(task => !task.completed);
                break;
            case 'completed':
                filteredTasks = this.tasks.filter(task => task.completed);
                break;
            case 'overdue':
                const today = new Date().toISOString().split('T')[0];
                filteredTasks = this.tasks.filter(task => 
                    !task.completed && task.dueDate < today
                );
                break;
        }

        if (filteredTasks.length === 0) {
            container.innerHTML = '<div class="no-tasks">No tasks found</div>';
            return;
        }

        container.innerHTML = filteredTasks.map(task => {
            const isOverdue = !task.completed && task.dueDate < new Date().toISOString().split('T')[0];
            const taskClass = task.completed ? 'completed' : (isOverdue ? 'overdue' : '');
            
            return `
                <div class="task-item ${taskClass}">
                    <div class="task-header-row">
                        <div class="task-info">
                            <div class="task-title">${task.title}</div>
                            <div class="task-meta">
                                <span><i class="fas fa-book"></i> ${task.subject || 'General'}</span>
                                <span><i class="fas fa-calendar"></i> ${this.formatDate(task.dueDate)}</span>
                                <span class="priority-badge priority-${task.priority}">
                                    ${task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                                </span>
                            </div>
                        </div>
                    </div>
                    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
                    <div class="task-actions">
                        <button class="btn btn-sm ${task.completed ? 'btn-secondary' : 'btn-success'}" 
                                onclick="studyPlanner.toggleTask('${task.id}')">
                            <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i>
                            ${task.completed ? 'Undo' : 'Complete'}
                        </button>
                        <button class="btn btn-sm btn-primary" 
                                onclick="studyPlanner.showTaskModal(${JSON.stringify(task).replace(/"/g, '&quot;')})">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-sm btn-danger" 
                                onclick="studyPlanner.deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Schedule Management
    showScheduleModal(schedule = null) {
        const modal = document.getElementById('scheduleModal');
        const form = document.getElementById('scheduleForm');
        const title = document.getElementById('scheduleModalTitle');
        
        if (schedule) {
            title.textContent = 'Edit Schedule';
            document.getElementById('scheduleTitle').value = schedule.title;
            document.getElementById('scheduleSubject').value = schedule.subject || '';
            document.getElementById('scheduleDate').value = schedule.date;
            document.getElementById('scheduleTime').value = schedule.time;
            document.getElementById('scheduleDuration').value = schedule.duration;
            form.dataset.editId = schedule.id;
        } else {
            title.textContent = 'Add Schedule';
            form.reset();
            delete form.dataset.editId;
        }
        
        modal.style.display = 'block';
    }

    saveSchedule(e) {
        e.preventDefault();
        const form = e.target;
        const editId = form.dataset.editId;
        
        const scheduleData = {
            id: editId || Date.now().toString(),
            title: document.getElementById('scheduleTitle').value,
            subject: document.getElementById('scheduleSubject').value,
            date: document.getElementById('scheduleDate').value,
            time: document.getElementById('scheduleTime').value,
            duration: parseInt(document.getElementById('scheduleDuration').value),
            createdAt: new Date().toISOString()
        };

        if (editId) {
            const index = this.schedules.findIndex(schedule => schedule.id === editId);
            if (index !== -1) {
                this.schedules[index] = { ...this.schedules[index], ...scheduleData };
            }
        } else {
            this.schedules.push(scheduleData);
        }

        this.saveSchedules();
        this.hideModal('scheduleModal');
        this.renderSchedule();
        this.renderCalendar();
    }

    deleteSchedule(scheduleId) {
        if (confirm('Are you sure you want to delete this schedule?')) {
            this.schedules = this.schedules.filter(schedule => schedule.id !== scheduleId);
            this.saveSchedules();
            this.renderSchedule();
            this.renderCalendar();
        }
    }

    renderSchedule() {
        const container = document.getElementById('scheduleList');
        const today = new Date().toISOString().split('T')[0];
        const upcomingSchedules = this.schedules
            .filter(schedule => schedule.date >= today)
            .sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));

        if (upcomingSchedules.length === 0) {
            container.innerHTML = '<div class="no-schedules">No upcoming schedules</div>';
            return;
        }

        container.innerHTML = upcomingSchedules.map(schedule => `
            <div class="schedule-item">
                <div class="schedule-time">
                    ${this.formatDate(schedule.date)} at ${this.formatTime(schedule.time)} 
                    (${schedule.duration} min)
                </div>
                <div class="schedule-title">${schedule.title}</div>
                ${schedule.subject ? `<div class="schedule-subject">${schedule.subject}</div>` : ''}
                <div class="task-actions">
                    <button class="btn btn-sm btn-primary" 
                            onclick="studyPlanner.showScheduleModal(${JSON.stringify(schedule).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="studyPlanner.deleteSchedule('${schedule.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Calendar Management
    renderCalendar() {
        const calendar = document.getElementById('calendar');
        const monthYear = document.getElementById('currentMonth');
        
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());
        
        monthYear.textContent = this.currentDate.toLocaleDateString('en-US', { 
            month: 'long', 
            year: 'numeric' 
        });

        let calendarHTML = '';
        
        // Day headers
        const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        dayHeaders.forEach(day => {
            calendarHTML += `<div class="day-header">${day}</div>`;
        });

        // Calendar days
        const currentDate = new Date(startDate);
        for (let i = 0; i < 42; i++) {
            const dateStr = currentDate.toISOString().split('T')[0];
            const isCurrentMonth = currentDate.getMonth() === this.currentDate.getMonth();
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            const hasSchedule = this.schedules.some(schedule => schedule.date === dateStr);
            
            const classes = [
                'calendar-day',
                !isCurrentMonth ? 'other-month' : '',
                isToday ? 'today' : '',
                hasSchedule ? 'has-schedule' : ''
            ].filter(Boolean).join(' ');

            calendarHTML += `<div class="${classes}">${currentDate.getDate()}</div>`;
            currentDate.setDate(currentDate.getDate() + 1);
        }

        calendar.innerHTML = calendarHTML;
    }

    changeMonth(direction) {
        this.currentDate.setMonth(this.currentDate.getMonth() + direction);
        this.renderCalendar();
    }

    // Goal Management
    showGoalModal(goal = null) {
        const modal = document.getElementById('goalModal');
        const form = document.getElementById('goalForm');
        const title = document.getElementById('goalModalTitle');
        
        if (goal) {
            title.textContent = 'Edit Goal';
            document.getElementById('goalTitle').value = goal.title;
            document.getElementById('goalDescription').value = goal.description || '';
            document.getElementById('goalCategory').value = goal.category;
            document.getElementById('goalTarget').value = goal.targetDate;
            document.getElementById('goalProgress').value = goal.progress;
            form.dataset.editId = goal.id;
        } else {
            title.textContent = 'Add New Goal';
            form.reset();
            delete form.dataset.editId;
        }
        
        modal.style.display = 'block';
    }

    saveGoal(e) {
        e.preventDefault();
        const form = e.target;
        const editId = form.dataset.editId;
        
        const goalData = {
            id: editId || Date.now().toString(),
            title: document.getElementById('goalTitle').value,
            description: document.getElementById('goalDescription').value,
            category: document.getElementById('goalCategory').value,
            targetDate: document.getElementById('goalTarget').value,
            progress: parseInt(document.getElementById('goalProgress').value),
            createdAt: new Date().toISOString()
        };

        if (editId) {
            const index = this.goals.findIndex(goal => goal.id === editId);
            if (index !== -1) {
                this.goals[index] = { ...this.goals[index], ...goalData };
            }
        } else {
            this.goals.push(goalData);
        }

        this.saveGoals();
        this.hideModal('goalModal');
        this.renderGoals();
    }

    deleteGoal(goalId) {
        if (confirm('Are you sure you want to delete this goal?')) {
            this.goals = this.goals.filter(goal => goal.id !== goalId);
            this.saveGoals();
            this.renderGoals();
        }
    }

    updateGoalProgress(goalId, progress) {
        const goal = this.goals.find(goal => goal.id === goalId);
        if (goal) {
            goal.progress = Math.max(0, Math.min(100, progress));
            this.saveGoals();
            this.renderGoals();
        }
    }

    renderGoals() {
        const container = document.getElementById('goalsList');
        
        if (this.goals.length === 0) {
            container.innerHTML = '<div class="no-goals">No goals set yet</div>';
            return;
        }

        container.innerHTML = this.goals.map(goal => `
            <div class="goal-item">
                <div class="goal-header-row">
                    <div class="goal-info">
                        <div class="goal-title">${goal.title}</div>
                        <div class="goal-category">${goal.category}</div>
                    </div>
                </div>
                ${goal.description ? `<div class="goal-description">${goal.description}</div>` : ''}
                <div class="goal-progress">
                    <div class="goal-progress-label">
                        <span>Progress</span>
                        <span>${goal.progress}%</span>
                    </div>
                    <div class="goal-progress-bar">
                        <div class="goal-progress-fill" style="width: ${goal.progress}%"></div>
                    </div>
                </div>
                <div class="goal-date">
                    Target: ${this.formatDate(goal.targetDate)}
                </div>
                <div class="task-actions">
                    <button class="btn btn-sm btn-success" 
                            onclick="studyPlanner.updateGoalProgress('${goal.id}', ${Math.min(100, goal.progress + 10)})">
                        <i class="fas fa-plus"></i> +10%
                    </button>
                    <button class="btn btn-sm btn-primary" 
                            onclick="studyPlanner.showGoalModal(${JSON.stringify(goal).replace(/"/g, '&quot;')})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-sm btn-danger" 
                            onclick="studyPlanner.deleteGoal('${goal.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Utility Methods
    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }

    formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    formatTime(timeString) {
        const [hours, minutes] = timeString.split(':');
        const date = new Date();
        date.setHours(parseInt(hours), parseInt(minutes));
        return date.toLocaleTimeString('en-US', { 
            hour: 'numeric', 
            minute: '2-digit',
            hour12: true 
        });
    }

    // Local Storage Methods
    saveTasks() {
        localStorage.setItem('studyTasks', JSON.stringify(this.tasks));
    }

    saveSchedules() {
        localStorage.setItem('studySchedules', JSON.stringify(this.schedules));
    }

    saveGoals() {
        localStorage.setItem('studyGoals', JSON.stringify(this.goals));
    }

    saveStudySessions() {
        localStorage.setItem('studySessions', JSON.stringify(this.studySessions));
    }

    // Study Session Tracking
    addStudySession(duration, subject = 'General') {
        const session = {
            id: Date.now().toString(),
            date: new Date().toISOString().split('T')[0],
            duration: duration, // in minutes
            subject: subject,
            createdAt: new Date().toISOString()
        };
        
        this.studySessions.push(session);
        this.saveStudySessions();
        this.renderDashboard();
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.studyPlanner = new StudyPlanner();
});

// Add some sample data for demonstration (remove in production)
if (!localStorage.getItem('studyTasks')) {
    const sampleTasks = [
        {
            id: '1',
            title: 'Review Chapter 5: Data Structures',
            description: 'Go through arrays, linked lists, and stacks',
            subject: 'Computer Science',
            dueDate: new Date().toISOString().split('T')[0],
            priority: 'high',
            completed: false,
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            title: 'Complete Math Assignment',
            description: 'Solve problems 1-20 from textbook',
            subject: 'Mathematics',
            dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            priority: 'medium',
            completed: false,
            createdAt: new Date().toISOString()
        }
    ];
    localStorage.setItem('studyTasks', JSON.stringify(sampleTasks));
}

if (!localStorage.getItem('studyGoals')) {
    const sampleGoals = [
        {
            id: '1',
            title: 'Complete Web Development Course',
            description: 'Finish the full-stack web development course by end of semester',
            category: 'skill',
            targetDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            progress: 45,
            createdAt: new Date().toISOString()
        }
    ];
    localStorage.setItem('studyGoals', JSON.stringify(sampleGoals));
}