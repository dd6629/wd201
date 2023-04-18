"use strict";
const { Model } = require("sequelize");
const { Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static async addTask(params) {
      return await Todo.create(params);
    }
    static async showList() {
      console.log("My Todo List \n");

      console.log("Overdue");
      let overdueTasks = await Todo.overdue();
      overdueTasks = overdueTasks.map((task) => task.displayableString());
      console.log(overdueTasks.join("\n"));
      console.log("\n");

      console.log("Due Today");
      let dueTodayTasks = await Todo.dueToday();
      dueTodayTasks = dueTodayTasks.map((task) => task.displayableString());
      console.log(dueTodayTasks.join("\n"));
      console.log("\n");

      console.log("Due Later");
      let dueLaterTasks = await Todo.dueLater();
      dueLaterTasks = dueLaterTasks.map((task) => task.displayableString());
      console.log(dueLaterTasks.join("\n"));
    }

    static async overdue() {
      const currentDate = new Date().setDate(new Date().getDate() - 1);
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.lt]: currentDate,
          },
        },
      });
    }

    static async dueToday() {
      const currentDate = new Date();
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.eq]: currentDate,
          },
        },
      });
    }

    static async dueLater() {
      const currentDate = new Date().setDate(new Date().getDate() + 1);
      return await Todo.findAll({
        where: {
          dueDate: {
            [Op.gt]: currentDate,
          },
        },
      });
    }

    static async markAsComplete(id) {
      const task = await Todo.update(
        { completed: true },
        {
          where: {
            id: id,
          },
        }
      );
      return task;
    }

    displayableString() {
      let checkbox = this.completed ? "[x]" : "[ ]";
      if (this.dueDate.split("-")[2] === new Date().getDate().toString()) {
        const sentence = `${this.id}. ${checkbox.trim()} ${this.title.trim()}`;
        return sentence.trim();
      }
      const sentence = `${
        this.id
      }. ${checkbox.trim()} ${this.title.trim()} ${this.dueDate.trim()}`;
      return sentence.trim();
    }
  }
  Todo.init(
    {
      title: DataTypes.STRING,
      dueDate: DataTypes.DATEONLY,
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
