"use strict";
const { Model } = require("sequelize");
const moment = require("moment");
const { Op } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Todo.belongsTo(models.User, {
        foreignKey: "userId",
      });
    }

    static addTodo(title, dueDate, userId) {
      return this.create({
        title,
        dueDate,
        completed: false,
        userId,
      });
    }

    static getTodos() {
      return this.findAll();
    }

    static async overdueTodos(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.lt]: moment().toDate(),
          },
          userId: {
            [Op.eq]: userId,
          },
          completed: {
            [Op.eq]: false,
          },
        },
      });
    }

    static async todayTodos(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.eq]: moment().toDate(),
          },
          userId: {
            [Op.eq]: userId,
          },
          completed: {
            [Op.eq]: false,
          },
        },
      });
    }

    static async laterTodos(userId) {
      return this.findAll({
        where: {
          dueDate: {
            [Op.gt]: moment().toDate(),
          },
          userId: {
            [Op.eq]: userId,
          },
          completed: {
            [Op.eq]: false,
          },
        },
      });
    }

    static async allCompletedTodos(userId) {
      return this.findAll({
        where: {
          completed: {
            [Op.eq]: true,
          },
          userId: {
            [Op.eq]: userId,
          },
        },
      });
    }

    static async remove(id, userId) {
      return this.destroy({
        where: {
          id: {
            [Op.eq]: id,
          },
          userId: {
            [Op.eq]: userId,
          },
        },
      });
    }

    setCompletionStatus(bool) {
      if (bool) {
        return this.update({ completed: true });
      } else {
        return this.update({ completed: false });
      }
    }
  }
  Todo.init(
    {
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Title cannot be empty",
          },
          notNull: {
            msg: "Title cannot be empty",
          },
        },
      },
      dueDate: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          notEmpty: {
            msg: "Due date cannot be empty",
          },
          notNull: {
            msg: "Due date cannot be empty",
          },
        },
      },
      completed: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Todo",
    }
  );
  return Todo;
};
