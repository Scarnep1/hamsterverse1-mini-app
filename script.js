// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupPlayButtons();
    setupTelegramIntegration();
    setupPriceData();
    setupGuideToggle();
    setupThemeToggle();
    setupTimePeriodSelector();
    setupRefreshButton();
    setupShareApp();
    setupUserStats();
    setupOnlineCounter();
    setupAppMetrics();
    
    // Показать welcome notification
    setTimeout(() => {
        showNotification('Добро пожаловать в Hamster Verse! 🐹', 'success');
    }, 1000);
}

// Навигация
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Track section change
            trackSectionChange(targetSection);
            
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
            trackGameClick(this.closest('.game-card').querySelector('h3').textContent);
            openGame(url);
        });
    });
    
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('play-button')) {
                const playButton = this.querySelector('.play-button');
                const url = playButton.getAttribute('data-url');
                trackGameClick(this.querySelector('h3').textContent);
                openGame(url);
            }
        });
    });
}

function openGame(url) {
    showNotification('Запуск игры... 🎮', 'info');
    
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
            updateUserProfile(user);
        }
        
        // Setup theme from Telegram
        if (window.Telegram.WebApp.colorScheme === 'dark') {
            setTheme('dark');
        }
    } else {
        // Demo data for non-Telegram environment
        updateUserProfile({
            first_name: 'Хомяк',
            last_name: 'Игрок',
            username: 'hamster_fan'
        });
    }
}

function updateUserProfile(user) {
    const avatar = document.getElementById('tg-avatar');
    const headerAvatar = document.getElementById('user-avatar');
    const name = document.getElementById('tg-name');
    const username = document.getElementById('tg-username');
    
    if (user.photo_url) {
        avatar.innerHTML = `<img src="${user.photo_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
        headerAvatar.innerHTML = `<img src="${user.photo_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
    } else {
        const initial = user.first_name?.[0] || 'H';
        avatar.textContent = initial;
        headerAvatar.textContent = initial;
    }
    
    if (user.first_name) {
        name.textContent = `${user.first_name} ${user.last_name || ''}`.trim();
    }
    
    if (user.username) {
        username.textContent = `@${user.username}`;
    } else {
        username.textContent = 'Telegram пользователь';
    }
}

// Функции для данных HMSTR
let currentChart = null;
let priceUpdateInterval = null;
let currentPriceData = {
    current: 0.000621,
    change24h: -4.13,
    volume: 2100000,
    marketCap: 18500000,
    liquidity: 5200000
};

const API_SOURCES = [
    {
        name: 'DexScreener',
        url: 'https://api.dexscreener.com/latest/dex/search?q=HMSTR',
        parser: parseDexScreener
    },
    {
        name: 'CoinGecko',
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=hamster-combat&vs_currencies=usd&include_24hr_change=true',
        parser: parseCoinGecko
    }
];

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
    const success = await fetchRealPriceData();
    if (success) {
        updateChartForPeriod('1D');
        priceUpdateInterval = setInterval(fetchRealPriceData, 15000);
    }
}

async function fetchRealPriceData() {
    showLoading(true);
    
    try {
        for (let source of API_SOURCES) {
            try {
                const priceData = await fetchFromSource(source);
                if (priceData && priceData.current) {
                    console.log(`✅ Данные получены из ${source.name}:`, priceData);
                    updatePriceDisplay(priceData);
                    currentPriceData = { ...currentPriceData, ...priceData };
                    showChartError(false);
                    showLoading(false);
                    
                    // Show success notification on first load
                    if (!window.priceDataLoaded) {
                        showNotification('Данные HMSTR обновлены ✅', 'success');
                        window.priceDataLoaded = true;
                    }
                    
                    return true;
                }
            } catch (error) {
                console.log(`❌ Ошибка ${source.name}:`, error.message);
                continue;
            }
        }
        
        throw new Error('Все источники данных недоступны');
        
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        showStaticDataMessage();
        return false;
    }
}

async function fetchFromSource(source) {
    const data = await fetchWithCache(source.url, `price_${source.name}`, 15000);
    return source.parser(data);
}

