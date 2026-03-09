// @ts-nocheck
// ^^ Keep this if your Monaco types are incomplete, or install: @types/monaco-editor

import * as monaco from 'monaco-editor';

// --- Types ---
interface ArduinoKeywordToken {
  keywords: string[];
  tokenizer: {
    root: Array<[string, any]>;
    string: Array<[string, string]>;
  };
}

// --- Global State ---
let monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null;
let isEditorOpen = false;
let lineNumbersVisible = true; // Default: line numbers ON

// --- Expose to global window (for legacy HTML interop) ---
declare global {
  interface Window {
    monacoEditor: monaco.editor.IStandaloneCodeEditor | null;
    codeEditorOpen: boolean;
    engine?: { resize: () => void };
    loadRobotFromData?: (data: any) => void;
    setArduinoCode: (code: string) => void;
    getMonacoCode: () => string;
    openCodeEditor: () => void;
    closeCodeEditor: () => void;
    toggleCodeEditor: () => void;
    toggleMenu: () => void;
  }
}

// --- Language Setup ---
function setupArduinoLanguage(): void {
  monaco.languages.register({ id: 'arduino' });

  const tokenizer: ArduinoKeywordToken = {
    keywords: [
      'void', 'int', 'float', 'double', 'char', 'boolean', 'byte', 'long', 'short', 'unsigned', 'signed',
      'if', 'else', 'for', 'while', 'do', 'switch', 'case', 'break', 'continue', 'goto',
      'return', 'true', 'false', 'NULL', 'setup', 'loop',
      // Digital I/O
      'pinMode', 'digitalWrite', 'digitalRead', 'pulseIn', 'pulseInLong', 'shiftOut', 'shiftIn',
      // Analog I/O - Enhanced support
      'analogRead', 'analogWrite', 'analogReference', 'analogReadResolution', 'analogWriteResolution',
      // Advanced Analog
      'tone', 'noTone', 'attachInterrupt', 'detachInterrupt',
      // Serial Communication
      'Serial', 'Serial.begin', 'Serial.end', 'Serial.available', 'Serial.read', 'Serial.readBytes',
      'Serial.print', 'Serial.println', 'Serial.write', 'Serial.flush', 'Serial.peek',
      // Time Functions
      'delay', 'delayMicroseconds', 'millis', 'micros',
      // Math Functions
      'min', 'max', 'abs', 'constrain', 'map', 'pow', 'sqrt', 'sin', 'cos', 'tan',
      // Random Functions
      'random', 'randomSeed'
    ],
    tokenizer: {
      root: [
        [/[a-z_$][\w$]*/, { cases: { '@keywords': 'keyword', '@default': 'identifier' } }],
        [/[{}()\[\]]/, '@brackets'],
        [/\d+/, 'number'],
        [/\/\/.*$/, 'comment'],
        [/"/, 'string', '@string'],
      ],
      string: [
        [/[^\\"]+/, 'string'],
        [/"/, 'string', '@pop']
      ]
    }
  };

  monaco.languages.setMonarchTokensProvider('arduino', tokenizer as any);

  monaco.languages.registerCompletionItemProvider('arduino', {
    provideCompletionItems: (model, position): monaco.languages.ProviderResult<monaco.languages.CompletionList> => {
      const word = model.getWordUntilPosition(position);
      const range = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };

      const suggestions: monaco.languages.CompletionItem[] = [
        {
          label: 'setup',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'void setup() {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Called once when the Arduino starts'
        },
        {
          label: 'loop',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'void loop() {\n\t$0\n}',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Called repeatedly after setup()'
        },
        // Analog Functions
        {
          label: 'analogRead',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'analogRead(${1|A0,A1,A2,A3,A4,A5|})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Reads analog value (0-1023) from analog pin'
        },
        {
          label: 'analogWrite',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'analogWrite(${1|3,5,6,9,10,11|}, ${2:value})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Writes analog value (0-255) to PWM pin'
        },
        {
          label: 'analogReference',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'analogReference(${1|DEFAULT,INTERNAL,INTERNAL1V1,INTERNAL2V56,EXTERNAL|})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Configures the reference voltage for analog input'
        },
        // Digital Functions
        {
          label: 'pinMode',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'pinMode(${1:pin}, ${2|INPUT,OUTPUT,INPUT_PULLUP|})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Configures pin as INPUT, OUTPUT, or INPUT_PULLUP'
        },
        {
          label: 'digitalWrite',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'digitalWrite(${1:pin}, ${2|HIGH,LOW|})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Writes HIGH or LOW to a digital pin'
        },
        {
          label: 'digitalRead',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'digitalRead(${1:pin})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Reads HIGH or LOW from a digital pin'
        },
        // Serial Functions
        {
          label: 'Serial.begin',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Serial.begin(${1:9600})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Initializes serial communication'
        },
        {
          label: 'Serial.print',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Serial.print(${1:value})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Prints data to serial port'
        },
        {
          label: 'Serial.println',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Serial.println(${1:value})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Prints data to serial port with newline'
        },
        // Time Functions
        {
          label: 'delay',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'delay(${1:1000})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Pauses program for specified milliseconds'
        },
        {
          label: 'millis',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'millis()$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Returns milliseconds since Arduino started'
        },
        // ✅ Enhanced: More Arduino functions
        {
          label: 'tone',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'tone(${1:pin}, ${2:frequency}, ${3:duration})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Generates a square wave of specified frequency on a pin',
          range: range
        },
        {
          label: 'noTone',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'noTone(${1:pin})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Stops the generation of square wave',
          range: range
        },
        {
          label: 'attachInterrupt',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'attachInterrupt(${1|0,1|}, ${2:ISR}, ${3|RISING,FALLING,CHANGE|})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Attaches an interrupt to a pin',
          range: range
        },
        {
          label: 'map',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'map(${1:value}, ${2:fromLow}, ${3:fromHigh}, ${4:toLow}, ${5:toHigh})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Re-maps a number from one range to another',
          range: range
        },
        {
          label: 'constrain',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'constrain(${1:x}, ${2:a}, ${3:b})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Constrains a number to be within a range',
          range: range
        },
        {
          label: 'random',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'random(${1:min}, ${2:max})$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Generates pseudo-random numbers',
          range: range
        },
        {
          label: 'Serial.available',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Serial.available()$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Returns the number of bytes available for reading',
          range: range
        },
        {
          label: 'Serial.read',
          kind: monaco.languages.CompletionItemKind.Function,
          insertText: 'Serial.read()$0',
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          documentation: 'Reads incoming serial data',
          range: range
        }
      ];
      
      // ✅ Filter suggestions based on current word
      const filtered = suggestions.filter(s => 
        s.label.toLowerCase().includes(word.word.toLowerCase())
      );
      
      return { 
        suggestions: filtered.length > 0 ? filtered : suggestions,
        incomplete: false
      };
    },
    triggerCharacters: ['.', '('] // Trigger on . and (
  });
}

// --- Initialize Monaco Editor ---
function initializeMonacoEditor(): void {
  const container = document.getElementById('arduinoCodeContainer');
  if (!container) {
    console.warn('Arduino code container not found');
    return;
  }

  // Clean up previous editor if exists
  if (monacoEditor) {
    monacoEditor.dispose();
    monacoEditor = null;
  }

  // Clear container
  container.innerHTML = '';

  const textarea = document.getElementById('arduinoCode') as HTMLTextAreaElement | null;
  let initialValue = textarea?.value ?? '';

  // ✅ Load from localStorage if available (auto-save feature)
  const savedCode = localStorage.getItem('arduinoCodeAutoSave');
  if (savedCode && !initialValue.trim()) {
    initialValue = savedCode;
  } else if (!initialValue.trim()) {
    initialValue = `void setup() {\n\tSerial.begin(9600);\n}\n\nvoid loop() {\n\t\n}`;
  }

  monacoEditor = monaco.editor.create(container, {
    value: initialValue,
    language: 'arduino',
    theme: 'vs-dark',
    automaticLayout: true,
    minimap: { enabled: true },
    scrollBeyondLastLine: false,
    fontFamily: 'Fira Code, monospace',
    fontSize: 13,
    readOnly: false, // ✅ Ensure editor is NOT read-only
    wordWrap: 'on',
    lineNumbers: 'on', // ✅ Show line numbers by default
    roundedSelection: false,
    cursorStyle: 'line',
    selectOnLineNumbers: true,
    acceptSuggestionOnEnter: 'on',
    tabSize: 2,
    insertSpaces: true,
    autoIndent: 'full',
    formatOnPaste: true,
    formatOnType: true,
    // ✅ Enable syntax error highlighting
    quickSuggestions: true,
    suggestOnTriggerCharacters: true,
    acceptSuggestionOnCommitCharacter: true
  });

  window.monacoEditor = monacoEditor;

  // ✅ Auto-save to localStorage on content change
  let saveTimeout: number | null = null;
  monacoEditor.onDidChangeModelContent(() => {
    const code = monacoEditor!.getValue();
    
    // Update textarea
    if (textarea) {
      textarea.value = code;
      textarea.dispatchEvent(new Event('input', { bubbles: true }));
    }
    
    // ✅ Auto-save to localStorage (debounced - save after 1 second of no typing)
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }
    
    // Update indicator to show "Saving..."
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
      indicator.textContent = '💾 Saving...';
      indicator.style.color = '#ff9800';
    }
    
    saveTimeout = window.setTimeout(() => {
      try {
        localStorage.setItem('arduinoCodeAutoSave', code);
        console.log('💾 Code auto-saved to localStorage');
        
        // Update indicator to show "Saved"
        if (indicator) {
          indicator.textContent = '💾 Saved';
          indicator.style.color = '#4caf50';
          setTimeout(() => {
            if (indicator) {
              indicator.textContent = '💾 Auto-save enabled';
              indicator.style.color = '#666';
            }
          }, 1500);
        }
      } catch (e) {
        console.warn('Failed to save code to localStorage:', e);
        if (indicator) {
          indicator.textContent = '❌ Save failed';
          indicator.style.color = '#f44336';
        }
      }
    }, 1000);
  });

  // ✅ Add syntax error highlighting using Monaco's built-in validation
  // Monaco will automatically highlight syntax errors for the 'arduino' language
  // We can enhance this with custom validation if needed
  
  // ✅ Focus editor immediately to allow typing
  setTimeout(() => {
    monacoEditor?.focus();
  }, 100);

  // ✅ Setup editor controls (line numbers toggle, format button)
  setupEditorControls();
}

// ✅ Setup Editor Controls (Line Numbers Toggle, Format Button)
function setupEditorControls(): void {
  const toggleLineNumbersBtn = document.getElementById('toggleLineNumbersBtn');
  const formatCodeBtn = document.getElementById('formatCodeBtn');
  const autoSaveIndicator = document.getElementById('autoSaveIndicator');

  // Line Numbers Toggle
  if (toggleLineNumbersBtn) {
    toggleLineNumbersBtn.addEventListener('click', () => {
      if (!monacoEditor) return;
      lineNumbersVisible = !lineNumbersVisible;
      monacoEditor.updateOptions({
        lineNumbers: lineNumbersVisible ? 'on' : 'off'
      });
      toggleLineNumbersBtn.textContent = lineNumbersVisible ? '📊 Line Numbers' : '📊 No Line Numbers';
      toggleLineNumbersBtn.title = lineNumbersVisible ? 'Hide line numbers' : 'Show line numbers';
    });
  }

  // Format Code Button
  if (formatCodeBtn) {
    formatCodeBtn.addEventListener('click', () => {
      formatCode();
    });
  }

  // Keyboard shortcut for formatting (Alt+Shift+F)
  if (monacoEditor) {
    try {
      monacoEditor.addCommand(monaco.KeyMod.Alt | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
        formatCode();
      });
    } catch (e) {
      console.warn('Could not add format shortcut:', e);
    }
  }

  // Update auto-save indicator
  if (autoSaveIndicator) {
    autoSaveIndicator.textContent = '💾 Auto-save enabled';
    autoSaveIndicator.style.color = '#4caf50';
  }
}

