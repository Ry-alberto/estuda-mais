import { IsEmail, IsNotEmpty, IsString, MaxLength, MinLength } from "class-validator";
import { SENHA_MIN } from "../../application/auth/registrar-usuario.use-case";

// bcrypt only uses the first 72 bytes of the password; longer input is rejected
// instead of being silently truncated.
const SENHA_MAX = 72;

export class RegistrarDto {
  @IsString()
  @IsNotEmpty({ message: "Informe seu nome." })
  @MaxLength(100)
  nome: string;

  @IsEmail({}, { message: "Informe um e-mail válido." })
  @MaxLength(254)
  email: string;

  @IsString()
  @MinLength(SENHA_MIN, { message: `A senha precisa ter pelo menos ${SENHA_MIN} caracteres.` })
  @MaxLength(SENHA_MAX)
  senha: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: "Informe seu e-mail." })
  email: string;

  @IsString()
  @IsNotEmpty({ message: "Informe sua senha." })
  senha: string;
}
