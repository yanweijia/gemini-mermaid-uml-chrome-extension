import mermaid from 'mermaid';

export const initMermaid = () => {
  mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    securityLevel: 'loose',
    suppressErrorRendering: true, // Don't let mermaid render syntax error text automatically
  });
};

export const renderMermaid = async (id: string, code: string): Promise<string> => {
  // We don't catch here anymore, letting the component handle it
  const { svg } = await mermaid.render(id, code);
  return svg;
};
