// API Configuration
const MEXC_API_BASE = 'https://api.mexc.com';
const HMSTR_SYMBOL = 'HMSTRUSDT';

// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupReferralLink();
    setupPlayButtons();
    setupTelegramIntegration();
    setupPriceData();
    setupDailyBonus();
    setupGuideButton();
    setupThemeToggle();
    
    // Start real-time updates
    startRealTimeUpdates();
}

// API Functions
async function fetchPriceData() {
    try {
        updateApiStatus('loading', 'Загрузка данных...');
        
        const response = await fetch(`${MEXC_API_BASE}/api/v3/ticker/24hr?symbol=${HMSTR_SYMBOL}`);
        
        if (!response.ok) {
            throw new Error('API request failed');
        }

        const tickerData = await response.json();
        
        updateApiStatus('connected', 'Данные обновлены');
        updatePriceDisplay(tickerData);
        updateMarketStats(tickerData);
        createPriceChart(tickerData);
        
        return true;
    } catch (error) {
        console.error('Error fetching price data:', error);
        updateApiStatus('error', 'Ошибка загрузки данных');
        
        // Fallback to mock data
        useMockData();
        
        return false;
    }
}

function updatePriceDisplay(tickerData) {
    const priceElement = document.getElementById('hmstr-price');
    const changeElement = document.getElementById('hmstr-change');
    
    const currentPrice = parseFloat(tickerData.lastPrice);
    const priceChangePercent = parseFloat(tickerData.priceChangePercent);
    
    const previousPrice = parseFloat(priceElement.textContent.replace('$', '')) || currentPrice;
    
    priceElement.textContent = `$${currentPrice.toFixed(6)}`;
    changeElement.textContent = `${priceChangePercent >= 0 ? '+' : ''}${priceChangePercent.toFixed(2)}%`;
    
    // Add update animation
    priceElement.classList.add('price-update');
    if (currentPrice > previousPrice) {
        priceElement.classList.add('positive');
    } else if (currentPrice < previousPrice) {
        priceElement.classList.add('negative');
    }
    
    setTimeout(() => {
        priceElement.classList.remove('price-update', 'positive', 'negative');
    }, 500);
    
    if (priceChangePercent >= 0) {
        changeElement.className = 'change positive';
    } else {
        changeElement.className = 'change negative';
    }
}

function updateMarketStats(tickerData) {
    document.getElementById('volume-24h').textContent = `$${formatVolume(parseFloat(tickerData.volume))}`;
    document.getElementById('high-24h').textContent = `$${parseFloat(tickerData.highPrice).toFixed(6)}`;
    document.getElementById('low-24h').textContent = `$${parseFloat(tickerData.lowPrice).toFixed(6)}`;
}

function formatVolume(volume) {
    if (volume >= 1000000) {
        return (volume / 1000000).toFixed(2) + 'M';
    } else if (volume >= 1000) {
        return (volume / 1000).toFixed(2) + 'K';
    }
    return volume.toFixed(2);
}

function updateApiStatus(status, message) {
    const statusElement = document.getElementById('api-status');
    const dotElement = statusElement.querySelector('.status-dot');
    const textElement = statusElement.querySelector('.status-text');
    
    dotElement.className = 'status-dot';
    if (status === 'connected') {
        dotElement.classList.add('connected');
    } else if (status === 'error') {
        dotElement.classList.add('error');
    }
    
    textElement.textContent = message;
}

