let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let currentFilter = 'all';

const taskInput = document.getElementById('task-input');
const dueDateInput = document.getElementById('due-date');
const priorityInput = document.getElementById('priority');
const addBtn = document.getElementById('add-btn');
const taskList = document.getElementById('task-list');
const themeToggle = document.getElementById('theme-toggle');
const searchInput = document.getElementById('search');

// Theme
function toggleTheme() {
  document.documentElement.classList.toggle('dark');
  localStorage.setItem('theme', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  themeToggle.innerHTML = document.documentElement.classList.contains('dark') ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
}

if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
  themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
}
themeToggle.addEventListener('click', toggleTheme);

// Save
function saveTasks() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

// Confetti
function triggerConfetti() {
  const colors = ['#6366f1', '#a855f7', '#22d3ee', '#4ade80', '#f472b6'];
  for (let i = 0; i < 100; i++) {
    setTimeout(() => {
      const confetti = document.createElement('div');
      confetti.style.position = 'fixed';
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.top = '-10px';
      confetti.style.width = '12px';
      confetti.style.height = '12px';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.opacity = Math.random() * 0.8 + 0.4;
      confetti.style.zIndex = 1000;
      document.body.appendChild(confetti);

      let y = -10;
      const fall = setInterval(() => {
        y += 10 + Math.random() * 8;
        confetti.style.top = y + 'px';
        if (y > window.innerHeight) {
          clearInterval(fall);
          confetti.remove();
        }
      }, 16);
    }, i * 6);
  }
}

// Render Tasks
function renderTasks(filteredTasks) {
  taskList.innerHTML = '';

  if (filteredTasks.length === 0) {
    taskList.innerHTML = `<li class="empty-state">No tasks found. Add some! ✨</li>`;
    return;
  }

  filteredTasks.forEach((task, index) => {
    const taskEl = document.createElement('li');
    taskEl.className = `task-item ${task.completed ? 'completed' : ''} priority-${task.priority}`;
    taskEl.draggable = true;
    taskEl.dataset.index = index;

    taskEl.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''}>
      <div class="task-info">
        <p class="task-text">${task.text}</p>
        <small>${task.dueDate ? '📅 Due: ' + task.dueDate : ''}</small>
      </div>
      <div class="task-actions">
        <button class="edit-btn"><i class="fas fa-edit"></i></button>
        <button class="delete-btn"><i class="fas fa-trash"></i></button>
      </div>
    `;

    // Checkbox with Confetti
    taskEl.querySelector('input[type="checkbox"]').addEventListener('change', () => {
      const wasCompleted = tasks[index].completed;
      tasks[index].completed = !tasks[index].completed;
      saveTasks();
      renderTasks(getFilteredTasks());
      updateStats();

      if (!wasCompleted && tasks[index].completed) triggerConfetti();
    });

    // Edit
    taskEl.querySelector('.edit-btn').addEventListener('click', () => {
      const newText = prompt("Edit task:", task.text);
      if (newText !== null && newText.trim() !== '') {
        tasks[index].text = newText.trim();
        saveTasks();
        renderTasks(getFilteredTasks());
      }
    });

    // Delete
    taskEl.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm("Delete this task?")) {
        tasks.splice(index, 1);
        saveTasks();
        renderTasks(getFilteredTasks());
        updateStats();
      }
    });

    taskList.appendChild(taskEl);
  });

  makeDraggable();
}

// Filter Tasks
function getFilteredTasks() {
  let filtered = tasks;

  if (currentFilter === 'active') filtered = tasks.filter(t => !t.completed);
  if (currentFilter === 'completed') filtered = tasks.filter(t => t.completed);
  if (currentFilter === 'today') {
    const today = new Date().toISOString().split('T')[0];
    filtered = tasks.filter(t => t.dueDate === today);
  }

  const searchTerm = searchInput.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(t => t.text.toLowerCase().includes(searchTerm));
  }
  return filtered;
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(t => t.completed).length;
  document.getElementById('total-tasks').textContent = total;
  document.getElementById('completed-tasks').textContent = completed;
  document.getElementById('pending-tasks').textContent = total - completed;
  document.getElementById('task-count').textContent = `${total - completed} tasks left`;
}

function addTask() {
  const text = taskInput.value.trim();
  if (!text) return;

  tasks.unshift({
    text,
    completed: false,
    dueDate: dueDateInput.value || null,
    priority: priorityInput.value
  });

  taskInput.value = '';
  dueDateInput.value = '';
  saveTasks();
  renderTasks(getFilteredTasks());
  updateStats();
}

function makeDraggable() {
  const items = document.querySelectorAll('.task-item');
  items.forEach(item => {
    item.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', item.dataset.index));
    item.addEventListener('dragover', e => e.preventDefault());
    item.addEventListener('drop', e => {
      e.preventDefault();
      const from = parseInt(e.dataTransfer.getData('text/plain'));
      const to = parseInt(item.dataset.index);
      if (from !== to) {
        const [moved] = tasks.splice(from, 1);
        tasks.splice(to, 0, moved);
        saveTasks();
        renderTasks(getFilteredTasks());
      }
    });
  });
}

// Event Listeners
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keypress', e => { if (e.key === 'Enter') addTask(); });
searchInput.addEventListener('input', () => renderTasks(getFilteredTasks()));

document.querySelectorAll('.filter-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentFilter = btn.dataset.filter;
    renderTasks(getFilteredTasks());
  });
});

document.getElementById('clear-completed').addEventListener('click', () => {
  if (confirm("Clear all completed tasks?")) {
    tasks = tasks.filter(t => !t.completed);
    saveTasks();
    renderTasks(getFilteredTasks());
    updateStats();
  }
});

// Init
window.onload = () => {
  renderTasks(getFilteredTasks());
  updateStats();
};