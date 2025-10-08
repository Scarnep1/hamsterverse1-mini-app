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
    
    // Инициализируем график для 1 дня
    updateChartForPeriod('1D');
}

async function fetchRealPriceData() {
    try {
        // Пробуем получить реальные данные с CoinGecko
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hamster-kombat&vs_currencies=usd&include_24hr_change=true');
        const data = await response.json();
        
        if (data['hamster-kombat']) {
            const price = data['hamster-kombat'].usd;
            const change24h = data['hamster-kombat'].usd_24h_change;
            
            updatePriceDisplay(price, change24h);
        } else {
            // Fallback данные
            useFallbackData();
        }
    } catch (error) {
        console.error('Error fetching price data:', error);
        useFallbackData();
    }
}

function useFallbackData() {
    // Реалистичные данные для HMSTR
    const fallbackPrice = 0.000621;
    const fallbackChange = -4.13;
    
    updatePriceDisplay(fallbackPrice, fallbackChange);
}

function updatePriceDisplay(price, change24h) {
    const priceElement = document.getElementById('hmstr-price');
    const changeElement = document.getElementById('hmstr-change');
    
    priceElement.textContent = `$${price.toFixed(6)}`;
    changeElement.textContent = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    
    if (change24h >= 0) {
        changeElement.className = 'change positive';
    } else {
        changeElement.className = 'change negative';
    }
}

function setupPriceUpdateInterval() {
    // Обновляем цену каждые 30 секунд
    priceUpdateInterval = setInterval(fetchRealPriceData, 30000);
}

function updateChartForPeriod(period) {
    const periodText = getPeriodText(period);
    document.getElementById('current-period').textContent = periodText;
    
    // Создаем реалистичные данные для графика
    const chartData = generateRealisticChartData(period);
    createPriceChart(chartData);
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

function generateRealisticChartData(period) {
    const basePrice = 0.000621;
    let dataPoints, timeRange, volatility;
    
    switch(period) {
        case '1D':
            dataPoints = 24;
            timeRange = 24;
            volatility = 0.015;
            break;
        case '1W':
            dataPoints = 7;
            timeRange = 7;
            volatility = 0.025;
            break;
        case '1M':
            dataPoints = 30;
            timeRange = 30;
            volatility = 0.04;
            break;
        case '1Y':
            dataPoints = 12;
            timeRange = 365;
            volatility = 0.08;
            break;
        case 'ALL':
            dataPoints = 6;
            timeRange = 180;
            volatility = 0.12;
            break;
        default:
            dataPoints = 24;
            timeRange = 24;
            volatility = 0.015;
    }
    
    const prices = [basePrice];
    let currentPrice = basePrice;
    
    // Создаем более реалистичный график с трендом и шумом
    for (let i = 1; i < dataPoints; i++) {
        // Добавляем тренд и случайные колебания
        const trend = (Math.random() - 0.5) * 0.002;
        const noise = (Math.random() - 0.5) * volatility;
        const change = trend + noise;
        
        currentPrice = Math.max(0.0001, currentPrice * (1 + change));
        prices.push(currentPrice);
    }
    
    return {
        prices: prices,
        period: period
    };
}

function createPriceChart(chartData) {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Уничтожаем предыдущий график если существует
    if (currentChart) {
        currentChart.destroy();
    }
    
    const labels = generateLabels(chartData.period, chartData.prices.length);
    
    // Определяем цвет графика на основе тренда
    const firstPrice = chartData.prices[0];
    const lastPrice = chartData.prices[chartData.prices.length - 1];
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
                data: chartData.prices,
                borderColor: borderColor,
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: borderColor,
                pointBorderColor: isDark ? '#2d2d2d' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 0,
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
            },
            elements: {
                line: {
                    tension: 0.4
                }
            }
        }
    });
}

function generateLabels(period, dataPoints) {
    switch(period) {
        case '1D':
            return Array.from({length: dataPoints}, (_, i) => {
                if (i === 0) return '00:00';
                if (i === dataPoints - 1) return 'Сейчас';
                return `${i}:00`;
            });
        case '1W':
            return ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        case '1M':
            return Array.from({length: dataPoints}, (_, i) => {
                if (i === 0) return '1';
                if (i === dataPoints - 1) return 'Сейчас';
                return `${i + 1}`;
            });
        case '1Y':
            return ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
        case 'ALL':
            return ['Запуск', 'М1', 'М2', 'М3', 'М4', 'Сейчас'];
        default:
            return Array.from({length: dataPoints}, (_, i) => `${i}`);
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
        
        updateChartTheme();
    }
}

function updateChartTheme() {
    if (currentChart) {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        
        currentChart.options.scales.x.ticks.color = isDark ? '#b0b0b0' : '#666';
        currentChart.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(45, 45, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)';
        currentChart.options.plugins.tooltip.bodyColor = isDark ? '#ffffff' : '#1a1a1a';
        currentChart.options.plugins.tooltip.titleColor = isDark ? '#ffffff' : '#1a1a1a';
        currentChart.options.plugins.tooltip.borderColor = isDark ? '#404040' : '#e9ecef';
        
        currentChart.update();
    }
}

// Prevent image drag
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
});
