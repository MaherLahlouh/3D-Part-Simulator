//@ts-nocheck
import { MeshBuilder, Color3, StandardMaterial } from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';

export function initializeGround(scene){
    const ground = MeshBuilder.CreateGround("ground", { width: 100, height: 100 }, scene);
    //need check if needed(drag logic)
    window.simulatorGround = ground;

    ground.checkCollisions = true;
    ground.isPickable = false;
    ground.freezeWorldMatrix();
    ground.receiveShadows = true;

    window.GROUND_Y_LEVEL = 0;

    let groundMat;
try {
        groundMat = new GridMaterial("groundGrid", scene);
        groundMat.majorUnitFrequency = 5;
        groundMat.minorUnitVisibility = 0.5;
        groundMat.gridRatio = 1;
        groundMat.mainColor = new Color3(0.2, 0.2, 0.2);
        groundMat.lineColor = new Color3(0.5, 0.5, 0.5);
        groundMat.opacity = 0.4;
    } catch (e) {
        console.warn("GridMaterial failed to load, falling back to StandardMaterial");
        groundMat = new StandardMaterial("groundStdMat", scene);
        groundMat.diffuseColor = new Color3(0.2, 0.2, 0.2);
        groundMat.specularColor = new Color3(0.1, 0.1, 0.1);
        groundMat.alpha = 0.4;
    }

    ground.material = groundMat;
    ground.isVisible = true;

    window.simulatorGroundMaterial = groundMat;
}
