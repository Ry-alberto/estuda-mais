import { IsNotEmpty, IsOptional, IsString, Matches, MaxLength } from "class-validator";

const COR_REGEX = /^#[0-9a-fA-F]{6}$/;
const COR_MENSAGEM = "Cor inválida: use o formato #RRGGBB.";

export class CriarDisciplinaDto {
  @IsString()
  @IsNotEmpty({ message: "Informe o nome da disciplina." })
  @MaxLength(60)
  nome: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  professor?: string | null;

  @IsOptional()
  @Matches(COR_REGEX, { message: COR_MENSAGEM })
  cor?: string;
}

export class AtualizarDisciplinaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty({ message: "Informe o nome da disciplina." })
  @MaxLength(60)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  professor?: string | null;

  @IsOptional()
  @Matches(COR_REGEX, { message: COR_MENSAGEM })
  cor?: string;
}

export interface DisciplinaResponse {
  id: string;
  nome: string;
  professor: string | null;
  cor: string;
}
