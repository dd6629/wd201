/* eslint-disable no-undef */

const request = require("supertest");
const cheerio = require("cheerio");

const db = require("../models/index");
const app = require("../app");

const moment = require("moment")
const date=moment()

let server, agent;

const extractCSRF = (html) => {
  const $ = cheerio.load(html.text);
  return $('[name="_csrf"]').val();
};


describe("Todo Application", function () {
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
    server = app.listen(7000, () => { });
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

  test("Create a new todo", async () => {
    const response = await agent.get("/");
    const csrfToken = extractCSRF(response);
    const response1 = await agent.post("/todos").send({
      title: "Buy milk",
      dueDate: date.format("YYYY-MM-DD"),
      completed: false,
      _csrf: csrfToken,
    });
    expect(response1.statusCode).toBe(302);
  });

  test("Update a given todo as complete", async () => {
    const response = await agent.get("/");
    const csrfToken = extractCSRF(response);
    let $ = cheerio.load(response.text);
    let completionStatus=$('input[type="checkbox"]').prop("checked");
    expect(completionStatus).toBe(false);
    const todoId=$('input[type="checkbox"]').attr("id");
    await agent.put(`/todos/${todoId.split("-")[1]}`).send({
      completed: true,
      _csrf: csrfToken,
    });
    const response2=await agent.get("/")
    $ = cheerio.load(response2.text);
    completionStatus=$('input[type="checkbox"]').prop("checked");
    expect(completionStatus).toBe(true);
  });

  test("Update a given todo as in-complete", async () => {
    const response = await agent.get("/");
    const csrfToken = extractCSRF(response);
    let $ = cheerio.load(response.text);
    let completionStatus=$('input[type="checkbox"]').prop("checked");
    expect(completionStatus).toBe(true);
    const todoId=$('input[type="checkbox"]').attr("id");
    await agent.put(`/todos/${todoId.split("-")[1]}`).send({
      completed: false,
      _csrf: csrfToken,
    });
    const response2=await agent.get("/")
    $ = cheerio.load(response2.text);
    completionStatus=$('input[type="checkbox"]').prop("checked");
    expect(completionStatus).toBe(false);
  });

  test("Delete a given todo ", async () => {
    const response = await agent.get("/");
    const csrfToken = extractCSRF(response);
    let $ = cheerio.load(response.text);
    let todoId=$('input[type="checkbox"]').attr("id");
    expect(todoId.split("-")[1].length).toBe(1);
    await agent.delete(`/todos/${todoId.split("-")[1]}`).send({
      completed: true,
      _csrf: csrfToken,
    });
    const response2=await agent.get("/")
    $ = cheerio.load(response2.text);
    todoId=$('input[type="checkbox"]').attr("id");
    expect(todoId).toBe(undefined);
  });
});