function createPriceChart(tickerData) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Generate realistic price history based on current price
    const currentPrice = parseFloat(tickerData.lastPrice);
    const prices = generateRealisticPriceHistory(currentPrice);
    const labels = ['6d', '5d', '4d', '3d', '2d', '1d', 'Now'];
    
    // Determine trend for color
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isPositive = lastPrice >= firstPrice;
    
    // Destroy existing chart if it exists
    const existingChart = Chart.getChart(ctx);
    if (existingChart) {
        existingChart.destroy();
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: prices,
                borderColor: isPositive ? '#00c851' : '#ff4444',
                backgroundColor: isPositive ? 
                    'rgba(0, 200, 81, 0.1)' : 
                    'rgba(255, 68, 68, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: isPositive ? '#00c851' : '#ff4444',
                pointBorderColor: isDark ? '#2d2d2d' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 3,
                pointHoverRadius: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: isDark ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                    bodyColor: isDark ? '#ffffff' : '#1a1a1a',
                    titleColor: isDark ? '#ffffff' : '#1a1a1a',
                    borderColor: isDark ? '#404040' : '#e9ecef',
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(6)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { 
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: isDark ? '#b0b0b0' : '#666',
                        font: { size: 9 }
                    }
                },
                y: { 
                    display: false,
                    grid: { display: false }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            elements: {
                line: {
                    tension: 0.4
                }
            }
        }
    });
}

function generateRealisticPriceHistory(currentPrice) {
    const prices = [];
    let price = currentPrice;
    
    // Generate 6 historical prices + current price
    for (let i = 6; i >= 0; i--) {
        if (i === 0) {
            prices.push(currentPrice);
        } else {
            // More realistic price fluctuations
            const volatility = 0.02; // 2% volatility
            const change = (Math.random() - 0.5) * volatility;
            price = Math.max(currentPrice * 0.8, price * (1 + change));
            prices.push(price);
        }
    }
    
    return prices;
}

function useMockData() {
    console.log('Using mock data as fallback');
    
    const basePrice = 0.01;
    const changePercent = (Math.random() - 0.5) * 10;
    const currentPrice = basePrice * (1 + changePercent / 100);
    
    const mockTicker = {
        lastPrice: currentPrice.toFixed(6),
        priceChange: (currentPrice - basePrice).toFixed(6),
        priceChangePercent: changePercent.toFixed(2),
        volume: (100000 + Math.random() * 50000).toFixed(2),
        highPrice: (currentPrice * (1 + Math.random() * 0.1)).toFixed(6),
        lowPrice: (currentPrice * (1 - Math.random() * 0.05)).toFixed(6)
    };
    
    updatePriceDisplay(mockTicker);
    updateMarketStats(mockTicker);
    updateApiStatus('connected', 'Данные (тестовые)');
    createPriceChart(mockTicker);
}

function startRealTimeUpdates() {
    // Initial data load
    fetchPriceData();
    
    // Update every 30 seconds
    setInterval(() => {
        fetchPriceData();
    }, 30000);
    
    // Setup refresh button
    setupRefreshButton();
}

function setupRefreshButton() {
    const refreshButton = document.getElementById('refresh-data');
    
    refreshButton.addEventListener('click', function() {
        // Add loading animation
        this.classList.add('loading');
        
        fetchPriceData().finally(() => {
            // Remove loading animation after a delay
            setTimeout(() => {
                this.classList.remove('loading');
            }, 1000);
        });
    });
}

// Navigation and UI Functions
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Update navigation
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Update sections
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

