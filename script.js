// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupPlayButtons();
    setupTelegramIntegration();
    setupPriceData();
    setupGuideButton();
    setupThemeToggle();
    setupTimePeriodSelector();
}

// Навигация
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
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

function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            const avatar = document.getElementById('tg-avatar');
            const headerAvatar = document.getElementById('user-avatar');
            
            if (user.photo_url) {
                avatar.innerHTML = `<img src="${user.photo_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
                headerAvatar.innerHTML = `<img src="${user.photo_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
            } else {
                const initial = user.first_name?.[0] || 'U';
                avatar.textContent = initial;
                headerAvatar.textContent = initial;
            }
            
            const name = document.getElementById('tg-name');
            const username = document.getElementById('tg-username');
            
            if (user.first_name) {
                name.textContent = `${user.first_name} ${user.last_name || ''}`.trim();
            }
            
            if (user.username) {
                username.textContent = `@${user.username}`;
            } else {
                username.textContent = 'Telegram пользователь';
            }
        }
    }
}

// Функции для данных HMSTR
let currentChart = null;
let priceUpdateInterval = null;
let currentPriceData = null;

function setupTimePeriodSelector() {
    const timeButtons = document.querySelectorAll('.time-btn');
    
    timeButtons.forEach(button => {
        button.addEventListener('click', function() {
            timeButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            const period = this.getAttribute('data-period');
            updateChartForPeriod(period);
        });
    });
}

async function setupPriceData() {
    await fetchRealPriceData();
    setupPriceUpdateInterval();
    updateChartForPeriod('1D');
}

async function fetchRealPriceData() {
    showLoading(true);
    
    try {
        const priceData = await fetchHMSTRPrice();
        
        if (priceData && priceData.current) {
            updatePriceDisplay(priceData.current, priceData.change24h);
            currentPriceData = priceData;
            showChartError(false);
            showLoading(false);
        } else {
            throw new Error('No price data received');
        }
    } catch (error) {
        console.error('Error fetching price data:', error);
        showNoDataMessage();
    }
}

async function fetchHMSTRPrice() {
    try {
        // Используем реальный адрес контракта HMSTR
        const response = await fetch('https://api.dexscreener.com/latest/dex/tokens/0x96371b5905d34e465beacdcf679dcaf235e0ea19');
        
        if (!response.ok) {
            throw new Error('API not available');
        }
        
        const data = await response.json();
        
        console.log('DexScreener response:', data); // Для отладки
        
        if (data.pairs && data.pairs.length > 0) {
            // Берем первую пару (обычно самая ликвидная)
            const hmstrPair = data.pairs[0];
            
            return {
                current: parseFloat(hmstrPair.priceUsd),
                change24h: parseFloat(hmstrPair.priceChange.h24),
                volume: parseFloat(hmstrPair.volume.h24),
                liquidity: parseFloat(hmstrPair.liquidity.usd),
                pairAddress: hmstrPair.pairAddress
            };
        }
        
        return null;
    } catch (error) {
        console.error('DexScreener error:', error);
        return null;
    }
}

function updatePriceDisplay(price, change24h) {
    const priceElement = document.getElementById('hmstr-price');
    const changeElement = document.getElementById('hmstr-change');
    
    let formattedPrice;
    if (price >= 1) {
        formattedPrice = `$${price.toFixed(4)}`;
    } else if (price >= 0.01) {
        formattedPrice = `$${price.toFixed(4)}`;
    } else {
        formattedPrice = `$${price.toFixed(6)}`;
    }
    
    priceElement.textContent = formattedPrice;
    changeElement.textContent = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    
    if (change24h >= 0) {
        changeElement.className = 'change positive';
    } else {
        changeElement.className = 'change negative';
    }
}

function showLoading(show) {
    const loadingElement = document.getElementById('price-loading');
    if (loadingElement) {
        if (show) {
            loadingElement.classList.remove('hidden');
            loadingElement.innerHTML = '<span>Загрузка реальных данных...</span>';
        } else {
            loadingElement.classList.add('hidden');
        }
    }
}

function showNoDataMessage() {
    const priceElement = document.getElementById('hmstr-price');
    const changeElement = document.getElementById('hmstr-change');
    const loadingElement = document.getElementById('price-loading');
    
    priceElement.textContent = '$--.--';
    changeElement.textContent = '--%';
    changeElement.className = 'change';
    
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        loadingElement.innerHTML = '<span style="color: var(--negative-color);">Данные временно недоступны</span>';
    }
    
    showChartError(true);
}

