import { LoginUseCase } from "../../../src/application/auth/login.use-case";
import { RegistrarUsuarioUseCase } from "../../../src/application/auth/registrar-usuario.use-case";
import { ConflitoError, CredenciaisInvalidasError, ValidacaoError } from "../../../src/domain/errors/domain.error";
import { FakePasswordHasher, FakeTokenService, InMemoryUsuarioRepository } from "../../support/in-memory";

describe("Autenticação (RF01)", () => {
  let usuarios: InMemoryUsuarioRepository;
  let registrar: RegistrarUsuarioUseCase;
  let login: LoginUseCase;

  beforeEach(() => {
    usuarios = new InMemoryUsuarioRepository();
    const hasher = new FakePasswordHasher();
    const tokens = new FakeTokenService();
    registrar = new RegistrarUsuarioUseCase(usuarios, hasher, tokens);
    login = new LoginUseCase(usuarios, hasher, tokens);
  });

  it("cadastra guardando só o hash da senha e devolve um token", async () => {
    const sessao = await registrar.executar({ nome: "Ana", email: "Ana@Mail.com", senha: "segredo1" });
    expect(sessao.accessToken).toBe(`token:${sessao.usuario.id}:ana@mail.com`);
    expect(sessao.usuario.senhaHash).toBe("hash:segredo1");
    expect(usuarios.itens.size).toBe(1);
  });

  it("não permite dois cadastros com o mesmo e-mail (ignorando maiúsculas)", async () => {
    await registrar.executar({ nome: "Ana", email: "ana@mail.com", senha: "segredo1" });
    await expect(registrar.executar({ nome: "Outra", email: "ANA@mail.com", senha: "segredo2" })).rejects.toThrow(
      ConflitoError,
    );
  });

  it("exige senha com pelo menos 6 caracteres", async () => {
    await expect(registrar.executar({ nome: "Ana", email: "ana@mail.com", senha: "123" })).rejects.toThrow(
      ValidacaoError,
    );
  });

  it("faz login com credenciais corretas", async () => {
    await registrar.executar({ nome: "Ana", email: "ana@mail.com", senha: "segredo1" });
    const sessao = await login.executar(" ANA@mail.com ", "segredo1");
    expect(sessao.usuario.nome).toBe("Ana");
    expect(sessao.accessToken).toContain("token:");
  });

  it("recusa senha errada e e-mail inexistente com o mesmo erro", async () => {
    await registrar.executar({ nome: "Ana", email: "ana@mail.com", senha: "segredo1" });
    await expect(login.executar("ana@mail.com", "errada")).rejects.toThrow(CredenciaisInvalidasError);
    await expect(login.executar("ninguem@mail.com", "segredo1")).rejects.toThrow(CredenciaisInvalidasError);
  });
});
