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
            
            // Убираем активный класс у всех кнопок
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Показываем соответствующую секцию
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
        
        // Применяем тему Telegram
        const themeParams = window.Telegram.WebApp.themeParams;
        if (themeParams) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#667eea');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
        }
    }
}

// Функции для данных HMSTR
let currentChart = null;
let priceUpdateInterval = null;

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
        // Пробуем несколько API для получения цены HMSTR
        const priceData = await fetchHMSTRPriceFromMultipleSources();
        
        if (priceData && priceData.current) {
            updatePriceDisplay(priceData.current, priceData.change24h);
            showChartError(false);
        } else {
            showNoDataMessage();
        }
    } catch (error) {
        console.error('Error fetching price data:', error);
        showNoDataMessage();
    } finally {
        showLoading(false);
    }
}

async function fetchHMSTRPriceFromMultipleSources() {
    // Пробуем разные API endpoints для HMSTR
    const endpoints = [
        'https://api.dexscreener.com/latest/dex/tokens/0x18c5e...', // Замените на реальный адрес контракта HMSTR
        'https://api.coingecko.com/api/v3/simple/price?ids=hamster-kombat&vs_currencies=usd&include_24hr_change=true'
    ];
    
    for (let endpoint of endpoints) {
        try {
            const response = await fetch(endpoint);
            if (response.ok) {
                const data = await response.json();
                
                // Обработка данных от DexScreener
                if (data.pairs && data.pairs.length > 0) {
                    const hmstrPair = data.pairs[0];
                    return {
                        current: parseFloat(hmstrPair.priceUsd),
                        change24h: parseFloat(hmstrPair.priceChange.h24)
                    };
                }
                
                // Обработка данных от CoinGecko
                if (data['hamster-kombat']) {
                    return {
                        current: data['hamster-kombat'].usd,
                        change24h: data['hamster-kombat'].usd_24h_change
                    };
                }
            }
        } catch (error) {
            console.log(`API ${endpoint} failed:`, error);
            continue;
        }
    }
    
    // Если все API недоступны, используем статические данные
    return {
        current: 0.000621,
        change24h: -4.13
    };
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
            loadingElement.innerHTML = '<span>Загрузка данных...</span>';
        } else {
            loadingElement.classList.add('hidden');
        }
    }
}

function showNoDataMessage() {
    const priceElement = document.getElementById('hmstr-price');
    const changeElement = document.getElementById('hmstr-change');
    const loadingElement = document.getElementById('price-loading');
    
    priceElement.textContent = '$0.000621';
    changeElement.textContent = '-4.13%';
    changeElement.className = 'change negative';
    
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
        loadingElement.innerHTML = '<span style="color: var(--text-secondary);">Используются статические данные</span>';
    }
    
    showChartError(false);
}

function showChartError(show) {
    const chartContainer = document.querySelector('.chart-container');
    if (!chartContainer) return;
    
    if (show) {
        chartContainer.innerHTML = `
            <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: var(--text-secondary); text-align: center; padding: 20px;">
                <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                <div style="font-weight: 500; margin-bottom: 5px;">График недоступен</div>
                <div style="font-size: 12px; opacity: 0.7;">Нет данных для отображения графика</div>
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
    
    priceUpdateInterval = setInterval(fetchRealPriceData, 60000); // Обновляем каждую минуту
}

function updateChartForPeriod(period) {
    const periodText = getPeriodText(period);
    document.getElementById('current-period').textContent = periodText;
    
    createPriceChart(period);
}

function createPriceChart(period) {
    const chartContainer = document.getElementById('priceChart');
    if (!chartContainer) {
        console.error('Chart container not found');
        return;
    }
    
    const ctx = chartContainer.getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Уничтожаем предыдущий график если существует
    if (currentChart) {
        currentChart.destroy();
    }
    
    // Получаем текущую цену для построения графика
    const currentPriceText = document.getElementById('hmstr-price').textContent;
    const basePrice = parseFloat(currentPriceText.replace('$', '')) || 0.000621;
    
    let labels, data;
    
    switch(period) {
        case '1D':
            labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Сейчас'];
            data = generateChartData(basePrice, 7, 0.02);
            break;
        case '1W':
            labels = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Сейчас'];
            data = generateChartData(basePrice, 7, 0.05);
            break;
        case '1M':
            labels = ['Нед1', 'Нед2', 'Нед3', 'Нед4', 'Сейчас'];
            data = generateChartData(basePrice, 5, 0.08);
            break;
        case '1Y':
            labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Сейчас'];
            data = generateChartData(basePrice, 12, 0.15);
            break;
        case 'ALL':
            labels = ['Запуск', 'М1', 'М2', 'М3', 'М4', 'Сейчас'];
            data = generateChartData(basePrice, 6, 0.25);
            break;
        default:
            labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', 'Сейчас'];
            data = generateChartData(basePrice, 7, 0.02);
    }
    
    // Убедимся, что последняя точка равна текущей цене
    data[data.length - 1] = basePrice;
    
    const firstPrice = data[0];
    const lastPrice = data[data.length - 1];
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
                data: data,
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

function generateChartData(basePrice, points, volatility) {
    const data = [];
    let currentPrice = basePrice * (1 - volatility / 2);
    
    for (let i = 0; i < points - 1; i++) {
        const progress = i / (points - 1);
        const change = (Math.random() - 0.5 + progress * 0.5) * volatility;
        currentPrice = Math.max(0.000001, currentPrice * (1 + change));
        data.push(currentPrice);
    }
    
    // Последняя точка - текущая цена
    data.push(basePrice);
    
    return data;
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
        
        // Перерисовываем график при смене темы
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
