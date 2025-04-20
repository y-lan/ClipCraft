// Minimalistic CSS for highlight and toast notifications
let styleEl = document.getElementById("md-select-style");
if (!styleEl) {
  styleEl = document.createElement("style");
  styleEl.id = "md-select-style";
  styleEl.textContent = `
    .md-sel-highlight { outline: 2px solid #4caf50 !important; cursor: crosshair !important; }
    #md-toast { position: fixed; right: 20px; bottom: 20px; background: #323232; color: #fff; padding: 8px 12px; border-radius: 4px; font-family: sans-serif; z-index: 2147483647; opacity: 0; transition: opacity .2s; }
    #md-toast.show { opacity: 1; }
  `;
  document.head.appendChild(styleEl);
}

// Core functionality
let currentEl;

// Copy text to clipboard with fallback for browsers without clipboard API
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const ta = document.createElement("textarea");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    ta.value = text;
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    document.execCommand("copy");
    ta.remove();
  }
}

// Display a temporary notification
function showToast(msg) {
  let toast = document.getElementById("md-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "md-toast";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.classList.add("show");
  setTimeout(() => toast.classList.remove("show"), 2000);
}

// Element selection handlers
const mouseover = (e) => {
  if (currentEl) currentEl.classList.remove("md-sel-highlight");
  currentEl = e.target;
  currentEl.classList.add("md-sel-highlight");
};

const click = async (e) => {
  e.preventDefault();
  e.stopPropagation();
  cleanup();

  // Convert HTML to Markdown
  const markdown = htmlToMarkdown(e.target.outerHTML);

  // Copy to clipboard and notify user
  await copyToClipboard(markdown);
  showToast("Markdown copied!");
};

// Handle ESC key press to cancel selection
const keydown = (e) => {
  if (e.key === "Escape") {
    cleanup();
    showToast("Selection cancelled");
  }
};

// Remove event listeners and cleanup
function cleanup() {
  document.removeEventListener("mouseover", mouseover, true);
  document.removeEventListener("click", click, true);
  document.removeEventListener("keydown", keydown, true);
  if (currentEl) currentEl.classList.remove("md-sel-highlight");
}

// Find the minimal DOM element that contains a selection
function getSelectionElement(selection) {
  const range = selection.getRangeAt(0);
  let node = range.commonAncestorContainer;
  
  // If the node is a text node, get its parent element
  if (node.nodeType !== Node.ELEMENT_NODE) {
    node = node.parentElement;
  }
  
  // Try to find the minimal element that contains the selection
  // Stop when the parent's text content is different from the current node
  while (node.parentElement && 
         node.parentElement.textContent.trim() === node.textContent.trim()) {
    node = node.parentElement;
  }
  
  return node;
}

// Start element selection mode
function startSelection() {
  document.addEventListener("mouseover", mouseover, true);
  document.addEventListener("click", click, true);
  document.addEventListener("keydown", keydown, true);
  showToast("Select an element to convert to Markdown (ESC to cancel)");
}

// Listen for messages from the background script
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "start_selection") {
    // Check if there's content already selected
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
      // Find the minimal DOM element that contains the selection
      const element = getSelectionElement(selection);
      
      // Convert HTML to Markdown
      const markdown = htmlToMarkdown(element.outerHTML);
      
      // Copy to clipboard and notify user
      await copyToClipboard(markdown);
      showToast("Markdown copied from selection!");
      
      // Clear the selection
      selection.removeAllRanges();
    } else {
      // No selection, start interactive mode
      startSelection();
    }
  }
});

// HTML to Markdown conversion functionality
function htmlToMarkdown(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  return processNode(doc.body);
}

// Process DOM nodes recursively to convert to Markdown
function processNode(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    return node.textContent;
  }

  if (node.nodeType !== Node.ELEMENT_NODE) {
    return '';
  }

  const tagName = node.tagName.toLowerCase();
  let result = '';
  let prefix = '';
  let suffix = '';

  switch (tagName) {
    case 'h1': prefix = '# '; suffix = '\n\n'; break;
    case 'h2': prefix = '## '; suffix = '\n\n'; break;
    case 'h3': prefix = '### '; suffix = '\n\n'; break;
    case 'h4': prefix = '#### '; suffix = '\n\n'; break;
    case 'h5': prefix = '##### '; suffix = '\n\n'; break;
    case 'h6': prefix = '###### '; suffix = '\n\n'; break;
    case 'p': suffix = '\n\n'; break;
    case 'br': return '\n';
    case 'b':
    case 'strong': prefix = '**'; suffix = '**'; break;
    case 'i':
    case 'em': prefix = '_'; suffix = '_'; break;
    case 'a':
      if (node.hasAttribute('href')) {
        suffix = `](${node.getAttribute('href')})`;
        prefix = '[';
      }
      break;
    case 'ul': suffix = '\n\n'; break;
    case 'ol': suffix = '\n\n'; break;
    case 'li': prefix = '* '; suffix = '\n'; break;
    case 'pre': prefix = '```\n'; suffix = '\n```\n\n'; break;
    case 'code':
      if (node.parentNode.tagName.toLowerCase() !== 'pre') {
        prefix = '`'; suffix = '`';
      }
      break;
    case 'blockquote': prefix = '> '; suffix = '\n\n'; break;
    case 'hr': return '---\n\n';
    case 'img':
      if (node.hasAttribute('src')) {
        const alt = node.hasAttribute('alt') ? node.getAttribute('alt') : '';
        return `![${alt}](${node.getAttribute('src')})\n\n`;
      }
      break;
  }

  // Process all child nodes
  for (const child of node.childNodes) {
    result += processNode(child);
  }

  // For block elements with prefixes (like lists), handle nested content
  if (tagName === 'li' || tagName === 'blockquote') {
    result = result.replace(/\n/g, '\n  ').trim();
  }

  return prefix + result + suffix;
} 