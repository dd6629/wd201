'use strict';
const {
  Model
} = require('sequelize');
const moment = require('moment');
const { Op } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Todo extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }

    static addTodo({ title, dueDate }) {
      return this.create({ title: title, dueDate: dueDate, completed: false})
    }

    static getTodos() {
      return this.findAll();
    }

    static overdueTodos() {
      return this.findAll({
          where: {
              dueDate: {
                  [Op.lt]:moment().toDate()
              },
              completed:{
              [Op.eq]:false,
              },
          }
      })
  }

  static todayTodos() {
      return this.findAll({
          where: {
              dueDate: {
                  [Op.eq]: moment().toDate()
              },
              completed: {
                [Op.eq]: false,
              },
          }
      })
  }

  static laterTodos() {
      return this.findAll({
          where: {
              dueDate: {
                  [Op.gt]: moment().toDate()
              },
              completed: {
                [Op.eq]: false,
              },
          }
      })
  }

  static allCompletedTodos(){
    return this.findAll({
      where: {
        completed: {
          [Op.eq]: true,
        },
      },
    });
  }

  static async remove(id){
    return this.destroy({
      where: {
        id,
      },
    });
  }

  setCompletionStatus(bool){
    if (bool) {
      return this.update({ completed: true });
    } else {
      return this.update({ completed: false });
    }
  }


   
  }
  Todo.init({
    title: DataTypes.STRING,
    dueDate: DataTypes.DATEONLY,
    completed: DataTypes.BOOLEAN
  }, {
    sequelize,
    modelName: 'Todo',
  });
  return Todo;
};