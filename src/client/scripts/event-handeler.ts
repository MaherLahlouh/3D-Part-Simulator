/**
 * 
 * Code Editor Event Handlers
 *
 * This module handles compilation, execution, and example loading for Arduino code.
 * Integrates with Monaco Editor for code retrieval and compilation system for execution.
 *
 * @module event-handeler
 */
// @ts-nocheck


// Simulation state tracking
let isSimulationRunning = false;  // Tracks if AVR simulation is currently running

// ENHANCEMENT #2: INPUT VALIDATION & SANITIZATION
// Purpose: Validate and sanitize user inputs to prevent XSS and injection attacks
// Called from: compileAndLoadCode(), input handlers throughout the application

/**
 * Sanitize HTML string to prevent XSS attacks
 * Purpose: Remove potentially dangerous HTML/JS from user input
 * @param {string} str - String to sanitize
 * @returns {string} Sanitized string
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';

  const temp = document.createElement('div');
  temp.textContent = str;
  return temp.innerHTML;
}

/**
 * Validate Arduino code for basic security checks
 * Purpose: Check for dangerous patterns before compilation
 * @param {string} code - Arduino code to validate
 * @returns {object} {valid: boolean, errors: string[]}
 */
function validateArduinoCode(code) {
  const errors = [];

  // Check if code is string
  if (typeof code !== 'string') {
    return { valid: false, errors: ['Invalid code format'] };
  }

  // Check code length (prevent DOS attacks)
  const MAX_CODE_LENGTH = 100000; // 100KB
  if (code.length > MAX_CODE_LENGTH) {
    errors.push(`Code too long (${code.length} chars). Maximum: ${MAX_CODE_LENGTH} characters.`);
  }

  // Check for empty code
  if (code.trim().length === 0) {
    errors.push('Code is empty. Please write some code first.');
  }

  // Check for excessive nesting (could crash compiler)
  const openBraces = (code.match(/{/g) || []).length;
  const closeBraces = (code.match(/}/g) || []).length;
  if (Math.abs(openBraces - closeBraces) > 100) {
    errors.push('Unbalanced braces detected. Please check your code syntax.');
  }

  // Check for dangerous shell patterns (should not be in Arduino code)
  // ✅ Analog functions (analogRead, analogWrite, etc.) are explicitly allowed
  // These are standard Arduino functions and are safe to use
  const dangerousPatterns = [
    /system\s*\(/gi,
    /exec\s*\(/gi,
    /__asm__/gi,
    /asm\s+volatile/gi,
    /eval\s*\(/gi,
    /Function\s*\(/gi
  ];

  // ✅ Analog functions are safe - check for dangerous patterns but allow analog functions
  dangerousPatterns.forEach(pattern => {
    if (pattern.test(code)) {
      // Double-check: if it's an analog function, it's safe
      const isAnalogFunction = /analog(Read|Write|Reference|ReadResolution|WriteResolution)\s*\(/gi.test(code);
      if (!isAnalogFunction) {
        errors.push('Code contains potentially dangerous patterns. Please review.');
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors: errors
  };
}

/**
 * Validate project name for save operations
 * Purpose: Ensure project names are safe for database storage
 * @param {string} name - Project name to validate
 * @returns {object} {valid: boolean, sanitized: string, error: string}
 */
function validateProjectName(name) {
  if (typeof name !== 'string') {
    return { valid: false, sanitized: '', error: 'Project name must be text' };
  }

  // Remove leading/trailing whitespace
  let sanitized = name.trim();

  // Check length
  if (sanitized.length === 0) {
    return { valid: false, sanitized: '', error: 'Project name cannot be empty' };
  }

  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }

  // Remove dangerous characters (keep alphanumeric, spaces, dashes, underscores)
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-_]/g, '');

  // Sanitize HTML
  sanitized = sanitizeHTML(sanitized);

  if (sanitized.length === 0) {
    return { valid: false, sanitized: '', error: 'Project name contains invalid characters' };
  }

  return { valid: true, sanitized: sanitized, error: null };
}

/**
 * Validate file path for security (prevent path traversal) - Cross-platform compatible
 * Purpose: Ensure file paths don't escape intended directories
 * Works on: Windows, Mac OS, Linux
 * @param {string} filePath - File path to validate
 * @returns {boolean} True if path is safe
 */
function validateFilePath(filePath) {
  if (typeof filePath !== 'string') return false;

  // Normalize path separators for cross-platform compatibility
  // Convert backslashes to forward slashes for consistent checking
  const normalizedPath = filePath.replace(/\\/g, '/');

  // Check for path traversal attempts (cross-platform)
  const dangerousPatterns = [
    /\.\./,           // Parent directory (../ or ..\)
    /\.\.\//,         // Parent directory with forward slash
    /\.\.\\/,         // Parent directory with backslash
    /^\/etc\//i,      // Linux system directory
    /^\/var\//i,      // Linux variable directory
    /^\/proc\//i,     // Linux process directory
    /^\/sys\//i,       // Linux system directory
    /^\/root\//i,     // Linux root home
    /^\/bin\//i,      // Linux binary directory
    /^\/sbin\//i,     // Linux system binary directory
    /^\/usr\//i,      // Linux user directory
    /^\/Library\//i,  // Mac OS Library directory
    /^\/System\//i,   // Mac OS System directory
    /^\/Applications\//i, // Mac OS Applications (if not allowed)
    /^[A-Z]:\//i,     // Windows drive letters (C:/, D:/, etc.) - only block absolute paths
    /^~/,             // Home directory reference
    /\/\.\./,         // Path traversal in middle of path
    /\/\.\.\//,       // Path traversal with slashes
  ];

  // Allow relative paths and simple filenames
  // Block only absolute system paths and path traversal
  if (normalizedPath.startsWith('/') || normalizedPath.match(/^[A-Z]:/i)) {
    // This is an absolute path - check if it's dangerous
    return !dangerousPatterns.some(pattern => pattern.test(normalizedPath));
  }

  // Relative paths are generally safe if they don't contain traversal
  return !normalizedPath.includes('..');
}

/**
 * Sanitize user input for display
 * Purpose: Clean user input before displaying in UI
 * @param {string} input - User input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeUserInput(input) {
  if (typeof input !== 'string') return '';

  // Limit length
  if (input.length > 1000) {
    input = input.substring(0, 1000);
  }

  // Remove HTML tags and escape special characters
  return sanitizeHTML(input);
}

// Export validation functions globally
window.sanitizeHTML = sanitizeHTML;
window.validateArduinoCode = validateArduinoCode;
window.validateProjectName = validateProjectName;
window.validateFilePath = validateFilePath;
window.sanitizeUserInput = sanitizeUserInput;

// ENHANCEMENT #5: ERROR BOUNDARY SYSTEM
// Purpose: Global error handling to prevent crashes and show user-friendly errors
// Called from: Wrapping critical operations throughout the application

/**
 * Error boundary wrapper for async functions
 * Purpose: Wrap async operations with error handling
 * @param {Function} fn - Async function to wrap
 * @param {string} operationName - Name of operation for error messages
 * @returns {Function} Wrapped function
 */
function withErrorBoundary(fn, operationName = 'Operation') {
    return async function(...args) {
        try {
            return await fn.apply(this, args);
        } catch (error) {
            console.error(`❌ Error in ${operationName}:`, error);

            // Log error details
            const errorDetails = {
                operation: operationName,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };

            console.error('Error details:', errorDetails);

            // Show user-friendly error message
            const userMessage = `An error occurred during ${operationName}:\n\n${error.message}\n\nPlease try again or refresh the page if the problem persists.`;

            if (typeof window.showToast === 'function') {
                window.showToast(`Error: ${error.message}`, 'error', 5000);
            } else {
                alert(userMessage);
            }

            // Optionally send error to logging service
            if (typeof window.logErrorToServer === 'function') {
                window.logErrorToServer(errorDetails);
            }

            // Re-throw if needed for caller to handle
            throw error;
        }
    };
}

/**
 * Error boundary wrapper for synchronous functions
 * Purpose: Wrap sync operations with error handling
 * @param {Function} fn - Function to wrap
 * @param {string} operationName - Name of operation for error messages
 * @returns {Function} Wrapped function
 */
function withErrorBoundarySync(fn, operationName = 'Operation') {
    return function(...args) {
        try {
            return fn.apply(this, args);
        } catch (error) {
            console.error(`❌ Error in ${operationName}:`, error);

            const errorDetails = {
                operation: operationName,
                message: error.message,
                stack: error.stack,
                timestamp: new Date().toISOString()
            };

            console.error('Error details:', errorDetails);

            const userMessage = `An error occurred during ${operationName}:\n\n${error.message}`;

            if (typeof window.showToast === 'function') {
                window.showToast(`Error: ${error.message}`, 'error', 5000);
            } else {
                alert(userMessage);
            }

            if (typeof window.logErrorToServer === 'function') {
                window.logErrorToServer(errorDetails);
            }

            return null;
        }
    };
}

/**
 * Safe execution wrapper
 * Purpose: Execute function safely with error recovery
 * @param {Function} fn - Function to execute
 * @param {*} fallbackValue - Value to return on error
 * @param {string} errorContext - Context for error message
 */
function safeExecute(fn, fallbackValue = null, errorContext = 'operation') {
    try {
        return fn();
    } catch (error) {
        console.error(`❌ Error during ${errorContext}:`, error);
        return fallbackValue;
    }
}

/**
 * Global error handler for uncaught errors
 */
window.addEventListener('error', (event) => {
    console.error('🚨 Uncaught error:', event.error);

    const errorDetails = {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error ? event.error.stack : 'No stack trace',
        timestamp: new Date().toISOString()
    };

    console.error('Global error details:', errorDetails);

    //commented _12_23_2025

    // Show user-friendly error
    // if (typeof window.showToast === 'function') {
    //     window.showToast('An unexpected error occurred. Please refresh if needed.', 'error', 5000);
    // }

    // Log to server if available
    if (typeof window.logErrorToServer === 'function') {
        window.logErrorToServer(errorDetails);
    }

    // Prevent default error handling (console spam)
    event.preventDefault();
});

/**
 * Global handler for unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);

    const errorDetails = {
        reason: event.reason,
        promise: event.promise,
        timestamp: new Date().toISOString()
    };

    console.error('Unhandled rejection details:', errorDetails);

    if (typeof window.showToast === 'function') {
        const message = event.reason?.message || String(event.reason) || 'Unknown error';
        window.showToast(`Promise error: ${message}`, 'error', 5000);
    }

    if (typeof window.logErrorToServer === 'function') {
        window.logErrorToServer(errorDetails);
    }

    event.preventDefault();
});

// Export error boundary functions
window.withErrorBoundary = withErrorBoundary;
window.withErrorBoundarySync = withErrorBoundarySync;
window.safeExecute = safeExecute;

/**
 * Compile Arduino code and load into AVR simulator
 * 
 * Purpose: Compile user's Arduino code via backend API and load compiled HEX into simulator
 * Called from: Run button click handler, example execution
 * Used in: Code compilation workflow when user clicks "Run" button
 * 
 * @param {boolean} startAfterLoad - If true, automatically start simulation after loading
 * @returns {Promise<boolean>} Success status of compilation and loading
 */
/**
 * Check if backend server is running
 * 
 * Purpose: Verify backend server is accessible before attempting compilation
 * Called from: compileAndLoadCode() before making compilation request
 * Used in: Error prevention and better user feedback
 * 
 * @returns {Promise<boolean>} True if server is running, false otherwise
 */
async function checkServerHealth() {
   /*     try {
            const response = await fetch('http://localhost:3005/api/health', {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            return false;
        }*/
}

async function compileAndLoadCode(startAfterLoad = false) {
    // Get code from Monaco editor (preferred) or textarea (fallback)
    // Purpose: Unified code retrieval that works with both Monaco and legacy textarea
    // Used in: Compilation process to get current code
    let code = '';
    if (typeof window.getArduinoCode === 'function') {
        code = window.getArduinoCode().trim();
    } else if (monacoEditor) {
        code = monacoEditor.getValue().trim();
    } else {
        const textarea = document.getElementById('arduinoCode');
        code = textarea ? textarea.value.trim() : '';
    }

    const output = document.getElementById('compileOutput');

    // ENHANCEMENT #2: Validate Arduino code before compilation
    const validation = validateArduinoCode(code);
    if (!validation.valid) {
        const errorMsg = '❌ Code Validation Failed:\n' + validation.errors.join('\n');
        updateCompileStatus('error', errorMsg);
        return false;
    }

    // Check if server is running before attempting compilation
    // Purpose: Provide better error message if server is down
    const serverRunning = await checkServerHealth();
    if (!serverRunning) {
        // ENHANCEMENT: Use compile status function for server error
        // Purpose: Show error status with consistent formatting
        // Called from: compileAndLoadCode() when server is not running
        // Used in: Consistent error messaging for server connection issues
        const errorMsg = `❌ Backend Server Not Running!\n\n🔧 To fix this:\n1. Open terminal in project folder\n2. Run: node server.js\n3. Wait for "Server Running" message\n4. Try compiling again\n\n📍 Server should be at: http://localhost:3005`;
        updateCompileStatus('error', errorMsg);
        return false;
    }

    // ENHANCEMENT: Use compile status function for loading state
    // Purpose: Show loading status with consistent formatting
    // Called from: compileAndLoadCode() when compilation starts
    // Used in: Consistent loading indicator during compilation
    updateCompileStatus('loading', 'Compiling...');

    try {
        // FIREBASE AUTHENTICATION - COMMENTED OUT FOR NOW
        // Authenticate user for backend API access
        // Purpose: Get Firebase auth token for secure API communication
        
        const response = await fetch('http://localhost:3005/arduino/compile', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
                // 'Authorization': `Bearer ${token}` // COMMENTED OUT - No auth required for now
            },
            body: JSON.stringify({ code })
        });

        // Check if response is actually JSON (not HTML error page)
        // Purpose: Detect when server returns HTML instead of JSON (server not running, 404, etc.)
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('❌ Server returned non-JSON response:', text.substring(0, 200));
            output.textContent = `❌ Server Error: Backend returned HTML instead of JSON.\n\nThis usually means:\n1. Backend server is not running on localhost:3005\n2. Server returned an error page\n\nPlease start the backend server with: node server.js\n\nResponse preview: ${text.substring(0, 100)}...`;
            return false;
        }

        const result = await response.json();

        if (response.ok) {
            // ENHANCEMENT: Use compile status function for success message
            // Purpose: Show success status with consistent formatting
            // Called from: compileAndLoadCode() when compilation succeeds
            // Used in: Consistent success messaging with green color
            const successMsg = `✅ Compilation successful!${result.output || 'Code compiled without errors.'}`;
            updateCompileStatus('success', successMsg);

            // Load compiled HEX into AVR simulator
            // Purpose: Transfer compiled code to simulator for execution
            // Used in: Execution workflow to run compiled Arduino code
            if (result.hex) {
                if (typeof window.loadProgramIntoAVR === 'function') {
                    const loaded = window.loadProgramIntoAVR(result.hex);
                    if (loaded) {
                        // ENHANCEMENT: Show success toast when program loads
                        // Purpose: Provide visual feedback that program loaded successfully
                        // Called from: compileAndLoadCode() when program loads into AVR
                        // Used in: User notification for successful program loading
                        if (typeof window.showToast === 'function') {
                            window.showToast('✅ Program loaded into AVR simulator', 'success', 2000);
                        }
                        // Auto-start simulation if requested
                        // Purpose: Seamless workflow from compile to execution
                        if (startAfterLoad) {
                            startSimulation();
                        }
                    } else {
                        // ENHANCEMENT: Show warning toast when program fails to load
                        // Purpose: Provide visual feedback that program loading failed
                        // Called from: compileAndLoadCode() when program fails to load
                        // Used in: User notification for loading failure
                        if (typeof window.showToast === 'function') {
                            window.showToast('⚠️ Failed to load program into AVR', 'error', 3000);
                        }
                    }
                } else {
                    // ENHANCEMENT: Show warning toast when AVR system not ready
                    // Purpose: Provide visual feedback that AVR system is unavailable
                    // Called from: compileAndLoadCode() when AVR system not ready
                    // Used in: User notification for AVR system unavailability
                    if (typeof window.showToast === 'function') {
                        window.showToast('⚠️ AVR system not ready', 'error', 3000);
                    }
                }
                // Store HEX data for later use
                // Purpose: Cache compiled code for re-execution without recompiling
                document.getElementById('arduinoCode').setAttribute('data-hex', result.hex);
            }
            return true;
        } 
        else {
            // ENHANCEMENT: Use compile status function for compilation failure
            // Purpose: Show error status with consistent formatting
            // Called from: compileAndLoadCode() when compilation fails
            // Used in: Consistent error messaging for compilation failures
            const errorMsg = `❌ Compilation failed:${result.error || result.output || 'Unknown error occurred.'}`;
            updateCompileStatus('error', errorMsg);
            return false;
        }
    } 
    catch (error) {
        console.error('Compilation error:', error);
        
        // Better error handling for network issues
        // Purpose: Provide helpful error messages for common issues
        let errorMessage = `❌ Network Error: ${error.message}\n\n`;
        
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            errorMessage += '🔍 Possible causes:\n';
            errorMessage += '1. Backend server is not running\n';
            errorMessage += '   → Start it with: node server.js\n';
            errorMessage += '2. Server is running on different port\n';
            errorMessage += '   → Check server.js PORT setting\n';
            errorMessage += '3. CORS or firewall blocking request\n';
            errorMessage += '   → Check browser console for details\n';
        } else if (error.message.includes('JSON')) {
            errorMessage += 'Server returned invalid JSON (likely HTML error page)\n';
            errorMessage += '→ Check if backend server is running correctly\n';
        }
        
        errorMessage += '\n📍 Expected endpoint: http://localhost:3005/arduino/compile';
        
        // ENHANCEMENT: Use compile status function for network errors
        // Purpose: Show error status with consistent formatting
        // Called from: compileAndLoadCode() when network error occurs
        // Used in: Consistent error messaging for network issues
        updateCompileStatus('error', errorMessage);
        return false;
    }
}

/**
 * ENHANCEMENT: Update compile output with status-based styling
 * Purpose: Display compilation status with appropriate colors (success=green, error=red, loading=blue)
 * Called from: compileAndLoadCode() throughout compilation process
 * Used in: Consistent status display in compile output area
 * 
 * @param {string} status - Status type: 'success', 'error', 'loading', or 'info'
 * @param {string} message - Message to display
 */
function updateCompileStatus(status, message) {
    // Purpose: Get compile output element from DOM
    // Called from: updateCompileStatus() to find output element
    // Used in: Displaying compilation status messages
    const output = document.getElementById('compileOutput');
    
    // Purpose: Check if output element exists before updating
    // Called from: updateCompileStatus() to prevent errors
    // Used in: Safety check to ensure element exists
    if (!output) {
        console.warn('compileOutput element not found');
        return;
    }
    
    // Purpose: Set text content of output element
    // Called from: updateCompileStatus() to display message
    // Used in: Showing compilation status message to user
    output.textContent = message;
    
    // Purpose: Set color based on status type for visual feedback
    // Called from: updateCompileStatus() to apply status color
    // Used in: Visual indication of compilation status (green=success, red=error, blue=loading/info)
    switch(status) {
        case 'success':
            // Purpose: Green color for successful compilation
            // Called from: updateCompileStatus() when status is 'success'
            // Used in: Visual feedback for successful operations
            output.style.color = '#27ae60';
            break;
        case 'error':
            // Purpose: Red color for compilation errors
            // Called from: updateCompileStatus() when status is 'error'
            // Used in: Visual feedback for error conditions
            output.style.color = '#e74c3c';
            break;
        case 'loading':
            // Purpose: Blue color for loading/compiling state
            // Called from: updateCompileStatus() when status is 'loading'
            // Used in: Visual feedback for in-progress operations
            output.style.color = '#3498db';
            // Purpose: Add loading spinner HTML for visual indication
            // Called from: updateCompileStatus() when status is 'loading'
            // Used in: Showing animated spinner during compilation
            output.innerHTML = `
<div style="display: flex; align-items: center; gap: 10px;">
  <div class="loading-spinner" style="width: 16px; height: 16px; border-width: 2px;"></div>
  <span>${message}</span>
</div>`;
            break;
        case 'info':
        default:
            // Purpose: Default blue color for informational messages
            // Called from: updateCompileStatus() when status is 'info' or default
            // Used in: Visual feedback for informational messages
            output.style.color = '#3498db';
            break;
    }
}

/**
 * ENHANCEMENT: Toast Notification System
 * Purpose: Display temporary success/error/info messages to users
 * Called from: Various functions throughout the application (compile, save, delete, etc.)
 * Used in: User feedback for operations (success, error, info messages)
 * 
 * @param {string} message - Message to display
 * @param {string} type - Toast type: 'success', 'error', 'info', or 'warning'
 * @param {number} duration - Display duration in milliseconds (default: 3000)
 */
function showToast(message, type = 'info', duration = 3000) {
    // Purpose: Get toast container element from DOM
    // Called from: showToast() to find container element
    // Used in: Adding toast notifications to the page
    let container = document.getElementById('toastContainer');
    
    // Purpose: Check if toast container exists before creating toast
    // Called from: showToast() to prevent errors
    // Used in: Safety check to ensure container element exists
    if (!container) {
        console.warn('toastContainer not found, creating it...');
        // Purpose: Create toast container if it doesn't exist
        // Called from: showToast() when container is missing
        // Used in: Ensuring toast container exists for notifications
        const newContainer = document.createElement('div');
        newContainer.id = 'toastContainer';
        newContainer.style.cssText = 'position: fixed; top: 20px; right: 20px; z-index: 10000; display: flex; flex-direction: column; gap: 10px; pointer-events: none;';
        document.body.appendChild(newContainer);
        container = newContainer;
    }
    
    // Purpose: Create toast notification element
    // Called from: showToast() to create individual toast
    // Used in: Displaying notification message to user
    const toast = document.createElement('div');
    
    // Purpose: Determine background color based on toast type
    // Called from: showToast() to set toast color
    // Used in: Visual distinction between success (green), error (red), info (blue), warning (orange)
    let bgColor = '#3498db'; // Default blue for info
    if (type === 'success') {
        // Purpose: Green background for success messages
        // Called from: showToast() when type is 'success'
        // Used in: Visual feedback for successful operations
        bgColor = '#27ae60';
    } else if (type === 'error') {
        // Purpose: Red background for error messages
        // Called from: showToast() when type is 'error'
        // Used in: Visual feedback for error conditions
        bgColor = '#e74c3c';
    } else if (type === 'warning') {
        // Purpose: Orange background for warning messages
        // Called from: showToast() when type is 'warning'
        // Used in: Visual feedback for warning conditions
        bgColor = '#f39c12';
    }
    
    // Purpose: Apply CSS styles to toast element
    // Called from: showToast() to style the toast
    // Used in: Creating visually appealing toast notifications
    toast.style.cssText = `
        padding: 12px 20px;
        background: ${bgColor};
        color: white;
        border-radius: 6px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: slideInRight 0.3s ease;
        font-size: 14px;
        font-weight: 500;
        max-width: 400px;
        word-wrap: break-word;
        pointer-events: auto;
        cursor: pointer;
    `;
    
    // Purpose: Set toast message text content
    // Called from: showToast() to display message
    // Used in: Showing notification message to user
    toast.textContent = message;
    
    // Purpose: Add click handler to dismiss toast on click
    // Called from: showToast() to make toast dismissible
    // Used in: Allowing users to manually close toast notifications
    toast.onclick = () => {
        // Purpose: Remove toast when clicked
        // Called from: Toast click handler
        // Used in: Dismissing toast notification on user click
        toast.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => toast.remove(), 300);
    };
    
    // Purpose: Add toast to container
    // Called from: showToast() to display toast
    // Used in: Showing toast notification on screen
    container.appendChild(toast);
    
    // Purpose: Auto-remove toast after specified duration
    // Called from: showToast() to schedule toast removal
    // Used in: Automatically dismissing toast after display duration
    setTimeout(() => {
        // Purpose: Animate toast removal with slide-out effect
        // Called from: showToast() timeout to remove toast
        // Used in: Smooth toast dismissal animation
        toast.style.animation = 'slideOutRight 0.3s ease';
        
        // Purpose: Remove toast from DOM after animation
        // Called from: showToast() timeout after animation
        // Used in: Cleaning up toast element from DOM
        setTimeout(() => {
            // Purpose: Remove toast element if it still exists
            // Called from: showToast() timeout after animation delay
            // Used in: Final cleanup of toast element
            if (toast.parentNode) {
                toast.remove();
            }
        }, 300);
    }, duration);
}