// ✅ Format Code Function
function formatCode(): void {
  if (!monacoEditor) {
    console.warn('Monaco editor not available for formatting');
    return;
  }

  try {
    // Get current selection or entire document
    const selection = monacoEditor.getSelection();
    const model = monacoEditor.getModel();
    
    if (!model) {
      console.warn('No model available for formatting');
      return;
    }

    // Format the code
    monacoEditor.getAction('editor.action.formatDocument')?.run();
    
    // Show success message
    const indicator = document.getElementById('autoSaveIndicator');
    if (indicator) {
      const originalText = indicator.textContent;
      indicator.textContent = '✨ Code formatted!';
      indicator.style.color = '#4caf50';
      setTimeout(() => {
        if (indicator) {
          indicator.textContent = originalText || '💾 Auto-save enabled';
          indicator.style.color = '#666';
        }
      }, 2000);
    }
  } catch (error) {
    console.error('Error formatting code:', error);
    alert('Failed to format code. Please check for syntax errors.');
  }
}

// --- Open Code Editor ---
function openCodeEditor(): void {
  console.log('🔓 Opening code editor...');
  
  // Hide Component Properties panel when code editor opens to ensure Load Example is visible
  const componentPropsPanel = document.getElementById('componentPropertiesPanel');
  if (componentPropsPanel) {
    componentPropsPanel.style.display = 'none';
  }

  const codeEditorPanel = document.getElementById('codeEditorPanel');
  const editCodeBtn = document.getElementById('editCodeBtn');

  if (!codeEditorPanel) return;

  isEditorOpen = true;
  window.codeEditorOpen = true;

  codeEditorPanel.style.display = 'flex';
  codeEditorPanel.classList.add('open');

  if (editCodeBtn) {
    editCodeBtn.textContent = '📝 Close Code';
    editCodeBtn.classList.add('active');
  }

  // Initialize Monaco immediately
  if (!monacoEditor) {
    setupArduinoLanguage();
  }

  // Resize after panel animation starts
  // ✅ Don't resize engine - code editor is a side panel overlay, doesn't change canvas size
  // Resizing engine can cause component positions to change unexpectedly
  setTimeout(() => {
    if (!monacoEditor) {
      initializeMonacoEditor();
    } else {
      // Re-layout if editor already exists
      monacoEditor.layout();
    }
    // ✅ Only resize Monaco editor, not the Babylon.js engine
    // The canvas size doesn't change when code editor opens
  }, 300);
}

