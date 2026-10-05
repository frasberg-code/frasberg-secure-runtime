import request from "supertest";
import { app } from "../../src/sofia_api"; // adjust path if needed

describe("sofia_api", () => {
  test("responds to health check", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  test("rejects malformed requests", async () => {
    const res = await request(app)
      .post("/message")
      .send({ wrongField: "invalid" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  test("accepts valid message payload", async () => {
    const res = await request(app)
      .post("/message")
      .send({
        user: "MR",
        text: "Hello Sofia"
      });

    expect(res.status).toBe(200);
    expect(res.body.reply).toBeDefined();
  });

  test("handles internal errors gracefully", async () => {
    const res = await request(app)
      .post("/trigger-error") // adjust if you have a test route
      .send({});

    expect([500, 501, 503]).toContain(res.status);
    expect(res.body.error).toBeDefined();
  });

  test("returns 404 for unknown routes", async () => {
    const res = await request(app).get("/unknown-route");
    expect(res.status).toBe(404);
  });
});
