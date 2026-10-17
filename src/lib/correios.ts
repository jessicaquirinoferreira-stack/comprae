import { ShippingAddress, ShippingOption } from '../types';

export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge?: string;
  gia?: string;
  ddd?: string;
  siafi?: string;
  erro?: boolean;
}

/**
 * Look up address details by Brazilian CEP via ViaCEP API
 */
export async function lookupCep(cep: string): Promise<ViaCepResponse | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;

  try {
    const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
    if (!res.ok) return null;
    const data: ViaCepResponse = await res.json();
    if (data.erro) return null;
    return data;
  } catch (err) {
    console.error('Error fetching CEP:', err);
    return null;
  }
}

/**
 * Calculates Correios shipping rates (PAC & SEDEX) based on destination state and order subtotal.
 */
export function calculateCorreiosShipping(
  state: string,
  subtotal: number = 0
): ShippingOption[] {
  const uf = state.toUpperCase().trim();
  const isFreeShipping = subtotal >= 149.00;

  // Regional baseline pricing matrix from São Paulo distribution hub
  let pacBase = 16.90;
  let pacDays = 5;
  let sedexBase = 24.90;
  let sedexDays = 2;

  if (['SP'].includes(uf)) {
    pacBase = 11.90;
    pacDays = 3;
    sedexBase = 15.90;
    sedexDays = 1;
  } else if (['RJ', 'MG', 'ES', 'PR'].includes(uf)) {
    pacBase = 17.50;
    pacDays = 5;
    sedexBase = 26.90;
    sedexDays = 2;
  } else if (['SC', 'RS', 'DF', 'GO', 'MS', 'MT'].includes(uf)) {
    pacBase = 21.90;
    pacDays = 6;
    sedexBase = 32.90;
    sedexDays = 3;
  } else if (['BA', 'PE', 'CE', 'RN', 'PB', 'AL', 'SE', 'PI', 'MA'].includes(uf)) {
    pacBase = 26.90;
    pacDays = 8;
    sedexBase = 42.90;
    sedexDays = 4;
  } else {
    // North (AM, PA, RO, AC, RR, AP, TO)
    pacBase = 34.90;
    pacDays = 11;
    sedexBase = 54.90;
    sedexDays = 5;
  }

  const pacPrice = isFreeShipping ? 0 : pacBase;
  const sedexPrice = isFreeShipping ? Math.max(0, sedexBase - pacBase) : sedexBase;

  return [
    {
      code: '04510',
      name: isFreeShipping ? 'PAC Correios (Frete Grátis Promocional)' : 'PAC Correios (Econômico)',
      price: pacPrice,
      days: pacDays,
      carrier: 'Correios',
    },
    {
      code: '04014',
      name: 'SEDEX Correios (Expresso Prioritário)',
      price: sedexPrice,
      days: sedexDays,
      carrier: 'Correios',
    },
  ];
}
