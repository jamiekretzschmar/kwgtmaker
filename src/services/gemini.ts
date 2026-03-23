import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

export async function enhanceWidgetPrompt(prompt: string): Promise<string> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `You are an expert KWGT designer. Enhance the following user description of a KWGT widget to make it more detailed, specific, and optimized for an AI image generator and code generator. 
    Focus on layout, style (e.g., Neumorphism, Glassmorphism, Material), typography, and data elements.
    Keep it concise but highly descriptive. Do not include any conversational text, just the enhanced prompt.
    
    Original prompt: "${prompt}"
    
    Enhanced prompt:`,
  });

  return response.text?.trim() || prompt;
}

export async function generateWidgetMockup(prompt: string, aspectRatio: string): Promise<string> {
  // Create instance right before call to get the latest key
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  // Map aspect ratios to those supported by gemini-2.5-flash-image
  let mappedRatio = aspectRatio;
  if (aspectRatio === '2:3') mappedRatio = '3:4';
  if (aspectRatio === '3:2') mappedRatio = '4:3';
  if (aspectRatio === '21:9') mappedRatio = '16:9';

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          text: `A high quality UI mockup of a KWGT Android widget on a clean background. ${prompt}`,
        },
      ],
    },
    config: {
      imageConfig: {
        aspectRatio: mappedRatio as any,
      }
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
  }

  throw new Error('Failed to generate mockup image.');
}

export async function generateWidgetInstructions(prompt: string): Promise<string> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are an expert KWGT (Kustom Widget Maker) designer and developer.
Your task is to provide a detailed, step-by-step guide on how to build the widget described by the user.

If the user asks for a complex widget (e.g., "neomorphic dark music player with an equalizer animation"), your guide MUST be extremely detailed and cover:
1. Setting up the basic structure (Root layer, Overlap Groups, Stack Groups).
2. Implementing specific design styles (e.g., Neumorphism requires specific shadow setups: a light shadow on top-left and dark shadow on bottom-right, using dark theme colors like #1E1E1E).
3. Integrating specific functionality (e.g., Music player controls using $mi(title)$, $mi(artist)$, and touch actions for play/pause/next/prev).
4. Creating animations (e.g., KWGT doesn't support true real-time audio visualizers natively without complex Tasker setups, so explain how to create a *simulated* equalizer animation using shapes, loops, and formulas based on $mi(state)$).
5. Tips for optimizing performance and appearance.

Format the output in clean, readable Markdown. Use headings, bullet points, and code blocks for KWGT formulas.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Provide step-by-step instructions to build the following KWGT widget: ${prompt}. 
      Include details on which elements to add (e.g., Overlap Group, Stack Group, Text, Shape), 
      how to style them (e.g., Neumorphism shadows, gradients), and where to place them.`,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH }
      }
    });

    return response.text || 'No instructions generated.';
  } catch (error: any) {
    if (error?.status === 429 || error?.message?.includes('429') || error?.message?.includes('Quota exceeded')) {
      console.warn('Quota exceeded for gemini-3.1-pro-preview, falling back to gemini-3-flash-preview');
      const fallbackResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Provide step-by-step instructions to build the following KWGT widget: ${prompt}. 
        Include details on which elements to add (e.g., Overlap Group, Stack Group, Text, Shape), 
        how to style them (e.g., Neumorphism shadows, gradients), and where to place them.`,
        config: {
          systemInstruction,
        }
      });
      return fallbackResponse.text || 'No instructions generated.';
    }
    throw error;
  }
}

