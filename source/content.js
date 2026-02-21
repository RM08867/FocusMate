/**
 * FOCUSMATE Content Script
 * Handles text extraction, word splitting, and visual adjustments
 * based on the user's fetched dpref.json configuration.
 */

// Color Mapping for the preference labels in JSON
const COLOR_VALUES = {
  'soft-cream': '#F5F5DC',
  'off-white': '#FAF9F6',
  'pastel-yellow': '#FEF9E7',
  'light-blue': '#EBF5FB',
  'light-peach': '#FDF2E9',
  'muted-green': '#556B2F',
  'warm-brown': '#8B4513',
  'soft-blue': '#4682B4',
  'soft-purple': '#9370DB',
  'black': '#1A1A1A',
  'dark-blue': '#00008B',
  'dark-brown': '#5D4037'
};

async function initFocusMate() {
  try {
    // 1. Fetch the logic rules from the local extension file
    const response = await fetch(chrome.runtime.getURL('dpref.json'));
    const config = await response.json();

    // 2. Get active user preferences from storage
    chrome.storage.sync.get(['focusMatePrefs'], (result) => {
      const prefs = result.focusMatePrefs || config.user_preferences;
      applyGlobalStyles(prefs, config);
      processPageText(config, prefs);
    });
  } catch (error) {
    console.error("FocusMate init failed:", error);
  }
}

/**
 * Applies global CSS (Fonts, Spacing, Background) to the document
 */
function applyGlobalStyles(prefs, config) {
  const styleId = 'focusmate-injected-styles';
  let styleEl = document.getElementById(styleId);
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = styleId;
    document.head.appendChild(styleEl);
  }

  const bgColor = COLOR_VALUES[prefs.background_color] || prefs.background_color || '#FFFFFF';
  const textColor = COLOR_VALUES[prefs.text_color] || prefs.text_color || '#1A1A1A';

  styleEl.textContent = `
    /* Universal adjustments */
    body {
      background-color: ${bgColor} !important;
      color: ${textColor} !important;
    }

    /* Target text elements specifically */
    p, span, li, h1, h2, h3, h4, h5, h6, div, blockquote {
      font-family: "${prefs.font}", sans-serif !important;
      font-size: ${prefs.font_size}px !important;
      line-height: ${prefs.line_spacing} !important;
      word-spacing: ${prefs.word_spacing}em !important;
      letter-spacing: ${prefs.letter_spacing}em !important;
    }

    /* Styles for the specific letter groups from config */
    ${Object.entries(config.letter_highlighting.default_highlight_colors).map(([group, colorName]) => `
      .focusmate-${group} {
        color: ${COLOR_VALUES[colorName] || 'inherit'} !important;
        font-weight: bold !important;
        background-color: rgba(0,0,0,0.05);
        border-radius: 2px;
        padding: 0 1px;
      }
    `).join('')}
  `;
}

/**
 * Extracts text nodes and splits them into words for letter-level processing
 */
function processPageText(config, prefs) {
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: (node) => {
        const parent = node.parentElement.tagName.toLowerCase();
        if (['script', 'style', 'textarea', 'input', 'noscript'].includes(parent)) {
          return NodeFilter.FILTER_REJECT;
        }
        return node.textContent.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
      }
    }
  );

  const textNodes = [];
  let currentNode;
  while (currentNode = walker.nextNode()) {
    textNodes.push(currentNode);
  }

  const groups = config.confusing_letter_groups;
  const allConfusingLetters = Object.values(groups).flat();
  const letterRegex = new RegExp(`([${allConfusingLetters.join('')}])`, 'gi');

  textNodes.forEach(node => {
    const originalText = node.textContent;
    const segments = originalText.split(/(\s+)/);
    const fragment = document.createDocumentFragment();

    segments.forEach(segment => {
      if (/\s+/.test(segment)) {
        fragment.appendChild(document.createTextNode(segment));
      } else {
        if (letterRegex.test(segment)) {
          const wordSpan = document.createElement('span');
          wordSpan.innerHTML = segment.replace(letterRegex, (match) => {
            const char = match.toLowerCase();
            let groupKey = '';
            for (const [key, chars] of Object.entries(groups)) {
              if (chars.includes(char)) {
                groupKey = key;
                break;
              }
            }
            return groupKey ? `<span class="focusmate-${groupKey}">${match}</span>` : match;
          });
          fragment.appendChild(wordSpan);
        } else {
          fragment.appendChild(document.createTextNode(segment));
        }
      }
    });

    if (node.parentNode) {
      node.parentNode.replaceChild(fragment, node);
    }
  });
}

initFocusMate();

chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "updateStyles") {
    location.reload();
  }
});