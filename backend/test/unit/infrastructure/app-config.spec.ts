import { carregarConfig } from "../../../src/infrastructure/config/app-config";

describe("carregarConfig", () => {
  const secret = "x".repeat(32);

  it("aplica valores padrão", () => {
    expect(carregarConfig({ JWT_SECRET: secret })).toEqual({
      port: 3000,
      jwtSecret: secret,
      jwtExpiresInSeconds: 86_400,
      corsOrigins: ["http://localhost:5173"],
    });
  });

  it("lê várias origens de CORS separadas por vírgula", () => {
    const config = carregarConfig({ JWT_SECRET: secret, CORS_ORIGIN: "http://a.com, http://b.com", PORT: "8080" });
    expect(config.corsOrigins).toEqual(["http://a.com", "http://b.com"]);
    expect(config.port).toBe(8080);
  });

  it("falha cedo com segredo curto ou números inválidos", () => {
    expect(() => carregarConfig({})).toThrow(/JWT_SECRET/);
    expect(() => carregarConfig({ JWT_SECRET: secret, PORT: "abc" })).toThrow(/PORT/);
    expect(() => carregarConfig({ JWT_SECRET: secret, JWT_EXPIRES_IN_SECONDS: "-1" })).toThrow(/JWT_EXPIRES/);
  });
});