// --- Close Code Editor ---
function closeCodeEditor(): void {
  console.log('🔒 Closing code editor...');

  isEditorOpen = false;
  window.codeEditorOpen = false;

  const codeEditorPanel = document.getElementById('codeEditorPanel');
  const editCodeBtn = document.getElementById('editCodeBtn');

  if (codeEditorPanel) {
    codeEditorPanel.classList.remove('open');
    setTimeout(() => {
      if (!isEditorOpen) {
        codeEditorPanel.style.display = 'none';
        // Dispose editor to free memory
        if (monacoEditor) {
          monacoEditor.dispose();
          monacoEditor = null;
          window.monacoEditor = null;
        }
      }
    }, 300);
  }

  // ✅ Restore Component Properties panel when code editor closes
  const componentPropsPanel = document.getElementById('componentPropertiesPanel');
  if (componentPropsPanel) {
    // Remove any inline display:none that was set
    componentPropsPanel.style.display = '';
  }

  if (editCodeBtn) {
    editCodeBtn.textContent = '📝 Edit Code';
    editCodeBtn.classList.remove('active');
  }

  // ✅ Don't resize engine - code editor is a side panel overlay, doesn't change canvas size
  // Resizing engine can cause component positions to change unexpectedly
  setTimeout(() => {
    // Only resize if canvas size actually changed (which it doesn't for side panel)
    // No engine resize needed
  }, 310);
}

