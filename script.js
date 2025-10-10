// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

// Cache system
const cache = {
    set: (key, data, ttl = 60000) => {
        localStorage.setItem(key, JSON.stringify({
            data,
            expiry: Date.now() + ttl
        }));
    },
    get: (key) => {
        const item = localStorage.getItem(key);
        if (!item) return null;
        
        const { data, expiry } = JSON.parse(item);
        if (Date.now() > expiry) {
            localStorage.removeItem(key);
            return null;
        }
        return data;
    }
};

// Analytics tracking
function trackEvent(event, data = {}) {
    const analytics = JSON.parse(localStorage.getItem('analytics') || '{}');
    if (!analytics[event]) analytics[event] = [];
    
    analytics[event].push({
        timestamp: new Date().toISOString(),
        ...data
    });
    
    localStorage.setItem('analytics', JSON.stringify(analytics));
    
    // Simple console log for demo
    console.log(`📊 Event: ${event}`, data);
}

async function initializeApp() {
    setupNavigation();
    setupPlayButtons();
    setupTelegramIntegration();
    setupPriceData();
    setupGuideButton();
    setupThemeToggle();
    setupTimePeriodSelector();
    
    // New features
    await loadNews();
    setupAutoRefresh();
    setupOnlineCounter();
    setupShareFunctionality();
    setupGameStatistics();
    setupDailyBonus();
    setupReferralSystem();
    setupAchievements();
    
    trackEvent('app_loaded');
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
                    trackEvent('section_switch', { section: targetSection });
                }
            });
        });
    });
}

function setupPlayButtons() {
    const playButtons = document.querySelectorAll('.play-button:not(.disabled)');
    
    playButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const url = this.getAttribute('data-url');
            const gameCard = this.closest('.game-card');
            const gameName = gameCard.getAttribute('data-game');
            
            trackEvent('game_play', { game: gameName, url });
            updateGameStats(gameName);
            openGame(url);
        });
    });
    
    const gameCards = document.querySelectorAll('.game-card:not(.coming-soon)');
    
    gameCards.forEach(card => {
        card.addEventListener('click', function() {
            const playButton = this.querySelector('.play-button');
            if (!playButton.disabled) {
                const url = playButton.getAttribute('data-url');
                const gameName = this.getAttribute('data-game');
                
                trackEvent('game_play', { game: gameName, url });
                updateGameStats(gameName);
                openGame(url);
            }
        });
    });
}

function updateGameStats(gameName) {
    const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
    stats[gameName] = (stats[gameName] || 0) + 1;
    localStorage.setItem('game_stats', JSON.stringify(stats));
    
    // Update UI
    updateGameStatsUI();
    checkAchievements();
}

function updateGameStatsUI() {
    const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
    
    // Update individual game counts
    Object.keys(stats).forEach(game => {
        const element = document.getElementById(`${game.toLowerCase().replace(' ', '-')}-plays`);
        if (element) {
            element.textContent = stats[game];
        }
    });
    
    // Update total plays
    const totalPlays = Object.values(stats).reduce((sum, count) => sum + count, 0);
    document.getElementById('total-plays').textContent = totalPlays;
    
    // Update user level
    const level = Math.floor(totalPlays / 5) + 1;
    document.getElementById('user-level').textContent = level;
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
            
            // Setup member days
            setupMemberDays();
        }
    }
}

function setupMemberDays() {
    let joinDate = localStorage.getItem('join_date');
    if (!joinDate) {
        joinDate = new Date().toISOString();
        localStorage.setItem('join_date', joinDate);
    }
    
    const join = new Date(joinDate);
    const today = new Date();
    const diffTime = Math.abs(today - join);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    document.getElementById('member-days').textContent = `Участник ${diffDays} ${getDayText(diffDays)}`;
    document.getElementById('streak-days').textContent = diffDays;
}

function getDayText(days) {
    if (days % 10 === 1 && days % 100 !== 11) return 'день';
    if (days % 10 >= 2 && days % 10 <= 4 && (days % 100 < 10 || days % 100 >= 20)) return 'дня';
    return 'дней';
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
        url: 'https://api.coingecko.com/api/v3/simple/price?ids=hamster&vs_currencies=usd&include_24hr_change=true',
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
            trackEvent('chart_period_change', { period });
        });
    });
}

async function setupPriceData() {
    const success = await fetchRealPriceData();
    if (success) {
        updateChartForPeriod('1D');
        
        // Обновляем данные каждые 30 секунд
        priceUpdateInterval = setInterval(fetchRealPriceData, 30000);
    }
}

