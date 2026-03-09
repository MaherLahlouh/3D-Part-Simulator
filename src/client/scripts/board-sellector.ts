

// @ts-nocheck

/**
 * Initializes the Serial Port and Upload Logic
 * Call this function after your DOM is ready
 */
export function setupArduinoUploader() {
    const portSelect = document.getElementById('portSelect');
    const uploadBtn = document.getElementById('uploadCodeBtn');
    const compileOutput = document.getElementById('compileOutput');

    // Safety check: if elements don't exist, don't run the script
    if (!portSelect || !uploadBtn) {
        console.warn('⚠️ Arduino Uploader UI elements not found. Skipping init.');
        return;
    }

    // --- 1. Port Refresh Logic ---
    async function refreshSerialPorts() {
        // Prevent refreshing if we are just selecting an option
        if (portSelect.options.length > 1 && portSelect.value !== "") return;

        portSelect.innerHTML = '<option value="">Refreshing...</option>';
        try {
            // Note: Ensure your backend is running on port 3001
            // Add timeout to prevent hanging requests
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
            
            const response = await fetch('http://localhost:3001/arduino/ports', {
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            const result = await response.json();
            
            if (result.success && result.ports && result.ports.length > 0) {
                portSelect.innerHTML = '<option value="">— Select Board —</option>';
                result.ports.forEach(item => {
                    const option = document.createElement('option');
                    // We store both port and FQBN in the value
                    option.value = JSON.stringify({ port: item.port, fqbn: item.fqbn });
                    option.textContent = `${item.name} (${item.port})`;
                    portSelect.appendChild(option);
                });
            } else {
                portSelect.innerHTML = '<option value="">No boards found</option>';
            }
        } catch (error) {
            // Only log error if it's not a network error (backend not running)
            if (error.name !== 'AbortError' && error.name !== 'TypeError') {
                console.error('Error fetching ports:', error);
            }
            // Silently handle backend not being available (optional feature)
            portSelect.innerHTML = '<option value="">Backend not available (Click to refresh)</option>';
        }
    }

    // Refresh ports when the user clicks the dropdown (mousedown is better than focus)
    portSelect.addEventListener('mousedown', () => {
        // Only refresh if empty or showing error/placeholder
        if (portSelect.options.length <= 1 || 
            portSelect.options[0].textContent.includes('Backend not available') ||
            portSelect.options[0].textContent.includes('Refresh Ports')) {
            refreshSerialPorts();
        }
    });

    // Set initial placeholder - don't auto-refresh on page load
    portSelect.innerHTML = '<option value="">— Click to refresh ports —</option>';

    // --- 2. Upload Logic ---
    uploadBtn.addEventListener('click', async function () {
        const selected = portSelect.value;
        if (!selected) {
            alert('Please select a board first.');
            return;
        }

        // Parse the JSON stored in the option value
        let portData;
        try {
            portData = JSON.parse(selected);
        } catch (e) {
            alert("Invalid port selection.");
            return;
        }

        const { port, fqbn } = portData;

        // Retrieve the compiled HEX code
        // IMPORTANT: Ensure your compile function sets this attribute!
        const arduinoCodeElement = document.getElementById('arduinoCode');
        const hex = arduinoCodeElement ? arduinoCodeElement.getAttribute('data-hex') : null;

        if (!hex) {
            alert('⚠️ No compiled code found. Please click "Compile" first.');
            return;
        }

        // Show Loading State
        if (compileOutput) {
            compileOutput.innerHTML = `
                <div style="display: flex; align-items: center; gap: 10px; color: #ffa500;">
                    <span class="spinner-border spinner-border-sm"></span>
                    <span>Uploading to Arduino (${port})...</span>
                </div>`;
        }

        try {
            const response = await fetch('http://localhost:3001/arduino/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hex, port, fqbn })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                if (compileOutput) compileOutput.textContent = `✅ Success: Code uploaded to ${port}!`;
                console.log(result.output);
                alert('🎉 Code uploaded successfully!');
            } else {
                throw new Error(result.error || result.output || 'Unknown upload error');
            }
        } catch (error) {
            console.error('Upload error:', error);
            if (compileOutput) {
                compileOutput.textContent = `❌ Upload Failed: ${error.message}`;
            }
            alert(`Upload Failed: ${error.message}\nCheck console for details.`);
        }
    });
}