// ENHANCEMENT: Export showToast function globally
// Purpose: Make showToast available throughout the application
// Called from: Various modules that need to show notifications
// Used in: Global notification system for user feedback
window.showToast = showToast;

// ENHANCEMENT: Export updateCompileStatus function globally
// Purpose: Make updateCompileStatus available throughout the application
// Called from: Compilation workflow and other modules
// Used in: Consistent compile status display across the application
window.updateCompileStatus = updateCompileStatus;

document.getElementById('runCodeBtn').addEventListener('click', async function () {
    if (isSimulationRunning) {
        console.log("Simulation is already running");
        return;
    }

    if (!window.avrInstance || !window.avrInstance.programLoaded) {
        const success = await compileAndLoadCode(true);
        if (!success) {
            return;
        }
    } else {
        startSimulation();
    }
});

document.getElementById('pauseCodeBtn').addEventListener('click', function () {
    if (!isSimulationRunning) {
        console.log("Simulation is not running");
        return;
    }

    pauseSimulation();
});

document.getElementById('resetSimulatorBtn').addEventListener('click', function () {
    if (isSimulationRunning) {
        pauseSimulation();
        setTimeout(() => {
            resetSimulation();
        }, 100);
    } else {
        resetSimulation();
    }
});

function startSimulation() {
    if (!window.avrInstance) {
        alert("AVR simulator not initialized!");
        return;
    }

    if (typeof window.avrInstance.start === 'function') {
        window.avrInstance.start();
        isSimulationRunning = true;
        updateSimulationUI();
        document.getElementById('compileOutput').textContent += "\n▶️ Simulation started";
        console.log("▶️ Simulation started");
    }
}

