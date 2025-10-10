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

// API для курса USD/RUB
const RUB_API_SOURCES = [
    {
        name: 'Binance',
        url: 'https://api.binance.com/api/v3/ticker/price?symbol=USDTRUB',
        parser: parseBinanceRUB
    },
    {
        name: 'ExchangeRateAPI',
        url: 'https://api.exchangerate-api.com/v4/latest/USD',
        parser: parseExchangeRateAPI
    }
];

async function setupPriceData() {
    const success = await fetchRealPriceData();
    if (success) {
        // Обновляем данные каждые 30 секунд
        priceUpdateInterval = setInterval(fetchRealPriceData, 30000);
    }
}

async function fetchRealPriceData() {
    showLoading(true);
    
    try {
        // Получаем цену HMSTR в USD
        const hmstrPriceData = await fetchHMSTRPrice();
        if (!hmstrPriceData) {
            throw new Error('Не удалось получить цену HMSTR');
        }
        
        // Получаем курс USD/RUB
        const usdToRubRate = await fetchUSDtoRUBRate();
        if (!usdToRubRate) {
            throw new Error('Не удалось получить курс USD/RUB');
        }
        
        // Обновляем отображение цен
        updatePriceDisplay(hmstrPriceData.current, hmstrPriceData.change24h, usdToRubRate);
        
        // Сохраняем данные
        currentPriceData = {
            ...hmstrPriceData,
            usdToRubRate: usdToRubRate
        };
        
        showLoading(false);
        return true;
        
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        showStaticDataMessage();
        return false;
    }
}

async function fetchHMSTRPrice() {
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
        console.log(`✅ Данные HMSTR получены из ${successfulResult.source}:`, successfulResult);
        return successfulResult;
    }
    
    throw new Error('Все источники данных HMSTR недоступны');
}

async function fetchUSDtoRUBRate() {
    // Пробуем все источники для курса RUB
    const promises = RUB_API_SOURCES.map(source => 
        fetchFromSource(source).catch(e => {
            console.log(`❌ ${source.name} RUB failed:`, e.message);
            return null;
        })
    );
    
    const results = await Promise.all(promises);
    const successfulResult = results.find(result => result !== null);
    
    if (successfulResult) {
        console.log(`✅ Курс RUB получен из ${successfulResult.source}:`, successfulResult);
        return successfulResult.rate;
    }
    
    // Fallback курс, если API недоступны
    console.log('⚠️ Используется fallback курс USD/RUB');
    return 90.0;
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

function parseBinanceRUB(data) {
    if (data && data.price) {
        return {
            rate: parseFloat(data.price),
            source: 'Binance'
        };
    }
    throw new Error('No Binance RUB data');
}

function parseExchangeRateAPI(data) {
    if (data && data.rates && data.rates.RUB) {
        return {
            rate: parseFloat(data.rates.RUB),
            source: 'ExchangeRateAPI'
        };
    }
    throw new Error('No ExchangeRateAPI data');
}

function updatePriceDisplay(usdPrice, change24h, usdToRubRate) {
    // Рассчитываем цену в RUB
    const rubPrice = usdPrice * usdToRubRate;
    
    // Форматируем цены
    const formattedUsdPrice = formatPrice(usdPrice, 'USD');
    const formattedRubPrice = formatPrice(rubPrice, 'RUB');
    
    // Обновляем отображение USD
    const usdPriceElement = document.getElementById('hmstr-price-usd');
    const usdChangeElement = document.getElementById('hmstr-change-usd');
    
    usdPriceElement.textContent = formattedUsdPrice;
    usdChangeElement.textContent = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    usdChangeElement.className = change24h >= 0 ? 'change positive' : 'change negative';
    
    // Обновляем отображение RUB
    const rubPriceElement = document.getElementById('hmstr-price-rub');
    const rubChangeElement = document.getElementById('hmstr-change-rub');
    
    rubPriceElement.textContent = formattedRubPrice;
    rubChangeElement.textContent = `${change24h >= 0 ? '+' : ''}${change24h.toFixed(2)}%`;
    rubChangeElement.className = change24h >= 0 ? 'change positive' : 'change negative';
    
    // Обновляем дополнительную статистику
    updateTokenStats(usdPrice, usdToRubRate);
}

function formatPrice(price, currency) {
    if (currency === 'USD') {
        if (price >= 1) {
            return `$${price.toFixed(4)}`;
        } else if (price >= 0.001) {
            return `$${price.toFixed(6)}`;
        } else {
            return `$${price.toFixed(8)}`;
        }
    } else if (currency === 'RUB') {
        if (price >= 1) {
            return `${price.toFixed(2)} ₽`;
        } else if (price >= 0.01) {
            return `${price.toFixed(4)} ₽`;
        } else {
            return `${price.toFixed(6)} ₽`;
        }
    }
    return price.toString();
}

// Дополнительная статистика токена
function updateTokenStats(usdPrice, usdToRubRate) {
    // Симулируем объем и капитализацию
    const simulatedVolume = usdPrice * 1000000; // Примерный объем
    const simulatedMarketCap = usdPrice * 1000000000; // Примерная эмиссия
    
    const volumeElement = document.getElementById('volume-24h');
    const marketCapElement = document.getElementById('market-cap');
    
    if (volumeElement) {
        volumeElement.textContent = `$${formatNumber(simulatedVolume)}`;
    }
    
    if (marketCapElement) {
        marketCapElement.textContent = `$${formatNumber(simulatedMarketCap)}`;
    }
}

function showLoading(show) {
    const loadingElement = document.getElementById('price-loading');
    if (loadingElement) {
        if (show) {
            loadingElement.classList.remove('hidden');
            loadingElement.innerHTML = '<span>🔄 Обновление данных HMSTR...</span>';
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

// В начало файла script.js добавьте
function getAdminAnnouncements() {
    return JSON.parse(localStorage.getItem('admin_announcements') || '[]');
}

function getAdminNews() {
    return JSON.parse(localStorage.getItem('admin_news') || '[]');
}

function getAdminGames() {
    return JSON.parse(localStorage.getItem('admin_games') || '[]');
}

function getAdminTokenData() {
    return JSON.parse(localStorage.getItem('admin_token_data'));
}

// Обновите функцию setupNewsSection
async function setupNewsSection() {
    let news = getAdminNews();
    
    if (news.length === 0) {
        try {
            news = await fetchNews();
        } catch (error) {
            news = [];
        }
    }
    
    displayNews(news);
}

// Обновите функцию setupPriceData
async function setupPriceData() {
    const adminData = getAdminTokenData();
    
    if (adminData && adminData.usdPrice) {
        // Используем данные из админки
        updatePriceDisplay(adminData.usdPrice, adminData.change24h, adminData.usdToRubRate);
    } else {
        // Получаем данные с API
        const success = await fetchRealPriceData();
        if (success) {
            priceUpdateInterval = setInterval(fetchRealPriceData, 30000);
        }
    }
}
