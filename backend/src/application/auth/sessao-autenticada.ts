import { Usuario } from "../../domain/entities/usuario";

export interface SessaoAutenticada {
  accessToken: string;
  usuario: Usuario;
}
