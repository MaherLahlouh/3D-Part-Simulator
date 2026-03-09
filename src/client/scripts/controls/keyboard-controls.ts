//@ts-nocheck
import { getPartBounds } from '../services/bounds-services.ts'


const movementStep = 0.2;

//needed to import in main
//need fixes and put all codes together




function updateCollisionBounds(object) {
    if (!object) return;

    object.computeWorldMatrix(true);

    if (window.collisionSystem) {
    window.collisionSystem.updatePartBounds(object);
    // Check for collisions after movement
    window.collisionSystem.detectAndResolveCollisions();
    }
}


function snapToGround(object) {
    if (!object) return;

    object.computeWorldMatrix(true);

    const bounds = getPartBounds(object);
    if (bounds) {
    const adjustment = window.GROUND_Y_LEVEL - bounds.lowestY;
    object.position.y += adjustment;

    console.log(`🏠 Snapped to ground: adjusted Y by ${adjustment.toFixed(2)}`);

    updateCollisionBounds(object);
    } else {
    object.position.y = 0.5;
    console.log(`🏠 Fallback: set Y=0.5`);
    }
}







window.addEventListener('keydown', (event) => {
    // Ignore if typing in input fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
        return;
    }

    // Skip if wiring mode is active and it's not a wiring-related key
    if (window.wiringMode) {
        if (event.key.toLowerCase() !== 'escape') {
            return;
        }
    }

    if (!window.selected) {
        return;
    }

    const step = movementStep;
    const rotationStep = 15 * (Math.PI / 180);
    const fineRotationStep = 5 * (Math.PI / 180);

    switch (event.key.toLowerCase()) {
        // VERTICAL MOVEMENT (Y-axis) - with ground constraint
        case 'arrowup':
        case 'o':
            if (event.ctrlKey || event.metaKey) return;
            event.preventDefault();
            window.selected.position.y += step;
            enforceGroundConstraint(window.selected); // ✅ Check after movement
            updateCollisionBounds(window.selected);
            console.log(`⬆️ Moved UP: y = ${window.selected.position.y.toFixed(2)}`);
            break;

        case 'arrowdown':
        case 'l':
            if (event.ctrlKey || event.metaKey) return;
            event.preventDefault();
            window.selected.position.y -= step;
            enforceGroundConstraint(window.selected); // ✅ Check after movement
            const bounds = getPartBounds(window.selected);
            const minHeight = bounds ? (-bounds.lowestY + 0.01) : 0.1;
            window.selected.position.y = Math.max(minHeight, window.selected.position.y);
            updateCollisionBounds(window.selected);
            console.log(`⬇️ Moved DOWN: y = ${window.selected.position.y.toFixed(2)}`);
            break;

        // ROTATION - Y AXIS (Yaw) - with ground constraint
        case 'arrowleft':
            event.preventDefault();
            if (event.shiftKey) {
                window.selected.rotation.y += fineRotationStep;
            } else {
                window.selected.rotation.y += rotationStep;
            }
            enforceGroundConstraint(window.selected); // ✅ Check after rotation
            updateCollisionBounds(window.selected);
            console.log(`↻ Rotated LEFT: ${(window.selected.rotation.y * 180 / Math.PI).toFixed(1)}°`);
            break;

        case 'arrowright':
            event.preventDefault();
            if (event.shiftKey) {
                window.selected.rotation.y -= fineRotationStep;
            } else {
                window.selected.rotation.y -= rotationStep;
            }
            enforceGroundConstraint(window.selected); // ✅ Check after rotation
            updateCollisionBounds(window.selected);
            console.log(`↺ Rotated RIGHT: ${(window.selected.rotation.y * 180 / Math.PI).toFixed(1)}°`);
            break;

        // A/D for Y-axis rotation - with ground constraint
        case 'a':
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
                window.selected.rotation.y += fineRotationStep;
            } else {
                window.selected.rotation.y += rotationStep;
            }
            enforceGroundConstraint(window.selected); // ✅ Check after rotation
            updateCollisionBounds(window.selected);
            break;

        case 'd':
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
                window.selected.rotation.y -= fineRotationStep;
            } else {
                window.selected.rotation.y -= rotationStep;
            }
            enforceGroundConstraint(window.selected); // ✅ Check after rotation
            updateCollisionBounds(window.selected);
            break;

        // ROTATION - X AXIS (Pitch) - with ground constraint
        case 'q':
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
                window.selected.rotation.x += fineRotationStep;
            } else {
                window.selected.rotation.x += rotationStep;
            }
            enforceGroundConstraint(window.selected); // ✅ Check after rotation
            updateCollisionBounds(window.selected);
            break;

        case 'e':
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
                window.selected.rotation.x -= fineRotationStep;
            } else {
                window.selected.rotation.x -= rotationStep;
            }
            enforceGroundConstraint(window.selected); // ✅ Check after rotation
            updateCollisionBounds(window.selected);
            break;

        // ROTATION - Z AXIS (Roll) - with ground constraint
        case 'z':
            event.preventDefault();
            event.stopPropagation();
            if (event.shiftKey) {
                window.selected.rotation.z += fineRotationStep;
            } else {
                window.selected.rotation.z += rotationStep;
            }
            enforceGroundConstraint(window.selected); // ✅ Check after rotation
            updateCollisionBounds(window.selected);
            break;

        case 'x':
            if (!event.ctrlKey && !event.metaKey) {
                event.preventDefault();
                event.stopPropagation();
                if (event.shiftKey) {
                    window.selected.rotation.z -= fineRotationStep;
                } else {
                    window.selected.rotation.z -= rotationStep;
                }
                enforceGroundConstraint(window.selected); // ✅ Check after rotation
                updateCollisionBounds(window.selected);
            }
            break;

        // RESET COMMANDS
        case 'r':
            event.preventDefault();
            event.stopPropagation();
            window.selected.rotation.x = 0;
            window.selected.rotation.y = 0;
            window.selected.rotation.z = 0;
            enforceGroundConstraint(window.selected); // ✅ Check after reset
            updateCollisionBounds(window.selected);
            console.log(`↩️ RESET all rotations to 0°`);
            break;

        case 'g':
            event.preventDefault();
            event.stopPropagation();
            snapToGround(window.selected);
            break;

        // QUICK FLIP (90° toggle)
        case 'f':
            event.preventDefault();
            event.stopPropagation();
            const currentPitch = window.selected.rotation.x;
            const tolerance = 0.1;
            const targetPitch = Math.PI / 2;

            if (Math.abs(currentPitch) < tolerance) {
                window.selected.rotation.x = -targetPitch;
                console.log("🔁 Flipped to HORIZONTAL");
                snapToGround(window.selected);
            } else if (Math.abs(currentPitch + targetPitch) < tolerance) {
                window.selected.rotation.x = 0;
                console.log("🔁 Flipped to VERTICAL");
                snapToGround(window.selected);
            } else {
                window.selected.rotation.x = 0;
                console.log(`🔁 Reset to VERTICAL`);
                snapToGround(window.selected);
            }
            break;

        // HELP
        case 'h':
            event.preventDefault();
            event.stopPropagation();
            showKeyboardHelp();
            break;
    }
});



