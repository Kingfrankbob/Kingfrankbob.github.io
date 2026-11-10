// State Management
let appData = {
    tasks: JSON.parse(localStorage.getItem('hub_tasks')) || [
        { id: 't1', title: 'Calculus Problem Set #4', category: 'Math', priority: 'High', dueDate: '2026-03-30', completed: false, updatedAt: Date.now() },
        { id: 't2', title: 'History Essay Draft', category: 'Humanities', priority: 'Medium', dueDate: '2026-04-02', completed: true, updatedAt: Date.now() }
    ],
    workouts: JSON.parse(localStorage.getItem('hub_workouts')) || [
        { id: 'w1', name: 'Barbell Bench Press', weight: 135, sets: 3, reps: 8, date: '2026-03-25', updatedAt: Date.now() },
        { id: 'w2', name: 'Barbell Squat', weight: 185, sets: 3, reps: 5, date: '2026-03-26', updatedAt: Date.now() }
    ],
    schedule: JSON.parse(localStorage.getItem('hub_schedule')) || [
        { id: 's1', title: 'Physics Midterm Exam', date: '2026-04-05', time: '10:00', completed: false, updatedAt: Date.now() }
    ]
};

let scriptUrl = localStorage.getItem('hub_script_url') || '';
let canvasDomain = localStorage.getItem('hub_canvas_domain') || '';
let canvasToken = localStorage.getItem('hub_canvas_token') || '';
let geminiApiKey = localStorage.getItem('hub_gemini_key') || '';
let taskFilterStatus = 'pending'; // Default to pending tasks
let taskSort = { key: 'dueDate', dir: 'asc' };

function pad2(n) { return String(n).padStart(2, '0'); }

function localDateStr(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
}

function normalizeDate(val) {
    if (val === null || val === undefined || val === '') return '';
    const str = String(val).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
    const isoDate = str.match(/^(\d{4}-\d{2}-\d{2})T/);
    if (isoDate) return isoDate[1];
    const d = new Date(str);
    if (isNaN(d.getTime())) {
        const m = str.match(/^(\d{4}-\d{2}-\d{2})/);
        return m ? m[1] : str;
    }
    return localDateStr(d);
}

function normalizeTime(val) {
    if (val === null || val === undefined || val === '') return '';
    const str = String(val).trim();
    if (/^\d{1,2}:\d{2}$/.test(str)) return pad2(str.split(':')[0]) + ':' + str.split(':')[1];
    if (/^\d{1,2}:\d{2}:\d{2}/.test(str)) return pad2(str.split(':')[0]) + ':' + str.split(':')[1];
    const d = new Date(str);
    if (isNaN(d.getTime())) return str;
    const total = Math.round((d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60));
    return pad2(Math.floor(total / 60) % 24) + ':' + pad2(total % 60);
}

function toBool(v) { return v === true || v === 'TRUE' || v === 'true'; }

const REPEAT_KEYS = ['never', 'daily', 'weekdays', 'weekly', 'monthly'];
function normalizeNag(v) {
    if (v === undefined || v === null || v === '') return 15;
    const n = Number(v);
    return isNaN(n) || n < 0 ? 15 : n;
}
function normalizeRepeat(v) {
    const r = String(v || 'never').toLowerCase();
    return REPEAT_KEYS.includes(r) ? r : 'never';
}

function normalizeTask(t) {
    t.dueDate = normalizeDate(t.dueDate);
    t.completed = toBool(t.completed);
    t.deleted = toBool(t.deleted);
    t.updatedAt = Number(t.updatedAt) || 0;
}
function normalizeWorkout(w) {
    w.date = normalizeDate(w.date);
    w.weight = parseFloat(w.weight) || 0;
    w.sets = parseInt(w.sets) || 0;
    w.reps = parseInt(w.reps) || 0;
    w.deleted = toBool(w.deleted);
    w.updatedAt = Number(w.updatedAt) || 0;
}
function normalizeScheduleItem(x) {
    x.date = normalizeDate(x.date);
    x.time = normalizeTime(x.time);
    x.completed = toBool(x.completed);
    x.deleted = toBool(x.deleted);
    x.nagInterval = normalizeNag(x.nagInterval);
    x.repeat = normalizeRepeat(x.repeat);
    x.updatedAt = Number(x.updatedAt) || 0;
}

function normalizeAllData() {
    appData.tasks.forEach(normalizeTask);
    appData.workouts.forEach(normalizeWorkout);
    appData.schedule.forEach(normalizeScheduleItem);

    const taskIndexes = new Map();
    const uniqueTasks = [];
    appData.tasks.forEach(task => {
        if (task.id === undefined || task.id === null || task.id === '') {
            uniqueTasks.push(task);
            return;
        }

        const key = String(task.id);
        if (!taskIndexes.has(key)) {
            taskIndexes.set(key, uniqueTasks.length);
            uniqueTasks.push(task);
            return;
        }

        const existingIndex = taskIndexes.get(key);
        const existing = uniqueTasks[existingIndex];
        if (task.updatedAt > existing.updatedAt ||
            (task.updatedAt === existing.updatedAt && task.completed && !existing.completed)) {
            uniqueTasks[existingIndex] = task;
        }
    });
    appData.tasks = uniqueTasks;
}

