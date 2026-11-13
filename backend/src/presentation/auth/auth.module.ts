import { Module } from "@nestjs/common";
import { LoginUseCase } from "../../application/auth/login.use-case";
import { RegistrarUsuarioUseCase } from "../../application/auth/registrar-usuario.use-case";
import { AuthController } from "./auth.controller";

@Module({
  controllers: [AuthController],
  providers: [RegistrarUsuarioUseCase, LoginUseCase],
})
export class AuthModule {}
