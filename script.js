// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Navigation functionality
    setupNavigation();
    
    // Copy referral link functionality
    setupReferralLink();
    
    // Balance refresh
    setupBalanceRefresh();
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Update active nav item
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Show target section
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
        });
    });
}

function setupReferralLink() {
    const copyBtn = document.getElementById('copy-btn');
    const referralInput = document.getElementById('referral-input');
    const notification = document.getElementById('notification');
    
    if (copyBtn && referralInput && notification) {
        copyBtn.addEventListener('click', function() {
            // Select the text field
            referralInput.select();
            referralInput.setSelectionRange(0, 99999); // For mobile devices
            
            // Copy the text inside the text field
            navigator.clipboard.writeText(referralInput.value).then(function() {
                // Show notification
                notification.classList.add('show');
                
                // Hide notification after 2 seconds
                setTimeout(function() {
                    notification.classList.remove('show');
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy text: ', err);
                // Fallback for older browsers
                try {
                    document.execCommand('copy');
                    notification.classList.add('show');
                    setTimeout(function() {
                        notification.classList.remove('show');
                    }, 2000);
                } catch (e) {
                    console.error('Fallback copy failed: ', e);
                }
            });
        });
    }
}

function setupBalanceRefresh() {
    const refreshBtn = document.querySelector('.balance-refresh');
    const balanceAmount = document.querySelector('.amount');
    
    if (refreshBtn && balanceAmount) {
        refreshBtn.addEventListener('click', function() {
            // Add rotation animation
            this.style.transition = 'transform 0.3s ease';
            this.style.transform = 'rotate(360deg)';
            
            // Simulate balance update (in real app, this would fetch from API)
            setTimeout(() => {
                // Reset rotation
                this.style.transform = 'rotate(0deg)';
                
                // Simulate small balance change for demo
                const currentBalance = parseInt(balanceAmount.textContent.replace(',', ''));
                const randomChange = Math.floor(Math.random() * 10) - 5; // -5 to +5
                const newBalance = Math.max(0, currentBalance + randomChange);
                
                balanceAmount.textContent = newBalance.toLocaleString();
                
                // Update equivalent USD value (simplified)
                const usdValue = (newBalance * 0.01).toFixed(2);
                const usdElement = document.querySelector('.balance-equivalent');
                if (usdElement) {
                    usdElement.textContent = `≈ $${usdValue}`;
                }
            }, 1000);
        });
    }
}

// Telegram Web App integration
if (window.Telegram && window.Telegram.WebApp) {
    // Expand the app to full height
    window.Telegram.WebApp.expand();
    
    // Set theme parameters
    const themeParams = window.Telegram.WebApp.themeParams;
    if (themeParams) {
        document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
        document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
        document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#667eea');
        document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
    }
}