function purgeTombstones() {
    const cutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    ['tasks', 'workouts', 'schedule'].forEach(k => {
        appData[k] = appData[k].filter(x => !(x.deleted && x.updatedAt < cutoff));
    });
}

const PRIORITY_RANK = { High: 3, Medium: 2, Low: 1 };

function setTaskSort(key) {
    if (taskSort.key === key) {
        taskSort.dir = taskSort.dir === 'asc' ? 'desc' : 'asc';
    } else {
        taskSort = { key, dir: 'asc' };
    }
    renderTasks();
}

function updateSortIcons() {
    document.querySelectorAll('[data-sort-icon]').forEach(icon => {
        const active = icon.dataset.sortIcon === taskSort.key;
        icon.className = 'fa-solid text-[10px] ml-0.5 ' + (active
            ? (taskSort.dir === 'asc' ? 'fa-sort-up text-emerald-500' : 'fa-sort-down text-emerald-500')
            : 'fa-sort opacity-40');
    });
}

function compareTasks(a, b) {
    let av, bv;
    switch (taskSort.key) {
        case 'completed': av = a.completed ? 1 : 0; bv = b.completed ? 1 : 0; break;
        case 'priority':  av = PRIORITY_RANK[a.priority] || 0; bv = PRIORITY_RANK[b.priority] || 0; break;
        case 'dueDate':   av = a.dueDate || ''; bv = b.dueDate || ''; break;
        default:          av = String(a[taskSort.key] || '').toLowerCase(); bv = String(b[taskSort.key] || '').toLowerCase();
    }
    let cmp = av < bv ? -1 : (av > bv ? 1 : 0);
    if (cmp === 0 && taskSort.key !== 'dueDate') {
        cmp = (a.dueDate || '') < (b.dueDate || '') ? -1 : ((a.dueDate || '') > (b.dueDate || '') ? 1 : 0);
    }
    return taskSort.dir === 'asc' ? cmp : -cmp;
}

let notificationsEnabled = localStorage.getItem('hub_notif_enabled') === 'true';

window.onload = function() {
    if (localStorage.getItem('hub_dark') === 'true') {
        document.documentElement.classList.add('dark');
    }
    if (scriptUrl) document.getElementById('scriptUrlInput').value = scriptUrl;
    if (canvasDomain) document.getElementById('canvasDomainInput').value = canvasDomain;
    if (canvasToken) document.getElementById('canvasTokenInput').value = canvasToken;
    if (geminiApiKey) document.getElementById('geminiKeyInput').value = geminiApiKey;

    if (notificationsEnabled) {
        document.getElementById('notifBadge').classList.remove('hidden');
        startNotificationEngine();
    }
    normalizeAllData();
    setTaskFilterStatus('pending');
    renderAll();
};

function saveDataLocal() {
    localStorage.setItem('hub_tasks', JSON.stringify(appData.tasks));
    localStorage.setItem('hub_workouts', JSON.stringify(appData.workouts));
    localStorage.setItem('hub_schedule', JSON.stringify(appData.schedule));
}

function renderAll() {
    renderTasks();
    renderWorkouts();
    renderSchedule();
    saveDataLocal();
    scheduleNativeSync();
}

function switchTab(tab) {
    ['tasks', 'workouts', 'schedule'].forEach(t => {
        document.getElementById('view-' + t).classList.add('hidden');
        document.getElementById('nav-' + t).className = "py-3 px-1 border-b-2 font-medium text-sm transition border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 flex items-center space-x-2";
    });
    document.getElementById('view-' + tab).classList.remove('hidden');
    document.getElementById('nav-' + tab).className = "py-3 px-1 border-b-2 font-medium text-sm transition border-emerald-500 text-emerald-600 dark:text-emerald-400 flex items-center space-x-2";
}

function updateCategoryDropdown() {
    const select = document.getElementById('taskFilterCategory');
    if (!select) return;
    
    const currentVal = select.value;
    const categories = Array.from(new Set(
        appData.tasks.filter(t => !t.deleted && t.category).map(t => t.category.trim())
    )).sort();

    select.innerHTML = '<option value="all">All Classes / Categories</option>';
    categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (cat === currentVal) opt.selected = true;
        select.appendChild(opt);
    });
}

