
import { createRoot } from 'react-dom/client';
import { initMermaid } from '@/utils/mermaid';
import { DiagramToggle } from '@/components/DiagramToggle';
import { SELECTORS, getDiagramType } from '@/content/selectors';
import '@/content/styles.css';

initMermaid();

const PROCESSED_ATTR = 'data-diagram-renderer-processed';

function processCodeBlock(codeBlockElement: HTMLElement) {
  // If already processed, we might still need to update if it wasn't a known diagram before but now is (streaming)
  if (codeBlockElement.getAttribute(PROCESSED_ATTR)) return;
  
  // Verify it's a code block
  if (!codeBlockElement.tagName.includes('CODE-BLOCK')) return;

  // Check if it's a supported diagram type
  const diagramType = getDiagramType(codeBlockElement);
  
  if (!diagramType) {
    return;
  }

  console.log(`Gemini Diagram Renderer: Found ${diagramType} block!`, codeBlockElement);

  // Mark processed
  codeBlockElement.setAttribute(PROCESSED_ATTR, 'true');

  // Find where to inject the button. 
  // We want to put it in the header/toolbar next to Copy button
  const header = codeBlockElement.querySelector(SELECTORS.CODE_HEADER);
  if (!header) {
    console.warn('Gemini Diagram Renderer: Header not found for code block');
    return;
  }

  // Create container for our button
  const container = document.createElement('div');
  container.className = 'gemini-diagram-toolbar-item inline-flex items-center ml-2';
  
  // Insert before the copy button container or at the end of header actions
  const buttonsContainer = header.querySelector('.buttons');
  if (buttonsContainer) {
    buttonsContainer.prepend(container);
  } else {
    header.appendChild(container);
  }

  // Get the code element for content
  const codeElement = codeBlockElement.querySelector('code');
  if (!codeElement) {
    console.warn('Gemini Diagram Renderer: Code element not found');
    return;
  }

  const textContent = codeElement.textContent || '';
  
  // Find the pre element to hide/show
  const preElement = codeBlockElement.querySelector('pre');
  if (!preElement) {
    console.warn('Gemini Diagram Renderer: Pre element not found');
    return;
  }

  const root = createRoot(container);
  
  const diagramContainer = document.createElement('div');
  diagramContainer.className = 'gemini-diagram-preview-area bg-white p-4 w-full overflow-auto';
  diagramContainer.style.display = 'none'; // Hidden by default until toggled
  
  // Insert diagram container after the header (before the code content wrapper)
  header.insertAdjacentElement('afterend', diagramContainer);

  root.render(
    <DiagramToggle 
      initialCode={textContent} 
      codeElement={codeElement as HTMLElement} 
      originalContainer={preElement}
      previewContainer={diagramContainer}
      type={diagramType}
    />
  );
}

function observeDOM() {
  console.log('Gemini Diagram Renderer: Starting observer...');
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof HTMLElement) {
            // 1. Check if the node itself is a code-block
            if (node.tagName === 'CODE-BLOCK') {
              processCodeBlock(node);
            }
            
            // 2. Check if the node contains code-blocks
            const blocks = node.querySelectorAll('code-block');
            blocks.forEach((block) => processCodeBlock(block as HTMLElement));

            // 3. CRITICAL FIX: Check if the node is INSIDE a code-block 
            // (e.g. content being streamed into an existing block)
            const parentBlock = node.closest('code-block');
            if (parentBlock) {
              processCodeBlock(parentBlock as HTMLElement);
            }
          }
        });
      }
      // Handle text changes (streaming)
      if (mutation.type === 'characterData') {
        const parentBlock = mutation.target.parentElement?.closest('code-block');
        if (parentBlock) {
           processCodeBlock(parentBlock as HTMLElement);
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true // Watch text changes too
  });
  
  // Initial check
  document.querySelectorAll('code-block').forEach((block) => processCodeBlock(block as HTMLElement));
  
  // Polling fallback (just in case)
  setInterval(() => {
    document.querySelectorAll('code-block').forEach((block) => processCodeBlock(block as HTMLElement));
  }, 2000);
}

if (document.body) {
  observeDOM();
} else {
  document.addEventListener('DOMContentLoaded', observeDOM);
}
