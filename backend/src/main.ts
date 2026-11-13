import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { APP_CONFIG, AppConfig } from "./infrastructure/config/app-config";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<AppConfig>(APP_CONFIG);

  // The front-end runs on another origin (Vite dev server / Vercel), so CORS is
  // limited to the origins listed in CORS_ORIGIN.
  app.enableCors({ origin: config.corsOrigins });
  app.enableShutdownHooks();

  await app.listen(config.port, "0.0.0.0");
}

void bootstrap();
