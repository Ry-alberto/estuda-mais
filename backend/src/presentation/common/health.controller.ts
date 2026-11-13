import { Controller, Get } from "@nestjs/common";
import { Publico } from "./publico.decorator";

// Used by the Docker healthcheck and by hosting providers.
@Controller("health")
export class HealthController {
  @Publico()
  @Get()
  verificar(): { status: "ok" } {
    return { status: "ok" };
  }
}
