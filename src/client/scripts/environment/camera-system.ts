//@ts-nocheck
import { ArcRotateCamera, Vector3 } from '@babylonjs/core';
import { bindClick } from '../services/click-services.ts'
import { initTheme } from './theme.ts'

let initialCameraPosition = null;
let initialCameraTarget = null;


export function initializeCameraSettings(scene, canvas) {
   
    const camera = new ArcRotateCamera(
        "camera",
        Math.PI / 2,
        Math.PI / 3,
        25,
        Vector3.Zero(),
        scene
    );
    camera.attachControl(canvas, true);
    camera.lowerRadiusLimit = 5;
    camera.upperRadiusLimit = 100;

    // Enable camera collisions
    camera.checkCollisions = true;
    camera.collisionRadius = new Vector3(0.5, 0.5, 0.5);

    scene.activeCamera = camera;

    initialCameraPosition = camera.position.clone();
    initialCameraTarget = camera.getTarget().clone();

}

export function resetCameraView () {

    if (!window.scene || !window.scene.activeCamera) {
        console.warn("Scene or camera not available for reset");
        return;
    }
    const cam = window.scene.activeCamera;
    if (initialCameraPosition && initialCameraTarget) {
        cam.setPosition(initialCameraPosition.clone());
        cam.setTarget(initialCameraTarget.clone());
    } else {
        // Fallback defaults
        const defaultPosition = new Vector3(10, 10, -10);
        const defaultTarget = Vector3.Zero();
        cam.setPosition(defaultPosition);
        cam.setTarget(defaultTarget);
    }
};

export function setCameraView  (view) {
    console.log(`Setting camera view from new code to: ${view}`);
    
    if (!window.scene || !window.scene.activeCamera) {
        console.warn("Scene or camera not available");
        return;
    }
    const cam = window.scene.activeCamera;
    const target = cam.getTarget ? cam.getTarget() : Vector3.Zero();
    const currentPos = cam.position.subtract(target);
    const radius = currentPos.length();

    const groundLevel = Math.max(0, target.y); 
    const cameraHeight = groundLevel + 3; 
    
    let newPosition;

    switch (view) {
        case 'top':
            newPosition = new Vector3(0, radius, 0);
            break;
        case 'left':
            const currentAngleLeft = Math.atan2(currentPos.z, currentPos.x);
            const leftAngle = currentAngleLeft + Math.PI / 2;
            const leftX = radius * Math.cos(leftAngle) * 0.7;
            const leftZ = radius * Math.sin(leftAngle) * 0.7;
            newPosition = new Vector3(leftX, cameraHeight, leftZ);
            break;
        case 'right':
            const currentAngleRight = Math.atan2(currentPos.z, currentPos.x);
            const rightAngle = currentAngleRight - Math.PI / 2;
            const rightX = radius * Math.cos(rightAngle) * 0.7;
            const rightZ = radius * Math.sin(rightAngle) * 0.7;
            newPosition = new Vector3(rightX, cameraHeight, rightZ);
            break;
        default:
            console.warn("Unknown camera view:", view);
            return;
    }
    cam.setPosition(newPosition.add(target));
    cam.setTarget(target);
};

export function zoomIn  () {
    if (!window.scene || !window.scene.activeCamera) return;
    const cam = window.scene.activeCamera;
    if (cam.radius !== undefined) {
        cam.radius = Math.max(cam.lowerRadiusLimit || 1, cam.radius - 2);
    } 
};

export function zoomOut () {
    if (!window.scene || !window.scene.activeCamera) return;
    const cam = window.scene.activeCamera;
    if (cam.radius !== undefined) {
        cam.radius = Math.min(cam.upperRadiusLimit || 100, cam.radius + 2);
    } 
};

export function setupCameraControlsButtons() {
    bindClick('btn-view-top',   () => setCameraView('top'));
    bindClick('btn-view-left',  () => setCameraView('left'));
    bindClick('btn-view-right', () => setCameraView('right'));
    bindClick('btn-reset-view', resetCameraView);
    bindClick('btn-zoom-in',    zoomIn);
    bindClick('btn-zoom-out',   zoomOut);
}