/** Converte o atributo tipo="…" das etiquetas para as propriedades do ui5-tag. */
type TagDesign = 'Positive' | 'Critical' | 'Negative' | 'Information' | 'Neutral' | 'Set1' | 'Set2';
export function tagProps(tipo?: string): { design: TagDesign; colorScheme?: string } {
  switch (tipo) {
    case 'sucesso': return { design: 'Positive' };
    case 'aviso': return { design: 'Critical' };
    case 'erro': return { design: 'Negative' };
    case 'info': return { design: 'Information' };
    case 'c5': return { design: 'Set1', colorScheme: '7' };
    case 'c7': return { design: 'Set1', colorScheme: '6' };
    default: {
      const m = tipo?.match(/^cor-(\d+)$/);
      return m ? { design: 'Set1', colorScheme: m[1] } : { design: 'Neutral' };
    }
  }
}

