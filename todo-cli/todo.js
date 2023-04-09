const todoList = () => {
  let all = [];
  const today = new Date().toISOString().slice(0, 10);
  const add = (todoItem) => {
    all.push(todoItem);
  };
  const markAsComplete = (index) => {
    all[index].completed = true;
  };
  const overdue = () => {
    return all.filter((items) => items.dueDate < today);
  };

  const dueToday = () => {
    return all.filter((items) => items.dueDate === today);
  };

  const dueLater = () => {
    return all.filter((items) => items.dueDate > today);
  };

  const toDisplayableList = (list) => {
    return list
      .map((item) => {
        const checkbox = item.completed ? "[x]" : "[ ]";
        const date = item.dueDate === today ? "" : ` ${item.dueDate}`;
        return `${checkbox} ${item.title}${date}`;
      })
      .join("\n");
  };
  return {
    all,
    add,
    markAsComplete,
    overdue,
    dueToday,
    dueLater,
    toDisplayableList,
  };
};

module.exports = todoList;
