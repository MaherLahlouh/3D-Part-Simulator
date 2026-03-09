// @ts-nocheck
console.log("🔧 Loading Manual Connection Mode Module...");

// --- 1. ROTATION SYSTEM CONSTANTS ---
const ROTATION_STEP_DEGREES = 90;
const ROTATION_STEP_RADIANS = ROTATION_STEP_DEGREES * (Math.PI / 180);
let isRotating = false;

// --- 2. CORE FUNCTIONS ---

/** Align mesh to ground level (Y=0) based on bounding box */
window.alignMeshToGround = function(mesh, groundY = 0) {
    if (!mesh) return;
    
    // Refresh bounding info if method exists, otherwise compute world matrix
    if (typeof mesh.refreshBoundingInfo === 'function') {
        mesh.refreshBoundingInfo();
    }
    
    // Force world matrix computation to ensure bounding box is up to date
    if (typeof mesh.computeWorldMatrix === 'function') {
        mesh.computeWorldMatrix(true);
    }
    
    // Check if getBoundingInfo method exists before calling
    let boundingInfo = null;
    if (typeof mesh.getBoundingInfo === 'function') {
        boundingInfo = mesh.getBoundingInfo();
    } else if (mesh.getBoundingInfo) {
        // Try direct property access
        boundingInfo = mesh.getBoundingInfo;
    }
    
    if (!boundingInfo || !boundingInfo.boundingBox) {
        // Fallback: use mesh position if bounding info is not available
        console.warn(`⚠️ Could not get bounding info for mesh: ${mesh.name || 'unnamed'}, using position fallback`);
        if (mesh.position && mesh.position.y < groundY) {
            mesh.position.y = groundY;
        }
        return;
    }
    
    const lowestY = boundingInfo.boundingBox.minimumWorld.y;
    const offset = groundY - lowestY;
    if (mesh.position) {
        mesh.position.y += offset;
        console.log(`📐 Aligned ${mesh.name} to ground. Offset: ${offset.toFixed(3)}`);
    }
};

/** Normalize angle to range [-PI, PI] */
function normalizeAngle(angle) {
    while (angle > Math.PI) angle -= 2 * Math.PI;
    while (angle < -Math.PI) angle += 2 * Math.PI;
    return angle;
}

/** Rotate selected mesh by 90 degrees with ground alignment */
export function rotateSelectedMesh(axis, direction = 1) {
    if (isRotating) return;

    const selected = window.selected;
    if (!selected) {
        showConnectionStatus("Select a component first!", 'warning');
        return;
    }

    if (selected.name === 'ground' || selected.metadata?.isGround) {
        showConnectionStatus("Cannot rotate ground!", 'error');
        return;
    }

    isRotating = true;
    const rotationAmount = ROTATION_STEP_RADIANS * direction;

    switch(axis.toLowerCase()) {
        case 'x': selected.rotation.x += rotationAmount; break;
        case 'y': selected.rotation.y += rotationAmount; break;
        case 'z': selected.rotation.z += rotationAmount; break;
        default: isRotating = false; return;
    }

    selected.rotation.x = normalizeAngle(selected.rotation.x);
    selected.rotation.y = normalizeAngle(selected.rotation.y);
    selected.rotation.z = normalizeAngle(selected.rotation.z);

    setTimeout(() => {
        window.alignMeshToGround(selected, 0);
        isRotating = false;
        showConnectionStatus(`Rotated 90° on ${axis.toUpperCase()}-axis`, 'success');
    }, 50);
}

// --- 3. UI GENERATION ---

