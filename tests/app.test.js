const request = require("supertest");
const app = require("../app");

describe("GET /", () => {
  it("deve retornar hello world", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({
      message: "Hello World!",
    });
  });
});
