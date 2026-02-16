// Code decoration plugin configuration
window.CODE_DECORATION_CONFIG = window.CODE_DECORATION_CONFIG || {
  defaultEffects: {
    shade: '#ffff0040',           // Default highlight color (semi-transparent yellow)
    underline: '#000000',         // Default underline color (black)
    fontColor: '#ff0000',         // Default font color (red)
    backgroundColor: '#ffff00',   // Default background color (yellow)
    frame: '#0000ff'              // Default border color (blue)
  },
  
  style: {
    underlineThickness: '2px',
    frameThickness: '2px',
    framePadding: '2px',
    frameRadius: '3px'
  }
};

const CODE_DECORATION_CONFIG = window.CODE_DECORATION_CONFIG;

// Initialize the configuration
function initCodeDecoration() {
  if (window.Reveal) {
    if (Reveal.isReady()) {
      setTimeout(() => applyCodeDecoration(), 150);
    } else {
      Reveal.on('ready', function() {
        setTimeout(() => applyCodeDecoration(), 150);
      });
    }
  } else {
    setTimeout(() => applyCodeDecoration(), 150);
  }
}

// Apply decoration
function applyCodeDecoration() {
  let foundBlocks = 0;
  
  // Process the code block
  document.querySelectorAll('pre code').forEach(function(code) {
    if (code.hasAttribute('data-decoration-applied')) return;
    
    const pre = code.parentElement;
    const sourceCodeDiv = pre.parentElement;
    
    let rangesAttr = null;
    let effectsAttr = null;
    
    // Look for attributes (`data-code-line-deco-ranges` and `data-code-line-deco-effects`)
    if (sourceCodeDiv && sourceCodeDiv.classList.contains('sourceCode')) {
      rangesAttr = sourceCodeDiv.getAttribute('data-code-line-deco-ranges');
      effectsAttr = sourceCodeDiv.getAttribute('data-code-line-deco-effects');
      console.log('Found in sourceCodeDiv:', rangesAttr, effectsAttr);
    }
    
    if (!rangesAttr) {
      rangesAttr = pre.getAttribute('data-code-line-deco-ranges') || code.getAttribute('data-code-line-deco-ranges');
      effectsAttr = pre.getAttribute('data-code-line-deco-effects') || code.getAttribute('data-code-line-deco-effects');
      console.log('Found in pre/code:', rangesAttr, effectsAttr);
    }
    
    if (!rangesAttr || !effectsAttr) return;
    
    foundBlocks++;
    code.setAttribute('data-decoration-applied', 'true');
    
    // Parse ranges and effects
    const ranges = parseDecoRanges(rangesAttr);
    const effects = parseDecoEffects(effectsAttr);
    
    console.log('Parsed ranges:', ranges);
    console.log('Parsed effects:', effects);
    
    if (ranges.length !== effects.length) {
      console.warn('Range and effect count mismatch:', ranges.length, 'vs', effects.length);
      return;
    }
    
    // Process each range–effect pair
    ranges.forEach((range, idx) => {
      const effect = effects[idx];
      
      // Handle the file name (line 0)
      if (range.lineNum === 0) {
        const filenameElement = findFilenameElement(pre);
        if (filenameElement) {
          applyDecorationToElement(filenameElement, [range], effect);
        }
        return;
      }
      
      // Process normal lines
      const lineSpan = code.querySelector(`span[id$="-${range.lineNum}"]`);
      console.log(`Looking for line ${range.lineNum}:`, lineSpan);
      
      if (!lineSpan) return;
      
      console.log(`Applying decoration to line ${range.lineNum}, range:`, range, 'effects:', effect);
      applyDecoration(lineSpan, range.startChar, range.endChar, effect);
    });
  });
  
  console.log('Total blocks with decoration:', foundBlocks);
}

// Find the file name element
function findFilenameElement(pre) {
  // Look for the `code-with-filename-file` structure
  let current = pre.parentElement;
  while (current && current !== document.body) {
    const filenameDiv = current.querySelector('.code-with-filename-file pre strong');
    if (filenameDiv) return filenameDiv;
    current = current.parentElement;
  }
  return null;
}

// Parse range specifications: "1:5-10,2:5-"
// Each comma-separated range has its own independent effect
function parseDecoRanges(rangesStr) {
  const ranges = rangesStr.split(',').map(s => s.trim());
  const configs = [];
  
  ranges.forEach(function(range) {
    const match = range.match(/(\d+):(\d+)-(\d*)$/);
    if (!match) return;
    
    const lineNum = parseInt(match[1]);
    const startChar = parseInt(match[2]);
    const endChar = match[3] ? parseInt(match[3]) : null;
    
    configs.push({
      lineNum: lineNum,
      startChar: startChar,
      endChar: endChar
    });
  });
  
  return configs;
}

// Parse effect specifications (e.g., "shade:#ff000040|underline|font-color:black|bold,background-color|frame:blue")
// Each comma-separated effect set is applied to the corresponding range
// Multiple effects separated by pipes are applied simultaneously to the same range
function parseDecoEffects(effectsStr) {
  const effectSets = effectsStr.split(',').map(s => s.trim());
  
  return effectSets.map(function(effectSet) {
    // Split by pipe (multiple effects)
    const effects = effectSet.split('|').map(s => s.trim());
    const result = {};
    
    effects.forEach(function(effect) {
      const parts = effect.split(':');
      const effectType = parts[0].trim();
      const effectValue = parts[1] ? parts[1].trim() : null;
      
      switch (effectType) {
        case 'shade':
          result.shade = effectValue || CODE_DECORATION_CONFIG.defaultEffects.shade;
          break;
        case 'underline':
          result.underline = effectValue || CODE_DECORATION_CONFIG.defaultEffects.underline;
          break;
        case 'font-color':
          result.fontColor = effectValue || CODE_DECORATION_CONFIG.defaultEffects.fontColor;
          break;
        case 'background-color':
          result.backgroundColor = effectValue || CODE_DECORATION_CONFIG.defaultEffects.backgroundColor;
          break;
        case 'frame':
          result.frame = effectValue || CODE_DECORATION_CONFIG.defaultEffects.frame;
          break;
        case 'bold':
          result.bold = true;
          break;
      }
    });
    
    return result;
  });
}

