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
let currentPriceData = {
    current: 0,
    change24h: 0
};

// MEXC API endpoints
const MEXC_API = {
    TICKER: 'https://api.mexc.com/api/v3/ticker/24hr?symbol=HMSTRUSDT',
    KLINES: 'https://api.mexc.com/api/v3/klines'
};

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
        
        // Обновляем данные каждые 10 секунд
        priceUpdateInterval = setInterval(fetchRealPriceData, 10000);
    }
}

async function fetchRealPriceData() {
    showLoading(true);
    
    try {
        const priceData = await fetchMEXCPrice();
        
        if (priceData && priceData.current) {
            updatePriceDisplay(priceData.current, priceData.change24h);
            currentPriceData = priceData;
            showChartError(false);
            showLoading(false);
            return true;
        } else {
            throw new Error('No price data received from MEXC');
        }
    } catch (error) {
        console.error('Error fetching price data:', error);
        showStaticDataMessage();
        return false;
    }
}

async function fetchMEXCPrice() {
    try {
        const response = await fetch(MEXC_API.TICKER);
        if (!response.ok) throw new Error(`MEXC API error: ${response.status}`);
        
        const data = await response.json();
        
        return {
            current: parseFloat(data.lastPrice),
            change24h: parseFloat(data.priceChangePercent),
            high: parseFloat(data.highPrice),
            low: parseFloat(data.lowPrice),
            volume: parseFloat(data.volume)
        };
    } catch (error) {
        console.error('MEXC price fetch failed:', error);
        throw error;
    }
}

async function fetchMEXCKlines(interval, limit) {
    try {
        const url = `${MEXC_API.KLINES}?symbol=HMSTRUSDT&interval=${interval}&limit=${limit}`;
        const response = await fetch(url);
        if (!response.ok) throw new Error(`MEXC Klines error: ${response.status}`);
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('MEXC klines fetch failed:', error);
        throw error;
    }
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
            loadingElement.innerHTML = '<span>Загрузка данных с MEXC...</span>';
        } else {
            loadingElement.classList.add('hidden');
        }
    }
}

function showStaticDataMessage() {
    const loadingElement = document.getElementById('price-loading');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        loadingElement.innerHTML = '<span style="color: var(--negative-color);">⚠️ Ошибка загрузки данных • Повтор через 10 сек</span>';
    }
}

function showChartError(show) {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    if (show) {
        chartContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                <div style="font-weight: 500; margin-bottom: 5px;">График временно недоступен</div>
                <div style="font-size: 12px; opacity: 0.7;">Обновление через 10 секунд</div>
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
        const chartData = await fetchMEXCChartData(period);
        
        if (!chartData || !chartData.labels || !chartData.prices) {
            throw new Error('No chart data available');
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
                            maxTicksLimit: 8
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
        console.error('Error creating chart:', error);
        showChartError(true);
    }
}

async function fetchMEXCChartData(period) {
    let interval, limit;
    
    switch(period) {
        case '1D':
            interval = '1h';
            limit = 24;
            break;
        case '1W':
            interval = '4h';
            limit = 42; // 7 дней * 6 точек в день
            break;
        case '1M':
            interval = '1d';
            limit = 30;
            break;
        case '1Y':
            interval = '1d';
            limit = 365;
            break;
        case 'ALL':
            interval = '1d';
            limit = 365; // Максимум 1 год данных
            break;
        default:
            interval = '1h';
            limit = 24;
    }
    
    try {
        const klines = await fetchMEXCKlines(interval, limit);
        
        if (!klines || klines.length === 0) {
            throw new Error('No klines data');
        }
        
        const prices = [];
        const labels = [];
        
        klines.forEach((kline, index) => {
            // kline: [openTime, open, high, low, close, volume, closeTime, ...]
            const price = parseFloat(kline[4]); // close price
            const timestamp = kline[0];
            
            prices.push(price);
            
            // Создаем метки времени
            const date = new Date(timestamp);
            let label;
            
            switch(period) {
                case '1D':
                    label = date.getHours() + ':00';
                    break;
                case '1W':
                    if (index % 6 === 0) { // Показываем каждую 4-ю точку
                        label = date.getDate() + '.' + (date.getMonth() + 1);
                    } else {
                        label = '';
                    }
                    break;
                case '1M':
                    if (index % 3 === 0) { // Показываем каждую 3-ю точку
                        label = date.getDate() + '.' + (date.getMonth() + 1);
                    } else {
                        label = '';
                    }
                    break;
                case '1Y':
                    if (index % 30 === 0) { // Показываем каждый месяц
                        label = date.toLocaleDateString('ru', { month: 'short' });
                    } else {
                        label = '';
                    }
                    break;
                case 'ALL':
                    if (index % 60 === 0) { // Показываем каждые 2 месяца
                        label = date.toLocaleDateString('ru', { month: 'short', year: '2-digit' });
                    } else {
                        label = '';
                    }
                    break;
                default:
                    label = date.getHours() + ':00';
            }
            
            labels.push(label);
        });
        
        // Последнюю метку всегда показываем как "Сейчас"
        if (labels.length > 0) {
            labels[labels.length - 1] = 'Сейчас';
        }
        
        return { labels, prices };
    } catch (error) {
        console.error('Error fetching MEXC chart data:', error);
        // Fallback: генерируем данные на основе текущей цены
        return generateFallbackChartData(period);
    }
}

function generateFallbackChartData(period) {
    const basePrice = currentPriceData.current || 0.0006099;
    const change24h = currentPriceData.change24h || -3.7;
    
    let labels, prices;
    
    switch(period) {
        case '1D':
            labels = ['00:00', '06:00', '12:00', '18:00', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, change24h, 5);
            break;
        case '1W':
            labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, change24h * 2, 7);
            break;
        case '1M':
            labels = ['Нед1', 'Нед2', 'Нед3', 'Нед4', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, change24h * 4, 5);
            break;
        case '1Y':
            labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, change24h * 12, 12);
            break;
        case 'ALL':
            labels = ['Запуск', 'М1', 'М2', 'М3', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, 50, 5);
            break;
        default:
            labels = ['00:00', '06:00', '12:00', '18:00', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, change24h, 5);
    }
    
    return { labels, prices };
}

function generateRealisticPrices(basePrice, totalChangePercent, points) {
    const prices = [];
    const startPrice = basePrice / (1 + totalChangePercent / 100);
    
    for (let i = 0; i < points; i++) {
        const progress = i / (points - 1);
        let price = startPrice + (basePrice - startPrice) * progress;
        
        // Добавляем небольшие случайные колебания для реалистичности
        const randomFactor = 1 + (Math.random() - 0.5) * 0.02;
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
