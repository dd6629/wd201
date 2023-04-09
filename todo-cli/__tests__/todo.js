const todoList = require("../todo");
const { all, markAsComplete, add, overdue, dueToday, dueLater } = todoList();
describe("TodoList Test Suite", () => {
  const yesterday = new Date(new Date().getTime() - 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date(new Date().getTime() + 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  beforeAll(() => {
    add({
      title: "Go to movie",
      completed: false,
      dueDate: yesterday,
    });
    add({
      title: "Buy Milk",
      completed: false,
      dueDate: today,
    });
    add({
      title: "repair bike",
      completed: false,
      dueDate: tomorrow,
    });
  });

  test("Should add new todo", () => {
    const todoItemsCount = all.length;
    add({
      title: "add new todo",
      completed: false,
      dueDate: today,
    });
    expect(all.length).toBe(todoItemsCount + 1);
  });

  test("Should mark a todo as completed", () => {
    expect(all[0].completed).toBe(false);
    markAsComplete(0);
    expect(all[0].completed).toBe(true);
  });

  test("Should retrieve overdue items", () => {
    const overdueItemsCount = overdue().length;
    add({
      title: "Overdue todo",
      completed: false,
      dueDate: yesterday,
    });
    expect(overdue().length).toEqual(overdueItemsCount + 1);
  });

  test("Should retrieve due today items", () => {
    const dueTodayItemsCount = dueToday().length;
    add({
      title: "Due today todo",
      completed: false,
      dueDate: today,
    });
    expect(dueToday().length).toEqual(dueTodayItemsCount + 1);
  });

  test("Should retrieve due later items", () => {
    const dueLaterItems = dueLater().length;
    add({
      title: "Due later todo",
      completed: false,
      dueDate: tomorrow,
    });
    expect(dueLater().length).toBe(dueLaterItems + 1);
  });
});
