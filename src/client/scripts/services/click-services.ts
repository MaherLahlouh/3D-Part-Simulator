//@ts-nocheck

export function bindClick (id, action)  {
    const btn = document.getElementById(id);
    if (btn) {
        btn.addEventListener('click', action);
    } else {
        console.warn(`Button with ID '${id}' not found!`);
    }
};