export async function generateWidgetAnimation(prompt: string, imageBase64: string, aspectRatio: string): Promise<string> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  // Map aspect ratio to 16:9 or 9:16 (Veo only supports these)
  const isPortrait = aspectRatio === '9:16' || aspectRatio === '3:4' || aspectRatio === '2:3';
  const veoAspectRatio = isPortrait ? '9:16' : '16:9';

  // Extract mimeType and data from data:image/png;base64,...
  const matches = imageBase64.match(/^data:(.+);base64,(.+)$/);
  let mimeType = 'image/png';
  let imageBytes = imageBase64;
  if (matches && matches.length === 3) {
    mimeType = matches[1];
    imageBytes = matches[2];
  }

  try {
    let operation = await ai.models.generateVideos({
      model: 'veo-3.1-fast-generate-preview',
      prompt: `A brief animation of this widget. ${prompt}`,
      image: {
        imageBytes: imageBytes,
        mimeType: mimeType,
      },
      config: {
        numberOfVideos: 1,
        resolution: '720p',
        aspectRatio: veoAspectRatio
      }
    });

    while (!operation.done) {
      await new Promise(resolve => setTimeout(resolve, 10000));
      operation = await ai.operations.getVideosOperation({operation: operation});
    }

    const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
    if (!downloadLink) throw new Error("No video generated");

    const response = await fetch(downloadLink, {
      method: 'GET',
      headers: {
        'x-goog-api-key': apiKey,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error("Error generating animation:", error);
    throw new Error("Failed to generate animation. Please check your API key and quotas.");
  }
}

export async function suggestWidgetImprovements(originalPrompt: string, userRequest?: string): Promise<string> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const prompt = userRequest 
    ? `I have a KWGT widget based on this prompt: "${originalPrompt}". I want to make these changes: "${userRequest}". Please suggest how to implement these changes in KWGT, including any specific formulas, layer structures, or design tweaks needed.`
    : `I have a KWGT widget based on this prompt: "${originalPrompt}". Please suggest 3-5 creative ways to improve or enhance this widget's design and functionality in KWGT. Include specific formulas or layout ideas.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || 'No suggestions generated.';
  } catch (error) {
    console.error("Error generating suggestions:", error);
    throw new Error("Failed to generate suggestions.");
  }
}
export async function generateFullWidgetPreset(prompt: string, vibe: string, assets: {fonts: string[], icons: string[], bitmaps: string[]}): Promise<{json: any, instructions: string}> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  try {
    // 1. Generate the JSON Preset
    const jsonResponse = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: `Generate a complete KWGT preset JSON for a widget based on this prompt: "${prompt}".
      
      CRITICAL INSTRUCTIONS:
      - Vibe: ${vibe}
      - Assets to include/map: 
        - Fonts: ${assets.fonts.join(', ')}
        - Icons: ${assets.icons.join(', ')}
        - Bitmaps: ${assets.bitmaps.join(', ')}
      - The JSON MUST follow this exact structure:
      {
        "preset_info": { "version": 11, "title": "...", "description": "...", "author": "...", "email": "...", "width": 1080, "height": 1051, "features": "...", "release": 123456789, "locked": false, "pflags": 0 },
        "preset_root": {
          "internal_events": [{ "action": "KUSTOM_ACTION" }],
          "internal_type": "RootLayerModule",
          "globals_list": { ... },
          "internal_toggles": { ... },
          "internal_formulas": { ... },
          "viewgroup_items": [ ... ]
        }
      }
      - Map the provided asset filenames into the JSON structure where appropriate (e.g., font family names, image paths).
      - ONLY output valid JSON.
      - DO NOT include markdown formatting like \`\`\`json or \`\`\`.
      - DO NOT include any explanatory text.
      - Use standard KWGT internal types.
      - Ensure all formulas and globals are correctly structured.
      `,
    });

    let jsonStr = jsonResponse.text || "";
    jsonStr = jsonStr.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
    
    let jsonPreset;
    try {
      jsonPreset = JSON.parse(jsonStr);
    } catch (e) {
      console.error("Failed to parse JSON preset:", jsonStr);
      throw new Error("Failed to generate valid JSON preset.");
    }

    // 2. Generate the Instructions
    const instructionsResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Based on the following KWGT widget preset JSON, provide comprehensive, non-jargon, step-by-step instructions on how to build this widget in the KWGT app.
      
      JSON: ${JSON.stringify(jsonPreset)}
      
      Instructions:`,
    });

    return {
      json: jsonPreset,
      instructions: instructionsResponse.text || "No instructions generated."
    };
  } catch (error: any) {
    console.error("Error in generateFullWidgetPreset:", error);
    throw new Error(error.message || "Failed to generate widget preset.");
  }
}

export async function auditWidgetContrast(presetJson: any): Promise<{compliant: boolean, suggestions: string}> {
  const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Analyze the following KWGT preset JSON for accessibility, specifically focusing on color contrast between text and background elements.
    
    JSON: ${JSON.stringify(presetJson)}
    
    Return a JSON response with:
    {
      "compliant": boolean,
      "suggestions": "string"
    }
    `,
    config: {
      responseMimeType: "application/json",
    }
  });

  return JSON.parse(response.text || '{"compliant": true, "suggestions": "No issues found."}');
}
