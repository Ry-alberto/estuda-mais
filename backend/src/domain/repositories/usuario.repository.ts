import { Usuario } from "../entities/usuario";

// Injection token: use cases depend on this interface, never on Prisma (DIP).
export const USUARIO_REPOSITORY = "UsuarioRepository";

export interface UsuarioRepository {
  buscarPorEmail(email: string): Promise<Usuario | null>;
  salvar(usuario: Usuario): Promise<Usuario>;
}