function pauseSimulation() {
    if (!window.avrInstance) {
        return;
    }

    if (typeof window.avrInstance.stop === 'function') {
        window.avrInstance.stop();
        isSimulationRunning = false;
        updateSimulationUI();
        document.getElementById('compileOutput').textContent += '\n⏸️ Simulation paused';
        console.log("⏸️ Simulation paused");
    }
}

function resetSimulation() {
    if (typeof window.resetAVR === 'function') {
        window.resetAVR();
        isSimulationRunning = false;
        updateSimulationUI();
        document.getElementById('compileOutput').textContent = "🔄 Simulator reset! Ready for new code.";
        console.log("🔄 Simulator reset");
    }
}

function updateSimulationUI() {
    const runBtn = document.getElementById('runCodeBtn');
    const pauseBtn = document.getElementById('pauseCodeBtn');

    if (isSimulationRunning) {
        runBtn.disabled = true;
        runBtn.style.opacity = '0.6';
        pauseBtn.disabled = false;
        pauseBtn.style.opacity = '1.0';
    } else {
        runBtn.disabled = false;
        runBtn.style.opacity = '1.0';
        pauseBtn.disabled = true;
        pauseBtn.style.opacity = '0.6';
    }
}

// Setup code editor button handlers - wait for DOM to be ready
/**
 * Setup code editor button event handlers
 * 
 * Purpose: Attach click handlers to Edit Code and Close Code buttons
 * Called from: DOMContentLoaded event or immediately if DOM is ready
 * Used in: Code editor panel opening/closing functionality
 */
