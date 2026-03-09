//@ts-nocheck
import { getPartBounds } from '../services/bounds-services.ts'
import { initializePartLoaderUI, showPartLoadingOverlay, hidePartLoadingOverlay, updatePartLoadingProgress } from './loading-part-screen.ts'
import { generateUniqueId, findClearSpawnPosition } from '../services/part-services.ts'
//need to fix babylon imports

//need to choose one global name (waiting for mohammad)
//need to edit delete function to remove deleted parts from the array
const loadedParts = [];
window.loadedParts = loadedParts;
window.allParts = loadedParts;


//need rename it to loadPart ((((but need to fix other loadPart names))))
export async function loadPart(part) {

    initializePartLoaderUI();
    showPartLoadingOverlay();

    //maybe need rename
    const actualFilename = part.fileName;
    //maybe need rename
    const partBaseName = part.name;

    const container = new BABYLON.TransformNode(`container_${partBaseName}_${Date.now()}`, scene);
    //need to add id
    container.metadata = {
        id: generateUniqueId(),
        //need rename
        baseName: part.name,
        //need to delete after fix things depend on it
        type: part.name
    };

    BABYLON.SceneLoader.ImportMeshAsync(
        "",
        "/glb_images/",
        actualFilename,
        //check if we need to pass scene
        scene,
        (meshes) => onSuccess(meshes, container),
        onProgress,
        onError
    );



}


function onSuccess(meshes, container) {

    updatePartLoadingProgress(100, "Load Complete!");
    hidePartLoadingOverlay();

    meshes.forEach((mesh) => {
        if (mesh) {
            //check if container is accesble from here
            mesh.parent = container;
            mesh.isPickable = true;
            mesh.checkCollisions = true;
            if (!mesh.material) {
                //maybe need to pass scene as a parameter
                //if needed we can edit material features
                mesh.material = new BABYLON.StandardMaterial(`mat_${mesh.name}_${Date.now()}`, scene);
            }

        }
    });

    container.computeWorldMatrix(true);

    const bounds = getPartBounds(container);
    if (bounds) {
        const heightOffset = -bounds.lowestY;
        const spawnPos = findClearSpawnPosition(bounds.size);
        container.position = new BABYLON.Vector3(spawnPos.x, heightOffset, spawnPos.z);
    } else {
        container.position = new BABYLON.Vector3(Math.random() * 4 - 2, 0.5, Math.random() * 4 - 2);
    }

    if (window.collisionSystem) {
        window.collisionSystem.registerPart(container);
    }

    loadedParts.push(container);

    if (typeof addDragBehavior === "function") {
        addDragBehavior(container, meshes[0]);
    }

    //need to import the function not use window
    if (typeof window.initializePinsForComponent === 'function') {
        const pins = window.initializePinsForComponent(container, scene);
    }

    hidePartLoadingOverlay();

}

function onProgress(event) {
    if (event.lengthComputable) {
        const progress = (event.loaded / event.total) * 100;
        updatePartLoadingProgress(progress, "Downloading 3D Model...");
    }
}

function onError(scene, message, exception) {
    console.error("BABYLON Loader Error:", message, exception);
    hidePartLoadingOverlay();
    let errorMsg = `Failed to load ${actualFilename}.\n`;
    if (message.includes('404') || message.includes('Not Found')) {
        errorMsg += `File not found in glb_images folder.\nPlease ensure the file exists:${actualFilename}\n`;
    } else {
        errorMsg += 'Error: ' + message;
    }
    alert(errorMsg);

}
