import React, { useState, useEffect, useRef } from 'react';
import { renderMermaid } from '@/utils/mermaid';
import { renderPlantUML } from '@/utils/plantuml';
import type { DiagramType } from '@/content/selectors';

interface DiagramToggleProps {
  initialCode: string;
  codeElement: HTMLElement;
  originalContainer: HTMLElement;
  previewContainer: HTMLElement;
  type: DiagramType;
}

export const DiagramToggle: React.FC<DiagramToggleProps> = ({ 
  initialCode, 
  codeElement, 
  originalContainer, 
  previewContainer,
  type
}) => {
  const [code, setCode] = useState(initialCode);
  const [isGraphMode, setIsGraphMode] = useState(true);
  const [svg, setSvg] = useState<string | null>(null);
  const [, setError] = useState<string | null>(null);
  const [displayError, setDisplayError] = useState<string | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const errorGraceTimer = useRef<NodeJS.Timeout | null>(null);

  // Streaming support
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const newText = codeElement.textContent || '';
      
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      
      debounceTimer.current = setTimeout(() => {
        setCode(newText);
      }, 500); 
    });

    observer.observe(codeElement, { characterData: true, subtree: true, childList: true });

    return () => {
      observer.disconnect();
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [codeElement]);

  // Mixed Render Logic
  useEffect(() => {
    if (isGraphMode) {
      setError(null);
      // Don't clear svg immediately to avoid flickering during re-renders if content is same
      
      const renderPromise = type === 'mermaid' 
        ? renderMermaid(`mermaid-${Math.random().toString(36).substr(2, 9)}`, code)
        : renderPlantUML(code);

      renderPromise
        .then((newSvg) => {
          setSvg(newSvg);
          setError(null);
          setDisplayError(null);
          if (errorGraceTimer.current) clearTimeout(errorGraceTimer.current);
        })
        .catch((err) => {
          setSvg(null);
          const message = err instanceof Error ? err.message : String(err);
          setError(message);
          
          if (errorGraceTimer.current) clearTimeout(errorGraceTimer.current);
          errorGraceTimer.current = setTimeout(() => {
            setDisplayError(message);
          }, 2000); 
        });
    }
    
    return () => {
      if (errorGraceTimer.current) clearTimeout(errorGraceTimer.current);
    };
  }, [isGraphMode, code, type]);

  // Handle visibility and error UI
  useEffect(() => {
    if (isGraphMode) {
      if (svg) {
        // Success
        originalContainer.style.display = 'none';
        previewContainer.style.display = 'block';
        previewContainer.innerHTML = svg;
        previewContainer.style.backgroundColor = 'var(--gem-sys-color--surface-container-low, #fff)';
      } else if (displayError) {
        // Error
        originalContainer.style.display = 'none';
        previewContainer.style.display = 'block';
        
        const lineMatch = displayError.match(/line\s+(\d+)/i);
        const lineNum = lineMatch ? lineMatch[1] : null;
        const lineInfo = lineNum ? `Line ${lineNum} / 第 ${lineNum} 行` : '';

        previewContainer.innerHTML = `
          <div class="flex flex-col items-center justify-center p-6 text-center border-2 border-dashed border-red-200 rounded-lg bg-red-50 text-red-800">
            <svg class="w-10 h-10 mb-2 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 class="text-sm font-semibold mb-1">Diagram Render Failed / 图表渲染失败</h3>
            ${lineInfo ? `<p class="text-xs font-bold text-red-600 mb-1">${lineInfo}</p>` : ''}
            <div class="text-xs opacity-80 mb-3 max-w-md break-words text-left bg-white p-2 rounded border border-red-100 font-mono overflow-auto max-h-24 w-full">
              ${displayError}
            </div>
            <button id="diagram-error-retry-btn" class="px-3 py-1 bg-white border border-red-200 rounded text-xs font-medium hover:bg-red-50 transition-colors">
              View Source / 查看源码
            </button>
          </div>
        `;
        
        const btn = previewContainer.querySelector('#diagram-error-retry-btn');
        if (btn) {
          btn.addEventListener('click', () => {
            setIsGraphMode(false);
          });
        }
        
        previewContainer.style.backgroundColor = 'transparent';
      } else {
        // Loading
        const typeLabel = type === 'plantuml' ? 'PlantUML' : 'Mermaid';
        previewContainer.innerHTML = `<div class="p-4 text-gray-400 italic text-sm text-center">Rendering ${typeLabel}... / 正在渲染...</div>`;
        originalContainer.style.display = 'none';
        previewContainer.style.display = 'block';
        previewContainer.style.backgroundColor = 'transparent';
      }
    } else {
      // Code view
      originalContainer.style.display = 'block';
      previewContainer.style.display = 'none';
    }
  }, [isGraphMode, svg, displayError, originalContainer, previewContainer, type]);

  return (
    <button
      className={`mermaid-renderer-btn ml-2 flex items-center gap-1 ${displayError ? 'bg-red-50 text-red-600 hover:bg-red-100' : ''}`}
      onClick={() => setIsGraphMode(!isGraphMode)}
      title={isGraphMode ? "Switch to Code View" : "Switch to Diagram View"}
    >
      {isGraphMode ? (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          <span className="hidden sm:inline">Code / 源码</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
          <span className="hidden sm:inline">Preview / 预览</span>
        </>
      )}
    </button>
  );
};
