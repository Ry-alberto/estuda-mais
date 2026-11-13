import { Request } from "express";
import { TokenPayload } from "../../domain/services/token-service";

export interface RequestAutenticada extends Request {
  usuario?: TokenPayload;
}