async function fetchRealPriceData() {
    showLoading(true);
    
    try {
        // Check cache first
        const cached = cache.get('hmstr_price');
        if (cached) {
            console.log('✅ Using cached price data');
            updatePriceDisplay(cached.current, cached.change24h);
            currentPriceData = cached;
            showChartError(false);
            showLoading(false);
            return true;
        }
        
        // Пробуем все источники по очереди
        for (let source of API_SOURCES) {
            try {
                const priceData = await fetchFromSource(source);
                if (priceData && priceData.current) {
                    console.log(`✅ Данные получены из ${source.name}:`, priceData);
                    updatePriceDisplay(priceData.current, priceData.change24h);
                    currentPriceData = priceData;
                    
                    // Cache the data
                    cache.set('hmstr_price', priceData);
                    
                    showChartError(false);
                    showLoading(false);
                    trackEvent('price_update_success', { source: source.name });
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
        trackEvent('price_update_failed', { error: error.message });
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
    if (data.hamster) {
        return {
            current: data.hamster.usd,
            change24h: data.hamster.usd_24h_change,
            source: 'CoinGecko'
        };
    }
    throw new Error('No hamster data');
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
        loadingElement.innerHTML = '<span style="color: var(--text-secondary);">📡 Используются кэшированные данные • Обновление через 30 сек</span>';
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
                trackEvent('guide_opened');
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
    
    const savedTheme = localStorage.getItem('theme') || 'dark'; // Dark theme by default
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        trackEvent('theme_switch', { theme: newTheme });
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

// Новые функции

// Загрузка новостей
async function loadNews() {
    const newsContainer = document.getElementById('news-container');
    const newsLoading = document.getElementById('news-loading');
    
    newsLoading.classList.remove('hidden');
    
    try {
        // Fallback news data
        const fallbackNews = [
            {
                title: "Добро пожаловать в Hamster Verse!",
                description: "Все игры Hamster Kombat теперь в одном приложении. Следите за ценами HMSTR и открывайте новые игры!",
                date: new Date().toLocaleDateString('ru-RU')
            },
            {
                title: "Новые игры скоро!",
                description: "Команда Hamster Kombat готовит сюрпризы. Следите за обновлениями!",
                date: new Date(Date.now() - 86400000).toLocaleDateString('ru-RU')
            },
            {
                title: "Обновление токеномики HMSTR",
                description: "Узнайте о последних изменениях в экономике токена HMSTR.",
                date: new Date(Date.now() - 172800000).toLocaleDateString('ru-RU')
            }
        ];
        
        displayNews(fallbackNews);
        trackEvent('news_loaded', { count: fallbackNews.length });
        
    } catch (error) {
        console.error('Error loading news:', error);
        newsContainer.innerHTML = '<div class="news-card"><p>Новости временно недоступны</p></div>';
    } finally {
        newsLoading.classList.add('hidden');
    }
}

function displayNews(news) {
    const newsContainer = document.getElementById('news-container');
    newsContainer.innerHTML = '';
    
    news.forEach(item => {
        const newsCard = document.createElement('div');
        newsCard.className = 'news-card';
        newsCard.innerHTML = `
            <div class="news-title">${item.title}</div>
            <div class="news-description">${item.description}</div>
            <div class="news-date">${item.date}</div>
        `;
        newsContainer.appendChild(newsCard);
    });
}

// Счетчик онлайн
function setupOnlineCounter() {
    const counter = document.getElementById('online-counter');
    
    // Initial random value
    const baseUsers = 1200;
    const random = Math.floor(Math.random() * 300);
    counter.textContent = `👥 ${(baseUsers + random).toLocaleString()} игроков онлайн`;
    
    // Update every 30 seconds
    setInterval(() => {
        const baseUsers = 1200;
        const random = Math.floor(Math.random() * 300);
        counter.textContent = `👥 ${(baseUsers + random).toLocaleString()} игроков онлайн`;
    }, 30000);
}

// Функция поделиться
function setupShareFunctionality() {
    const shareBtn = document.getElementById('share-btn');
    const profileShare = document.getElementById('profile-share');
    
    const shareHandler = async () => {
        const shareData = {
            title: 'Hamster Verse',
            text: 'Все игры Hamster Kombat в одном приложении! Следи за ценой HMSTR и открывай новые игры 🐹',
            url: window.location.href
        };
        
        try {
            if (navigator.share) {
                await navigator.share(shareData);
                trackEvent('share_success');
            } else {
                // Fallback - copy to clipboard
                await navigator.clipboard.writeText(shareData.text + ' ' + shareData.url);
                alert('Ссылка скопирована в буфер обмена!');
                trackEvent('share_fallback');
            }
        } catch (err) {
            console.log('Ошибка sharing:', err);
            trackEvent('share_error', { error: err.message });
        }
    };
    
    if (shareBtn) shareBtn.addEventListener('click', shareHandler);
    if (profileShare) profileShare.addEventListener('click', shareHandler);
}

// Статистика игр
function setupGameStatistics() {
    updateGameStatsUI();
}

// Ежедневный бонус
function setupDailyBonus() {
    const bonusElement = document.getElementById('daily-bonus');
    const claimButton = document.getElementById('claim-bonus');
    
    // Check if bonus was already claimed today
    const lastClaim = localStorage.getItem('last_bonus_claim');
    const today = new Date().toDateString();
    
    if (lastClaim !== today) {
        bonusElement.classList.remove('hidden');
    }
    
    claimButton.addEventListener('click', () => {
        // Mark as claimed
        localStorage.setItem('last_bonus_claim', today);
        
        // Add to streak
        const streak = parseInt(localStorage.getItem('bonus_streak') || '0') + 1;
        localStorage.setItem('bonus_streak', streak.toString());
        
        // Hide bonus
        bonusElement.classList.add('hidden');
        
        // Show confetti
        createConfetti();
        
        // Update streak display
        document.getElementById('streak-days').textContent = streak;
        
        trackEvent('daily_bonus_claimed', { streak });
        
        alert(`🎉 Бонус получен! Ваша серия: ${streak} дней`);
    });
}

// Реферальная система
function setupReferralSystem() {
    const inviteButton = document.getElementById('invite-friends');
    const referralCount = document.getElementById('referral-count');
    
    // Load referral count
    const count = parseInt(localStorage.getItem('referral_count') || '0');
    referralCount.textContent = count;
    
    inviteButton.addEventListener('click', () => {
        const referralLink = `${window.location.origin}${window.location.pathname}?ref=${Date.now()}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Присоединяйся к Hamster Verse!',
                text: 'Все игры Hamster Kombat в одном приложении 🐹',
                url: referralLink
            }).then(() => {
                // Increment referral count
                const newCount = count + 1;
                localStorage.setItem('referral_count', newCount.toString());
                referralCount.textContent = newCount;
                trackEvent('referral_invite_sent');
            });
        } else {
            // Fallback
            navigator.clipboard.writeText(referralLink).then(() => {
                alert('Реферальная ссылка скопирована!');
                const newCount = count + 1;
                localStorage.setItem('referral_count', newCount.toString());
                referralCount.textContent = newCount;
                trackEvent('referral_invite_copied');
            });
        }
    });
}

// Достижения
function setupAchievements() {
    checkAchievements();
}

function checkAchievements() {
    const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
    const totalPlays = Object.values(stats).reduce((sum, count) => sum + count, 0);
    
    // Unlock achievements based on progress
    if (totalPlays >= 1) {
        unlockAchievement('first_game');
    }
    if (totalPlays >= 10) {
        unlockAchievement('strategist');
    }
    if (totalPlays >= 50) {
        unlockAchievement('legend');
    }
}

function unlockAchievement(achievementId) {
    const unlocked = JSON.parse(localStorage.getItem('achievements') || '{}');
    
    if (!unlocked[achievementId]) {
        unlocked[achievementId] = true;
        localStorage.setItem('achievements', JSON.stringify(unlocked));
        
        // Visual feedback
        createConfetti();
        trackEvent('achievement_unlocked', { achievement: achievementId });
        
        // Show notification
        setTimeout(() => {
            alert('🏆 Достижение разблокировано!');
        }, 500);
    }
}

// Confetti effect
function createConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#ff6b35', '#f7931a', '#00c851', '#667eea', '#764ba2'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
        container.appendChild(confetti);
        
        // Animation
        const animation = confetti.animate([
            { 
                top: '-10px', 
                opacity: 1,
                transform: `rotate(${Math.random() * 360}deg)`
            },
            { 
                top: '100vh', 
                opacity: 0,
                transform: `rotate(${Math.random() * 720}deg)`
            }
        ], {
            duration: 3000 + Math.random() * 3000,
            easing: 'cubic-bezier(0.1, 0.8, 0.2, 1)'
        });
        
        animation.onfinish = () => confetti.remove();
    }
}

// Auto refresh
function setupAutoRefresh() {
    const refreshBtn = document.getElementById('refresh-btn');
    
    refreshBtn.addEventListener('click', () => {
        fetchRealPriceData();
        trackEvent('manual_refresh');
    });
    
    // Auto refresh every 5 minutes
    setInterval(() => {
        fetchRealPriceData();
        trackEvent('auto_refresh');
    }, 300000);
}

// Prevent image drag
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
});

// Очистка при закрытии
window.addEventListener('beforeunload', function() {
    if (priceUpdateInterval) {
        clearInterval(priceUpdateInterval);
    }
});
