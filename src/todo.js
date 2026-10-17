// Todo list logic. Pure functions over an array of { id, title, done }.
// The page (src/app.js) only renders what these return; test/todo.test.js covers them.

// Where the page keeps the list between loads; browser storage only.
export const STORAGE_KEY = "orbi-demo.todos";

export function addTodo(todos, title) {
  const text = String(title).trim();
  if (text === "") return todos;
  const id = todos.reduce((max, t) => Math.max(max, t.id), 0) + 1;
  return [...todos, { id, title: text, done: false }];
}

export function toggleTodo(todos, id) {
  return todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
}

export function removeTodo(todos, id) {
  return todos.filter((t) => t.id !== id);
}

export function clearCompleted(todos) {
  return todos.filter((t) => !t.done);
}

export function remainingCount(todos) {
  return todos.filter((t) => !t.done).length;
}

export function visibleTodos(todos, filter) {
  if (filter === "active") return todos.filter((t) => !t.done);
  if (filter === "done") return todos.filter((t) => t.done);
  return todos;
}

function isTodo(todo) {
  return todo !== null && typeof todo === "object" && typeof todo.id === "number" && typeof todo.title === "string" && typeof todo.done === "boolean";
}

// Read the saved list. Anything missing, unreadable or not a valid todo list
// returns null so the page can fall back to the sample tasks and keep working.
export function loadTodos(storage) {
  let raw;
  try {
    raw = storage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
  if (raw === null) return null;
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!Array.isArray(data)) return null;
  if (!data.every(isTodo)) return null;
  return data;
}

// Save the list for the next page load. Blocked or full storage only loses the
// saved copy; the list itself keeps working in memory.
export function saveTodos(storage, todos) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // Nothing else to do: the page stays usable without persistence.
  }
}
