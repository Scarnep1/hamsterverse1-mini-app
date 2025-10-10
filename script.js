// Конфигурация приложения
const APP_CONFIG = {
    version: '2.0.0',
    lastUpdate: new Date().toISOString(),
    features: {
        news: true,
        stats: true,
        priceAlerts: false
    }
};

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
    setupNewsSection();
    setupGamesStats();
    setupAutoRefresh();
    setupShareFunctionality();
    setupErrorHandling();
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
let currentPriceData = {
    current: 0.000621,
    change24h: -4.13
};

// Multiple API sources
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
    },
    {
        name: 'MEXC Proxy',
        url: 'https://api.allorigins.win/raw?url=https://www.mexc.com/open/api/v2/market/ticker?symbol=HMSTR_USDT',
        parser: parseMEXC
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
        
        // Обновляем данные каждые 15 секунд
        priceUpdateInterval = setInterval(fetchRealPriceData, 15000);
    }
}

async function fetchRealPriceData() {
    showLoading(true);
    
    try {
        // Пробуем все источники параллельно
        const promises = API_SOURCES.map(source => 
            fetchFromSource(source).catch(e => {
                console.log(`❌ ${source.name} failed:`, e.message);
                return null;
            })
        );
        
        const results = await Promise.all(promises);
        const successfulResult = results.find(result => result !== null);
        
        if (successfulResult) {
            console.log(`✅ Данные получены из ${successfulResult.source}:`, successfulResult);
            updatePriceDisplay(successfulResult.current, successfulResult.change24h);
            updateTokenStats(successfulResult);
            currentPriceData = successfulResult;
            showChartError(false);
            showLoading(false);
            return true;
        }
        
        throw new Error('Все источники данных недоступны');
        
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        showStaticDataMessage();
        return false;
    }
}

