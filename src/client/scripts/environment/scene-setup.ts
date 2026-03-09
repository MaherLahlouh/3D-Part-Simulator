// @ts-nocheck
import { Engine, Scene, Vector3, HemisphericLight, DirectionalLight } from '@babylonjs/core';
//need update after finish drag-logic file
import { setupPointerSelection } from '../drag-logic.ts';
import { applyTheme } from './theme.ts'
import { initializeCameraSettings } from './camera-system.ts'
import { initializeGround } from './ground-setup.ts'

export function SceneSetup() {
    console.log("🚀 Initializing simulator environment from the new code...");

    const canvas = document.getElementById("renderCanvas");
    if (!canvas) {
        console.error("Canvas element not found");
        return;
    }

    const engine = new Engine(canvas, true);
    const scene = new Scene(engine);
    scene.collisionsEnabled = true;

    window.scene = scene;
    window.engine = engine;

    const resizeObserver = new ResizeObserver(() => {engine.resize();});

    //when moving to other pages the observer need to be killed to prevent memory leak
    resizeObserver.observe(canvas);

    initializeCameraSettings(scene, canvas);

    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);
    light.intensity = 0.8;

    const dirLight = new DirectionalLight("dirLight", new Vector3(-1, -1, -1), scene);
    dirLight.intensity = 0.4;
    dirLight.position = new Vector3(20, 40, 20);

    initializeGround(scene);

    const isDark = document.body.classList.contains('dark-mode') || localStorage.getItem('taa_theme_dark') === 'true';

    applyTheme(isDark, scene);

    setupPointerSelection(scene);

    engine.runRenderLoop(() => {scene.render();});

    //need change the name
    window.simulatorScene = scene;
}


