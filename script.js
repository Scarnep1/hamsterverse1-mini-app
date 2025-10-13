// Конфигурация приложения
const APP_CONFIG = {
    version: '2.2.0',
    features: {
        ratings: true,
        news: true,
        priceUpdates: true
    }
};

// Система рейтингов
const RATINGS_SYSTEM = {
    storageKey: 'game_ratings_v2',
    maxRating: 5
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupPlayButtons();
    setupTelegramIntegration();
    setupPriceData();
    setupThemeToggle();
    setupNewsSection();
    setupRatingSystem();
    setupAutoRefresh();
    setupErrorHandling();
    
    console.log('Hamster Verse v' + APP_CONFIG.version + ' initialized');
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
            
            if (targetSection === 'hmstr-section') {
                refreshPriceData();
            }
        });
    });
}

// Кнопки запуска игр
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
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('star') && !e.target.closest('.stars-rating')) {
                const playButton = this.querySelector('.play-button');
                const url = playButton.getAttribute('data-url');
                openGame(url);
            }
        });
    });
}

function openGame(url) {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

// Интеграция с Telegram
function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            updateUserProfile(user);
        }
    } else {
        simulateUserProfile();
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
        const initial = user.first_name?.[0] || 'U';
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

function simulateUserProfile() {
    const names = ['Алексей', 'Мария', 'Дмитрий', 'Анна', 'Сергей'];
    const surnames = ['Иванов', 'Петрова', 'Сидоров', 'Кузнецова', 'Попов'];
    const usernames = ['alexey', 'maria', 'dmitry', 'anna', 'sergey'];
    
    const randomIndex = Math.floor(Math.random() * names.length);
    const name = names[randomIndex];
    const surname = surnames[randomIndex];
    const username = usernames[randomIndex];
    
    document.getElementById('tg-name').textContent = `${name} ${surname}`;
    document.getElementById('tg-username').textContent = `@${username}`;
}

// Система рейтингов
function setupRatingSystem() {
    initializeRatings();
    loadAllRatings();
    setupStarsInteractions();
}

function initializeRatings() {
    if (!localStorage.getItem(RATINGS_SYSTEM.storageKey)) {
        const initialRatings = {
            games: {
                '1': { total: 4.2, count: 128, ratings: [] },
                '2': { total: 4.5, count: 256, ratings: [] },
                '3': { total: 4.3, count: 189, ratings: [] },
                '4': { total: 4.7, count: 312, ratings: [] }
            },
            userRatings: {}
        };
        saveRatings(initialRatings);
    }
}

function loadAllRatings() {
    const ratings = getRatings();
    
    Object.keys(ratings.games).forEach(gameId => {
        updateRatingDisplay(gameId, ratings.games[gameId]);
    });
}

function setupStarsInteractions() {
    document.querySelectorAll('.stars-rating').forEach(ratingContainer => {
        const gameId = ratingContainer.getAttribute('data-game-id');
        const stars = ratingContainer.querySelectorAll('.star');
        const userId = getUserId();
        const ratings = getRatings();
        
        // Проверяем, оценивал ли уже пользователь эту игру
        const userRating = ratings.userRatings[userId]?.[gameId];
        
        if (userRating) {
            // Пользователь уже оценивал - блокируем и показываем его оценку
            highlightUserRating(stars, userRating);
            ratingContainer.classList.add('disabled');
        } else {
            // Пользователь еще не оценивал - настраиваем взаимодействие
            stars.forEach(star => {
                star.addEventListener('click', function() {
                    const rating = parseInt(this.getAttribute('data-rating'));
                    rateGame(gameId, rating);
                });
                
                star.addEventListener('mouseover', function() {
                    if (!ratingContainer.classList.contains('disabled')) {
                        const rating = parseInt(this.getAttribute('data-rating'));
                        highlightStars(stars, rating);
                    }
                });
                
                star.addEventListener('mouseout', function() {
                    if (!ratingContainer.classList.contains('disabled')) {
                        const userRating = ratings.userRatings[userId]?.[gameId];
                        if (userRating) {
                            highlightStars(stars, userRating);
                        } else {
                            resetStars(stars);
                        }
                    }
                });
            });
        }
    });
}

function rateGame(gameId, rating) {
    const userId = getUserId();
    const ratings = getRatings();
    
    // Проверяем, не оценивал ли уже пользователь эту игру
    if (ratings.userRatings[userId]?.[gameId]) {
        showNotification('Вы уже оценили эту игру!', 'info');
        return;
    }
    
    // Добавляем оценку пользователя
    if (!ratings.userRatings[userId]) {
        ratings.userRatings[userId] = {};
    }
    ratings.userRatings[userId][gameId] = rating;
    
    // Обновляем статистику игры
    if (!ratings.games[gameId]) {
        ratings.games[gameId] = { total: 0, count: 0, ratings: [] };
    }
    
    const game = ratings.games[gameId];
    game.ratings.push(rating);
    game.count = game.ratings.length;
    game.total = game.ratings.reduce((sum, r) => sum + r, 0) / game.count;
    
    // Сохраняем обновленные рейтинги
    saveRatings(ratings);
    
    // Обновляем отображение
    updateRatingDisplay(gameId, game);
    
    // Блокируем возможность повторной оценки
    const ratingContainer = document.querySelector(`.stars-rating[data-game-id="${gameId}"]`);
    const stars = ratingContainer.querySelectorAll('.star');
    highlightUserRating(stars, rating);
    ratingContainer.classList.add('disabled');
    
    // Анимация и уведомление
    const clickedStar = ratingContainer.querySelector(`.star[data-rating="${rating}"]`);
    clickedStar.classList.add('just-rated');
    setTimeout(() => clickedStar.classList.remove('just-rated'), 500);
    
    showNotification(`Спасибо за оценку ${rating} ⭐!`, 'success');
}

function updateRatingDisplay(gameId, gameData) {
    const gameCard = document.querySelector(`.game-card[data-game-id="${gameId}"]`);
    if (!gameCard) return;
    
    const averageElement = gameCard.querySelector('.average-rating');
    const countElement = gameCard.querySelector('.rating-count');
    const staticStars = gameCard.querySelectorAll('.stars-static .star');
    
    if (averageElement) {
        averageElement.textContent = gameData.total.toFixed(1);
    }
    
    if (countElement) {
        countElement.textContent = `(${gameData.count} оценок)`;
    }
    
    // Обновляем статические звезды
    const averageRating = Math.round(gameData.total * 2) / 2; // Округляем до 0.5
    highlightStaticStars(staticStars, averageRating);
}

function highlightStaticStars(stars, rating) {
    stars.forEach((star, index) => {
        const starNumber = index + 1;
        
        if (rating >= starNumber) {
            // Полная звезда
            star.classList.add('active');
        } else if (rating >= starNumber - 0.5) {
            // Половина звезды (можно добавить CSS для половинчатой звезды)
            star.classList.add('active');
        } else {
            // Пустая звезда
            star.classList.remove('active');
        }
    });
}

function highlightUserRating(stars, rating) {
    stars.forEach((star, index) => {
        const starNumber = index + 1;
        if (starNumber <= rating) {
            star.classList.add('active', 'rated');
        } else {
            star.classList.remove('active', 'rated');
        }
    });
}

function highlightStars(stars, rating) {
    stars.forEach((star, index) => {
        const starNumber = index + 1;
        if (starNumber <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function resetStars(stars) {
    stars.forEach(star => {
        star.classList.remove('active');
    });
}

function getUserId() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user?.id) {
        return `tg_${window.Telegram.WebApp.initDataUnsafe.user.id}`;
    }
    
    // Генерируем уникальный ID для анонимного пользователя
    let userId = localStorage.getItem('anonymous_user_id');
    if (!userId) {
        userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('anonymous_user_id', userId);
    }
    return userId;
}

function getRatings() {
    return JSON.parse(localStorage.getItem(RATINGS_SYSTEM.storageKey)) || { games: {}, userRatings: {} };
}

function saveRatings(ratings) {
    localStorage.setItem(RATINGS_SYSTEM.storageKey, JSON.stringify(ratings));
}

// Данные токена HMSTR
let currentPriceData = {
    usd: 0.000621,
    rub: 0.056,
    change: 2.34,
    lastUpdated: new Date().toISOString()
};

function setupPriceData() {
    loadPriceData();
    updatePriceDisplay();
}

function loadPriceData() {
    const savedData = localStorage.getItem('hmstr_price_data');
    if (savedData) {
        currentPriceData = JSON.parse(savedData);
    }
}

function savePriceData() {
    localStorage.setItem('hmstr_price_data', JSON.stringify(currentPriceData));
}

function updatePriceDisplay() {
    const usdPriceElement = document.getElementById('hmstr-price-usd');
    const usdChangeElement = document.getElementById('hmstr-change-usd');
    const rubPriceElement = document.getElementById('hmstr-price-rub');
    const rubChangeElement = document.getElementById('hmstr-change-rub');
    
    if (usdPriceElement) {
        usdPriceElement.textContent = `$${currentPriceData.usd.toFixed(6)}`;
    }
    
    if (usdChangeElement) {
        usdChangeElement.textContent = `${currentPriceData.change >= 0 ? '+' : ''}${currentPriceData.change.toFixed(2)}%`;
        usdChangeElement.className = `change ${currentPriceData.change >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (rubPriceElement) {
        rubPriceElement.textContent = `${currentPriceData.rub.toFixed(3)} ₽`;
    }
    
    if (rubChangeElement) {
        rubChangeElement.textContent = `${currentPriceData.change >= 0 ? '+' : ''}${currentPriceData.change.toFixed(2)}%`;
        rubChangeElement.className = `change ${currentPriceData.change >= 0 ? 'positive' : 'negative'}`;
    }
}

function refreshPriceData() {
    showPriceLoading(true);
    
    // Имитация обновления данных
    setTimeout(() => {
        const randomChange = (Math.random() - 0.5) * 10;
        const changePercent = parseFloat(randomChange.toFixed(2));
        
        currentPriceData.usd = parseFloat((currentPriceData.usd * (1 + changePercent / 100)).toFixed(6));
        currentPriceData.rub = parseFloat((currentPriceData.rub * (1 + changePercent / 100)).toFixed(3));
        currentPriceData.change = changePercent;
        currentPriceData.lastUpdated = new Date().toISOString();
        
        savePriceData();
        updatePriceDisplay();
        showPriceLoading(false);
        
        showNotification('Курс обновлен', 'success');
    }, 1500);
}

function showPriceLoading(show) {
    const loadingElement = document.getElementById('price-loading');
    if (loadingElement) {
        loadingElement.classList.toggle('hidden', !show);
    }
}

// Переключение темы
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

// Новости
function setupNewsSection() {
    loadNews();
}

function loadNews() {
    const newsContainer = document.getElementById('news-container');
    const news = getNewsData();
    
    if (news.length === 0) {
        newsContainer.innerHTML = `
            <div class="news-item">
                <span class="news-date">Сегодня</span>
                <div class="news-title">Добро пожаловать в Hamster Verse!</div>
                <div class="news-content">Теперь вы можете оценивать игры! Ваши оценки помогают другим игрокам выбирать лучшие игры.</div>
            </div>
        `;
        return;
    }
    
    newsContainer.innerHTML = news.map(item => `
        <div class="news-item">
            <span class="news-date">${formatDate(item.date)}</span>
            <div class="news-title">${item.title}</div>
            <div class="news-content">${item.content}</div>
        </div>
    `).join('');
}

function getNewsData() {
    return [
        {
            date: new Date().toISOString(),
            title: "Новая система рейтингов",
            content: "Теперь вы можете оценивать игры! Ваша оценка помогает сообществу выбирать лучшие игры."
        },
        {
            date: new Date(Date.now() - 86400000).toISOString(),
            title: "Hamster Verse обновлен",
            content: "Мы полностью обновили дизайн и добавили новые функции для вашего удобства!"
        }
    ];
}

// Авто-обновление
function setupAutoRefresh() {
    setInterval(() => {
        if (document.querySelector('#hmstr-section.active')) {
            refreshPriceData();
        }
    }, 120000);
}

// Обработка ошибок
function setupErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e);
    });
    
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e);
    });
}

// Вспомогательные функции
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return 'Только что';
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

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00c851' : type === 'error' ? '#ff4444' : '#667eea'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Закрытие анонса
function closeAnnouncement() {
    const banner = document.getElementById('announcement');
    if (banner) {
        banner.style.display = 'none';
        localStorage.setItem('announcement_closed', 'true');
    }
}

// Проверяем, был ли анонс закрыт ранее
function checkAnnouncementState() {
    const isClosed = localStorage.getItem('announcement_closed');
    if (isClosed === 'true') {
        const banner = document.getElementById('announcement');
        if (banner) {
            banner.style.display = 'none';
        }
    }
}

// Предотвращаем перетаскивание изображений
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
    
    checkAnnouncementState();
});

// Добавляем CSS для анимации уведомлений
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }
    
    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);
