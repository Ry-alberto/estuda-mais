import { Inject, Injectable } from "@nestjs/common";
import { Usuario } from "../../domain/entities/usuario";
import { ConflitoError, ValidacaoError } from "../../domain/errors/domain.error";
import { USUARIO_REPOSITORY, UsuarioRepository } from "../../domain/repositories/usuario.repository";
import { PASSWORD_HASHER, PasswordHasher } from "../../domain/services/password-hasher";
import { TOKEN_SERVICE, TokenService } from "../../domain/services/token-service";
import { SessaoAutenticada } from "./sessao-autenticada";

export const SENHA_MIN = 6;

export interface RegistrarUsuarioDados {
  nome: string;
  email: string;
  senha: string;
}

@Injectable()
export class RegistrarUsuarioUseCase {
  constructor(
    @Inject(USUARIO_REPOSITORY) private readonly usuarios: UsuarioRepository,
    @Inject(PASSWORD_HASHER) private readonly hasher: PasswordHasher,
    @Inject(TOKEN_SERVICE) private readonly tokens: TokenService,
  ) {}

  // Flow: validate password -> reject duplicate e-mail -> hash (bcrypt) -> save -> issue JWT,
  // so the user is logged in right after signing up.
  async executar(dados: RegistrarUsuarioDados): Promise<SessaoAutenticada> {
    if (dados.senha.length < SENHA_MIN) {
      throw new ValidacaoError(`A senha precisa ter pelo menos ${SENHA_MIN} caracteres.`);
    }
    const email = Usuario.normalizarEmail(dados.email);
    if (await this.usuarios.buscarPorEmail(email)) {
      throw new ConflitoError("Já existe uma conta com este e-mail.");
    }

    const senhaHash = await this.hasher.gerarHash(dados.senha);
    const usuario = await this.usuarios.salvar(Usuario.criar({ nome: dados.nome, email, senhaHash }));
    const accessToken = await this.tokens.gerar({ sub: usuario.id, email: usuario.email });
    return { accessToken, usuario };
  }
}
