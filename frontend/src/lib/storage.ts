// localStorage wrapper that never throws (private mode, blocked storage, bad JSON).
export function lerStorage<T>(chave: string, padrao: T): T {
  try {
    const bruto = localStorage.getItem(chave);
    return bruto ? (JSON.parse(bruto) as T) : padrao;
  } catch {
    return padrao;
  }
}

export function salvarStorage(chave: string, valor: unknown): void {
  try {
    localStorage.setItem(chave, JSON.stringify(valor));
  } catch {
    /* storage unavailable: data just won't persist */
  }
}

export function removerStorage(chave: string): void {
  try {
    localStorage.removeItem(chave);
  } catch {
    /* ignore */
  }
}
