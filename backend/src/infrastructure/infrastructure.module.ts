import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { DISCIPLINA_REPOSITORY } from "../domain/repositories/disciplina.repository";
import { TAREFA_REPOSITORY } from "../domain/repositories/tarefa.repository";
import { USUARIO_REPOSITORY } from "../domain/repositories/usuario.repository";
import { PASSWORD_HASHER } from "../domain/services/password-hasher";
import { TOKEN_SERVICE } from "../domain/services/token-service";
import { APP_CONFIG, AppConfig, carregarConfig } from "./config/app-config";
import { PrismaModule } from "./prisma/prisma.module";
import { PrismaDisciplinaRepository } from "./repositories/prisma-disciplina.repository";
import { PrismaTarefaRepository } from "./repositories/prisma-tarefa.repository";
import { PrismaUsuarioRepository } from "./repositories/prisma-usuario.repository";
import { BcryptPasswordHasher } from "./security/bcrypt-password-hasher";
import { JwtTokenService } from "./security/jwt-token.service";

const configProvider = { provide: APP_CONFIG, useFactory: (): AppConfig => carregarConfig() };

@Global()
@Module({
  providers: [configProvider],
  exports: [configProvider],
})
export class ConfigModule {}

// Composition root of the Clean Architecture: the only place that knows which
// concrete class (Prisma, bcrypt, JWT) implements each domain interface.
// Tests swap these bindings for in-memory versions (Liskov substitution).
@Global()
@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [APP_CONFIG],
      useFactory: (config: AppConfig) => ({
        secret: config.jwtSecret,
        signOptions: { expiresIn: config.jwtExpiresInSeconds },
      }),
    }),
  ],
  providers: [
    { provide: USUARIO_REPOSITORY, useClass: PrismaUsuarioRepository },
    { provide: DISCIPLINA_REPOSITORY, useClass: PrismaDisciplinaRepository },
    { provide: TAREFA_REPOSITORY, useClass: PrismaTarefaRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: TOKEN_SERVICE, useClass: JwtTokenService },
  ],
  exports: [USUARIO_REPOSITORY, DISCIPLINA_REPOSITORY, TAREFA_REPOSITORY, PASSWORD_HASHER, TOKEN_SERVICE],
})
export class InfrastructureModule {}