function showKeyboardHelp() {
    console.log("📖 Displaying keyboard controls overlay");
    const existingHelp = document.getElementById('keyboardHelpOverlay');
    if (existingHelp) {
        existingHelp.remove();
        return;
    }

    const helpOverlay = document.createElement('div');
    helpOverlay.id = 'keyboardHelpOverlay';
    helpOverlay.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        color: white;
        padding: 30px;
        border-radius: 15px;
        z-index: 10000;
        font-family: monospace;
        max-width: 650px;
        max-height: 85vh;
        overflow-y: auto;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
      `;

    helpOverlay.innerHTML = `
        <h2 style="margin-top: 0; color: #4CAF50; text-align: center;">⌨️ Keyboard Controls</h2>
        <div style="line-height: 1.8;">
          <strong style="color: #FFD700;">⬆️ Vertical Movement (Ground Protected):</strong><br>
          &nbsp;&nbsp;↑ / O - Move Up<br>
          &nbsp;&nbsp;↓ / L - Move Down (auto-stops at ground)<br><br>
          
          <strong style="color: #FFD700;">🔄 Y-Axis Rotation (Yaw):</strong><br>
          &nbsp;&nbsp;← / A - Rotate Left (15°)<br>
          &nbsp;&nbsp;→ / D - Rotate Right (15°)<br>
          &nbsp;&nbsp;Shift + key - Fine adjustment (5°)<br><br>
          
          <strong style="color: #FFD700;">🔄 X-Axis Rotation (Pitch):</strong><br>
          &nbsp;&nbsp;Q - Pitch Forward<br>
          &nbsp;&nbsp;E - Pitch Backward<br><br>
          
          <strong style="color: #FFD700;">🔄 Z-Axis Rotation (Roll):</strong><br>
          &nbsp;&nbsp;Z - Roll Counter-Clockwise<br>
          &nbsp;&nbsp;X - Roll Clockwise<br><br>
          
          <strong style="color: #FFD700;">↩️ Quick Actions:</strong><br>
          &nbsp;&nbsp;R - Reset ALL Rotations<br>
          &nbsp;&nbsp;G - Snap to Ground<br>
          &nbsp;&nbsp;F - Quick Flip (90°)<br>
          &nbsp;&nbsp;C - Connect to nearest part<br>
          &nbsp;&nbsp;H - Toggle This Help<br><br>
          
          <strong style="color: #00BCD4;">🎯 Collision System:</strong><br>
          &nbsp;&nbsp;Ctrl+B - Show collision bounds<br>
          &nbsp;&nbsp;Ctrl+K - Toggle collision detection<br>
          &nbsp;&nbsp;Parts auto-snap when close!<br><br>
          
          <strong style="color: #FF6B6B;">🛡️ Ground Protection:</strong><br>
          &nbsp;&nbsp;✅ Objects NEVER go below Y=0<br>
          &nbsp;&nbsp;✅ Auto-correction every frame<br>
          &nbsp;&nbsp;✅ Rotation-aware positioning<br>
          &nbsp;&nbsp;✅ Drag operations protected<br><br>
          
          <strong style="color: #4CAF50;">💡 Tips:</strong><br>
          &nbsp;&nbsp;• Drag parts near each other to auto-snap<br>
          &nbsp;&nbsp;• Green preview shows snap position<br>
          &nbsp;&nbsp;• Red flash indicates collision<br>
          &nbsp;&nbsp;• Parts automatically stay on ground<br>
        </div>
        <button onclick="document.getElementById('keyboardHelpOverlay').remove()" 
          style="margin-top: 20px; padding: 10px 20px; background: #4CAF50; 
          color: white; border: none; border-radius: 5px; cursor: pointer; 
          font-weight: bold; display: block; margin-left: auto; margin-right: auto;">
          Close (H)
        </button>
      `;

    document.body.appendChild(helpOverlay);

    setTimeout(() => {
        if (document.getElementById('keyboardHelpOverlay')) {
            helpOverlay.remove();
        }
    }, 15000);
}
