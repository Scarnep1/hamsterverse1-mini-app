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

// Система рейтинга и комментариев
const REVIEWS_CONFIG = {
    storageKey: 'game_reviews',
    maxCommentLength: 500
};

// Инициализация системы рейтинга
function setupRatingSystem() {
    loadRatingsForAllGames();
    setupStarsInteractions();
    setupCommentsSystem();
}

// Загрузка рейтингов для всех игр
function loadRatingsForAllGames() {
    const reviews = getReviewsData();
    
    document.querySelectorAll('.game-card').forEach(card => {
        const gameId = card.getAttribute('data-game-id');
        const gameReviews = reviews[gameId] || { ratings: [], comments: [] };
        
        updateRatingDisplay(gameId, gameReviews.ratings);
        updateCommentsDisplay(gameId, gameReviews.comments);
    });
}

// Взаимодействие со звездами
function setupStarsInteractions() {
    document.querySelectorAll('.stars').forEach(starsContainer => {
        const gameId = starsContainer.getAttribute('data-game-id');
        const stars = starsContainer.querySelectorAll('.star');
        
        stars.forEach(star => {
            // Ховер эффект
            star.addEventListener('mouseenter', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                highlightStars(starsContainer, rating);
            });
            
            star.addEventListener('mouseleave', function() {
                const reviews = getReviewsData();
                const gameReviews = reviews[gameId] || { ratings: [] };
                highlightStars(starsContainer, calculateAverageRating(gameReviews.ratings), true);
            });
            
            // Клик для оценки
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                rateGame(gameId, rating);
            });
        });
    });
}

// Подсветка звезд
function highlightStars(starsContainer, rating, isPermanent = false) {
    const stars = starsContainer.querySelectorAll('.star');
    const ratingValue = Math.round(rating);
    
    stars.forEach((star, index) => {
        const starRating = index + 1;
        
        if (isPermanent) {
            star.classList.toggle('rated', starRating <= ratingValue);
            star.classList.remove('active');
        } else {
            star.classList.toggle('active', starRating <= ratingValue);
        }
    });
}

// Оценка игры
function rateGame(gameId, rating) {
    const reviews = getReviewsData();
    if (!reviews[gameId]) {
        reviews[gameId] = { ratings: [], comments: [] };
    }
    
    // Добавляем оценку
    reviews[gameId].ratings.push({
        value: rating,
        timestamp: new Date().toISOString(),
        userId: getUserId()
    });
    
    // Сохраняем
    saveReviewsData(reviews);
    
    // Обновляем отображение
    updateRatingDisplay(gameId, reviews[gameId].ratings);
    
    // Анимация
    const clickedStar = document.querySelector(`.stars[data-game-id="${gameId}"] .star[data-rating="${rating}"]`);
    if (clickedStar) {
        clickedStar.classList.add('just-rated');
        setTimeout(() => clickedStar.classList.remove('just-rated'), 500);
    }
    
    // Уведомление
    showRatingNotification(rating);
}

// Система комментариев
function setupCommentsSystem() {
    // Кнопки показа/скрытия комментариев
    document.querySelectorAll('.comments-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const gameCard = this.closest('.game-card');
            const commentsSection = gameCard.querySelector('.game-comments');
            commentsSection.classList.toggle('hidden');
            
            if (!commentsSection.classList.contains('hidden')) {
                const gameId = gameCard.getAttribute('data-game-id');
                loadComments(gameId);
            }
        });
    });
    
    // Кнопки отправки комментариев
    document.querySelectorAll('.submit-comment').forEach(btn => {
        btn.addEventListener('click', function() {
            const gameCard = this.closest('.game-card');
            const gameId = gameCard.getAttribute('data-game-id');
            const textarea = gameCard.querySelector('.comment-textarea');
            const commentText = textarea.value.trim();
            
            if (commentText) {
                addComment(gameId, commentText);
                textarea.value = '';
            }
        });
    });
    
    // Enter для отправки комментария
    document.querySelectorAll('.comment-textarea').forEach(textarea => {
        textarea.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                const gameCard = this.closest('.game-card');
                const gameId = gameCard.getAttribute('data-game-id');
                const commentText = this.value.trim();
                
                if (commentText) {
                    addComment(gameId, commentText);
                    this.value = '';
                }
            }
        });
    });
}

// Добавление комментария
function addComment(gameId, text) {
    if (text.length > REVIEWS_CONFIG.maxCommentLength) {
        showTemporaryNotification(`Комментарий слишком длинный. Максимум ${REVIEWS_CONFIG.maxCommentLength} символов.`, 'error');
        return;
    }
    
    const reviews = getReviewsData();
    if (!reviews[gameId]) {
        reviews[gameId] = { ratings: [], comments: [] };
    }
    
    const user = getUserInfo();
    
    reviews[gameId].comments.unshift({
        id: generateCommentId(),
        text: text,
        author: user.name,
        authorAvatar: user.avatar,
        timestamp: new Date().toISOString(),
        userId: user.id
    });
    
    saveReviewsData(reviews);
    updateCommentsDisplay(gameId, reviews[gameId].comments);
    
    // Показываем уведомление
    showCommentNotification();
}