function parseDexScreener(data) {
    if (data.pairs && data.pairs.length > 0) {
        const pair = data.pairs.find(p => 
            p.baseToken && p.baseToken.symbol.toUpperCase() === 'HMSTR'
        ) || data.pairs[0];
        
        return {
            current: parseFloat(pair.priceUsd),
            change24h: parseFloat(pair.priceChange?.h24 || 0),
            volume: parseFloat(pair.volume?.h24 || 0),
            liquidity: parseFloat(pair.liquidity?.usd || 0),
            source: 'DexScreener'
        };
    }
    throw new Error('No pairs found');
}

function parseCoinGecko(data) {
    if (data['hamster-combat']) {
        return {
            current: data['hamster-combat'].usd,
            change24h: data['hamster-combat'].usd_24h_change,
            source: 'CoinGecko'
        };
    }
    throw new Error('No hamster-combat data');
}

function updatePriceDisplay(priceData) {
    const priceElement = document.getElementById('hmstr-price');
    const changeElement = document.getElementById('hmstr-change');
    const volumeElement = document.getElementById('volume-24h');
    const marketCapElement = document.getElementById('market-cap');
    const liquidityElement = document.getElementById('liquidity');
    
    // Format price
    let formattedPrice;
    if (priceData.current >= 1) {
        formattedPrice = `$${priceData.current.toFixed(4)}`;
    } else if (priceData.current >= 0.001) {
        formattedPrice = `$${priceData.current.toFixed(6)}`;
    } else {
        formattedPrice = `$${priceData.current.toFixed(8)}`;
    }
    
    priceElement.textContent = formattedPrice;
    changeElement.textContent = `${priceData.change24h >= 0 ? '+' : ''}${priceData.change24h.toFixed(2)}%`;
    
    if (priceData.change24h >= 0) {
        changeElement.className = 'change positive';
    } else {
        changeElement.className = 'change negative';
    }
    
    // Update additional stats
    if (priceData.volume) {
        volumeElement.textContent = `$${(priceData.volume / 1000000).toFixed(1)}M`;
    }
    
    if (priceData.marketCap) {
        marketCapElement.textContent = `$${(priceData.marketCap / 1000000).toFixed(1)}M`;
    }
    
    if (priceData.liquidity) {
        liquidityElement.textContent = `$${(priceData.liquidity / 1000000).toFixed(1)}M`;
    }
}

function showLoading(show) {
    const loadingElement = document.getElementById('price-loading');
    if (loadingElement) {
        if (show) {
            loadingElement.classList.remove('hidden');
            loadingElement.innerHTML = '<span>🔄 Поиск актуальных данных HMSTR...</span>';
        } else {
            loadingElement.classList.add('hidden');
        }
    }
}

function showStaticDataMessage() {
    const loadingElement = document.getElementById('price-loading');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        loadingElement.innerHTML = '<span style="color: var(--text-secondary);">📡 Используются кэшированные данные • Обновление через 15 сек</span>';
    }
}