function setupCodeEditorButtons() {
    const editCodeBtn = document.getElementById('editCodeBtn');
    const closeCodeEditorBtn = document.getElementById('closeCodeEditor');

    if (editCodeBtn) {
        // Remove any existing listeners by cloning button
        // Purpose: Prevent duplicate event listeners
        editCodeBtn.replaceWith(editCodeBtn.cloneNode(true));
        const newEditBtn = document.getElementById('editCodeBtn');
        
        // Attach click handler to Edit Code button
        // Purpose: Open code editor panel when button is clicked
        // Used in: User interaction to access code editor
        newEditBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("📝 Edit Code button clicked");
            
            if (typeof window.toggleCodeEditor === 'function') {
                window.toggleCodeEditor();
            } else if (typeof toggleCodeEditor === 'function') {
                toggleCodeEditor();
            } else {
                console.error('toggleCodeEditor function not found, using fallback');
                // Fallback: directly toggle the panel
                const panel = document.getElementById('codeEditorPanel');
                if (panel) {
                    panel.classList.toggle('open');
                    const isOpen = panel.classList.contains('open');
                    if (newEditBtn) {
                        newEditBtn.textContent = isOpen ? '📝 Close Code' : '📝 Edit Code';
                        newEditBtn.classList.toggle('active', isOpen);
                    }
                }
            }
        });
        console.log("✅ Edit Code button handler attached");
    } else {
        console.warn("⚠️ Edit Code button not found");
    }

    if (closeCodeEditorBtn) {
        // Remove any existing listeners
        closeCodeEditorBtn.replaceWith(closeCodeEditorBtn.cloneNode(true));
        const newCloseBtn = document.getElementById('closeCodeEditor');
        
        newCloseBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log("✕ Close Code button clicked");
            
            if (typeof window.closeCodeEditor === 'function') {
                window.closeCodeEditor();
            } else if (typeof closeCodeEditor === 'function') {
                closeCodeEditor();
            } else {
                console.error('closeCodeEditor function not found, using fallback');
                // Fallback: directly close the panel
                const panel = document.getElementById('codeEditorPanel');
                if (panel) {
                    panel.classList.remove('open');
                }
                const editBtn = document.getElementById('editCodeBtn');
                if (editBtn) {
                    editBtn.textContent = '📝 Edit Code';
                    editBtn.classList.remove('active');
                }
            }
        });
        console.log("✅ Close Code button handler attached");
    } else {
        console.warn("⚠️ Close Code button not found");
    }
}

