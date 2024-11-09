// Character sets for password generation
const characters = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    numbers: '0123456789',
    symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?'
};

// Initialize stored passwords from localStorage
let storedPasswords = JSON.parse(localStorage.getItem('passwords')) || [];

// DOM Elements
const lengthSlider = document.getElementById('length');
const lengthValue = document.getElementById('lengthValue');
const passwordDisplay = document.getElementById('password');
const copyBtn = document.getElementById('copyBtn');
const generateBtn = document.querySelector('.generate-btn');
const saveBtn = document.getElementById('saveBtn');
const passwordVault = document.getElementById('passwordVault');
const alert = document.getElementById('alert');

// Event Listeners
lengthSlider.addEventListener('input', () => updateLength(lengthSlider.value));
generateBtn.addEventListener('click', generatePassword);
copyBtn.addEventListener('click', () => copyToClipboard(passwordDisplay.textContent, copyBtn));
saveBtn.addEventListener('click', savePassword);

// Initialize the vault on page load
document.addEventListener('DOMContentLoaded', () => {
    updatePasswordVault();
});

// Update password length display
function updateLength(value) {
    lengthValue.textContent = value;
}

// Generate password
function generatePassword() {
    const length = parseInt(lengthSlider.value);
    let availableChars = '';

    // Build character set based on selected options
    if (document.getElementById('uppercase').checked) 
        availableChars += characters.uppercase;
    if (document.getElementById('lowercase').checked) 
        availableChars += characters.lowercase;
    if (document.getElementById('numbers').checked) 
        availableChars += characters.numbers;
    if (document.getElementById('symbols').checked) 
        availableChars += characters.symbols;

    if (availableChars === '') {
        showAlert('Please select at least one character type!', 'error');
        return;
    }

    // Generate random password
    let password = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * availableChars.length);
        password += availableChars[randomIndex];
    }

    passwordDisplay.textContent = password;
    calculatePasswordStrength(password);
}

// Calculate password strength
function calculatePasswordStrength(password) {
    let strength = 0;
    
    // Length contribution
    if (password.length >= 12) strength += 25;
    else if (password.length >= 8) strength += 10;

    // Character type contribution
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;

    // Update strength meter
    const strengthMeter = document.getElementById('strengthMeter');
    if (strengthMeter) {
        strengthMeter.style.width = `${Math.min(strength, 100)}%`;
        
        if (strength < 40) strengthMeter.style.background = '#f56565';
        else if (strength < 70) strengthMeter.style.background = '#ecc94b';
        else strengthMeter.style.background = '#48bb78';
    }

    return strength;
}

// Copy to clipboard function
async function copyToClipboard(text, button) {
    if (text === 'Click Generate!') {
        showAlert('Please generate a password first!', 'error');
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        
        // Visual feedback
        button.classList.add('copied');
        button.textContent = '✓ Copied!';
        button.classList.add('copy-success-animation');

        // Reset button after 2 seconds
        setTimeout(() => {
            button.classList.remove('copied');
            button.textContent = '📋 Copy';
            button.classList.remove('copy-success-animation');
        }, 2000);

        showAlert('Password copied to clipboard!');

    } catch (err) {
        showAlert('Failed to copy password!', 'error');
        console.error('Copy failed:', err);
    }
}

// Save password to vault
function savePassword() {
    const password = passwordDisplay.textContent;
    const title = document.getElementById('passwordTitle').value.trim();
    const note = document.getElementById('passwordNote').value.trim();

    if (password === 'Click Generate!') {
        showAlert('Please generate a password first!', 'error');
        return;
    }

    if (!title) {
        showAlert('Please enter a title!', 'error');
        return;
    }

    const newPassword = {
        id: Date.now(),
        title,
        password,
        note,
        date: new Date().toLocaleDateString(),
        strength: calculatePasswordStrength(password)
    };

    storedPasswords.unshift(newPassword);
    localStorage.setItem('passwords', JSON.stringify(storedPasswords));
    updatePasswordVault();
    
    // Clear form
    document.getElementById('passwordTitle').value = '';
    document.getElementById('passwordNote').value = '';
    
    showAlert('Password saved successfully!');
}

// Update password vault display
function updatePasswordVault() {
    passwordVault.innerHTML = '';

    if (storedPasswords.length === 0) {
        passwordVault.innerHTML = `
            <div class="empty-vault">
                <p>No passwords saved yet. Generate and save your first password!</p>
            </div>
        `;
        return;
    }

    storedPasswords.forEach(entry => {
        const card = document.createElement('div');
        card.className = 'password-card';
        card.innerHTML = `
            <h3>${entry.title}</h3>
            <p><strong>Password:</strong> <span class="password-text">********</span></p>
            ${entry.note ? `<p><strong>Note:</strong> ${entry.note}</p>` : ''}
            <p><small>Saved on: ${entry.date}</small></p>
            <div class="actions">
                <button class="button secondary-button" onclick="togglePassword(this, '${entry.password}')">
                    👁️ Show
                </button>
                <button class="button primary-button copy-button" onclick="copyStoredPassword('${entry.password}', this)">
                    📋 Copy
                </button>
                <button class="button secondary-button" onclick="deletePassword(${entry.id})">
                    🗑️ Delete
                </button>
            </div>
        `;
        passwordVault.appendChild(card);
    });
}

