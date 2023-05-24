/* eslint-disable no-undef */

const request = require("supertest");
const cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

const moment = require("moment");
const date = moment();

let server, agent;

const extractCSRF = (html) => {
  const $ = cheerio.load(html.text);
  return $('[name="_csrf"]').val();
};

const login = async (agent, username, password) => {
  let res = await agent.get("/login");
  let csrfToken = extractCSRF(res);
  res = await agent.post("/session").send({
    email: username,
    password: password,
    _csrf: csrfToken,
  });
};

describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(7000, () => {});
    agent = request.agent(server);
  });

  afterAll(async () => {
    try {
      await db.sequelize.close();
      await server.close();
    } catch (error) {
      console.log(error);
    }
  });

  test("Sign up as user 1", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCSRF(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "One",
      email: "test1@test.com",
      password: "1",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out as user 1", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Sign up as user 2", async () => {
    let res = await agent.get("/signup");
    const csrfToken = extractCSRF(res);
    res = await agent.post("/users").send({
      firstName: "Test",
      lastName: "Two",
      email: "test2@test.com",
      password: "2",
      _csrf: csrfToken,
    });
    expect(res.statusCode).toBe(302);
  });

  test("Sign out as user 1", async () => {
    let res = await agent.get("/todos");
    expect(res.statusCode).toBe(200);
    res = await agent.get("/signout");
    expect(res.statusCode).toBe(302);
    res = await agent.get("/todos");
    expect(res.statusCode).toBe(302);
  });

  test("Create a new todo as user 1", async () => {
    const agent = request.agent(server);
    await login(agent, "test1@test.com", "1");
    const response = await agent.get("/todos");
    const csrfToken = extractCSRF(response);
    const response1 = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: date.format("YYYY-MM-DD"),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response1.statusCode).toBe(302);
  });

  test("Update a given todo as complete as user 1", async () => {
    const agent = request.agent(server);
    await login(agent, "test1@test.com", "1");
    const response = await agent.get("/todos");
    const csrfToken = extractCSRF(response);
    let $ = cheerio.load(response.text);
    let completionStatus = $('input[type="checkbox"]').prop("checked");
    expect(completionStatus).toBe(false);
    const todoId = $('input[type="checkbox"]').attr("id");
    await agent.put(`/todos/${todoId.split("-")[1]}`).send({
      completed: true,
      _csrf: csrfToken,
    });
    const response2 = await agent.get("/todos");
    $ = cheerio.load(response2.text);
    completionStatus = $('input[type="checkbox"]').prop("checked");
    expect(completionStatus).toBe(true);
  });

  test("Delete a given todo as user 1", async () => {
    const agent = request.agent(server);
    await login(agent, "test1@test.com", "1");
    const response = await agent.get("/todos");
    const csrfToken = extractCSRF(response);
    let $ = cheerio.load(response.text);
    let todoId = $('input[type="checkbox"]').attr("id");
    expect(todoId.split("-")[1].length).toBe(1);
    await agent.delete(`/todos/${todoId.split("-")[1]}`).send({
      _csrf: csrfToken,
    });
    const response2 = await agent.get("/todos");
    $ = cheerio.load(response2.text);
    todoId = $('input[type="checkbox"]').attr("id");
    expect(todoId).toBe(undefined);
  });

  test("user 2 cannot update user 1 todo", async () => {
    const agent = request.agent(server);
    await login(agent, "test1@test.com", "1");
    const response = await agent.get("/todos");
    const csrfToken = extractCSRF(response);
    const response1 = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: date.format("YYYY-MM-DD"),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response1.statusCode).toBe(302);
    const response2 = await agent.get("/todos");
    let $ = cheerio.load(response2.text);
    let completionStatus = $('input[type="checkbox"]').prop("checked");
    expect(completionStatus).toBe(false);
    const todoId = $('input[type="checkbox"]').attr("id");
    await agent.get("/signout");
    await login(agent, "test2@test.com", "2");
    const response3 = await agent.get("/todos");
    const csrfToken1 = extractCSRF(response2);
    await agent.put(`/todos/${todoId.split("-")[1]}`).send({
      completed: true,
      _csrf: csrfToken1,
    });
    await agent.get("/signout");
    await login(agent, "test1@test.com", "1");
    const response4 = await agent.get("/todos");
    $ = cheerio.load(response4.text);
    completionStatus = $('input[type="checkbox"]').prop("checked");
    expect(completionStatus).toBe(false);
  });

  test("user 2 cannot delete user 1 todo", async () => {
    const agent = request.agent(server);
    await login(agent, "test1@test.com", "1");
    const response = await agent.get("/todos");
    let $ = cheerio.load(response.text);
    let todoId = $('input[type="checkbox"]').attr("id");
    expect(todoId.split("-")[1].length).toBe(1);
    await agent.get("/signout");
    await login(agent, "test2@test.com", "2");
    const response1 = await agent.get("/todos");
    const csrfToken = extractCSRF(response1);
    const response2 = await agent
      .delete(`/todos/${todoId.split("-")[1]}`)
      .send({
        _csrf: csrfToken,
      });
    await agent.get("/signout");
    await login(agent, "test1@test.com", "1");
    const response3 = await agent.get("/todos");
    $ = cheerio.load(response3.text);
    todoId = $('input[type="checkbox"]').attr("id");
    expect(todoId.split("-")[1].length).toBe(1);
  });
});
