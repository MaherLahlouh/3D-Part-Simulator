//@ts-nocheck
import { getPartsList, getCachedParts } from '../services/part-services.ts';
//------------------need to import loadPart-----------------

//need to fix cach cleaning system
let cachedParts = []; 


export async function initializeMenu() {
    const grid = document.getElementById('componentsGrid');
    
    cachedParts = getCachedParts();
    if (cachedParts.length > 0) {
        renderComponentLibrary();
    }
    else {
        try {
            if (grid) grid.innerHTML = '<div class="status">Connecting to Database...</div>';
            cachedParts = await getPartsList();
            localStorage.setItem('parts_menu', JSON.stringify(cachedParts));
            renderComponentLibrary();
            
        } catch (error) {
            console.error('Library Initialization Failed:', error);
            if (grid) grid.innerHTML = `<div class="error">Failed to load parts: ${error.message}</div>`;
        }
    }
}


export function renderComponentLibrary() {
    const grid = document.getElementById('componentsGrid');
    const subtitle = document.getElementById('kitSubtitle');
    
    if (!grid) return;

    grid.innerHTML = '';

    cachedParts.forEach(part => {
        const button = createComponentButton(part);
        grid.appendChild(button);
    });

}


function createComponentButton(part) {
    const button = document.createElement('button');
    button.className = 'component-btn';
    
    button.onclick = () => {
        //-temp-need to edit it to use import not window
        window.loadPart(part.name); 
    };

    button.innerHTML = `
        <div class="component-icon">${part.icon }</div>
        <div class="component-info">
            <h4>${part.name}</h4>
            <p>${part.desc || 'No description available'}</p>
        </div>
    `;

    return button;
}