// Обновление отображения рейтинга
function updateRatingDisplay(gameId, ratings) {
    const gameCard = document.querySelector(`.game-card[data-game-id="${gameId}"]`);
    if (!gameCard) return;
    
    const averageRating = calculateAverageRating(ratings);
    const ratingCount = ratings.length;
    
    const averageElement = gameCard.querySelector('.average-rating');
    const countElement = gameCard.querySelector('.rating-count');
    const starsContainer = gameCard.querySelector('.stars');
    
    if (averageElement) averageElement.textContent = averageRating.toFixed(1);
    if (countElement) countElement.textContent = ratingCount;
    
    // Подсвечиваем звезды
    if (starsContainer) {
        highlightStars(starsContainer, averageRating, true);
    }
}

// Обновление отображения комментариев
function updateCommentsDisplay(gameId, comments) {
    const gameCard = document.querySelector(`.game-card[data-game-id="${gameId}"]`);
    if (!gameCard) return;
    
    const commentsList = gameCard.querySelector('.comments-list');
    const commentsCount = gameCard.querySelector('.comments-count');
    const commentsBtn = gameCard.querySelector('.comments-btn');
    
    // Обновляем счетчик
    if (commentsCount) {
        commentsCount.textContent = comments.length;
    }
    
    // Обновляем список комментариев
    if (commentsList) {
        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="no-comments">
                    <p>Пока нет комментариев</p>
                    <small>Будьте первым, кто оставит отзыв!</small>
                </div>
            `;
        } else {
            commentsList.innerHTML = comments.map(comment => `
                <div class="comment-item">
                    <div class="comment-header">
                        <div class="comment-author">
                            <span class="comment-author-avatar">${comment.author.charAt(0)}</span>
                            ${comment.author}
                        </div>
                        <span class="comment-date">${formatCommentDate(comment.timestamp)}</span>
                    </div>
                    <div class="comment-text">${escapeHtml(comment.text)}</div>
                </div>
            `).join('');
        }
    }
    
    // Анимация кнопки при новых комментариях
    if (commentsBtn && comments.length > 0) {
        commentsBtn.classList.add('has-comments');
    }
}

// Загрузка комментариев
function loadComments(gameId) {
    const reviews = getReviewsData();
    const gameReviews = reviews[gameId] || { comments: [] };
    updateCommentsDisplay(gameId, gameReviews.comments);
}

// Вспомогательные функции
function getReviewsData() {
    return JSON.parse(localStorage.getItem(REVIEWS_CONFIG.storageKey)) || {};
}

function saveReviewsData(data) {
    localStorage.setItem(REVIEWS_CONFIG.storageKey, JSON.stringify(data));
}

function calculateAverageRating(ratings) {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((total, rating) => total + rating.value, 0);
    return sum / ratings.length;
}

function getUserId() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user?.id) {
        return `tg_${window.Telegram.WebApp.initDataUnsafe.user.id}`;
    }
    return `anon_${Math.random().toString(36).substr(2, 9)}`;
}

function getUserInfo() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        return {
            id: user.id,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Аноним',
            avatar: user.photo_url || null
        };
    }
    
    return {
        id: getUserId(),
        name: 'Анонимный Хомяк',
        avatar: null
    };
}

function generateCommentId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatCommentDate(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return 'только что';
    } else if (diff < 3600000) {
        const minutes = Math.floor(diff / 60000);
        return `${minutes} мин. назад`;
    } else if (diff < 86400000) {
        const hours = Math.floor(diff / 3600000);
        return `${hours} ч. назад`;
    } else {
        return date.toLocaleDateString('ru-RU');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showRatingNotification(rating) {
    const messages = [
        `Вы поставили ${rating} ★! Спасибо!`,
        `Оценка ${rating} ★ сохранена!`,
        `Ваш голос: ${rating} ★ принят!`
    ];
    const message = messages[Math.floor(Math.random() * messages.length)];
    
    showTemporaryNotification(message, 'success');
}

function showCommentNotification() {
    showTemporaryNotification('Комментарий добавлен!', 'success');
}

function showTemporaryNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00c851' : '#ff4444'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-size: 14px;
        font-weight: 500;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Инициализируем систему рейтинга при загрузке
document.addEventListener('DOMContentLoaded', function() {
    // Обновите функцию initializeApp, добавив setupRatingSystem()
    setTimeout(() => {
        setupRatingSystem();
    }, 1000);
});
