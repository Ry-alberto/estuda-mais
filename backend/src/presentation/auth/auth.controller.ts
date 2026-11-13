import { Body, Controller, HttpCode, HttpStatus, Post } from "@nestjs/common";
import { LoginUseCase } from "../../application/auth/login.use-case";
import { RegistrarUsuarioUseCase } from "../../application/auth/registrar-usuario.use-case";
import { SessaoAutenticada } from "../../application/auth/sessao-autenticada";
import { Publico } from "../common/publico.decorator";
import { LoginDto, RegistrarDto } from "./auth.dto";

export interface SessaoResponse {
  accessToken: string;
  usuario: { id: string; nome: string; email: string };
}

// Never exposes senhaHash.
const apresentar = ({ accessToken, usuario }: SessaoAutenticada): SessaoResponse => ({
  accessToken,
  usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email },
});

@Publico()
@Controller("auth")
export class AuthController {
  constructor(
    private readonly registrarUsuario: RegistrarUsuarioUseCase,
    private readonly login: LoginUseCase,
  ) {}

  @Post("register")
  async registrar(@Body() dto: RegistrarDto): Promise<SessaoResponse> {
    return apresentar(await this.registrarUsuario.executar(dto));
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  async autenticar(@Body() dto: LoginDto): Promise<SessaoResponse> {
    return apresentar(await this.login.executar(dto.email, dto.senha));
  }
}
