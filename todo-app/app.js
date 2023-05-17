const express = require("express");
const csurf = require("tiny-csrf");
const app = express();
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser("A stupid secret string"));
app.use(csurf("b65d495c1e85110843aad9ffb9f25d1a", ["POST", "PUT", "DELETE"]));

//Set EJS as view engine

app.set("view engine","ejs");
app.use(express.static(path.join(__dirname,'public')));
const { Todo } = require("./models")

// eslint-disable-next-line no-unused-vars
app.get("/", async (request, response) => {
  const getTodos = await Todo.getTodos();
  const overdue = await Todo.overdueTodos()
  const today = await Todo.todayTodos()
  const later = await Todo.laterTodos()
  const completed=await Todo.allCompletedTodos()
  if (request.accepts("html")) {
      response.render("index", {
          title: "Todo Application",
          overdue,
          today,
          later,
          completed,
          csrfToken: request.csrfToken(),
      })
  } else {
      response.json({
        overdue,
        today,
        later,
        completed
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
    await Todo.addTodo(request.body);
    return response.redirect("/");
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.put("/todos/:id", async function (request, response) {
  
  try {
    const todo = await Todo.findByPk(request.params.id);
    const updatedTodo = await todo.setCompletionStatus(request.body.completed)
    return response.json(updatedTodo);
  } catch (error) {
    console.log(error);
    return response.status(422).json(error);
  }
});

app.delete("/todos/:id", async function (request, response) {
  console.log("Delete a todo by ID: ", request.params.id);
  try {
    await Todo.remove(request.params.id);
    return response.json({ success: true});
  } catch(error) {
    return response.status(422).json(error);
  }
});

module.exports = app;