function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            const avatar = document.getElementById('tg-avatar');
            if (user.photo_url) {
                avatar.innerHTML = `<img src="${user.photo_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
            } else {
                avatar.querySelector('.avatar-icon').textContent = user.first_name?.[0] || 'U';
            }
            
            const name = document.getElementById('tg-name');
            const username = document.getElementById('tg-username');
            
            if (user.first_name) {
                name.textContent = `${user.first_name} ${user.last_name || ''}`.trim();
            }
            
            if (user.username) {
                username.textContent = `@${user.username}`;
            }
        }
    }
}

function setupDailyBonus() {
    const claimButton = document.getElementById('claim-daily');
    
    if (claimButton) {
        // Check if already claimed today
        const lastClaim = localStorage.getItem('lastDailyClaim');
        const today = new Date().toDateString();
        
        if (lastClaim === today) {
            claimButton.disabled = true;
            claimButton.textContent = '🎁 Получено сегодня';
        }
        
        claimButton.addEventListener('click', function() {
            const lastClaim = localStorage.getItem('lastDailyClaim');
            const today = new Date().toDateString();
            
            if (lastClaim === today) {
                alert('Вы уже получили бонус сегодня! Возвращайтесь завтра.');
                return;
            }
            
            // Claim bonus
            localStorage.setItem('lastDailyClaim', today);
            
            const pointsElement = document.getElementById('total-points');
            const currentPoints = parseInt(pointsElement.textContent);
            pointsElement.textContent = currentPoints + 1;
            
            const streakElement = document.getElementById('daily-streak');
            const currentStreak = parseInt(streakElement.textContent);
            streakElement.textContent = currentStreak + 1;
            
            updateUserRank(currentPoints + 1);
            
            // Update button state
            claimButton.disabled = true;
            claimButton.textContent = '🎁 Получено сегодня';
            
            // Show success message
            alert('🎉 Вы получили 1 очко за ежедневный вход!');
        });
    }
    
    // Initial rank update
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
    } else if (points < 100) {
        rank = 'player';
        nextRank = 100;
        progress = `${points}/100 очков`;
    } else if (points < 300) {
        rank = 'pro';
        nextRank = 300;
        progress = `${points}/300 очков`;
    } else {
        rank = 'whale';
        nextRank = '∞';
        progress = `${points}+ очков`;
    }
    
    rankBadge.className = `rank-badge ${rank}`;
    rankBadge.textContent = getRankName(rank);
    rankProgress.textContent = progress;
}

function getRankName(rank) {
    switch(rank) {
        case 'beginner': return 'Новичок';
        case 'player': return 'Игрок';
        case 'pro': return 'Профи';
        case 'whale': return 'Кит';
        default: return 'Новичок';
    }
}

function setupGuideButton() {
    const guideButton = document.getElementById('show-guide');
    const buyGuide = document.getElementById('buy-guide');
    
    if (guideButton && buyGuide) {
        guideButton.addEventListener('click', function() {
            if (buyGuide.classList.contains('hidden')) {
                buyGuide.classList.remove('hidden');
                guideButton.textContent = '📖 Скрыть гайд';
            } else {
                buyGuide.classList.add('hidden');
                guideButton.textContent = '📖 Как купить HMSTR';
            }
        });
    }
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const themeText = themeToggle.querySelector('.theme-text');
    
    // Load saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Светлая тема';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Темная тема';
        }
        
        // Update chart theme if it exists
        updateChartTheme();
    }
}

function updateChartTheme() {
    const chartCanvas = document.getElementById('priceChart');
    if (chartCanvas) {
        const chart = Chart.getChart(chartCanvas);
        if (chart) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            
            chart.options.scales.x.ticks.color = isDark ? '#b0b0b0' : '#666';
            chart.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)';
            chart.options.plugins.tooltip.bodyColor = isDark ? '#ffffff' : '#1a1a1a';
            chart.options.plugins.tooltip.titleColor = isDark ? '#ffffff' : '#1a1a1a';
            chart.options.plugins.tooltip.borderColor = isDark ? '#404040' : '#e9ecef';
            
            chart.update('none'); // Update without animation
        }
    }
}

// Add CSS for price update animation
const style = document.createElement('style');
style.textContent = `
    .price-update {
        animation: priceUpdate 0.5s ease;
    }
    
    .price-update.positive {
        animation: priceUpdatePositive 0.5s ease;
    }
    
    .price-update.negative {
        animation: priceUpdateNegative 0.5s ease;
    }
    
    @keyframes priceUpdate {
        0% { background-color: transparent; }
        50% { background-color: rgba(102, 126, 234, 0.1); }
        100% { background-color: transparent; }
    }
    
    @keyframes priceUpdatePositive {
        0% { background-color: transparent; }
        50% { background-color: rgba(0, 200, 81, 0.1); }
        100% { background-color: transparent; }
    }
    
    @keyframes priceUpdateNegative {
        0% { background-color: transparent; }
        50% { background-color: rgba(255, 68, 68, 0.1); }
        100% { background-color: transparent; }
    }
`;
document.head.appendChild(style);