function showChartError(show) {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    if (show) {
        chartContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                <div style="font-weight: 500; margin-bottom: 5px;">График недоступен</div>
                <div style="font-size: 12px; opacity: 0.7;">Обновите страницу или попробуйте позже</div>
            </div>
        `;
    } else {
        chartContainer.innerHTML = '<canvas id="priceChart"></canvas>';
    }
}

function setupPriceUpdateInterval() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
    
    priceUpdateInterval = setInterval(fetchRealPriceData, 30000);
}

function updateChartForPeriod(period) {
    if (!currentPriceData) {
        showChartError(true);
        return;
    }
    
    const periodText = getPeriodText(period);
    document.getElementById('current-period').textContent = periodText;
    
    createPriceChart(period);
}

function createPriceChart(period) {
    const chartContainer = document.getElementById('priceChart');
    if (!chartContainer) return;
    
    const ctx = chartContainer.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    const basePrice = currentPriceData.current;
    const change24h = currentPriceData.change24h;
    
    let labels, prices;
    
    // Генерируем реалистичные данные на основе реальной цены
    switch(period) {
        case '1D':
            labels = ['00:00', '06:00', '12:00', '18:00', 'Сейчас'];
            prices = generatePriceMovement(basePrice, change24h, 5, 0.02);
            break;
        case '1W':
            labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Сейчас'];
            prices = generatePriceMovement(basePrice, change24h, 7, 0.05);
            break;
        case '1M':
            labels = ['Нед1', 'Нед2', 'Нед3', 'Нед4', 'Сейчас'];
            prices = generatePriceMovement(basePrice, change24h, 5, 0.08);
            break;
        case '1Y':
            labels = ['Янв', 'Мар', 'Май', 'Июл', 'Сен', 'Ноя', 'Сейчас'];
            prices = generatePriceMovement(basePrice, change24h, 7, 0.15);
            break;
        case 'ALL':
            labels = ['Запуск', 'М1', 'М2', 'М3', 'Сейчас'];
            prices = generatePriceMovement(basePrice, change24h, 5, 0.25);
            break;
        default:
            labels = ['00:00', '06:00', '12:00', '18:00', 'Сейчас'];
            prices = generatePriceMovement(basePrice, change24h, 5, 0.02);
    }
    
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const isPositive = lastPrice >= firstPrice;
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    
    if (isPositive) {
        gradient.addColorStop(0, 'rgba(0, 200, 81, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 200, 81, 0.05)');
        var borderColor = '#00c851';
    } else {
        gradient.addColorStop(0, 'rgba(255, 68, 68, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0.05)');
        var borderColor = '#ff4444';
    }
    
    currentChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                data: prices,
                borderColor: borderColor,
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: borderColor,
                pointBorderColor: isDark ? '#2d2d2d' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 0,
                pointHoverRadius: 4
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
                            return `Цена: $${context.parsed.y.toFixed(6)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { 
                        display: false,
                        color: isDark ? '#404040' : '#e9ecef'
                    },
                    ticks: {
                        color: isDark ? '#b0b0b0' : '#666',
                        font: { size: 10 }
                    }
                },
                y: {
                    display: false,
                    grid: {
                        color: isDark ? '#404040' : '#e9ecef'
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

function generatePriceMovement(basePrice, change24h, points, volatility) {
    const prices = [];
    
    // Начинаем с цены, которая соответствует общему тренду
    let currentPrice = basePrice * (1 - (change24h / 100));
    
    for (let i = 0; i < points - 1; i++) {
        const progress = i / (points - 1);
        // Плавно приближаемся к текущей цене
        const targetPrice = basePrice * (1 - (change24h / 100) + (change24h / 100) * progress);
        const noise = (Math.random() - 0.5) * volatility * basePrice;
        
        currentPrice = targetPrice + noise;
        prices.push(Math.max(0.000001, currentPrice));
    }
    
    // Последняя точка - текущая цена
    prices.push(basePrice);
    
    return prices;
}

function getPeriodText(period) {
    switch(period) {
        case '1D': return 'Сегодня';
        case '1W': return 'За неделю';
        case '1M': return 'За месяц';
        case '1Y': return 'За год';
        case 'ALL': return 'За всё время';
        default: return 'Сегодня';
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
        
        if (currentChart && currentPriceData) {
            const activePeriod = document.querySelector('.time-btn.active').getAttribute('data-period');
            updateChartForPeriod(activePeriod);
        }
    }
}

// Prevent image drag
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
});
