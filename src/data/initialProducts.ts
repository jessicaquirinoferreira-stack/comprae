import { Product, StoreSettings } from '../types';

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Fone Bluetooth True Wireless com Cancelamento de Ruído',
    description: 'Som nítido e bateria de longa duração para o dia inteiro. Ideal para academia, trabalho e deslocamento. Conexão estável e conforto mesmo em uso prolongado.',
    category: 'Tech & Gadgets',
    suggested_cost_base: 8.50,
    virality_score: 9,
    cost_price: 42.50,
    profit_margin: 47.40,
    price: 89.90,
    image_url: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 84,
    badge: 'Mais Vendido 🔥',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-2',
    name: 'Organizador Modular de Gavetas Ajustável',
    description: 'Transforme gavetas bagunçadas em espaços organizados em minutos. Módulos encaixáveis, fácil de limpar e perfeito para cozinha, banheiro ou escritório.',
    category: 'Office & Organization',
    suggested_cost_base: 4.20,
    virality_score: 8,
    cost_price: 21.00,
    profit_margin: 28.90,
    price: 49.90,
    image_url: 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1507089947368-19c1da9775ae?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 120,
    badge: 'Viral TikTok ⚡',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-3',
    name: 'Máscara Facial Coreana Hidratante (Kit 10 unidades)',
    description: 'Hidratação intensa e brilho natural em 20 minutos. Fórmula leve, ideal para pele cansada e rotina de skincare diária. Resultados visíveis e recompra alta.',
    category: 'Beauty & Health',
    suggested_cost_base: 6.80,
    virality_score: 9,
    cost_price: 34.00,
    profit_margin: 35.90,
    price: 69.90,
    image_url: 'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 65,
    badge: 'Tendência K-Beauty ✨',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-4',
    name: 'Brinquedo Interativo para Cães com Dispenser de Petisco',
    description: 'Estimula a mente do pet e reduz a ansiedade. Fácil de limpar, resistente e mantém o cão entretido por horas. Ideal para tutores que buscam enriquecimento ambiental.',
    category: 'Pet Supplies',
    suggested_cost_base: 5.90,
    virality_score: 8,
    cost_price: 29.50,
    profit_margin: 30.40,
    price: 59.90,
    image_url: 'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1576201836106-db1758fd1c97?q=80&w=1000&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1587300003388-59208cc962cb?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 45,
    badge: 'Pet Lovers 🐾',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-5',
    name: 'Sandália Papete Feminina Birken com Regulagem',
    description: 'Conforto o dia todo com design moderno e ajuste perfeito. Ideal para o dia a dia e passeios. Solado antiderrapante e visual que combina com vários looks.',
    category: 'Accessories',
    suggested_cost_base: 7.40,
    virality_score: 8,
    cost_price: 37.00,
    profit_margin: 52.90,
    price: 89.90,
    image_url: 'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1603808033192-082d6919d3e1?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 50,
    badge: 'Moda Verão ☀️',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-6',
    name: 'Mini Processador de Alimentos Elétrico',
    description: 'Pique, triture e prepare receitas em segundos. Compacto, fácil de limpar e perfeito para cozinhas pequenas. Economiza tempo no preparo diário.',
    category: 'Home & Kitchen',
    suggested_cost_base: 9.10,
    virality_score: 8,
    cost_price: 45.50,
    profit_margin: 34.40,
    price: 79.90,
    image_url: 'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1589365278144-c9e705f843ba?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 92,
    badge: 'Praticidade Total 🍳',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-7',
    name: 'Suporte Articulado para Celular 360°',
    description: 'Mãos livres no carro, mesa ou cozinha. Rotação total e base estável. Ideal para navegação, lives e assistir conteúdo sem esforço.',
    category: 'Tech & Gadgets',
    suggested_cost_base: 3.80,
    virality_score: 7,
    cost_price: 19.00,
    profit_margin: 20.90,
    price: 39.90,
    image_url: 'https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1586105251261-72a756497a11?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 150,
    badge: 'Top Avaliado ⭐',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-8',
    name: 'Tapete Higiênico para Pets Super Absorvente',
    description: 'Alta absorção e controle de odores. Ideal para filhotes e treino. Troca rápida e mantém a casa limpa e sem cheiro.',
    category: 'Pet Supplies',
    suggested_cost_base: 4.50,
    virality_score: 8,
    cost_price: 22.50,
    profit_margin: 27.40,
    price: 49.90,
    image_url: 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 78,
    badge: 'Casa Limpa 🐶',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-9',
    name: 'Luminária LED de Mesa Recarregável',
    description: 'Iluminação ajustável e portátil para home office ou estudo. Bateria de longa duração e design moderno que valoriza qualquer ambiente.',
    category: 'Office & Organization',
    suggested_cost_base: 6.20,
    virality_score: 7,
    cost_price: 31.00,
    profit_margin: 38.90,
    price: 69.90,
    image_url: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 60,
    badge: 'Design Minimalista 💡',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-10',
    name: 'Body Splash Feminino Longa Duração',
    description: 'Fragrância fresca e marcante que dura o dia inteiro. Textura leve e ideal para o dia a dia ou presente. Alta recompra entre o público jovem.',
    category: 'Beauty & Health',
    suggested_cost_base: 5.30,
    virality_score: 9,
    cost_price: 26.50,
    profit_margin: 33.40,
    price: 59.90,
    image_url: 'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1616949755610-8c9bbc08f138?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 110,
    badge: 'Fragrância Favorita 🌸',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-11',
    name: 'Varal Retrátil de Parede',
    description: 'Seca roupas sem ocupar espaço. Ideal para apartamentos e áreas pequenas. Fácil instalação e resistente ao uso diário.',
    category: 'Home & Kitchen',
    suggested_cost_base: 7.80,
    virality_score: 8,
    cost_price: 39.00,
    profit_margin: 40.90,
    price: 79.90,
    image_url: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 42,
    badge: 'Espaço Otimizado 🧺',
    created_at: new Date().toISOString()
  },
  {
    id: 'prod-12',
    name: 'Kit de Brinquedos Educativos Sensoriais',
    description: 'Estimula coordenação e criatividade das crianças. Materiais seguros e design colorido. Perfeito para presente e desenvolvimento infantil.',
    category: 'Kids & Toys',
    suggested_cost_base: 6.50,
    virality_score: 7,
    cost_price: 32.50,
    profit_margin: 37.40,
    price: 69.90,
    image_url: 'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1000&auto=format&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1596461404969-9ae70f2830c1?q=80&w=1000&auto=format&fit=crop'
    ],
    stock: 58,
    badge: 'Educativo & Seguro 🧸',
    created_at: new Date().toISOString()
  }
];

export const INITIAL_SETTINGS: StoreSettings = {
  instagram: 'https://instagram.com/comprae.brasil',
  tiktok: 'https://tiktok.com/@comprae_oficial',
  whatsapp: 'https://wa.me/5511999998888?text=Olá,%20gostaria%20de%20tirar%20dúvidas%20sobre%20meu%20pedido%20no%20Compraê',
  facebook: 'https://facebook.com/comprae.loja',
  youtube: 'https://youtube.com/@compraetv',
  store_name: 'Compraê',
  infinitepay_handle: '$vendas_online2',
  pix_key: 'jonasjessicalove@gmail.com',
  infinitepay_payment_link: 'https://infinitepay.io/pay/$vendas_online2',
  banner_announcement: '🔥 FRETE GRÁTIS EM COMPRAS ACIMA DE R$ 149 | PARCELAMENTO EM ATÉ 12X NO CARTÃO OU DESCONTO NO PIX'
};