/** Create UI Panel for Manual Connection Instructions */
export function createManualConnectionUI() {
    if (document.getElementById('manualConnectionPanel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'manualConnectionPanel';
    panel.style.cssText = `
        position: fixed; bottom: 120px; right: 20px;
        background: rgba(0, 0, 0, 0.95); color: white;
        padding: 20px; border-radius: 12px; font-family: 'Segoe UI', Arial, sans-serif;
        font-size: 14px; z-index: 1000; min-width: 340px; max-width: 420px;
        border: 2px solid #4CAF50; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
        transition: all 0.3s ease; display: none;
    `;
    
    panel.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px;">
            <div style="display: flex; align-items: center;">
                <span style="font-size: 24px; margin-right: 10px;">🏠</span>
                <h3 style="margin: 0; color: #4CAF50; font-size: 18px;">Manual Connection</h3>
            </div>
            <button id="closeManualPanel" style="background: transparent; border: 2px solid #f44336; color: #f44336; width: 30px; height: 30px; border-radius: 50%; cursor: pointer;">✕</button>
        </div>
        <div id="manualPanelContent">
            <div style="margin-bottom: 10px; padding: 12px; background: rgba(76, 175, 80, 0.2); border-radius: 6px; border-left: 4px solid #4CAF50;">
                <strong>📍 How to Use:</strong>
                <ol style="margin: 10px 0; padding-left: 20px; line-height: 1.8;">
                    <li>Drag parts to position</li>
                    <li>Select a part (blue glow)</li>
                    <li>Press <kbd>C</kbd> to connect</li>
                </ol>
            </div>
            <div style="margin-top: 15px; padding: 12px; background: rgba(255, 152, 0, 0.2); border-radius: 6px; border-left: 4px solid #FF9800;">
                <strong>⌨️ Rotation (Shift +):</strong>
                <div style="margin-top:5px;">Q/E (Y), A/D (X), Z/X (Z)</div>
            </div>
        </div>
    `;
    
    document.body.appendChild(panel);
    document.getElementById('closeManualPanel').onclick = window.toggleManualConnectionPanel;
}

/** Add button to header control panel */
export function addManualConnectionHeaderButton() {
    const controlPanel = document.querySelector('.control-panel');
    if (!controlPanel || document.getElementById('manualConnectionHeaderBtn')) return;

    const button = document.createElement('button');
    button.id = 'manualConnectionHeaderBtn';
    button.className = 'btn';
    button.style.cssText = `background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; font-weight: bold;`;
    button.innerHTML = '🏠 Manual Connection';
    button.onclick = window.toggleManualConnectionPanel;

    const loadRobotBtn = document.getElementById('loadRobotBtn');
    if (loadRobotBtn) loadRobotBtn.after(button);
    else controlPanel.appendChild(button);
}

/** Show connection status indicator */
export function showConnectionStatus(message, type = 'info') {
    const existing = document.getElementById('connectionStatus');
    if (existing) existing.remove();
    
    const colors = { success: '#4CAF50', error: '#f44336', warning: '#FF9800', info: '#2196F3' };
    const status = document.createElement('div');
    status.id = 'connectionStatus';
    status.style.cssText = `
        position: fixed; top: 80px; left: 50%; transform: translateX(-50%);
        background: ${colors[type]}; color: white; padding: 12px 24px;
        border-radius: 8px; z-index: 10001; font-weight: bold; animation: slideDown 0.3s ease;
    `;
    status.textContent = message;
    document.body.appendChild(status);
    setTimeout(() => status.remove(), 3000);
}

// --- 4. EVENT LISTENERS ---

/** Handle Keyboard Shortcuts */
function handleRotationKeys(event) {
    if (['INPUT', 'TEXTAREA'].includes(event.target.tagName) || event.target.isContentEditable) return;
    if (event.ctrlKey || event.metaKey || event.altKey || !event.shiftKey) return;

    const key = event.key.toLowerCase();
    const map = { q: ['y', -1], e: ['y', 1], a: ['x', 1], d: ['x', -1], z: ['z', 1], x: ['z', -1] };
    
    if (map[key]) {
        event.preventDefault();
        rotateSelectedMesh(map[key][0], map[key][1]);
    }
}

// --- 5. INITIALIZATION & EXPORTS ---

/** Global Toggle function */
window.toggleManualConnectionPanel = function() {
    const panel = document.getElementById('manualConnectionPanel');
    const headerBtn = document.getElementById('manualConnectionHeaderBtn');
    if (!panel) { createManualConnectionUI(); return; }
    
    const isHidden = panel.style.display === 'none';
    panel.style.display = isHidden ? 'block' : 'none';
    
    if (headerBtn) {
        if (isHidden) headerBtn.classList.add('active');
        else headerBtn.classList.remove('active');
    }
};

/** Main initialization function to be called from main.ts */
export function initManualConnectionMode() {
    createManualConnectionUI();
    addManualConnectionHeaderButton();
    document.addEventListener('keydown', handleRotationKeys);
    
    // Help shortcut
    window.addEventListener('keydown', (e) => {
        if (e.key === '?' && !e.ctrlKey) window.toggleManualConnectionPanel();
    });

    console.log("✅ Manual Connection Mode fully initialized");
}

// Ensure global access for functions used by dynamic HTML
window.showConnectionStatus = showConnectionStatus;