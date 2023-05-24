const express = require("express");
const csurf = require("tiny-csrf");
const { Todo, User } = require("./models");
const bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
const path = require("path");

const app = express();

const passport = require("passport");
const connectEnsureLogin = require("connect-ensure-login");
const session = require("express-session");
const flash = require("connect-flash");
const LocalStrategy = require("passport-local");
const bcrypt = require("bcrypt");

const saltRounds = 10;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser("A stupid secret string"));
app.use(csurf("b65d495c1e85110843aad9ffb9f25d1a", ["POST", "PUT", "DELETE"]));

app.use(
  session({
    secret: "my-super-secret-key-6521894321898413",
    cookie: {
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use(function (request, response, next) {
  response.locals.messages = request.flash();
  next();
});
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));

const checkLogin = (req, res, next) => {
  if (req.isAuthenticated()) {
    res.redirect("/todos");
  } else {
    return next();
  }
};

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      User.findOne({ where: { email: username } })
        .then(async function (user) {
          const result = await bcrypt.compare(password, user.password);
          if (result) {
            return done(null, user);
          } else {
            return done(null, false, { message: "Invalid Password" });
          }
        })
        .catch((error) => {
          console.log(error);
          return done(null, false, { message: "Invalid Email" });
        });
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  User.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((error) => {
      done(error);
    });
});

//Get Home Page
app.get("/", checkLogin,async (request, response) => {
  response.render("index", {
    title: "Todo Application",
    csrfToken: request.csrfToken(),
  });
});

//Get Signup Page
app.get("/signup",checkLogin, (request, response) => {
  response.render("signup", {
    title: "Signup",
    csrfToken: request.csrfToken(),
  });
});

//Post Signup Page
app.post("/users", async (request, response) => {
  const hashedPwd = await bcrypt.hash(request.body.password, saltRounds);
  try {
    const user = await User.create({
      firstName: request.body.firstName,
      lastName: request.body.lastname,
      email: request.body.email,
      password: hashedPwd,
    });
    request.login(user, (err) => {
      if (err) {
        console.log(err);
        response.locals.message = request.flash("error", "Signup failed");
        return;
      }
      response.redirect("/todos");
    });
  } catch (error) {
    console.log(error);
    response.locals.message = request.flash("error", error.errors[0].message);
    response.redirect("/signup");
  }
});

//Get Login Page
app.get("/login",checkLogin, (request, response) => {
  response.render("login", { title: "Login", csrfToken: request.csrfToken() });
});

//Post Login Page
app.post(
  "/session",
  passport.authenticate("local", {
    failureRedirect: "/login",
    failureFlash: true,
  }),
  (request, response) => {
    response.redirect("/todos");
  }
);

//Get Todos Page
app.get(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async (request, response) => {
    const loggedInUser = request.user.id;
    const getTodos = await Todo.getTodos(loggedInUser);
    const overdue = await Todo.overdueTodos(loggedInUser);
    const today = await Todo.todayTodos(loggedInUser);
    const later = await Todo.laterTodos(loggedInUser);
    const completed = await Todo.allCompletedTodos(loggedInUser);
    if (request.accepts("html")) {
      response.render("todos", {
        title: "Todo Application",
        overdue,
        today,
        later,
        completed,
        csrfToken: request.csrfToken(),
      });
    } else {
      response.json({
        overdue,
        today,
        later,
        completed,
      });
    }
  }
);

//Get Todos Page
app.post(
  "/todos",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    console.log("Creating a todo", request.body);
    try {
      await Todo.addTodo(
        request.body.title,
        request.body.dueDate,
        request.user.id
      );
      response.locals.message = request.flash("success", "Todo created");
      return response.redirect("/todos");
    } catch (error) {
      console.log(error);
      response.locals.message = request.flash("error", error.errors[0].message);
      return response.redirect("/todos");
    }
  }
);

//Update Todos Id
app.put(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      const todo = await Todo.findByPk(request.params.id);
      const updatedTodo = await todo.setCompletionStatus(
        request.body.completed
      );
      return response.status(200).json(updatedTodo);
    } catch (error) {
      console.log(error);
      response.locals.message = request.flash(
        "error",
        "Failed to update the todo"
      );
      return response.status(422).json(error);
    }
  }
);

//Delete Todos Id
app.delete(
  "/todos/:id",
  connectEnsureLogin.ensureLoggedIn(),
  async function (request, response) {
    try {
      await Todo.remove(request.params.id, request.user.id);
      return response.status(200).json({ message: "Deleted the todo" });
    } catch (error) {
      console.log(error);
      response.locals.message = request.flash(
        "error",
        "Failed to delete the todo"
      );
      return response.status(422).json(error);
    }
  }
);

//Get Signout Page
app.get("/signout", (request, response, next) => {
  request.logout((err) => {
    if (err) {
      return next(err);
    }
    response.redirect("/");
  });
});

module.exports = app;
