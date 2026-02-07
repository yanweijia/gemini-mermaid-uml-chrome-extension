export const SELECTORS = {
  CODE_BLOCK: 'code-block',
  CODE_ELEMENT: 'pre code',
  CODE_HEADER: '.code-block-decoration.header-formatted',
  LANGUAGE_CLASS_PREFIX: 'language-',
  COPY_BUTTON: 'button[aria-label="Copy code"]',
};

export type DiagramType = 'mermaid' | 'plantuml' | null;

export const getDiagramType = (element: HTMLElement): DiagramType => {
  const pre = element.querySelector('pre');
  const code = element.querySelector('code');
  const text = (code?.textContent?.trim() || '').toLowerCase();

  // 1. Check classes first (Most reliable)
  if (pre?.classList.contains('language-mermaid') || code?.classList.contains('language-mermaid')) {
    return 'mermaid';
  }
  if (pre?.classList.contains('language-plantuml') || code?.classList.contains('language-plantuml')) {
    return 'plantuml';
  }

  // 2. Check content keywords
  // Mermaid keywords
  const mermaidKeywords = [
    'mermaid',
    'graph ',
    'flowchart ',
    'sequenceDiagram',
    'classDiagram',
    'stateDiagram',
    'erDiagram',
    'gantt',
    'pie',
    'gitGraph',
    'journey',
    'mindmap',
    'timeline',
    'quadrantChart',
    'xychart',
    'block-beta',
    'packet-beta',
    'kanban',
    'c4'
  ];

  if (mermaidKeywords.some(keyword => text.startsWith(keyword.toLowerCase()))) {
    return 'mermaid';
  }

  // PlantUML keywords
  // Usually starts with @startuml or just the diagram type if inferred
  if (text.startsWith('@startuml') || text.startsWith('@startmindmap') || text.startsWith('@startwbs') || text.startsWith('@startgantt')) {
    return 'plantuml';
  }

  return null;
};

// Kept for backward compatibility if needed, but getDiagramType is preferred
export const isMermaidBlock = (element: HTMLElement): boolean => {
  return getDiagramType(element) === 'mermaid';
};
