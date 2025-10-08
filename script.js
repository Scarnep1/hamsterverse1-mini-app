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
    current: 0.0006099,
    change24h: -3.7
};

// Основные адреса пар HMSTR для получения данных
const HMSTR_PAIRS = [
    'ton/hmstr_usdt', // Основная пара на TON
    'bsc/0x96371b5905d34e465beacdcf679dcaf235e0ea19', // Резервный адрес
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
    await fetchRealPriceData();
    updateChartForPeriod('1D');
    
    // Обновляем данные каждые 30 секунд
    priceUpdateInterval = setInterval(fetchRealPriceData, 30000);
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
            return true;
        } else {
            throw new Error('No price data received');
        }
    } catch (error) {
        console.error('Error fetching price data:', error);
        showStaticDataMessage();
        return false;
    }
}

async function fetchHMSTRPrice() {
    // Пробуем разные методы получения данных
    const methods = [
        fetchDexScreenerData,
        fetchGeckoterminalData,
        fetchCoinGeckoData
    ];
    
    for (let method of methods) {
        try {
            const data = await method();
            if (data && data.current) {
                console.log(`Price data from ${method.name}:`, data);
                return data;
            }
        } catch (error) {
            console.log(`${method.name} failed:`, error);
            continue;
        }
    }
    
    return null;
}

async function fetchDexScreenerData() {
    try {
        // Пробуем найти HMSTR через поиск
        const searchResponse = await fetch('https://api.dexscreener.com/latest/dex/search?q=HMSTR');
        if (!searchResponse.ok) throw new Error('Search failed');
        
        const searchData = await searchResponse.json();
        
        if (searchData.pairs && searchData.pairs.length > 0) {
            // Ищем пару с наибольшей ликвидностью
            const hmstrPairs = searchData.pairs.filter(pair => 
                pair.baseToken && 
                pair.baseToken.symbol.toUpperCase() === 'HMSTR'
            );
            
            if (hmstrPairs.length > 0) {
                // Сортируем по ликвидности и берем самую ликвидную пару
                hmstrPairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
                const bestPair = hmstrPairs[0];
                
                return {
                    current: parseFloat(bestPair.priceUsd),
                    change24h: parseFloat(bestPair.priceChange?.h24 || 0),
                    pairAddress: bestPair.pairAddress,
                    dexId: bestPair.dexId
                };
            }
        }
        
        throw new Error('No HMSTR pairs found');
    } catch (error) {
        throw error;
    }
}

async function fetchGeckoterminalData() {
    try {
        const response = await fetch('https://api.geckoterminal.com/api/v2/networks/ton/tokens/EQBg3_S0EgK5r1dVIbYBMsdYv7uKxWJbB4e1jR8Zzq1dF_BR/pools?page=1');
        if (!response.ok) throw new Error('Geckoterminal API failed');
        
        const data = await response.json();
        
        if (data.data && data.data.length > 0) {
            const pool = data.data[0];
            const attributes = pool.attributes;
            
            return {
                current: parseFloat(attributes.base_token_price_usd),
                change24h: parseFloat(attributes.price_change_percentage?.h24 || 0)
            };
        }
        
        throw new Error('No pool data');
    } catch (error) {
        throw error;
    }
}

async function fetchCoinGeckoData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hamster-combat&vs_currencies=usd&include_24hr_change=true');
        if (!response.ok) throw new Error('CoinGecko API failed');
        
        const data = await response.json();
        
        if (data['hamster-combat']) {
            return {
                current: data['hamster-combat'].usd,
                change24h: data['hamster-combat'].usd_24h_change
            };
        }
        
        throw new Error('No CoinGecko data');
    } catch (error) {
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
            loadingElement.innerHTML = '<span>Загрузка реальных данных HMSTR...</span>';
        } else {
            loadingElement.classList.add('hidden');
        }
    }
}

function showStaticDataMessage() {
    const loadingElement = document.getElementById('price-loading');
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        loadingElement.innerHTML = '<span style="color: var(--text-secondary);">⚠️ Данные временно недоступны • Обновление через 30 сек</span>';
    }
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
        const chartData = await fetchChartData(period);
        
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
        
        showChartError(false);
    } catch (error) {
        console.error('Error creating chart:', error);
        showChartError(true);
    }
}

async function fetchChartData(period) {
    // Для демонстрации создаем реалистичные данные на основе текущей цены
    // В реальном приложении здесь должен быть API запрос
    const basePrice = currentPriceData.current;
    const change24h = currentPriceData.change24h;
    
    let labels, prices;
    
    switch(period) {
        case '1D':
            // 24 точки за последние 24 часа
            labels = generateTimeLabels(24, 'hour');
            prices = generateRealisticPrices(basePrice, change24h, 24);
            break;
        case '1W':
            // 7 точек за последние 7 дней
            labels = generateTimeLabels(7, 'day');
            prices = generateRealisticPrices(basePrice, change24h * 7, 7);
            break;
        case '1M':
            // 30 точек за последние 30 дней
            labels = generateTimeLabels(30, 'day');
            prices = generateRealisticPrices(basePrice, change24h * 30, 30);
            break;
        case '1Y':
            // 12 точек за последние 12 месяцев
            labels = generateTimeLabels(12, 'month');
            prices = generateRealisticPrices(basePrice, change24h * 365, 12);
            break;
        case 'ALL':
            // 6 точек с момента запуска
            labels = ['Запуск', 'М1', 'М2', 'М3', 'М4', 'Сейчас'];
            prices = generateRealisticPrices(basePrice, 150, 6); // +150% за все время
            break;
        default:
            labels = generateTimeLabels(24, 'hour');
            prices = generateRealisticPrices(basePrice, change24h, 24);
    }
    
    return { labels, prices };
}

function generateTimeLabels(count, type) {
    const labels = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
        const date = new Date();
        
        if (type === 'hour') {
            date.setHours(now.getHours() - i);
            labels.push(date.getHours() + ':00');
        } else if (type === 'day') {
            date.setDate(now.getDate() - i);
            labels.push(date.getDate() + '.' + (date.getMonth() + 1));
        } else if (type === 'month') {
            date.setMonth(now.getMonth() - i);
            labels.push(date.toLocaleString('ru', { month: 'short' }));
        }
    }
    
    // Заменяем последнюю метку на "Сейчас"
    if (labels.length > 0) {
        labels[labels.length - 1] = 'Сейчас';
    }
    
    return labels;
}

function generateRealisticPrices(basePrice, totalChangePercent, points) {
    const prices = [];
    const startPrice = basePrice / (1 + totalChangePercent / 100);
    
    // Создаем реалистичное движение цены
    for (let i = 0; i < points; i++) {
        const progress = i / (points - 1);
        
        // Базовое линейное изменение
        let price = startPrice + (basePrice - startPrice) * progress;
        
        // Добавляем случайные колебания для реалистичности
        const volatility = 0.02; // 2% волатильность
        const randomFactor = 1 + (Math.random() - 0.5) * volatility * 2;
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