function showChartError(show) {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    if (show) {
        chartContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                <div style="font-weight: 500; margin-bottom: 5px;">Демо-график</div>
                <div style="font-size: 12px; opacity: 0.7;">Реальные данные графика временно недоступны</div>
            </div>
        `;
    } else {
        chartContainer.innerHTML = '<canvas id="priceChart"></canvas>';
    }
}

async function updateChartForPeriod(period) {
    const periodText = getPeriodText(period);
    document.getElementById('current-period').textContent = periodText;
    
    await createRealPriceChart(period);
}

async function createRealPriceChart(period) {
    const chartContainer = document.getElementById('priceChart');
    if (!chartContainer) {
        const container = document.querySelector('.chart-container');
        container.innerHTML = '<canvas id="priceChart"></canvas>';
    }
    
    const ctx = document.getElementById('priceChart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    if (currentChart) {
        currentChart.destroy();
    }
    
    try {
        const chartData = await fetchRealChartData(period);
        
        if (!chartData || !chartData.labels || !chartData.prices) {
            throw new Error('No real chart data available');
        }
        
        createChart(ctx, isDark, chartData.labels, chartData.prices);
        showChartError(false);
    } catch (error) {
        console.error('Error creating real chart:', error);
        createDemoChart(period, ctx, isDark);
    }
}

function createChart(ctx, isDark, labels, prices) {
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
                            return `Цена: $${context.parsed.y.toFixed(8)}`;
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
                        font: { size: 10 },
                        maxTicksLimit: 6
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

async function fetchRealChartData(period) {
    try {
        const response = await fetchWithCache(
            'https://api.allorigins.win/raw?url=https://api.mexc.com/api/v3/klines?symbol=HMSTRUSDT&interval=1h&limit=24',
            'chart_data',
            30000
        );
        if (response) {
            return parseKlinesData(response, period);
        }
    } catch (error) {
        console.log('Real chart data unavailable, using demo data');
    }
    
    throw new Error('Real chart data not available');
}

function parseKlinesData(klines, period) {
    const prices = [];
    const labels = [];
    
    klines.forEach((kline, index) => {
        const price = parseFloat(kline[4]);
        prices.push(price);
        
        if (period === '1D') {
            const date = new Date(kline[0]);
            labels.push(date.getHours() + ':00');
        } else {
            labels.push(`Точка ${index + 1}`);
        }
    });
    
    if (labels.length > 0) {
        labels[labels.length - 1] = 'Сейчас';
    }
    
    return { labels, prices };
}

function createDemoChart(period, ctx, isDark) {
    const basePrice = currentPriceData.current || 0.000621;
    const change24h = currentPriceData.change24h || -4.13;
    
    let labels, prices;
    
    switch(period) {
        case '1D':
            labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, change24h, 7);
            break;
        case '1W':
            labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, change24h * 1.5, 7);
            break;
        case '1M':
            labels = ['Нед1', 'Нед2', 'Нед3', 'Нед4', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, change24h * 3, 5);
            break;
        case '1Y':
            labels = ['Янв', 'Мар', 'Май', 'Июл', 'Сен', 'Ноя', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, change24h * 8, 7);
            break;
        case 'ALL':
            labels = ['Запуск', 'М1', 'М2', 'М3', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, 25, 5);
            break;
        default:
            labels = ['00:00', '06:00', '12:00', '18:00', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, change24h, 5);
    }
    
    createChart(ctx, isDark, labels, prices);
    showChartError(true);
}

function generateRealisticPrices(basePrice, totalChangePercent, points) {
    const prices = [];
    const startPrice = basePrice / (1 + totalChangePercent / 100);
    
    for (let i = 0; i < points; i++) {
        const progress = i / (points - 1);
        let price = startPrice + (basePrice - startPrice) * progress;
        
        const randomFactor = 1 + (Math.random() - 0.5) * 0.03;
        price *= randomFactor;
        
        if (i === points - 1) {
            price = basePrice;
        }
        
        prices.push(price);
    }
    
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

function setupGuideToggle() {
    const guideToggle = document.getElementById('guide-toggle');
    const buyGuide = document.getElementById('buy-guide');
    
    if (guideToggle && buyGuide) {
        // Collapse by default
        buyGuide.classList.add('collapsed');
        
        guideToggle.addEventListener('click', function() {
            if (buyGuide.classList.contains('collapsed')) {
                buyGuide.classList.remove('collapsed');
                this.classList.add('open');
            } else {
                buyGuide.classList.add('collapsed');
                this.classList.remove('open');
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
        showNotification(`Тема изменена на ${newTheme === 'dark' ? 'тёмную' : 'светлую'} 🎨`, 'info');
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
        
        if (currentChart) {
            const activePeriod = document.querySelector('.time-btn.active').getAttribute('data-period');
            updateChartForPeriod(activePeriod);
        }
    }
}

function setupRefreshButton() {
    const refreshBtn = document.getElementById('refresh-btn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', async function() {
            this.style.animation = 'spin 1s linear';
            
            showNotification('Обновление данных... 🔄', 'info');
            
            await Promise.all([
                fetchRealPriceData(),
                updateOnlineCounter()
            ]);
            
            setTimeout(() => {
                this.style.animation = '';
                showNotification('Данные обновлены! ✅', 'success');
            }, 1000);
        });
    }
}

function setupShareApp() {
    const shareBtn = document.getElementById('share-app');
    if (shareBtn) {
        shareBtn.addEventListener('click', function() {
            const shareText = 'Присоединяйся к Hamster Verse - все игры Hamster Kombat в одном приложении! 🐹🎮';
            const shareUrl = window.location.href;
            
            if (navigator.share) {
                navigator.share({
                    title: 'Hamster Verse',
                    text: shareText,
                    url: shareUrl
                }).then(() => {
                    showNotification('Спасибо за распространение! 🙏', 'success');
                });
            } else {
                navigator.clipboard.writeText(shareUrl).then(() => {
                    showNotification('Ссылка скопирована в буфер обмена! 📋', 'success');
                });
            }
            
            trackShareAction();
        });
    }
}

function setupUserStats() {
    // Load user stats from localStorage
    const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    
    // Update session count
    stats.sessions = (stats.sessions || 0) + 1;
    stats.lastActive = new Date().toISOString();
    
    // Update favorite game (simple logic)
    const gameClicks = stats.gameClicks || {};
    let favGame = 'GameDev';
    let maxClicks = 0;
    
    for (const game in gameClicks) {
        if (gameClicks[game] > maxClicks) {
            maxClicks = gameClicks[game];
            favGame = game;
        }
    }
    
    // Update DOM
    document.getElementById('sessions-count').textContent = stats.sessions;
    document.getElementById('fav-game').textContent = favGame;
    document.getElementById('last-active').textContent = 'Сегодня';
    
    // Save updated stats
    localStorage.setItem('user_stats', JSON.stringify(stats));
}

function setupOnlineCounter() {
    updateOnlineCounter();
    // Update every 30 seconds
    setInterval(updateOnlineCounter, 30000);
}

function updateOnlineCounter() {
    const counter = document.getElementById('online-counter');
    if (!counter) return;
    
    // Simulate online users (in real app, this would come from API)
    const baseUsers = 70000;
    const randomVariation = Math.floor(Math.random() * 5000) - 2500;
    const onlineUsers = baseUsers + randomVariation;
    
    counter.textContent = `🎯 Игроков онлайн: ${(onlineUsers / 1000).toFixed(1)}K+`;
    
    // Update quick stats
    document.getElementById('total-players').textContent = '500K+';
    document.getElementById('active-now').textContent = `${(onlineUsers / 1000).toFixed(1)}K+`;
}

function setupAppMetrics() {
    const startTime = Date.now();
    let currentSection = 'games-section';
    
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            trackUserSession(currentSection, Date.now() - startTime);
        }
    });
    
    // Track initial session
    trackUserSession(currentSection, 0);
}

function trackUserSession(section, duration) {
    const stats = JSON.parse(localStorage.getItem('app_stats') || '{}');
    stats[section] = (stats[section] || 0) + Math.round(duration / 1000);
    localStorage.setItem('app_stats', JSON.stringify(stats));
}

function trackSectionChange(section) {
    const stats = JSON.parse(localStorage.getItem('app_stats') || '{}');
    stats.sectionChanges = (stats.sectionChanges || 0) + 1;
    localStorage.setItem('app_stats', JSON.stringify(stats));
}

function trackGameClick(gameName) {
    const stats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    stats.gameClicks = stats.gameClicks || {};
    stats.gameClicks[gameName] = (stats.gameClicks[gameName] || 0) + 1;
    localStorage.setItem('user_stats', JSON.stringify(stats));
}

function trackShareAction() {
    const stats = JSON.parse(localStorage.getItem('app_stats') || '{}');
    stats.shares = (stats.shares || 0) + 1;
    localStorage.setItem('app_stats', JSON.stringify(stats));
}

// Notification system
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    container.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

// Cache system
async function fetchWithCache(url, cacheKey, ttl = 60000) {
    const cached = localStorage.getItem(cacheKey);
    const now = Date.now();
    
    if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (now - timestamp < ttl) {
            return data;
        }
    }
    
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
        
        const data = await response.json();
        localStorage.setItem(cacheKey, JSON.stringify({
            data,
            timestamp: now
        }));
        return data;
    } catch (error) {
        console.error('Fetch error:', error);
        if (cached) {
            return JSON.parse(cached).data;
        }
        throw error;
    }
}

// Prevent image drag
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
});

// Cleanup on close
window.addEventListener('beforeunload', function() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
    
    // Track total session time
    const stats = JSON.parse(localStorage.getItem('app_stats') || '{}');
    stats.totalUsage = (stats.totalUsage || 0) + Math.round(performance.now() / 1000);
    localStorage.setItem('app_stats', JSON.stringify(stats));
});
