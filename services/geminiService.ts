import { GoogleGenAI } from "@google/genai";
import { TattooConfig, TattooStyle, TattooOrientation } from "../types";

// Helper to construct the professional prompt based on user input
const constructPrompt = (config: TattooConfig): string => {
  const stylesList = config.style.join(" misturado com ");
  const orientationDesc = config.orientation === TattooOrientation.Vertical 
    ? "formato vertical (portrait), mais alto que largo" 
    : "formato horizontal (landscape), mais largo que alto";
  
  let baseInstruction = "Crie um design de tatuagem profissional de alta qualidade.";
  
  if (config.referenceImages && config.referenceImages.length > 0) {
    if (config.referenceImages.length === 1) {
       baseInstruction = "Transforme a imagem de referência fornecida em um design de tatuagem profissional, aplicando as modificações solicitadas e integrando ao estilo escolhido.";
    } else {
       baseInstruction = `Combine e integre os elementos das ${config.referenceImages.length} imagens de referência fornecidas em uma composição única e coesa de tatuagem. Não apenas coloque-as lado a lado, funda-as artisticamente.`;
    }
  }

  const backgroundInstruction = config.includeBackground
    ? "Fundo: Crie um fundo atmosférico, sutil e artístico que complemente o tema da tatuagem (fumaça, geometria leve, manchas de aquarela ou cenário onírico suave). Não use fundo branco simples."
    : "Fundo: NEUTRO e LIMPO (branco ou levemente texturizado como papel de arte) para focar apenas no design da tatuagem.";

  return `
    ${baseInstruction}
    Estilo Artístico: Uma fusão harmoniosa de ${stylesList}.
    Assunto/Elementos: ${config.description}.
    Local do corpo pretendido: ${config.placement} (a arte deve ser projetada para fluir perfeitamente nesta anatomia específica).
    Orientação da composição: ${orientationDesc}.
    
    Diretrizes Técnicas:
    - ${backgroundInstruction}
    - Traços nítidos, bem definidos e limpos (sem borrões).
    - Contraste adequado para tatuagem (preto sólido onde necessário, sombras suaves).
    - Composição equilibrada e harmoniosa que respeite a curvatura da área ${config.placement}.
    - Qualidade de estúdio de tatuagem high-end.
    - Contexto: Obra de arte artística para portfólio de tatuador.
    
    Diretrizes de Estilo Específicas:
    ${config.style.includes(TattooStyle.Fineline) ? '- Elementos Fineline: Use linhas extremamente finas e delicadas.' : ''}
    ${config.style.includes(TattooStyle.OldSchool) ? '- Elementos Old School: Use linhas grossas (bold lines) e sombreamento clássico.' : ''}
    ${config.style.includes(TattooStyle.Blackwork) ? '- Elementos Blackwork: Alto contraste, tinta preta sólida, preenchimento pesado.' : ''}
    ${config.style.includes(TattooStyle.Geometrico) ? '- Elementos Geométricos: Simetria perfeita e formas precisas.' : ''}
    ${config.style.includes(TattooStyle.Aquarela) ? '- Elementos Aquarela: Manchas de cor suaves e translúcidas, sem contornos rígidos.' : ''}
  `;
};

// Single generation function
const generateSingleImage = async (ai: GoogleGenAI, prompt: string, config: TattooConfig): Promise<string> => {
    // Map orientation to supported aspect ratios
    const aspectRatio = config.orientation === TattooOrientation.Vertical ? "3:4" : "4:3";

    const parts: any[] = [{ text: prompt }];

    // Add reference images if exist
    if (config.referenceImages && config.referenceImages.length > 0) {
        for (const imgBase64 of config.referenceImages) {
             // Strip the data prefix if present
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
    
    // Check if safety filter was triggered
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

    // Create an array of promises based on the number of images requested
    const promises = Array(numberOfImages).fill(null).map(() => generateSingleImage(ai, prompt, config));

    const results = await Promise.all(promises);
    return results;

  } catch (error) {
    console.error("Erro ao gerar tatuagem:", error);
    throw error;
  }
};