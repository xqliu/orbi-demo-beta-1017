import { test } from "node:test";
import assert from "node:assert/strict";
import { addTodo, toggleTodo, removeTodo, clearCompleted, visibleTodos, remainingCount, loadTodos, saveTodos, STORAGE_KEY } from "../src/todo.js";

function memoryStorage(initial) {
  const entries = new Map(initial ? [[STORAGE_KEY, initial]] : []);
  return {
    getItem: (key) => entries.get(key) ?? null,
    setItem: (key, value) => entries.set(key, value),
  };
}

test("addTodo appends a trimmed title with the next id", () => {
  const one = addTodo([], "  Buy milk ");
  assert.deepEqual(one, [{ id: 1, title: "Buy milk", done: false }]);
  assert.equal(addTodo(one, "Walk dog")[1].id, 2);
});

test("addTodo ignores an empty title", () => {
  assert.deepEqual(addTodo([], "   "), []);
});

test("toggleTodo flips only the matching todo", () => {
  const todos = addTodo(addTodo([], "a"), "b");
  const toggled = toggleTodo(todos, 2);
  assert.equal(toggled[0].done, false);
  assert.equal(toggled[1].done, true);
});

test("removeTodo drops the matching todo", () => {
  const todos = addTodo(addTodo([], "a"), "b");
  assert.deepEqual(removeTodo(todos, 1).map((t) => t.title), ["b"]);
});

test("clearCompleted removes done todos and keeps active ones in order", () => {
  const todos = toggleTodo(addTodo(addTodo(addTodo([], "a"), "b"), "c"), 2);
  assert.deepEqual(clearCompleted(todos).map((t) => t.title), ["a", "c"]);
});

test("clearCompleted leaves a list without completed todos unchanged", () => {
  const todos = addTodo(addTodo([], "a"), "b");
  assert.deepEqual(clearCompleted(todos), todos);
});

test("remainingCount counts only todos that are not done", () => {
  const todos = toggleTodo(addTodo(addTodo(addTodo([], "a"), "b"), "c"), 2);
  assert.equal(remainingCount(todos), 2);
  assert.equal(remainingCount([]), 0);
  assert.equal(remainingCount(todos.map((todo) => ({ ...todo, done: true }))), 0);
});

test("visibleTodos filters by active and done", () => {
  const todos = toggleTodo(addTodo(addTodo([], "a"), "b"), 1);
  assert.deepEqual(visibleTodos(todos, "active").map((t) => t.title), ["b"]);
  assert.deepEqual(visibleTodos(todos, "done").map((t) => t.title), ["a"]);
  assert.equal(visibleTodos(todos, "all").length, 2);
});

test("saveTodos then loadTodos keeps the list and its done state", () => {
  const storage = memoryStorage();
  const todos = toggleTodo(addTodo(addTodo(addTodo([], "a"), "b"), "c"), 2);
  saveTodos(storage, todos);
  assert.deepEqual(loadTodos(storage), todos);
});

test("loadTodos returns null when nothing was saved", () => {
  assert.equal(loadTodos(memoryStorage()), null);
});

test("loadTodos returns null for stored JSON that is not a todo list", () => {
  assert.equal(loadTodos(memoryStorage("not json")), null);
  assert.equal(loadTodos(memoryStorage('{"id":1}')), null);
  assert.equal(loadTodos(memoryStorage("[null]")), null);
  assert.equal(loadTodos(memoryStorage('["a"]')), null);
  assert.equal(loadTodos(memoryStorage('[{"id":"1","title":"a","done":false}]')), null);
  assert.equal(loadTodos(memoryStorage('[{"id":1,"title":2,"done":false}]')), null);
  assert.equal(loadTodos(memoryStorage('[{"id":1,"title":"a","done":"yes"}]')), null);
});

test("storage failures do not break the list", () => {
  const blocked = {
    getItem() { throw new Error("storage blocked"); },
    setItem() { throw new Error("storage blocked"); },
  };
  assert.equal(loadTodos(blocked), null);
  assert.doesNotThrow(() => saveTodos(blocked, addTodo([], "a")));
});
