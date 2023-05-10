const express = require("express");
const app = express();
const { Todo } = require("./models");
const bodyParser = require("body-parser");
const path = require("path");
app.use(bodyParser.json());

//Set EJS as view engine

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,'public')));

app.get("/", async (request, response) => {
  const getTodos = await Todo.getTodos();
  const past = await Todo.pastTodos()
  const present = await Todo.presentTodos()
  const future = await Todo.futureTodos()
  if (request.accepts("html")) {
      response.render("index", {
          past,
          present,
          future
      })
  } else {
      response.json({
          getTodos,
      })
  }
});


app.get("/todos", async function (_request, response) {
  console.log("Processing list of all Todos ...");
  try {
    const todos = await Todo.getTodos();
    return response.json(todos);
    } catch (error) {
    console.log(error);
    return response.status(422).json(error);
    }
});

app.get("/todos/:id", async function (request, response) {
  try {
    const todo = await Todo.findByPk(request.params.id);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.post("/todos", async function (request, response) {
  try {
    const todo = await Todo.addTodo(request.body);
    return response.json(todo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id/markAsCompleted", async function (request, response) {
  const todo = await Todo.findByPk(request.params.id);
  try {
    const updatedTodo = await todo.markAsCompleted();
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("We have to delete a Todo with ID: ", request.params.id);
  try {
    const result = await Todo.destroy({
    where: {
      id: request.params.id,
    },
  });
  return response.send(result === 1);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

module.exports = app;
