import { SetMetadata } from "@nestjs/common";

export const ROTA_PUBLICA = "rotaPublica";

// The JWT guard is global (secure by default); only routes marked @Publico() skip it.
export const Publico = (): MethodDecorator & ClassDecorator => SetMetadata(ROTA_PUBLICA, true);
