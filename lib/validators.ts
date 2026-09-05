/**
 * Validação de CPF pelo cálculo dos dígitos verificadores.
 * Aceita formatado ("000.000.000-00") ou apenas números.
 */
export function isValidCpf(value: string): boolean {
  const cpf = (value ?? "").replace(/\D/g, "");
  if (cpf.length !== 11) return false;

  // Sequências de dígitos repetidos (000.000.000-00 etc.) são inválidas.
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const digits = cpf.split("").map(Number);

  const checkDigit = (length: number): number => {
    let sum = 0;
    for (let i = 0; i < length; i++) {
      sum += digits[i] * (length + 1 - i);
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  return checkDigit(9) === digits[9] && checkDigit(10) === digits[10];
}