// Copy stored password
async function copyStoredPassword(password, button) {
    try {
        await navigator.clipboard.writeText(password);
        
        // Visual feedback
        const originalText = button.textContent;
        button.classList.add('copied');
        button.textContent = '✓ Copied!';
        button.classList.add('copy-success-animation');

        // Reset button after 2 seconds
        setTimeout(() => {
            button.classList.remove('copied');
            button.textContent = originalText;
            button.classList.remove('copy-success-animation');
        }, 2000);

        showAlert('Password copied to clipboard!');

    } catch (err) {
        showAlert('Failed to copy password!', 'error');
        console.error('Copy failed:', err);
    }
}

// Toggle password visibility
function togglePassword(button, password) {
    const passwordSpan = button.parentElement.parentElement.querySelector('.password-text');
    const isHidden = passwordSpan.textContent === '********';
    
    if (isHidden) {
        passwordSpan.textContent = password;
        button.textContent = '👁️ Hide';
        
        // Automatically hide password after 10 seconds
        setTimeout(() => {
            if (passwordSpan.textContent !== '********') {
                passwordSpan.textContent = '********';
                button.textContent = '👁️ Show';
            }
        }, 10000);
    } else {
        passwordSpan.textContent = '********';
        button.textContent = '👁️ Show';
    }
}

// Delete password from vault
function deletePassword(id) {
    if (confirm('Are you sure you want to delete this password?')) {
        storedPasswords = storedPasswords.filter(p => p.id !== id);
        localStorage.setItem('passwords', JSON.stringify(storedPasswords));
        updatePasswordVault();
        showAlert('Password deleted successfully!');
    }
}

// Show alert message
function showAlert(message, type = 'success') {
    const alert = document.getElementById('alert');
    alert.textContent = message;
    alert.style.background = type === 'success' ? '#48bb78' : '#f56565';
    alert.classList.add('show');
    
    // Clear any existing timeout
    if (alert.timeout) {
        clearTimeout(alert.timeout);
    }
    
    // Set new timeout
    alert.timeout = setTimeout(() => {
        alert.classList.remove('show');
    }, 2000);
}

// Export functionality
function exportPasswords() {
    const dataStr = JSON.stringify(storedPasswords, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `password_vault_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    showAlert('Passwords exported successfully!');
}

// Import functionality
function importPasswords(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                storedPasswords = [...imported, ...storedPasswords];
                localStorage.setItem('passwords', JSON.stringify(storedPasswords));
                updatePasswordVault();
                showAlert('Passwords imported successfully!');
            }
        } catch (err) {
            showAlert('Failed to import passwords!', 'error');
            console.error('Import failed:', err);
        }
    };
    reader.readAsText(file);
}

// Search functionality
function searchPasswords(query) {
    const searchTerm = query.toLowerCase();
    const filteredPasswords = storedPasswords.filter(entry => 
        entry.title.toLowerCase().includes(searchTerm) || 
        entry.note.toLowerCase().includes(searchTerm)
    );
    
    updatePasswordVault(filteredPasswords);
}

// Sort functionality
function sortPasswords(criteria) {
    switch(criteria) {
        case 'date':
            storedPasswords.sort((a, b) => new Date(b.date) - new Date(a.date));
            break;
        case 'title':
            storedPasswords.sort((a, b) => a.title.localeCompare(b.title));
            break;
        case 'strength':
            storedPasswords.sort((a, b) => b.strength - a.strength);
            break;
    }
    updatePasswordVault();
}

// Initialize tooltips
function initTooltips() {
    const tooltipElements = document.querySelectorAll('[data-tooltip]');
    tooltipElements.forEach(element => {
        element.addEventListener('mouseenter', showTooltip);
        element.addEventListener('mouseleave', hideTooltip);
    });
}

function showTooltip(event) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = event.target.dataset.tooltip;
    document.body.appendChild(tooltip);
    
    const rect = event.target.getBoundingClientRect();
    tooltip.style.top = `${rect.top - tooltip.offsetHeight - 5}px`;
    tooltip.style.left = `${rect.left + (rect.width - tooltip.offsetWidth) / 2}px`;
}

function hideTooltip() {
    const tooltip = document.querySelector('.tooltip');
    if (tooltip) tooltip.remove();
}

// Initialize the application
function init() {
    updatePasswordVault();
    initTooltips();
    
    // Add event listener for search
    const searchInput = document.getElementById('searchPasswords');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => searchPasswords(e.target.value));
    }
    
    // Add event listener for sort
    const sortSelect = document.getElementById('sortPasswords');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => sortPasswords(e.target.value));
    }
}

// Call init when DOM is loaded
document.addEventListener('DOMContentLoaded', init);