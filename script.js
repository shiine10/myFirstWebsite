/* Pro To-Do — script.js
   Features: add, edit, delete, complete, filters, drag & drop, localStorage persistence
*/

(() => {
  const STORAGE_KEY = "pro-todo-v1";
  const form = document.getElementById("todo-form");
  const input = document.getElementById("todo-input");
  const listEl = document.getElementById("todo-list");
  const filters = document.querySelectorAll(".filter");
  const itemsLeftEl = document.getElementById("items-left");
  const clearCompletedBtn = document.getElementById("clear-completed");
  const toggleThemeBtn = document.getElementById("toggle-theme");

  let tasks = load();
  let currentFilter = "all";
  let dragSrcEl = null;

  // --- Persistence ---
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      console.error("Failed to parse tasks:", e);
      return [];
    }
  }

  // --- Utilities ---
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2,8);
  }

  function render() {
    listEl.innerHTML = "";
    const visible = tasks.filter(t => {
      if (currentFilter === "active") return !t.completed;
      if (currentFilter === "completed") return t.completed;
      return true;
    });

    for (const task of visible) {
      const li = document.createElement("li");
      li.className = "todo__item";
      li.draggable = true;
      li.dataset.id = task.id;

      // checkbox
      const cb = document.createElement("button");
      cb.className = "checkbox" + (task.completed ? " checked" : "");
      cb.setAttribute("aria-pressed", String(task.completed));
      cb.title = task.completed ? "Mark as active" : "Mark as completed";
      cb.innerHTML = task.completed ? '<span class="check-icon">✓</span>' : "";
      cb.addEventListener("click", () => {
        toggleComplete(task.id);
      });

      // task text container
      const taskDiv = document.createElement("div");
      taskDiv.className = "task";

      const text = document.createElement("span");
      text.className = "text" + (task.completed ? " completed" : "");
      text.textContent = task.text;
      text.title = "Double-click or press Enter to edit";
      text.tabIndex = 0;
      text.addEventListener("dblclick", () => startEdit(task.id, li));
      text.addEventListener("keydown", (e) => {
        if (e.key === "Enter") startEdit(task.id, li);
      });

      taskDiv.appendChild(text);

      // actions
      const editBtn = document.createElement("button");
      editBtn.className = "icon-btn";
      editBtn.title = "Edit";
      editBtn.innerHTML = "✎";
      editBtn.addEventListener("click", () => startEdit(task.id, li));

      const delBtn = document.createElement("button");
      delBtn.className = "icon-btn";
      delBtn.title = "Delete";
      delBtn.innerHTML = "🗑";
      delBtn.addEventListener("click", () => removeTask(task.id));

      li.appendChild(cb);
      li.appendChild(taskDiv);
      li.appendChild(editBtn);
      li.appendChild(delBtn);

      // drag events
      li.addEventListener("dragstart", dragStart);
      li.addEventListener("dragover", dragOver);
      li.addEventListener("dragenter", dragEnter);
      li.addEventListener("dragleave", dragLeave);
      li.addEventListener("drop", drop);
      li.addEventListener("dragend", dragEnd);

      listEl.appendChild(li);
    }

    updateItemsLeft();
    save();
  }

  // --- CRUD ---
  function addTask(text) {
    const t = { id: uid(), text: text.trim(), completed: false, created: Date.now() };
    tasks.unshift(t); // newest on top
    render();
  }

  function removeTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    render();
  }

  function toggleComplete(id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.completed = !t.completed;
    render();
  }

  function startEdit(id, li) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const taskDiv = li.querySelector(".task");
    taskDiv.innerHTML = "";

    const input = document.createElement("input");
    input.className = "edit";
    input.value = t.text;
    input.type = "text";
    input.setAttribute("aria-label", "Edit task text");
    taskDiv.appendChild(input);
    input.focus();
    // place caret at end
    input.setSelectionRange(input.value.length, input.value.length);

    function commit() {
      const val = input.value.trim();
      if (!val) { removeTask(id); return; }
      t.text = val;
      render();
    }
    function cancel() {
      render();
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") commit();
      if (e.key === "Escape") cancel();
    });
    input.addEventListener("blur", commit);
  }

  // --- Filters & UI ---
  filters.forEach(btn => {
    btn.addEventListener("click", () => {
      filters.forEach(b => b.classList.remove("active"));
      filters.forEach(b => b.setAttribute("aria-selected", "false"));
      btn.classList.add("active");
      btn.setAttribute("aria-selected", "true");
      currentFilter = btn.dataset.filter;
      render();
    });
  });

  function updateItemsLeft() {
    const left = tasks.filter(t => !t.completed).length;
    itemsLeftEl.textContent = `${left} item${left !== 1 ? "s" : ""} left`;
  }

  clearCompletedBtn.addEventListener("click", () => {
    tasks = tasks.filter(t => !t.completed);
    render();
  });

  toggleThemeBtn.addEventListener("click", () => {
    const dark = document.documentElement.getAttribute("data-theme") !== "dark";
    if (dark) {
      document.documentElement.setAttribute("data-theme", "dark");
      document.documentElement.style.setProperty("--bg", "#0b1220");
      document.documentElement.style.setProperty("--card", "#071032");
      document.documentElement.style.setProperty("--muted", "#a8b3c7");
      document.documentElement.style.setProperty("--accent", "#7dd3fc");
      toggleThemeBtn.textContent = "Light";
      toggleThemeBtn.setAttribute("aria-pressed", "true");
    } else {
      document.documentElement.removeAttribute("data-theme");
      document.documentElement.style.removeProperty("--bg");
      document.documentElement.style.removeProperty("--card");
      document.documentElement.style.removeProperty("--muted");
      document.documentElement.style.removeProperty("--accent");
      toggleThemeBtn.textContent = "Dark";
      toggleThemeBtn.setAttribute("aria-pressed", "false");
    }
  });

  // --- Drag & Drop handlers ---
  function dragStart(e) {
    dragSrcEl = this;
    this.classList.add("dragging");
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", this.dataset.id); } catch (err) { /* IE fallback */ }
  }
  function dragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }
  function dragEnter(e) {
    this.classList.add("drag-over");
  }
  function dragLeave(e) {
    this.classList.remove("drag-over");
  }
  function drop(e) {
    e.stopPropagation();
    this.classList.remove("drag-over");
    const srcId = e.dataTransfer.getData("text/plain") || (dragSrcEl && dragSrcEl.dataset.id);
    const dstId = this.dataset.id;
    if (!srcId || srcId === dstId) return;

    // reorder tasks array
    const srcIndex = tasks.findIndex(t => t.id === srcId);
    const dstIndex = tasks.findIndex(t => t.id === dstId);
    if (srcIndex < 0 || dstIndex < 0) return;

    const [moved] = tasks.splice(srcIndex, 1);
    tasks.splice(dstIndex, 0, moved);
    render();
  }
  function dragEnd(e) {
    if (dragSrcEl) dragSrcEl.classList.remove("dragging");
    dragSrcEl = null;
    document.querySelectorAll(".todo__item.drag-over").forEach(el => el.classList.remove("drag-over"));
  }

  // --- Form submit ---
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = input.value.trim();
    if (!val) return;
    addTask(val);
    input.value = "";
    input.focus();
  });

  // keyboard shortcut: press "n" to focus new task input
  window.addEventListener("keydown", (e) => {
    if (e.key === "n" && !/input|textarea/i.test(document.activeElement.tagName)) {
      e.preventDefault();
      input.focus();
    }
  });

  // initial render
  render();

  // expose for debugging from console
  window.__PRO_TODO = { tasks, save, load, render };
})();