// Consolidated DOM initialization - setup all handlers when DOM is ready
function initializeEventHandlers() {
    setupCodeEditorButtons();
    setupExampleSelector();
    updateSimulationUI();
}

// Setup when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeEventHandlers);
} else {
    // DOM already loaded
    initializeEventHandlers();
}

// Note: Window resize handler is defined in scene-setup.ts
// This resize handler is removed to avoid duplicate event listeners

document.addEventListener('keydown', function (event) {
    if ((event.ctrlKey || event.metaKey) && event.key === 'e') {
        event.preventDefault();
        if (typeof window.toggleCodeEditor === 'function') {
            window.toggleCodeEditor();
        } else if (typeof toggleCodeEditor === 'function') {
            toggleCodeEditor();
        }
    }
    if (event.key === 'Escape') {
        const panel = document.getElementById('codeEditorPanel');
        if (panel && panel.classList.contains('open')) {
            if (typeof window.closeCodeEditor === 'function') {
                window.closeCodeEditor();
            } else if (typeof closeCodeEditor === 'function') {
                closeCodeEditor();
            } else {
                panel.classList.remove('open');
            }
        }
    }
});

/**
 * Setup example code selector dropdown
 * 
 * Purpose: Load example Arduino code files when user selects from dropdown
 * Called from: DOMContentLoaded event or immediately if DOM is ready
 * Used in: Example code loading workflow
 */