function renderTasks() {
    updateCategoryDropdown();
    const tbody = document.getElementById('taskTableBody');
    tbody.innerHTML = '';

    const search = document.getElementById('taskSearch').value.toLowerCase();
    const priorityFilter = document.getElementById('taskFilterPriority').value;
    const categoryFilter = document.getElementById('taskFilterCategory')?.value || 'all';

    const activeTasks = appData.tasks.filter(t => !t.deleted);
    let filtered = activeTasks.filter(t => {
        const matchesSearch = t.title.toLowerCase().includes(search) || t.category.toLowerCase().includes(search);
        const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        const matchesStatus = taskFilterStatus === 'all' || (taskFilterStatus === 'completed' && t.completed) || (taskFilterStatus === 'pending' && !t.completed);
        return matchesSearch && matchesPriority && matchesCategory && matchesStatus;
    });

    filtered.sort(compareTasks);
    updateSortIcons();

    const total = activeTasks.length;
    const completed = activeTasks.filter(t => t.completed).length;
    const pending = total - completed;
    const todayStr = localDateStr(new Date());
    const overdue = activeTasks.filter(t => !t.completed && t.dueDate < todayStr).length;

    document.getElementById('statTotal').innerText = total;
    document.getElementById('statCompleted').innerText = completed;
    document.getElementById('statPending').innerText = pending;
    document.getElementById('statOverdue').innerText = overdue;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center py-8 text-slate-400 text-sm">No tasks found.</td></tr>`;
        return;
    }

    filtered.forEach(t => {
        const tr = document.createElement('tr');
        tr.className = "hover:bg-slate-50 dark:hover:bg-slate-800/50 transition border-b border-slate-100 dark:border-slate-800/60";
        
        const isOverdue = !t.completed && t.dueDate < todayStr;
        const priorityColor = t.priority === 'High' ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400' : (t.priority === 'Medium' ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400');

        tr.innerHTML = `
            <td class="py-3 px-4 text-center">
                <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskCompletion('${t.id}')" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">
            </td>
            <td class="py-3 px-4 font-medium text-slate-900 dark:text-white ${t.completed ? 'line-through opacity-50' : ''}">${escapeHtml(t.title)}</td>
            <td class="py-3 px-4 text-slate-500 dark:text-slate-400">${escapeHtml(t.category)}</td>
            <td class="py-3 px-4"><span class="px-2.5 py-1 rounded-full text-xs font-semibold ${priorityColor}">${t.priority}</span></td>
            <td class="py-3 px-4 text-slate-500 dark:text-slate-400 ${isOverdue ? 'text-rose-600 font-semibold' : ''}">${t.dueDate} ${isOverdue ? '(Overdue)' : ''}</td>
            <td class="py-3 px-4 text-right space-x-2">
                <button onclick="editTask('${t.id}')" class="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"><i class="fa-solid fa-pen text-xs"></i></button>
                <button onclick="deleteTask('${t.id}')" class="p-1.5 text-slate-400 hover:text-rose-600 transition"><i class="fa-solid fa-trash text-xs"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function setTaskFilterStatus(status) {
    taskFilterStatus = status;
    ['all', 'pending', 'completed'].forEach(s => {
        const btn = document.getElementById('filter-status-' + s);
        if (s === status) {
            btn.className = "px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 transition";
        } else {
            btn.className = "px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 transition";
        }
    });
    renderTasks();
}

function openTaskModal(id = null) {
    document.getElementById('taskId').value = '';
    document.getElementById('taskTitleInput').value = '';
    document.getElementById('taskCategoryInput').value = '';
    document.getElementById('taskPriorityInput').value = 'Medium';
    document.getElementById('taskDateInput').value = localDateStr(new Date());
    document.getElementById('taskModalTitle').innerText = 'Add Task / Homework';

    if (id) {
        const task = appData.tasks.find(t => t.id === id);
        if (task) {
            document.getElementById('taskId').value = task.id;
            document.getElementById('taskTitleInput').value = task.title;
            document.getElementById('taskCategoryInput').value = task.category;
            document.getElementById('taskPriorityInput').value = task.priority;
            document.getElementById('taskDateInput').value = task.dueDate;
            document.getElementById('taskModalTitle').innerText = 'Edit Task / Homework';
        }
    }
    document.getElementById('taskModal').classList.remove('hidden');
}

function closeTaskModal() {
    document.getElementById('taskModal').classList.add('hidden');
}

function handleTaskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('taskId').value;
    const title = document.getElementById('taskTitleInput').value;
    const category = document.getElementById('taskCategoryInput').value;
    const priority = document.getElementById('taskPriorityInput').value;
    const dueDate = document.getElementById('taskDateInput').value;

    if (id) {
        const t = appData.tasks.find(x => x.id === id);
        if (t) {
            t.title = title;
            t.category = category;
            t.priority = priority;
            t.dueDate = dueDate;
            t.updatedAt = Date.now();
        }
    } else {
        appData.tasks.push({
            id: 't_' + Math.random().toString(36).substr(2, 9),
            title, category, priority, dueDate,
            completed: false,
            updatedAt: Date.now()
        });
    }

    closeTaskModal();
    renderAll();
}

function toggleTaskCompletion(id) {
    const t = appData.tasks.find(x => x.id === id);
    if (t) {
        t.completed = !t.completed;
        t.updatedAt = Date.now();
        renderAll();
    }
}

function editTask(id) { openTaskModal(id); }

function deleteTask(id) {
    const t = appData.tasks.find(x => x.id === id);
    if (t) {
        t.deleted = true;
        t.updatedAt = Date.now();
    }
    renderAll();
}



function saveCanvasCredentials() {
    canvasDomain = document.getElementById('canvasDomainInput').value.trim();
    canvasToken = document.getElementById('canvasTokenInput').value.trim();
    localStorage.setItem('hub_canvas_domain', canvasDomain);
    localStorage.setItem('hub_canvas_token', canvasToken);
    closeSettings();
    showMessage("Credentials Saved", "Canvas LMS domain and access token stored securely in local browser storage.");
}

function saveGeminiKey() {
    geminiApiKey = document.getElementById('geminiKeyInput').value.trim();
    localStorage.setItem('hub_gemini_key', geminiApiKey);
    closeSettings();
    showMessage("Settings Saved", "Gemini API Key saved successfully.");
}

// --- WORKOUTS ENGINE ---
function renderWorkouts() {
    const grid = document.getElementById('workoutGrid');
    grid.innerHTML = '';

    const activeWorkouts = appData.workouts.filter(w => !w.deleted);
    if (activeWorkouts.length === 0) {
        grid.innerHTML = `<div class="col-span-full text-center py-12 text-slate-400 text-sm">No workouts logged yet.</div>`;
        return;
    }

    const grouped = {};
    activeWorkouts.forEach(w => {
        if (!grouped[w.name]) grouped[w.name] = [];
        grouped[w.name].push(w);
    });

    for (const [name, logs] of Object.entries(grouped)) {
        logs.sort((a, b) => new Date(b.date) - new Date(a.date));
        const latest = logs[0];
        const card = document.createElement('div');
        card.className = "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 space-y-4";
        
        card.innerHTML = `
            <div class="flex items-center justify-between">
                <h3 class="font-bold text-slate-900 dark:text-white text-lg">${escapeHtml(name)}</h3>
                <span class="px-2.5 py-1 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-full text-xs font-semibold">${logs.length} sessions</span>
            </div>
            <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl space-y-2">
                <p class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Latest Session (${latest.date})</p>
                <div class="flex justify-between items-center text-sm font-medium">
                    <span>Weight: <strong class="text-emerald-600">${latest.weight} lbs</strong></span>
                    <span>Sets: <strong>${latest.sets}</strong></span>
                    <span>Reps: <strong>${latest.reps}</strong></span>
                </div>
            </div>
            <div class="space-y-1">
                <p class="text-xs font-medium text-slate-400">Previous History</p>
                <div class="max-h-28 overflow-y-auto custom-scrollbar space-y-1 text-xs">
                    ${logs.slice(1).map(l => `<div class="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800 text-slate-600 dark:text-slate-400"><span>${l.date}</span><span>${l.weight} lbs × ${l.sets}s × ${l.reps}r</span></div>`).join('') || '<span class="text-slate-400 italic">No prior sessions</span>'}
                </div>
            </div>
        `;
        grid.appendChild(card);
    }
}

function openWorkoutModal() {
    document.getElementById('workoutNameInput').value = '';
    document.getElementById('workoutWeightInput').value = '';
    document.getElementById('workoutSetsInput').value = '3';
    document.getElementById('workoutRepsInput').value = '8';
    document.getElementById('workoutDateInput').value = localDateStr(new Date());
    document.getElementById('workoutModal').classList.remove('hidden');
}

function closeWorkoutModal() {
    document.getElementById('workoutModal').classList.add('hidden');
}

function handleWorkoutSubmit(e) {
    e.preventDefault();
    const name = document.getElementById('workoutNameInput').value;
    const weight = parseFloat(document.getElementById('workoutWeightInput').value);
    const sets = parseInt(document.getElementById('workoutSetsInput').value);
    const reps = parseInt(document.getElementById('workoutRepsInput').value);
    const date = document.getElementById('workoutDateInput').value;

    appData.workouts.push({
        id: 'w_' + Math.random().toString(36).substr(2, 9),
        name, weight, sets, reps, date,
        updatedAt: Date.now()
    });

    closeWorkoutModal();
    renderAll();
}

async function fetchAITrainingAdvice() {
    if (!geminiApiKey) {
        openSettings();
        showMessage("Gemini Key Required", "Please enter your Gemini API key in Settings to use the AI Coach.");
        return;
    }

    const card = document.getElementById('aiAdviceCard');
    const content = document.getElementById('aiAdviceContent');
    card.classList.remove('hidden');
    content.innerHTML = `<div class="flex items-center space-x-2 text-purple-600"><i class="fa-solid fa-spinner fa-spin"></i><span>Analyzing progressive overload logs with Gemini AI...</span></div>`;

    const activeLogs = appData.workouts.filter(w => !w.deleted);
    if (activeLogs.length === 0) {
        content.innerHTML = `<span class="text-amber-500">No active workout logs found. Log a workout first!</span>`;
        return;
    }

    const prompt = `Act as an elite strength and conditioning coach. Review these workout logs and provide progressive overload recommendations, weight increases, or volume adjustments:\n${JSON.stringify(activeLogs)}`;

    const payload = {
        contents: [{ parts: [{ text: prompt }] }],
        systemInstruction: { parts: [{ text: "Provide concise, actionable progressive overload advice in bullet points." }] }
    };

    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=${geminiApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const result = await response.json();
        
        if (result.error) {
            throw new Error(result.error.message || "API error");
        }
        
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || "Unable to generate advice at this time.";
        content.innerHTML = `<div class="prose dark:prose-invert text-xs leading-relaxed">${text.replace(/\n/g, '<br>')}</div>`;
    } catch (err) {
        console.error(err);
        content.innerHTML = `<span class="text-rose-500">Error generating AI analysis: ${escapeHtml(err.message)}</span>`;
    }
}

// --- SCHEDULE & NAGGING REMINDERS ENGINE ---
const REPEAT_LABELS = { never: 'Does not repeat', daily: 'Repeats daily', weekdays: 'Repeats weekdays', weekly: 'Repeats weekly', monthly: 'Repeats monthly' };

function nagLabel(m) {
    m = Number(m) || 0;
    if (!m) return 'Alerts once';
    if (m % 60 === 0) return 'Nags every ' + (m / 60) + ' hr';
    return 'Nags every ' + m + ' min';
}

function dueDateTime(s) {
    return new Date(`${s.date}T${s.time || '00:00'}:00`);
}

function renderSchedule() {
    const list = document.getElementById('scheduleList');
    list.innerHTML = '';

    const items = appData.schedule.filter(s => !s.deleted);
    if (items.length === 0) {
        list.innerHTML = `<div class="text-center py-8 text-slate-400 text-sm">No schedule items or reminders.</div>`;
        return;
    }

    items.sort((a, b) => dueDateTime(a) - dueDateTime(b));
    const now = Date.now();

    items.forEach(s => {
        const isOverdue = !s.completed && dueDateTime(s).getTime() < now;
        const div = document.createElement('div');
        div.className = "flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border " + (isOverdue ? "border-rose-300 dark:border-rose-900" : "border-slate-200 dark:border-slate-700");

        const repeatBadge = s.repeat !== 'never'
            ? `<span class="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[11px] font-medium"><i class="fa-solid fa-repeat mr-1"></i>${REPEAT_LABELS[s.repeat]}</span>` : '';

        div.innerHTML = `
            <div class="flex items-center space-x-4">
                <input type="checkbox" ${s.completed ? 'checked' : ''} onchange="toggleScheduleCompletion('${s.id}')" class="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer">
                <div class="space-y-1">
                    <h4 class="font-bold text-slate-900 dark:text-white ${s.completed ? 'line-through opacity-50' : ''}">${escapeHtml(s.title)}</h4>
                    <p class="text-xs ${isOverdue ? 'text-rose-600 font-semibold' : 'text-slate-500 dark:text-slate-400'}"><i class="fa-regular fa-calendar mr-1"></i>${s.date} at ${s.time}${isOverdue ? ' (Overdue)' : ''}</p>
                    <div class="flex flex-wrap gap-1.5">
                        <span class="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 text-[11px] font-medium"><i class="fa-solid fa-bell mr-1"></i>${nagLabel(s.nagInterval)}</span>
                        ${repeatBadge}
                    </div>
                </div>
            </div>
            <div class="flex items-center space-x-1">
                <button onclick="openScheduleModal('${s.id}')" class="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"><i class="fa-solid fa-pen text-xs"></i></button>
                <button onclick="deleteSchedule('${s.id}')" class="p-2 text-slate-400 hover:text-rose-600 transition"><i class="fa-solid fa-trash text-sm"></i></button>
            </div>
        `;
        list.appendChild(div);
    });
}

function openScheduleModal(id = null) {
    document.getElementById('scheduleId').value = '';
    document.getElementById('scheduleTitleInput').value = '';
    document.getElementById('scheduleDateInput').value = localDateStr(new Date());
    document.getElementById('scheduleTimeInput').value = '12:00';
    document.getElementById('scheduleNagInput').value = '15';
    document.getElementById('scheduleRepeatInput').value = 'never';
    document.getElementById('scheduleModalTitle').innerText = 'Add Schedule & Reminder Item';

    if (id) {
        const s = appData.schedule.find(x => x.id === id);
        if (s) {
            document.getElementById('scheduleId').value = s.id;
            document.getElementById('scheduleTitleInput').value = s.title;
            document.getElementById('scheduleDateInput').value = s.date;
            document.getElementById('scheduleTimeInput').value = s.time;
            document.getElementById('scheduleNagInput').value = String(s.nagInterval);
            document.getElementById('scheduleRepeatInput').value = s.repeat;
            document.getElementById('scheduleModalTitle').innerText = 'Edit Schedule & Reminder Item';
        }
    }
    document.getElementById('scheduleModal').classList.remove('hidden');
}

function closeScheduleModal() {
    document.getElementById('scheduleModal').classList.add('hidden');
}

function handleScheduleSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('scheduleId').value;
    const title = document.getElementById('scheduleTitleInput').value;
    const date = document.getElementById('scheduleDateInput').value;
    const time = document.getElementById('scheduleTimeInput').value;
    const nagInterval = Number(document.getElementById('scheduleNagInput').value) || 0;
    const repeat = document.getElementById('scheduleRepeatInput').value;

    if (id) {
        const s = appData.schedule.find(x => x.id === id);
        if (s) {
            Object.assign(s, { title, date, time, nagInterval, repeat });
            s.completed = false;
            s.updatedAt = Date.now();
        }
    } else {
        appData.schedule.push({
            id: 's_' + Math.random().toString(36).substr(2, 9),
            title, date, time, nagInterval, repeat,
            completed: false,
            deleted: false,
            updatedAt: Date.now()
        });
    }

    closeScheduleModal();
    renderAll();
    checkReminders();
}

function nextOccurrence(s) {
    const [y, m, d] = s.date.split('-').map(Number);
    const [hh, mm] = (s.time || '00:00').split(':').map(Number);
    let cur = new Date(y, m - 1, d, 12, 0, 0);
    const baseDay = d;

    const step = () => {
        if (s.repeat === 'weekly') {
            cur.setDate(cur.getDate() + 7);
        } else if (s.repeat === 'monthly') {
            const nm = cur.getMonth() + 1;
            const dim = new Date(cur.getFullYear(), nm + 1, 0).getDate();
            cur = new Date(cur.getFullYear(), nm, Math.min(baseDay, dim), 12, 0, 0);
        } else {
            cur.setDate(cur.getDate() + 1);
            if (s.repeat === 'weekdays') {
                while (cur.getDay() === 0 || cur.getDay() === 6) cur.setDate(cur.getDate() + 1);
            }
        }
    };
    const stamp = () => new Date(cur.getFullYear(), cur.getMonth(), cur.getDate(), hh, mm).getTime();

    step();
    let guard = 0;
    while (stamp() <= Date.now() && guard++ < 2000) step();
    return localDateStr(cur);
}

function toggleScheduleCompletion(id) {
    const s = appData.schedule.find(x => x.id === id);
    if (!s) return;

    if (!s.completed && s.repeat !== 'never') {
        s.date = nextOccurrence(s);
        s.completed = false;
        s.updatedAt = Date.now();
        renderAll();
        showMessage("Done!", `"${s.title}" is complete. Next reminder: ${s.date} at ${s.time}.`);
        return;
    }

    s.completed = !s.completed;
    s.updatedAt = Date.now();
    renderAll();
}

function deleteSchedule(id) {
    const s = appData.schedule.find(x => x.id === id);
    if (s) {
        s.deleted = true;
        s.updatedAt = Date.now();
    }
    renderAll();
}

// --- NOTIFICATIONS ---
let lastNotified = {};
try { lastNotified = JSON.parse(localStorage.getItem('hub_last_notified')) || {}; } catch (e) { lastNotified = {}; }
let notifInterval = null;

async function requestNotificationPermission() {
    try {
        const LN = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
        if (LN) await LN.requestPermissions();
        else if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    } catch (e) { console.warn('Notification permission request failed', e); }
}

function toggleNotifications() {
    notificationsEnabled = !notificationsEnabled;
    localStorage.setItem('hub_notif_enabled', notificationsEnabled);
    if (notificationsEnabled) {
        document.getElementById('notifBadge').classList.remove('hidden');
        requestNotificationPermission();
        startNotificationEngine();
        scheduleNativeSync();
        showMessage("Nagging Reminders Enabled", "Once a schedule item passes its due time, you'll be reminded at its chosen interval until it is marked done.");
    } else {
        document.getElementById('notifBadge').classList.add('hidden');
        if (notifInterval) clearInterval(notifInterval);
        scheduleNativeSync();
        showMessage("Nagging Reminders Disabled", "Notifications have been turned off.");
    }
}

function startNotificationEngine() {
    if (notifInterval) clearInterval(notifInterval);
    checkReminders();
    notifInterval = setInterval(checkReminders, 30000);
}

function checkReminders() {
    if (!notificationsEnabled) return;
    const now = Date.now();
    const firing = [];
    const activeKeys = {};

    appData.schedule.forEach(s => {
        if (s.deleted || s.completed) return;
        const due = dueDateTime(s).getTime();
        if (isNaN(due)) return;
        const key = s.id + '|' + s.date + '|' + s.time;
        if (lastNotified[key]) activeKeys[key] = lastNotified[key];
        if (now < due) return;

        const last = lastNotified[key] || 0;
        const intervalMs = (Number(s.nagInterval) || 0) * 60000;
        if (!last || (intervalMs > 0 && now - last >= intervalMs)) {
            activeKeys[key] = now;
            firing.push(s);
        }
    });

    lastNotified = activeKeys;
    localStorage.setItem('hub_last_notified', JSON.stringify(lastNotified));

    if (firing.length) {
        const title = firing.length === 1 ? 'Reminder: ' + firing[0].title : firing.length + ' reminders pending';
        const body = firing.map(s => `${s.title} (due ${s.date} ${s.time})`).join('\n');
        deliverNotification(title, body);
    }
}

function deliverNotification(title, body) {
    let shownNatively = false;
    try {
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, { body, tag: 'hub-reminder' });
            shownNatively = true;
        }
    } catch (e) {}

    if (!shownNatively || document.visibilityState === 'visible') {
        showMessage(title, body + '\n\nMark it done to stop these reminders.');
    }
}

function hashId(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
    return Math.abs(h) % 2000000000;
}

function buildNagSchedule() {
    const out = [];
    const now = Date.now();
    const horizon = now + 48 * 3600 * 1000;
    appData.schedule.forEach(s => {
        if (s.deleted || s.completed) return;
        const due = dueDateTime(s).getTime();
        if (isNaN(due)) return;
        const stepMs = (Number(s.nagInterval) || 0) * 60000;
        let t = due;
        if (t <= now) {
            if (!stepMs) return;
            t = due + Math.ceil((now + 5000 - due) / stepMs) * stepMs;
        }
        let n = 0;
        while (t <= horizon && n < 20) {
            out.push({
                id: hashId(s.id + '|' + t),
                title: 'Reminder: ' + s.title,
                body: `Due ${s.date} ${s.time}. Mark it done to stop reminders.`,
                schedule: { at: new Date(t), allowWhileIdle: true }
            });
            n++;
            if (!stepMs) break;
            t += stepMs;
        }
    });
    return out.sort((a, b) => a.schedule.at - b.schedule.at).slice(0, 60);
}

let nativeSyncTimer = null;
function scheduleNativeSync() {
    clearTimeout(nativeSyncTimer);
    nativeSyncTimer = setTimeout(syncNativeNotifications, 1000);
}

async function syncNativeNotifications() {
    const LN = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications;
    if (!LN) return;
    try {
        const pending = await LN.getPending();
        if (pending.notifications && pending.notifications.length) await LN.cancel({ notifications: pending.notifications });
        if (!notificationsEnabled) return;
        const list = buildNagSchedule();
        if (list.length) await LN.schedule({ notifications: list });
    } catch (e) { console.warn('Native notification scheduling failed', e); }
}

// --- TWO-WAY GOOGLE SHEETS SYNC ENGINE ---
// --- CANVAS IMPORT ENGINE ---
async function importCanvasAssignments() {
    scriptUrl = document.getElementById('scriptUrlInput').value.trim();
    canvasDomain = document.getElementById('canvasDomainInput').value.trim();
    canvasToken = document.getElementById('canvasTokenInput').value.trim();

    if (!scriptUrl || !canvasDomain || !canvasToken) {
        openSettings();
        showMessage("Canvas Config Required", "Please fill in your Apps Script URL, Canvas Domain, and Access Token in Settings.");
        return;
    }

    const canvasIcon = document.getElementById('canvasIcon');
    if (canvasIcon) canvasIcon.className = "fa-solid fa-spinner fa-spin";

    const today = new Date();
    const nextWeek = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000); // Expanded window to 14 days
    
    const startDate = localDateStr(today);
    const endDate = localDateStr(nextWeek);

    try {
        const response = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({
                action: "fetch_canvas",
                domain: canvasDomain,
                token: canvasToken,
                startDate: startDate,
                endDate: endDate
            })
        });

        const plannerItems = await response.json();
        if (!Array.isArray(plannerItems)) {
            throw new Error(plannerItems.message || "Invalid response from Canvas API.");
        }

        let importedCount = 0;
        plannerItems.forEach(item => {
            const plannable = item.plannable || {};
            const title = item.plannable_title || plannable.title || "Canvas Assignment";
            const rawDue = item.plannable_date || plannable.due_at;
            if (!rawDue) return;

            const dueDate = normalizeDate(rawDue);
            const category = item.context_name || item.course_name || "Canvas";
            const canvasId = plannable.id || item.id || Math.random().toString(36).substr(2, 9);
            const uniqueId = 'canvas_' + canvasId;

            const exists = appData.tasks.some(t => String(t.id) === uniqueId);
            if (!exists) {
                appData.tasks.push({
                    id: uniqueId,
                    title: title,
                    category: category,
                    priority: 'High',
                    dueDate: dueDate,
                    completed: Boolean(item.submissions && item.submissions.submitted),
                    deleted: false,
                    updatedAt: Date.now()
                });
                importedCount++;
            }
        });

        renderAll();
        await triggerTwoWaySync(); // Automatically trigger sync to write imported items to Sheet immediately
        showMessage("Canvas Import Complete", `Successfully imported ${importedCount} assignment(s).`);
    } catch (err) {
        console.error(err);
        showMessage("Canvas Import Error", "Failed to fetch assignments: " + err.message);
    } finally {
        if (canvasIcon) canvasIcon.className = "fa-solid fa-graduation-cap";
    }
}

// --- TWO-WAY GOOGLE SHEETS SYNC ENGINE ---
async function triggerTwoWaySync() {
    scriptUrl = document.getElementById('scriptUrlInput').value.trim();
    if (!scriptUrl) {
        openSettings();
        showMessage("Setup Required", "Please enter your Google Apps Script Web App URL in settings first.");
        return;
    }

    const syncIcon = document.getElementById('syncIcon');
    const syncDot = document.getElementById('syncDot');
    const syncText = document.getElementById('syncText');

    if (syncIcon) syncIcon.classList.add('fa-spin');
    if (syncDot) syncDot.className = "w-2 h-2 rounded-full bg-amber-400";
    if (syncText) syncText.innerText = "Syncing...";

    try {
        // Step 1: Pull current remote state
        const response = await fetch(scriptUrl);
        const remoteData = await response.json();

        if (remoteData.status === "success") {
            mergeRemoteData(remoteData);
            purgeTombstones();
        }

        // Step 2: Push complete merged client state
        normalizeAllData();
        const pushResponse = await fetch(scriptUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(appData)
        });

        const pushResult = await pushResponse.json();
        if (pushResult.status !== "success") {
            throw new Error(pushResult.message || "Failed pushing state to Sheet.");
        }

        if (syncDot) syncDot.className = "w-2 h-2 rounded-full bg-emerald-500";
        if (syncText) syncText.innerText = "Synced Successfully";
        renderAll();
        setTimeout(() => { if (syncText) syncText.innerText = "Sync Ready"; }, 3000);
    } catch (err) {
        console.error("Sync Error:", err);
        if (syncDot) syncDot.className = "w-2 h-2 rounded-full bg-rose-500";
        if (syncText) syncText.innerText = "Sync Failed";
        showMessage("Sync Error", "Could not complete two-way synchronization: " + err.message);
    } finally {
        if (syncIcon) syncIcon.classList.remove('fa-spin');
    }
}

function mergeRemoteData(remote) {
    ['tasks', 'workouts', 'schedule'].forEach(key => {
        if (remote[key] && Array.isArray(remote[key])) {
            remote[key].forEach(remoteItem => {
                if (!remoteItem || !remoteItem.id) return;
                const localIndex = appData[key].findIndex(i => String(i.id) === String(remoteItem.id));
                const remoteUpdated = Number(remoteItem.updatedAt) || 0;

                if (localIndex !== -1) {
                    const localUpdated = Number(appData[key][localIndex].updatedAt) || 0;
                    if (remoteUpdated >= localUpdated) {
                        appData[key][localIndex] = remoteItem;
                    }
                } else {
                    appData[key].push(remoteItem);
                }
            });
        }
    });
}

function openSettings() { document.getElementById('settingsModal').classList.remove('hidden'); }
function closeSettings() { document.getElementById('settingsModal').classList.add('hidden'); }

function saveScriptUrl() {
    scriptUrl = document.getElementById('scriptUrlInput').value.trim();
    localStorage.setItem('hub_script_url', scriptUrl);
    closeSettings();
    showMessage("Settings Saved", "Google Apps Script Web App URL updated successfully.");
}

function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark');
    localStorage.setItem('hub_dark', isDark);
}

function showMessage(title, body) {
    document.getElementById('messageTitle').innerText = title;
    document.getElementById('messageBody').innerText = body;
    document.getElementById('messageModal').classList.remove('hidden');
}

function closeMessageModal() { document.getElementById('messageModal').classList.add('hidden'); }

function escapeHtml(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
