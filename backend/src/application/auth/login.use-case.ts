import { Inject, Injectable } from "@nestjs/common";
import { Usuario } from "../../domain/entities/usuario";
import { CredenciaisInvalidasError } from "../../domain/errors/domain.error";
import { USUARIO_REPOSITORY, UsuarioRepository } from "../../domain/repositories/usuario.repository";
import { PASSWORD_HASHER, PasswordHasher } from "../../domain/services/password-hasher";
import { TOKEN_SERVICE, TokenService } from "../../domain/services/token-service";
import { SessaoAutenticada } from "./sessao-autenticada";

@Injectable()
export class LoginUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  // Sequence diagram RF01: buscarPorEmail -> bcrypt.compare -> generate JWT.
  // Unknown e-mail and wrong password return the same error, so the API
  // does not reveal which e-mails have an account.
  async executar(email: string, senha: string): Promise<SessaoAutenticada> {
    const usuario = await this.usuarios.buscarPorEmail(Usuario.normalizarEmail(email));
    if (!usuario || !(await this.hasher.comparar(senha, usuario.senhaHash))) {
      throw new CredenciaisInvalidasError();
    }
    const accessToken = await this.tokens.gerar({ sub: usuario.id, email: usuario.email });
    return { accessToken, usuario };
  }
}