function setupExampleSelector() {
    const exampleSelect = document.getElementById('exampleSelect');
    if (!exampleSelect) {
        console.warn("⚠️ Example selector not found");
        return;
    }
    
    // Handle example selection from dropdown
    // Purpose: Load selected example code into Monaco editor
    // Used in: User selecting example from dropdown menu
    exampleSelect.addEventListener('change', async function () {
        const example = this.value;
        if (!example) return;
        
        const output = document.getElementById('compileOutput');
        if (output) {
            output.textContent = `🔄 Loading example: ${example}...`;
        }
        
        try {
            // Fetch example code file from examples folder
            // Purpose: Load pre-written Arduino example code
            // Used in: Example loading workflow
            const response = await fetch(`examples/${example}.ino`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const code = await response.text();
            
            if (!code || code.trim() === '') {
                throw new Error('Example file is empty');
            }
            
            // Auto-open code editor panel first if not already open
            const panel = document.getElementById('codeEditorPanel');
            if (panel && !panel.classList.contains('open')) {
                if (typeof window.openCodeEditor === 'function') {
                    window.openCodeEditor();
                    // Wait for Monaco to initialize
                    await new Promise(resolve => setTimeout(resolve, 500));
                }
            }
            
            // Wait for Monaco editor to be ready
            let attempts = 0;
            while (attempts < 20) {
                if (window.monacoEditor || typeof window.setArduinoCode === 'function') {
                    break;
                }
                await new Promise(resolve => setTimeout(resolve, 100));
                attempts++;
            }
            
            // Set loaded code into Monaco editor (preferred) or textarea (fallback)
            if (typeof window.setArduinoCode === 'function') {
                window.setArduinoCode(code);
            } else if (window.monacoEditor) {
                window.monacoEditor.setValue(code);
                window.monacoEditor.layout();
                const textarea = document.getElementById('arduinoCode');
                if (textarea) textarea.value = code;
            } else {
                const textarea = document.getElementById('arduinoCode');
                if (textarea) {
                    textarea.value = code;
                    textarea.dispatchEvent(new Event('input', { bubbles: true }));
                }
            }

            if (output) {
                output.textContent = `✅ Example "${example}" loaded successfully! Click 'Run' to compile and start simulation.`;
            }
            
            console.log(`✅ Example loaded: ${example}`);
            
        } catch (error) {
            console.error('❌ Error loading example:', error);
            if (output) {
                output.textContent = `❌ Error loading example "${example}": ${error.message}\nMake sure the examples folder exists in the pages directory.`;
            }
        }
    });
    
    console.log("✅ Example selector handler attached");
}

// Note: setupExampleSelector is now called from initializeEventHandlers() above
