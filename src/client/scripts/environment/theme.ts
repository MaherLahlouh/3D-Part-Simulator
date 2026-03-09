//@ts-nocheck
import { Color3 } from '@babylonjs/core';
import { GridMaterial } from '@babylonjs/materials';

//need to remove export
export const updateGroundTheme = function (isDark, scene = null) {
    const targetScene = scene || window.scene;
    const mat = window.simulatorGroundMaterial;
    if (!mat || !targetScene) return;

    const bgColor = isDark ? 0.08 : 0.95;
    targetScene.clearColor = new Color3(bgColor, bgColor, bgColor);

    if (mat instanceof GridMaterial) {
        if (isDark) {
            mat.mainColor = new Color3(0.2, 0.2, 0.2); // Darker floor
        } else {
            mat.mainColor = new Color3(0.9, 0.9, 0.9); // Lighter floor
        }
    }
};


export const applyTheme = (isDark, scene = null) => {
    themeSwitcher.checked = isDark;
    localStorage.setItem('taa_theme_dark', isDark);
    document.body.classList.toggle('dark-mode', isDark);

    const slider = document.getElementById('themeToggleSlider');
    const button = document.getElementById('themeToggleButton');
    
    if (slider) {
        slider.style.background = isDark ? 'rgba(0, 255, 106, 0.4)' : 'rgba(255,255,255,0.2)';
    }
    
    if (button) {
        button.style.left = isDark ? '26px' : '2px';
        button.textContent = isDark ? '🌙' : '☀️';
    }

    updateGroundTheme(isDark, scene);
    
};


export const initTheme = (scene = null) => {
    const themeSwitcher = document.getElementById('themeSwitcher');

    if (themeSwitcher) {
        
        themeSwitcher.addEventListener('change', (e) => {
            applyTheme(e.target.checked, scene);
        });

        const savedTheme = localStorage.getItem('taa_theme_dark') === 'true';
        
        applyTheme(savedTheme, scene);
    }
}