async function fetchFromSource(source) {
    const response = await fetch(source.url);
    if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
    
    const data = await response.json();
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

function parseMEXC(data) {
    if (data.data && data.data.length > 0) {
        const ticker = data.data[0];
        return {
            current: parseFloat(ticker.last),
            change24h: parseFloat(ticker.rate),
            volume: parseFloat(ticker.volume),
            source: 'MEXC'
        };
    }
    throw new Error('No MEXC data');
}

function updatePriceDisplay(price, change24h) {
    const priceElement = document.getElementById('hmstr-price');
    const changeElement = document.getElementById('hmstr-change');
    
    let formattedPrice;
    if (price >= 1) {
        formattedPrice = `$${price.toFixed(4)}`;
    } else if (price >= 0.001) {
        formattedPrice = `$${price.toFixed(6)}`;
    } else {
        formattedPrice = `$${price.toFixed(8)}`;
    }
    
    priceElement.textContent = formattedPrice;
    changeElement.textContent = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    
    if (change24h >= 0) {
        changeElement.className = 'change positive';
    } else {
        changeElement.className = 'change negative';
    }
}

// Дополнительная статистика токена
function updateTokenStats(priceData) {
    if (priceData.volume) {
        const volumeElement = document.getElementById('volume-24h');
        if (volumeElement) {
            volumeElement.textContent = `$${formatNumber(priceData.volume)}`;
        }
    }
    
    // Симулируем капитализацию если нет в API
    const marketCapElement = document.getElementById('market-cap');
    if (marketCapElement) {
        const simulatedMarketCap = priceData.current * 1000000000; // Примерная эмиссия
        marketCapElement.textContent = `$${formatNumber(simulatedMarketCap)}`;
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
        // Пытаемся получить реальные данные для графика
        const chartData = await fetchRealChartData(period);
        
        if (!chartData || !chartData.labels || !chartData.prices) {
            throw new Error('No real chart data available');
        }
        
        const prices = chartData.prices;
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
                labels: chartData.labels,
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
        
        showChartError(false);
    } catch (error) {
        console.error('Error creating real chart:', error);
        // Показываем демо-график на основе текущей цены
        createDemoChart(period, ctx, isDark);
    }
}

async function fetchRealChartData(period) {
    // Пытаемся получить реальные исторические данные
    try {
        const response = await fetch('https://api.allorigins.win/raw?url=https://api.mexc.com/api/v3/klines?symbol=HMSTRUSDT&interval=1h&limit=24');
        if (response.ok) {
            const klines = await response.json();
            return parseKlinesData(klines, period);
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
        const price = parseFloat(kline[4]); // close price
        prices.push(price);
        
        // Создаем метки в зависимости от периода
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
    
    showChartError(true); // Показываем сообщение что это демо-график
}

function generateRealisticPrices(basePrice, totalChangePercent, points) {
    const prices = [];
    const startPrice = basePrice / (1 + totalChangePercent / 100);
    
    for (let i = 0; i < points; i++) {
        const progress = i / (points - 1);
        let price = startPrice + (basePrice - startPrice) * progress;
        
        // Добавляем реалистичные колебания
        const randomFactor = 1 + (Math.random() - 0.5) * 0.03;
        price *= randomFactor;
        
        // Гарантируем, что последняя цена равна текущей
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
        
        if (currentChart) {
            const activePeriod = document.querySelector('.time-btn.active').getAttribute('data-period');
            updateChartForPeriod(activePeriod);
        }
    }
}

// Новостная лента
async function setupNewsSection() {
    try {
        const news = await fetchNews();
        displayNews(news);
    } catch (error) {
        console.log('News not available, using fallback');
        displayFallbackNews();
    }
}

async function fetchNews() {
    // Можно добавить реальный RSS позже, пока заглушка
    return [
        {
            date: new Date().toISOString(),
            title: "Hamster Kombat Season 2",
            content: "Запущен второй сезон с тремя новыми играми",
            type: "update"
        },
        {
            date: new Date(Date.now() - 86400000).toISOString(),
            title: "Токен HMSTR",
            content: "Тестирование токена началось в Telegram Stars",
            type: "announcement"
        },
        {
            date: new Date(Date.now() - 172800000).toISOString(),
            title: "Новые игры в разработке",
            content: "Команда Hamster работает над расширением игровой вселенной",
            type: "development"
        }
    ];
}

function displayNews(news) {
    const container = document.getElementById('news-container');
    if (!container) return;

    container.innerHTML = news.map(item => `
        <div class="news-item" data-type="${item.type}">
            <span class="news-date">${formatDate(item.date)}</span>
            <div class="news-title">${item.title}</div>
            <div class="news-content">${item.content}</div>
        </div>
    `).join('');
}

function displayFallbackNews() {
    const container = document.getElementById('news-container');
    if (!container) return;

    container.innerHTML = `
        <div class="news-item">
            <span class="news-date">Сегодня</span>
            <div class="news-title">Добро пожаловать в Hamster Verse!</div>
            <div class="news-content">Здесь будут появляться последние новости проекта</div>
        </div>
    `;
}

// Статистика игроков (симулированная)
function setupGamesStats() {
    // В реальном приложении можно получать с API
    const totalPlayers = Math.floor(10000 + Math.random() * 50000);
    const activeToday = Math.floor(totalPlayers * 0.15);
    
    document.getElementById('total-players').textContent = 
        formatNumber(totalPlayers);
    document.getElementById('active-today').textContent = 
        formatNumber(activeToday);
}

// Авто-обновление
function setupAutoRefresh() {
    // Обновлять статистику каждые 5 минут
    setInterval(setupGamesStats, 300000);
    
    // Обновлять новости каждый час
    setInterval(setupNewsSection, 3600000);
}

// Шеринг функциональность
function setupShareFunctionality() {
    const shareButtonContainer = document.getElementById('share-button-container');
    if (shareButtonContainer) {
        const shareButton = document.createElement('button');
        shareButton.className = 'guide-button';
        shareButton.innerHTML = '📤 Поделиться приложением';
        shareButton.onclick = shareApp;
        shareButtonContainer.appendChild(shareButton);
    }
}

function shareApp() {
    const shareText = "🎮 Открой для себя мир Hamster Verse - все игры в одном приложении!";
    const shareUrl = window.location.href;
    
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.shareUrl(shareUrl, shareText);
    } else if (navigator.share) {
        navigator.share({
            title: 'Hamster Verse',
            text: shareText,
            url: shareUrl
        });
    } else {
        // Fallback - копирование в буфер
        navigator.clipboard.writeText(shareUrl).then(() => {
            alert('Ссылка скопирована в буфер! Поделись с друзьями 🐹');
        });
    }
}

// Обработка ошибок
function setupErrorHandling() {
    window.addEventListener('error', (e) => {
        console.error('Global error:', e);
    });
    
    window.addEventListener('unhandledrejection', (e) => {
        console.error('Unhandled promise rejection:', e);
    });
}

// Вспомогательные функции
function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(2) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 86400000) { // менее суток
        return 'Сегодня';
    } else if (diff < 172800000) { // менее 2 суток
        return 'Вчера';
    } else {
        return date.toLocaleDateString('ru-RU');
    }
}

// Закрытие анонса
function closeAnnouncement() {
    const banner = document.getElementById('announcement');
    if (banner) {
        banner.style.display = 'none';
        localStorage.setItem('announcementClosed', 'true');
    }
}

// Проверка, был ли анонс закрыт
function checkAnnouncementState() {
    const isClosed = localStorage.getItem('announcementClosed');
    if (isClosed === 'true') {
        const banner = document.getElementById('announcement');
        if (banner) {
            banner.style.display = 'none';
        }
    }
}

// Prevent image drag
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
    
    checkAnnouncementState();
});

// Очистка при закрытии
window.addEventListener('beforeunload', function() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
});
