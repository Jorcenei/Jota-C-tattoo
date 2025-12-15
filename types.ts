export enum TattooStyle {
  Minimalista = 'Minimalista',
  Fineline = 'Fineline',
  OldSchool = 'Old School',
  Realismo = 'Realismo',
  Blackwork = 'Blackwork',
  Maori = 'Maori',
  Geometrico = 'Geométrico',
  Ornamental = 'Ornamental',
  Aquarela = 'Aquarela',
  Tribal = 'Tribal',
  Oriental = 'Oriental (Irezumi)',
  Dotwork = 'Dotwork',
  Sketch = 'Sketch / Rascunho',
  NeoTradicional = 'Neo Tradicional',
  Surrealismo = 'Surrealismo',
  Lettering = 'Lettering / Caligrafia'
}

export enum BodyPlacement {
  // Braços
  AntebracoInterno = 'Antebraço (Interno)',
  AntebracoExterno = 'Antebraço (Externo)',
  BracoBiceps = 'Braço (Bíceps)',
  BracoTriceps = 'Braço (Tríceps)',
  OmbroFrente = 'Ombro (Frente)',
  OmbroLateral = 'Ombro (Lateral)',
  MaoDorso = 'Mão (Dorso)',
  MaoDedos = 'Mão (Dedos)',
  
  // Tronco
  PeitoCentral = 'Peito (Esterno/Central)',
  PeitoPeitoral = 'Peito (Peitoral)',
  Costela = 'Costela',
  CostasSuperior = 'Costas (Superior)',
  CostasLombar = 'Costas (Lombar)',
  CostasCompleta = 'Costas (Completa)',
  
  // Cabeça/Pescoço
  PescocoLateral = 'Pescoço (Lateral)',
  PescocoNuca = 'Pescoço (Nuca)',
  PescocoGarganta = 'Pescoço (Garganta)',
  AtrasOrelha = 'Atrás da Orelha',
  
  // Pernas
  PernaCoxaFrontal = 'Coxa (Frontal)',
  PernaCoxaLateral = 'Coxa (Lateral)',
  PernaCanela = 'Perna (Canela)',
  PernaPanturrilha = 'Perna (Panturrilha)',
  Tornozelo = 'Tornozelo',
  Pe = 'Pé'
}

export enum TattooOrientation {
  Vertical = 'Vertical',
  Horizontal = 'Horizontal'
}

export interface TattooConfig {
  style: TattooStyle[];
  description: string;
  placement: BodyPlacement;
  orientation: TattooOrientation;
  includeBackground: boolean;
  referenceImages: string[]; // Changed from single string to array
  numberOfImages: number;
}

export interface GeneratedTattoo {
  id: string;
  imageUrl: string;
  prompt: string;
  config: TattooConfig;
  timestamp: number;
}
