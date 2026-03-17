import { GoogleGenAI } from "@google/genai";
import { TattooConfig, TattooStyle, TattooOrientation, BodyPlacement } from "../types";

// Helper to construct the professional prompt based on user input
const constructPrompt = (config: TattooConfig): string => {
  const stylesList = config.style.join(" e ");
  const orientationDesc = config.orientation === TattooOrientation.Vertical 
    ? "formato vertical (mais alto que largo)" 
    : "formato horizontal (mais largo que alto)";
  
  const isStencil = config.placement === BodyPlacement.PapelImpressao;

  let baseInstruction = "Crie uma imagem de tatuagem de altíssima qualidade.";
  
  if (config.referenceImages && config.referenceImages.length > 0) {
    baseInstruction = `Use as ${config.referenceImages.length} imagens de referência fornecidas como base principal. Extraia a essência, formas e o conceito delas e transforme em um novo design de tatuagem coeso seguindo o estilo ${stylesList}.`;
  }

  // Specific placement and background logic
  let visualContext = "";
  let backgroundInstruction = "";

  if (isStencil) {
    visualContext = `
      CONTEXTO: DESIGN DIGITAL PLANO (2D FLASH ART).
      ESTRITAMENTE: NÃO mostre pele humana, NÃO mostre partes do corpo, NÃO simule uma foto. 
      A imagem deve ser apenas o desenho artístico puro, centralizado, como um arquivo digital pronto para impressão.
    `;
    backgroundInstruction = "Fundo: BRANCO PURO ABSOLUTO (#FFFFFF), sem sombras, sem texturas de papel, sem vinhetas.";
  } else {
    visualContext = `
      CONTEXTO: MOCKUP REALISTA NO CORPO.
      ESTRITAMENTE: A tatuagem DEVE estar aplicada sobre a pele humana real, especificamente no(a) ${config.placement}. 
      A imagem deve parecer uma fotografia profissional de alta resolução de uma pessoa real com esta tatuagem recém-feita.
      A composição deve respeitar a anatomia, músculos e curvaturas do(a) ${config.placement}.
    `;
    backgroundInstruction = config.includeBackground
      ? "Ambiente: Mostre o local do corpo em um cenário artístico ou estúdio de tatuagem com iluminação cinematográfica e profundidade de campo (bokeh)."
      : "Ambiente: Fundo neutro de estúdio, focando inteiramente na parte do corpo e na aplicação da tatuagem.";
  }

  return `
    ${baseInstruction}
    
    ${visualContext}
    
    TEMA/ASSUNTO: ${config.description}
    ESTILO: ${stylesList}
    ORIENTAÇÃO: ${orientationDesc}
    
    DIRETRIZES TÉCNICAS:
    - ${backgroundInstruction}
    - Detalhes nítidos, contraste perfeito.
    - Pigmentação realista na pele (se não for modo Impressão).
    - Traços limpos e profissionais.
    
    DIRETRIZES DE ESTILO ESPECÍFICAS:
    ${config.style.includes(TattooStyle.Fineline) ? '- Fineline: Use agulhas finas, traços delicados e precisos.' : ''}
    ${config.style.includes(TattooStyle.OldSchool) ? '- Old School: Traços grossos (bold lines), paleta de cores clássica e sombras sólidas.' : ''}
    ${config.style.includes(TattooStyle.Blackwork) ? '- Blackwork: Áreas de preto saturado intenso e alto contraste.' : ''}
    ${config.style.includes(TattooStyle.Geometrico) ? '- Geométrico: Geometria sagrada, simetria matemática e linhas retas perfeitas.' : ''}
    ${config.style.includes(TattooStyle.Realismo) ? '- Realismo: Sombreamento fotográfico, texturas realistas e profundidade 3D.' : ''}
    ${config.style.includes(TattooStyle.Aquarela) ? '- Aquarela: Transições suaves de cores, efeito de tinta fluida e sem bordas rígidas.' : ''}
  `;
};

// Single generation function
const generateSingleImage = async (ai: GoogleGenAI, prompt: string, config: TattooConfig): Promise<string> => {
    const aspectRatio = config.orientation === TattooOrientation.Vertical ? "3:4" : "4:3";

    const parts: any[] = [{ text: prompt }];

    if (config.referenceImages && config.referenceImages.length > 0) {
        for (const imgBase64 of config.referenceImages) {
             const base64Data = imgBase64.split(',')[1] || imgBase64;
             const mimeType = imgBase64.substring(imgBase64.indexOf(':') + 1, imgBase64.indexOf(';')) || 'image/png';
             
             parts.unshift({
                 inlineData: {
                     data: base64Data,
                     mimeType: mimeType
                 }
             });
        }
    }

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts,
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
        ]
      }
    });

    if (response.candidates && response.candidates.length > 0) {
      const parts = response.candidates[0].content?.parts;
      if (parts) {
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType || 'image/png';
                return `data:${mimeType};base64,${base64Data}`;
            }
        }
      }
    }
    
    if (response.candidates && response.candidates[0]?.finishReason === 'SAFETY') {
        throw new Error("A imagem foi bloqueada pelos filtros de segurança. Tente evitar termos muito explícitos ou simplificar a descrição.");
    }

    throw new Error("Não foi possível gerar a imagem. Tente novamente.");
};

export const generateTattooDesign = async (config: TattooConfig): Promise<string[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = constructPrompt(config);
    const numberOfImages = config.numberOfImages || 1;

    const promises = Array(numberOfImages).fill(null).map(() => generateSingleImage(ai, prompt, config));

    const results = await Promise.all(promises);
    return results;

  } catch (error) {
    console.error("Erro ao gerar tatuagem:", error);
    throw error;
  }
};