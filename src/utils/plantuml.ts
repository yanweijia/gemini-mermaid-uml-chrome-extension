import plantumlEncoder from 'plantuml-encoder';

export const renderPlantUML = async (code: string): Promise<string> => {
  try {
    // 1. Encode
    const encoded = plantumlEncoder.encode(code);
    
    // 2. Construct URL
    const url = `https://www.plantuml.com/plantuml/svg/${encoded}`;
    
    // 3. Fetch SVG
    // Note: We fetch the SVG text so we can inline it, rather than using an <img> tag.
    // This allows better styling/interaction control and avoids some CORS/CSP headaches if we used <img> directly in some contexts.
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`PlantUML Server Error: ${response.status} ${response.statusText}`);
    }
    
    const svgText = await response.text();
    
    // Basic validation to ensure we got an SVG
    if (!svgText.includes('<svg')) {
      throw new Error('Invalid response from PlantUML server');
    }
    
    return svgText;
  } catch (error) {
    console.error('PlantUML render error:', error);
    throw error; // Re-throw for UI handling
  }
};
