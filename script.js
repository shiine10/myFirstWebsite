(() => {
const STORAGE_KEY = "shiine10-pro-todo-v2";
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const categoryInput = document.getElementById("category-input");
const dueInput = document.getElementById("due-date-input");
const listEl = document.getElementById("todo-list");
const filters = document.querySelectorAll(".filter");
const searchInput = document.getElementById("search-input");
const itemsLeftEl = document.getElementById("items-left");
const clearCompletedBtn = document.getElementById("clear-completed");
const toggleThemeBtn = document.getElementById("toggle-theme");
const chartCanvas = document.getElementById("progress-chart");
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let currentFilter = "all";

// ----------------------
// Render Functions
// ----------------------
function save(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,8); }

function render(){
  listEl.innerHTML = "";
  let filtered = tasks.filter(t=>{
    if(currentFilter==="active") return !t.completed;
    if(currentFilter==="completed") return t.completed;
    return true;
  });
  const search = searchInput.value.trim().toLowerCase();
  if(search) filtered = filtered.filter(t=>t.text.toLowerCase().includes(search));

  filtered.forEach(task=>{
    const li = document.createElement("li");
    li.className="todo__item";
    li.draggable=true;
    li.dataset.id=task.id;

    // checkbox
    const cb = document.createElement("button");
    cb.className="checkbox"+(task.completed?" checked":"");
    cb.innerHTML = task.completed? "✓":"";
    cb.addEventListener("click",()=>{ task.completed=!task.completed; render(); });

    // task text + category + due
    const taskDiv = document.createElement("div");
    taskDiv.className="task";
    const textSpan = document.createElement("span");
    textSpan.className="text"+(task.completed?" completed":"");
    textSpan.textContent = task.text;
    taskDiv.appendChild(textSpan);
    if(task.category) {
      const catSpan = document.createElement("span");
      catSpan.style.color="#2563eb";
      catSpan.style.fontWeight="600";
      catSpan.style.marginLeft="6px";
      catSpan.textContent=`[${task.category}]`;
      taskDiv.appendChild(catSpan);
    }
    if(task.due) {
      const dueSpan = document.createElement("span");
      dueSpan.style.color="#ef4444";
      dueSpan.style.marginLeft="6px";
      const dueDate = new Date(task.due);
      const today = new Date();
      dueSpan.textContent=`Due: ${dueDate.toLocaleDateString()}`;
      if(dueDate<today && !task.completed) dueSpan.style.fontWeight="700";
      taskDiv.appendChild(dueSpan);
    }

    // actions
    const delBtn = document.createElement("button");
    delBtn.className="icon-btn"; delBtn.innerHTML="🗑";
    delBtn.addEventListener("click",()=>{ tasks=tasks.filter(t2=>t2.id!==task.id); render(); });

    li.appendChild(cb);
    li.appendChild(taskDiv);
    li.appendChild(delBtn);
    listEl.appendChild(li);
  });

  updateFooter();
  renderChart();
  save();
}

function updateFooter(){
  const left = tasks.filter(t=>!t.completed).length;
  itemsLeftEl.textContent=`${left} item${left!==1?"s":""} left`;
}

// ----------------------
// Form
// ----------------------
form.addEventListener("submit",(e)=>{
  e.preventDefault();
  const text = input.value.trim();
  if(!text) return;
  const newTask = { id: uid(), text, category: categoryInput.value.trim(), due: dueInput.value, completed:false };
  tasks.unshift(newTask);
  input.value=""; categoryInput.value=""; dueInput.value="";
  render();
});

// ----------------------
// Filters
// ----------------------
filters.forEach(btn=>{
  btn.addEventListener("click",()=>{
    filters.forEach(b=>{b.classList.remove("active");b.setAttribute("aria-selected","false");});
    btn.classList.add("active"); btn.setAttribute("aria-selected","true");
    currentFilter=btn.dataset.filter;
    render();
  });
});

// ----------------------
// Search
// ----------------------
searchInput.addEventListener("input",render);

// ----------------------
// Clear Completed
// ----------------------
clearCompletedBtn.addEventListener("click",()=>{ tasks=tasks.filter(t=>!t.completed); render(); });

// ----------------------
// Theme
// ----------------------
toggleThemeBtn.addEventListener("click",()=>{
  const dark = document.documentElement.getAttribute("data-theme")!=="dark";
  if(dark){
    document.documentElement.setAttribute("data-theme","dark");
    document.body.style.background="#0b1220"; document.body.style.color="#fff";
    toggleThemeBtn.textContent="Light";
  }else{
    document.documentElement.removeAttribute("data-theme");
    document.body.style.background="linear-gradient(180deg,#f3f6fb 0%, #f6f8fb 100%)";
    document.body.style.color="#071032";
    toggleThemeBtn.textContent="Dark";
  }
});

// ----------------------
// Dashboard Chart
// ----------------------
function renderChart(){
  if(!chartCanvas) return;
  const ctx = chartCanvas.getContext("2d");
  ctx.clearRect(0,0,chartCanvas.width,chartCanvas.height);
  const completed = tasks.filter(t=>t.completed).length;
  const active = tasks.length - completed;
  const total = tasks.length || 1;
  const width = chartCanvas.width;
  const height = chartCanvas.height;
  const completedWidth = width*(completed/total);
  const activeWidth = width*(active/total);

  // active bar
  ctx.fillStyle="#2563eb"; ctx.fillRect(0,10,activeWidth,40);
  // completed bar
  ctx.fillStyle="#06b6d4"; ctx.fillRect(activeWidth,10,completedWidth,40);

  ctx.fillStyle="#000"; ctx.font="14px Arial";
  ctx.fillText(`Active: ${active}`,10,70);
  ctx.fillText(`Completed: ${completed}`,150,70);
}

// ----------------------
// Initial render
// ----------------------
render();
})();