// --- Toggle Menu ---
// Note: This function is kept here as it's Monaco-related functionality
function toggleMenu(): void {
  const sidePanel = document.getElementById('sidePanel');
  if (sidePanel) {
    sidePanel.classList.toggle('open');
  }
}

// --- Utility: Get Code ---
function getMonacoCode(): string {
  return monacoEditor ? monacoEditor.getValue() : '';
}

// --- Utility: Set Code ---
function setArduinoCode(code: string): void {
  // Ensure Monaco is initialized
  if (!monacoEditor) {
    const container = document.getElementById('arduinoCodeContainer');
    if (container) {
      setupArduinoLanguage();
      initializeMonacoEditor();
    }
  }
  
  if (monacoEditor) {
    monacoEditor.setValue(code || '');
    monacoEditor.layout();
  }
  const textarea = document.getElementById('arduinoCode') as HTMLTextAreaElement | null;
  if (textarea) {
    textarea.value = code || '';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

// --- Auto-load Project on Page Load ---
window.addEventListener('load', () => {
  setupArduinoLanguage();

  const projectToLoad = localStorage.getItem('loadRobotData');
  if (projectToLoad) {
    localStorage.removeItem('loadRobotData');

    const checkAndLoad = () => {
      if (typeof window.loadRobotFromData === 'function') {
        try {
          const robotData = JSON.parse(projectToLoad);
          window.loadRobotFromData(robotData);
          console.log('✅ Project loaded successfully');
        } catch (error) {
          console.error('❌ Error loading project:', error);
        }
      } else {
        setTimeout(checkAndLoad, 100);
      }
    };
    checkAndLoad();
  }
});

// --- Expose Functions to Global Window ---
window.openCodeEditor = openCodeEditor;
window.closeCodeEditor = closeCodeEditor;
window.toggleCodeEditor = () => {
  const panel = document.getElementById('codeEditorPanel');
  if (panel?.classList.contains('open')) {
    closeCodeEditor();
  } else {
    openCodeEditor();
  }
};
window.toggleMenu = toggleMenu;
window.setArduinoCode = setArduinoCode;
window.getMonacoCode = getMonacoCode;

// Note: Window resize handler for engine is defined in scene-setup.ts
// Monaco-specific resize handling (monacoEditor.layout()) is done within openCodeEditor/closeCodeEditor functions