// Apply decoration to the entire element (for file names)
function applyDecorationToElement(element, ranges, effects) {
  const textPositions = getTextPositions(element);
  if (textPositions.length === 0) return;
  
  ranges.forEach(function(range) {
    const lastPos = textPositions[textPositions.length - 1].textIndex + 1;
    const actualEndChar = (range.endChar === null || range.endChar > lastPos) ? lastPos + 1 : range.endChar + 1;
    
    if (range.startChar >= actualEndChar) return;
    
    const startInfo = findCharPosition(textPositions, range.startChar);
    const endInfo = findCharPosition(textPositions, actualEndChar);
    
    if (!startInfo || !endInfo) return;
    
    const domRange = document.createRange();
    domRange.setStart(startInfo.node, startInfo.offset);
    domRange.setEnd(endInfo.node, endInfo.offset);
    
    const extractedContent = domRange.extractContents();
    const decoratedSpan = createDecoratedSpan(extractedContent, effects);
    
    domRange.insertNode(decoratedSpan);
  });
}

// Apply decoration to the specified inline range
function applyDecoration(lineSpan, startChar, endChar, effects) {
  const textPositions = getTextPositions(lineSpan);
  
  console.log('Text positions:', textPositions.map(p => ({ char: p.char, index: p.textIndex })));
  
  if (textPositions.length === 0) return;
  
  const lastPos = textPositions[textPositions.length - 1].textIndex + 1;
  const actualEndChar = (endChar === null || endChar > lastPos) ? lastPos + 1 : endChar + 1;
  
  console.log(`Applying decoration from ${startChar} to ${actualEndChar} (last: ${lastPos})`);
  
  if (startChar >= actualEndChar) return;
  
  const startInfo = findCharPosition(textPositions, startChar);
  const endInfo = findCharPosition(textPositions, actualEndChar);
  
  console.log('Start info:', startInfo, 'End info:', endInfo);
  
  if (!startInfo || !endInfo) return;
  
  const range = document.createRange();
  range.setStart(startInfo.node, startInfo.offset);
  range.setEnd(endInfo.node, endInfo.offset);
  
  const extractedContent = range.extractContents();
  const decoratedSpan = createDecoratedSpan(extractedContent, effects);
  
  range.insertNode(decoratedSpan);
}

// Create a `span` for decoration
function createDecoratedSpan(content, effects) {
  const span = document.createElement('span');
  span.className = 'code-decorated';
  span.appendChild(content);
  
  const styles = [];
  
  if (effects.shade) {
    styles.push(`background-color: ${effects.shade}`);
  }
  
  if (effects.underline) {
    const thickness = CODE_DECORATION_CONFIG.style?.underlineThickness || '2px';
    styles.push(`text-decoration: underline`);
    styles.push(`text-decoration-color: ${effects.underline}`);
    styles.push(`text-decoration-thickness: ${thickness}`);
  }
  
  if (effects.fontColor) {
    styles.push(`color: ${effects.fontColor} !important`);
  }
  
  if (effects.backgroundColor) {
    styles.push(`background-color: ${effects.backgroundColor}`);
  }
  
  if (effects.frame) {
    const thickness = CODE_DECORATION_CONFIG.style?.frameThickness || '2px';
    const padding = CODE_DECORATION_CONFIG.style?.framePadding || '2px';
    const radius = CODE_DECORATION_CONFIG.style?.frameRadius || '3px';
    styles.push(`border: ${thickness} solid ${effects.frame}`);
    styles.push(`padding: ${padding}`);
    styles.push(`border-radius: ${radius}`);
    styles.push(`display: inline-block`);
  }
  
  if (effects.bold) {
    styles.push(`font-weight: bold`);
  }
  
  span.style.cssText = styles.join('; ');
  
  console.log('Created decorated span with styles:', span.style.cssText);
  
  return span;
}

// Get text positions excluding HTML tags
function getTextPositions(element) {
  const positions = [];
  let textIndex = 0;
  
  function traverse(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;
      for (let i = 0; i < text.length; i++) {
        positions.push({
          node: node,
          offset: i,
          textIndex: textIndex,
          char: text[i]
        });
        textIndex++;
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      if (node.tagName.toLowerCase() === 'a' && node.getAttribute('href') === '') {
        return;
      }
      Array.from(node.childNodes).forEach(traverse);
    }
  }
  
  traverse(element);
  return positions;
}

// Find the node and offset for the specified character position
function findCharPosition(positions, charIndex) {
  const index = charIndex - 1;
  
  if (index < 0) {
    const first = positions[0];
    return {
      node: first.node,
      offset: first.offset
    };
  }
  
  if (index >= positions.length) {
    const last = positions[positions.length - 1];
    return {
      node: last.node,
      offset: last.offset + 1
    };
  }
  
  const pos = positions[index];
  return {
    node: pos.node,
    offset: pos.offset
  };
}

/*
// Initialize
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initCodeDecoration);
} else {
  initCodeDecoration();
}
*/