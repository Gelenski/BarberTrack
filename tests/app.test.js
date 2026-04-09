const request = require("supertest");
const app = require("../app");

describe("GET /", () => {
  it("ok", async () => {
    const response = await request(app).get("/");

    expect(response.statusCode).toBe(200);
  });
});
