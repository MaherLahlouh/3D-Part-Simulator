// @ts-nocheck
import { authService } from './services/authService.ts';

/**
 * Landing Page - Redirects to Dashboard
 * When the project runs, redirect to the dashboard page
 */

// Redirect to dashboard immediately
//window.location.href = 'src/client/pages/dashboard.html';

const skipBtn = document.querySelector('.skip-btn');
skipBtn?.addEventListener('click', () => {
    console.log("User skipped to standard kit");
    selectKit('normal');
    // Redirect to simulator (index.html) after a short delay
    setTimeout(() => {
        window.location.href = "/src/client/pages/index.html";
    }, 400);
});

// 2. CARD CLICK LISTENERS: Handles clicking the card itself
const cards = document.querySelectorAll('.kit-card');
console.log(`Initialized ${cards.length} kit cards.`);

cards.forEach(card => {
    card.addEventListener('click', () => {
        const kitType = card.getAttribute('data-kit');
        if (kitType) {
            selectKit(kitType);
        }
    });
});

// 3. BUTTON CLICK LISTENERS: Handles clicking the "Select" button specifically
document.querySelectorAll('.select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Prevent the card from firing its own click event
        e.stopPropagation();
        
        // Find the parent card to get the kit type
        const card = btn.closest('.kit-card');
        const kitType = card?.getAttribute('data-kit');
        
        if (kitType) {
            console.log("Button click detected for:", kitType);
            selectKit(kitType);
        }
    });
});




// --- HELPER FUNCTIONS ---

function selectKit(kitType) {
    console.log(`Setting kit to: ${kitType}`);

    // Store selection in localStorage
    localStorage.setItem('selectedKit', kitType);
    localStorage.setItem('kitSelectionTime', new Date().toISOString());

    // Visual feedback
    const selectedCard = document.querySelector(`[data-kit="${kitType}"]`);
    if (selectedCard) {
        selectedCard.style.transform = 'scale(1.05)';
        selectedCard.style.transition = 'transform 0.2s ease';
    }

    // Show your success modal
    showSuccessModal(kitType);


}

function highlightPreviousSelection(kitType) {
    const cards = document.querySelectorAll('.kit-card');
    cards.forEach(card => {
        if (card.getAttribute('data-kit') === kitType) {
            const badge = document.createElement('div');
            badge.className = 'selected-badge';
            badge.textContent = 'Currently Selected';
            card.appendChild(badge);
        }
    });
}

function showSuccessModal(kitType) {
    const kitNames = {
        house: 'House Kit',
        car: 'Car Kit',
        byte: 'Byte Kit',
        normal: 'Standard Kit'
    };

    const modal = document.getElementById('successModal');
    const title = document.getElementById('successTitle');
    
    if (modal && title) {
        title.textContent = `${kitNames[kitType]} Selected!`;
        modal.classList.add('show');
    }
}


const logoutButton = document.getElementById('logoutBtn');
logoutButton?.addEventListener('click', () => {
    authService.logout();
});
