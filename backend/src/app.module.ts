import { Module, ValidationPipe } from "@nestjs/common";
import { APP_FILTER, APP_GUARD, APP_PIPE } from "@nestjs/core";
import { InfrastructureModule } from "./infrastructure/infrastructure.module";
import { AuthModule } from "./presentation/auth/auth.module";
import { DomainExceptionFilter } from "./presentation/common/domain-exception.filter";
import { HealthController } from "./presentation/common/health.controller";
import { JwtAuthGuard } from "./presentation/common/jwt-auth.guard";
import { DisciplinasModule } from "./presentation/disciplinas/disciplinas.module";
import { TarefasModule } from "./presentation/tarefas/tarefas.module";

// Global pipe, guard and filter are registered here (not in main.ts) so the
// e2e tests, which build this module directly, get exactly the same behaviour.
@Module({
  imports: [InfrastructureModule, AuthModule, DisciplinasModule, TarefasModule],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_PIPE,
      // whitelist + forbidNonWhitelisted: unknown fields (e.g. "usuarioId") are rejected,
      // so a client cannot write data into another account.
      useValue: new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_FILTER, useClass: DomainExceptionFilter },
  ],
})
export class AppModule {}
