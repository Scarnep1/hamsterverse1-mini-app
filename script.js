// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    // Navigation functionality
    setupNavigation();
    
    // Copy referral link functionality
    setupReferralLink();
    
    // Play button functionality
    setupPlayButtons();
    
    // Telegram WebApp integration
    setupTelegramIntegration();
    
    // HMSTR price data
    setupPriceData();
    
    // Daily bonus claim
    setupDailyBonus();
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

function setupPlayButtons() {
    const playButtons = document.querySelectorAll('.play-button');
    
    playButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const url = this.getAttribute('data-url');
            openGame(url);
        });
    });
    
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('click', function() {
            const playButton = this.querySelector('.play-button');
            const url = playButton.getAttribute('data-url');
            openGame(url);
        });
    });
}

function openGame(url) {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank');
    }
}

function setupReferralLink() {
    const copyBtn = document.getElementById('copy-btn');
    const referralInput = document.getElementById('referral-input');
    const notification = document.getElementById('notification');
    
    if (copyBtn && referralInput && notification) {
        copyBtn.addEventListener('click', function() {
            referralInput.select();
            referralInput.setSelectionRange(0, 99999);
            
            navigator.clipboard.writeText(referralInput.value).then(function() {
                notification.classList.add('show');
                setTimeout(function() {
                    notification.classList.remove('show');
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy text: ', err);
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

function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        // Expand the app to full height
        window.Telegram.WebApp.expand();
        
        // Get user data
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            // Update avatar
            const avatar = document.getElementById('tg-avatar');
            if (user.photo_url) {
                avatar.innerHTML = `<img src="${user.photo_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
            } else {
                avatar.textContent = user.first_name?.[0] || 'U';
            }
            
            // Update name and username
            const name = document.getElementById('tg-name');
            const username = document.getElementById('tg-username');
            
            if (user.first_name) {
                name.textContent = `${user.first_name} ${user.last_name || ''}`.trim();
            }
            
            if (user.username) {
                username.textContent = `@${user.username}`;
            }
        }
        
        // Set theme parameters
        const themeParams = window.Telegram.WebApp.themeParams;
        if (themeParams) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#667eea');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
        }
    }
}

function setupPriceData() {
    // Simulate price data (in real app, fetch from API)
    const priceElement = document.getElementById('hmstr-price');
    const changeElement = document.getElementById('hmstr-change');
    
    // Generate random price data
    const basePrice = 0.01;
    const randomChange = (Math.random() - 0.5) * 0.02; // -1% to +1%
    const currentPrice = basePrice * (1 + randomChange);
    const changePercent = (randomChange * 100).toFixed(2);
    
    priceElement.textContent = `$${currentPrice.toFixed(4)}`;
    changeElement.textContent = `${changePercent >= 0 ? '+' : ''}${changePercent}%`;
    
    if (changePercent >= 0) {
        changeElement.className = 'change positive';
    } else {
        changeElement.className = 'change negative';
    }
    
    // Create price chart
    createPriceChart();
}

function createPriceChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    
    // Generate sample price data for 7 days
    const prices = [];
    let currentPrice = 0.01;
    
    for (let i = 0; i < 7; i++) {
        const change = (Math.random() - 0.5) * 0.008;
        currentPrice = Math.max(0.005, currentPrice * (1 + change));
        prices.push(currentPrice);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['6d', '5d', '4d', '3d', '2d', '1d', 'Now'],
            datasets: [{
                label: 'HMSTR Price',
                data: prices,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: '#666',
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    display: false,
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

function setupDailyBonus() {
    const claimButton = document.getElementById('claim-daily');
    
    if (claimButton) {
        claimButton.addEventListener('click', function() {
            // Check if already claimed today
            const lastClaim = localStorage.getItem('lastDailyClaim');
            const today = new Date().toDateString();
            
            if (lastClaim === today) {
                alert('Вы уже получили бонус сегодня! Возвращайтесь завтра.');
                return;
            }
            
            // Claim bonus
            localStorage.setItem('lastDailyClaim', today);
            
            // Update points
            const pointsElement = document.getElementById('total-points');
            const currentPoints = parseInt(pointsElement.textContent);
            pointsElement.textContent = currentPoints + 1;
            
            // Update streak
            const streakElement = document.getElementById('daily-streak');
            const currentStreak = parseInt(streakElement.textContent);
            streakElement.textContent = currentStreak + 1;
            
            // Update rank if needed
            updateUserRank(currentPoints + 1);
            
            alert('🎉 Вы получили 1 очко за ежедневный вход!');
            claimButton.disabled = true;
            claimButton.textContent = 'Получено сегодня';
        });
    }
    
    // Initialize user rank
    updateUserRank(parseInt(document.getElementById('total-points').textContent));
}

function updateUserRank(points) {
    const rankElement = document.getElementById('user-rank');
    const rankBadge = rankElement.querySelector('.rank-badge');
    const rankProgress = rankElement.querySelector('.rank-progress');
    
    let rank, nextRank, progress;
    
    if (points < 30) {
        rank = 'beginner';
        nextRank = 30;
        progress = `${points}/30 очков`;
    } else if (points < 300) {
        rank = 'player';
        nextRank = 300;
        progress = `${points}/300 очков`;
    } else {
        rank = 'whale';
        nextRank = '∞';
        progress = `${points}+ очков`;
    }
    
    // Update rank badge
    rankBadge.className = `rank-badge ${rank}`;
    rankBadge.textContent = getRankName(rank);
    rankProgress.textContent = progress;
}

function getRankName(rank) {
    switch(rank) {
        case 'beginner': return 'Новичок';
        case 'player': return 'Игрок';
        case 'whale': return 'Кит';
        default: return 'Новичок';
    }
}

// Prevent image drag
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
});
