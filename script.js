// Конфигурация приложения
const APP_CONFIG = {
    version: '3.0.0',
    lastUpdate: new Date().toISOString(),
    adminPassword: 'hamster2024',
    priceUpdateInterval: 120000, // 2 минуты
    newsUpdateInterval: 300000   // 5 минут
};

// Глобальные переменные
let currentPriceData = {
    usd: 0.000621,
    change: 2.34,
    marketCap: 12500000,
    volume24h: 1200000,
    lastUpdated: new Date().toISOString()
};

const ACHIEVEMENTS = {
    'first_game': { 
        name: 'Первая игра', 
        icon: '🎮', 
        description: 'Запустите первую игру',
        condition: (user) => user.gamesPlayed >= 1
    },
    'five_ratings': { 
        name: 'Критик', 
        icon: '⭐', 
        description: 'Оцените 5 игр',
        condition: (user) => user.ratingsGiven >= 5
    },
    'all_games': { 
        name: 'Исследователь', 
        icon: '🏆', 
        description: 'Попробуйте все игры',
        condition: (user) => user.uniqueGamesPlayed >= 4
    },
    'reviewer': { 
        name: 'Обозреватель', 
        icon: '📝', 
        description: 'Напишите первый отзыв',
        condition: (user) => user.reviewsWritten >= 1
    },
    'trader': { 
        name: 'Трейдер', 
        icon: '💰', 
        description: 'Проверьте курс 10 раз',
        condition: (user) => user.priceChecks >= 10
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    setupNavigation();
    setupPlayButtons();
    setupTelegramIntegration();
    await setupPriceData();
    setupGuideButton();
    setupThemeToggle();
    await setupNewsSection();
    setupRatingSystem();
    setupShareButton();
    setupAdminButton();
    setupAutoRefresh();
    setupErrorHandling();
    setupUserReviews();
    setupAchievements();
    setupAnalytics();
    
    console.log('Hamster Verse v' + APP_CONFIG.version + ' initialized');
}

// Навигация
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.content-section');
    
    navItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetSection = this.getAttribute('data-section');
            
            // Обновляем активные элементы
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем соответствующую секцию
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
            
            // Специальные действия при переключении секций
            if (targetSection === 'hmstr-section') {
                refreshPriceData();
                trackEvent('section_view', { section: 'hmstr' });
            } else if (targetSection === 'news-section') {
                loadNews();
                trackEvent('section_view', { section: 'news' });
            } else if (targetSection === 'games-section') {
                loadUserReviews();
                trackEvent('section_view', { section: 'games' });
            } else if (targetSection === 'profile-section') {
                updateUserStats();
                checkAchievements();
                trackEvent('section_view', { section: 'profile' });
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
            const gameCard = this.closest('.game-card');
            const gameId = gameCard.getAttribute('data-game-id');
            const gameName = gameCard.querySelector('h3').textContent;
            
            trackEvent('game_launch', { gameId, gameName, url });
            recordGamePlay(gameId);
            openGame(url);
        });
    });
    
    // Клик по карточке игры
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('star') && !e.target.closest('.stars') && !e.target.classList.contains('play-button')) {
                const playButton = this.querySelector('.play-button');
                const url = playButton.getAttribute('data-url');
                const gameId = this.getAttribute('data-game-id');
                const gameName = this.querySelector('h3').textContent;
                
                trackEvent('game_launch', { gameId, gameName, url });
                recordGamePlay(gameId);
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
        
        window.Telegram.WebApp.MainButton.setText('Открыть игры');
        window.Telegram.WebApp.MainButton.show();
        window.Telegram.WebApp.MainButton.onClick(function() {
            switchToSection('games-section');
        });
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

// Данные токена HMSTR
async function setupPriceData() {
    await loadPriceData();
    updatePriceDisplay();
}

async function loadPriceData() {
    const savedData = localStorage.getItem('hmstr_price_data');
    if (savedData) {
        currentPriceData = JSON.parse(savedData);
    } else {
        // Первоначальная загрузка реальных данных
        await fetchRealPriceData();
    }
}

async function fetchRealPriceData() {
    try {
        showPriceLoading(true);
        
        // Попробуем несколько источников данных
        const sources = [
            fetchCoinGeckoData(),
            fetchDexScreenerData()
        ];
        
        const results = await Promise.allSettled(sources);
        
        for (const result of results) {
            if (result.status === 'fulfilled' && result.value) {
                currentPriceData = { ...currentPriceData, ...result.value };
                break;
            }
        }
        
        currentPriceData.lastUpdated = new Date().toISOString();
        savePriceData();
        updatePriceDisplay();
        
    } catch (error) {
        console.log('Ошибка загрузки данных, используем локальные');
        useFallbackPriceData();
    } finally {
        showPriceLoading(false);
    }
}

async function fetchCoinGeckoData() {
    try {
        // Замените на реальный ID токена HMSTR в CoinGecko
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hamster&vs_currencies=usd&include_24hr_change=true&include_market_cap=true&include_24hr_vol=true');
        const data = await response.json();
        
        if (data.hamster) {
            return {
                usd: data.hamster.usd,
                change: data.hamster.usd_24h_change,
                marketCap: data.hamster.usd_market_cap,
                volume24h: data.hamster.usd_24h_vol
            };
        }
    } catch (error) {
        throw new Error('CoinGecko недоступен');
    }
}

async function fetchDexScreenerData() {
    try {
        const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=HMSTR');
        const data = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            return {
                usd: parseFloat(pair.priceUsd),
                change: parseFloat(pair.priceChange.h24),
                marketCap: pair.fdv,
                volume24h: pair.volume.h24
            };
        }
    } catch (error) {
        throw new Error('DexScreener недоступен');
    }
}

function useFallbackPriceData() {
    // Случайное изменение цены в пределах ±3%
    const randomChange = (Math.random() - 0.5) * 6;
    const changePercent = parseFloat(randomChange.toFixed(2));
    
    currentPriceData.usd = parseFloat((currentPriceData.usd * (1 + changePercent / 100)).toFixed(6));
    currentPriceData.change = changePercent;
    currentPriceData.lastUpdated = new Date().toISOString();
    
    savePriceData();
    updatePriceDisplay();
}

function savePriceData() {
    localStorage.setItem('hmstr_price_data', JSON.stringify(currentPriceData));
}

function updatePriceDisplay() {
    const usdPriceElement = document.getElementById('hmstr-price-usd');
    const usdChangeElement = document.getElementById('hmstr-change-usd');
    const marketCapElement = document.getElementById('market-cap');
    const volumeElement = document.getElementById('volume-24h');
    
    if (usdPriceElement) {
        usdPriceElement.textContent = `$${currentPriceData.usd.toFixed(6)}`;
    }
    
    if (usdChangeElement) {
        usdChangeElement.textContent = `${currentPriceData.change >= 0 ? '+' : ''}${currentPriceData.change.toFixed(2)}%`;
        usdChangeElement.className = `change ${currentPriceData.change >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (marketCapElement && currentPriceData.marketCap) {
        marketCapElement.textContent = `$${(currentPriceData.marketCap / 1000000).toFixed(1)}M`;
    }
    
    if (volumeElement && currentPriceData.volume24h) {
        volumeElement.textContent = `$${(currentPriceData.volume24h / 1000000).toFixed(1)}M`;
    }
}

async function refreshPriceData() {
    trackEvent('price_refresh');
    recordPriceCheck();
    await fetchRealPriceData();
    showNotification('Курс обновлен', 'success');
}

function showPriceLoading(show) {
    const loadingElement = document.getElementById('price-loading');
    if (loadingElement) {
        loadingElement.classList.toggle('hidden', !show);
    }
}

// Гайд покупки HMSTR
function setupGuideButton() {
    const guideButton = document.getElementById('show-guide');
    const buyGuide = document.getElementById('buy-guide');
    
    if (guideButton && buyGuide) {
        guideButton.addEventListener('click', function() {
            const isHidden = buyGuide.classList.contains('hidden');
            
            if (isHidden) {
                buyGuide.classList.remove('hidden');
                guideButton.textContent = '📖 Скрыть инструкцию';
            } else {
                buyGuide.classList.add('hidden');
                guideButton.textContent = '📖 Как купить HMSTR';
            }
        });
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

// Система рейтинга
function setupRatingSystem() {
    const starsContainers = document.querySelectorAll('.stars');
    
    starsContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');
        const gameId = container.getAttribute('data-game-id');
        
        loadRating(gameId, container);
        
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                rateGame(gameId, rating, container);
            });
            
            star.addEventListener('mouseover', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                highlightStars(stars, rating);
            });
            
            star.addEventListener('mouseout', function() {
                const savedRating = getSavedRating(gameId);
                highlightStars(stars, savedRating);
            });
        });
    });
}

function loadRating(gameId, container) {
    const savedRating = getSavedRating(gameId);
    const stars = container.querySelectorAll('.star');
    
    highlightStars(stars, savedRating);
    updateRatingText(gameId, savedRating);
}

function getSavedRating(gameId) {
    const ratings = JSON.parse(localStorage.getItem('game_ratings') || '{}');
    return ratings[gameId] || 0;
}

function saveRating(gameId, rating) {
    const ratings = JSON.parse(localStorage.getItem('game_ratings') || '{}');
    ratings[gameId] = rating;
    localStorage.setItem('game_ratings', JSON.stringify(ratings));
    
    // Обновляем статистику пользователя
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    userStats.ratingsGiven = (userStats.ratingsGiven || 0) + 1;
    localStorage.setItem('user_stats', JSON.stringify(userStats));
}

function rateGame(gameId, rating, container) {
    saveRating(gameId, rating);
    
    const stars = container.querySelectorAll('.star');
    highlightStars(stars, rating);
    updateRatingText(gameId, rating);
    
    const clickedStar = container.querySelector(`.star[data-rating="${rating}"]`);
    clickedStar.classList.add('just-rated');
    setTimeout(() => clickedStar.classList.remove('just-rated'), 500);
    
    showNotification(`Оценка ${rating} ⭐ сохранена!`, 'success');
    trackEvent('game_rated', { gameId, rating });
}

function highlightStars(stars, rating) {
    stars.forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        star.classList.toggle('active', starRating <= rating);
        star.classList.toggle('rated', starRating <= rating);
    });
}

function updateRatingText(gameId, rating) {
    const container = document.querySelector(`.stars[data-game-id="${gameId}"]`).closest('.game-rating');
    const averageElement = container.querySelector('.average-rating');
    const countElement = container.querySelector('.rating-count');
    
    if (averageElement && rating > 0) {
        // Обновляем средний рейтинг на основе всех оценок
        const allRatings = JSON.parse(localStorage.getItem('game_ratings') || '{}');
        const ratings = Object.values(allRatings).filter(r => r > 0);
        const average = ratings.length > 0 ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : '4.2';
        averageElement.textContent = average;
    }
    
    if (countElement && rating > 0) {
        const currentCount = parseInt(countElement.textContent) || 0;
        countElement.textContent = currentCount + 1;
    }
}

// Новости
async function setupNewsSection() {
    setupNewsFilters();
    await loadNews();
}

function setupNewsFilters() {
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            const filter = this.getAttribute('data-filter');
            
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            filterNews(filter);
        });
    });
}

async function loadNews() {
    const news = await getNewsData();
    displayNews(news);
}

async function getNewsData() {
    try {
        // Попробуем загрузить из внешнего источника
        const response = await fetch('https://api.jsonbin.io/v3/b/6581e6b2266cfc3fde6d3c1f/latest', {
            headers: {
                'X-Master-Key': '$2a$10$your-jsonbin-key-here'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return data.record.news || [];
        }
    } catch (error) {
        console.log('Используем локальные новости');
    }
    
    // Локальные новости
    const adminNews = JSON.parse(localStorage.getItem('admin_news') || '[]');
    if (adminNews.length > 0) {
        return adminNews.slice(0, 10);
    }
    
    return getDefaultNews();
}

function getDefaultNews() {
    return [
        {
            id: 1,
            date: new Date().toISOString(),
            title: "Запуск Hamster Verse 3.0",
            content: "Мы рады представить полностью обновленную платформу с автоматическими обновлениями и новыми функциями!",
            type: "updates",
            image: null
        },
        {
            id: 2,
            date: new Date(Date.now() - 86400000).toISOString(),
            title: "Новая система достижений",
            content: "Теперь вы можете получать достижения за активность в приложении. Откройте все!",
            type: "updates",
            image: null
        },
        {
            id: 3,
            date: new Date(Date.now() - 172800000).toISOString(),
            title: "Турнир Hamster King",
            content: "Примите участие в еженедельном турнире и выиграйте призы в токенах HMSTR!",
            type: "events",
            image: null
        }
    ];
}

function displayNews(news) {
    const newsContainer = document.getElementById('news-container');
    
    if (news.length === 0) {
        newsContainer.innerHTML = `
            <div class="news-item">
                <span class="news-date">Сегодня</span>
                <div class="news-title">Новости скоро появятся!</div>
                <div class="news-content">Следите за обновлениями, мы готовим для вас много интересного.</div>
            </div>
        `;
        return;
    }
    
    newsContainer.innerHTML = news.map(item => `
        <div class="news-item" data-type="${item.type || 'all'}">
            <span class="news-date">${formatDate(item.date)}</span>
            <div class="news-title">${item.title}</div>
            <div class="news-content">${item.content}</div>
            ${item.image ? `<img src="${item.image}" alt="News image" style="width: 100%; border-radius: 8px; margin-top: 10px;">` : ''}
        </div>
    `).join('');
}

function filterNews(filter) {
    const newsItems = document.querySelectorAll('.news-item');
    
    newsItems.forEach(item => {
        if (filter === 'all' || item.getAttribute('data-type') === filter) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Пользовательские отзывы
function setupUserReviews() {
    loadUserReviews();
}

function loadUserReviews() {
    const reviews = JSON.parse(localStorage.getItem('user_reviews') || '[]');
    const reviewsList = document.getElementById('reviews-list');
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="review-item">
                <div class="review-text">Пока нет отзывов. Будьте первым!</div>
            </div>
        `;
        return;
    }
    
    // Сортируем по дате (новые сначала)
    reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    reviewsList.innerHTML = reviews.slice(0, 10).map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="review-game">${getGameName(review.gameId)}</div>
                <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
            </div>
            <div class="review-text">${review.text}</div>
            <div class="review-meta">
                <span class="review-author">${review.author || 'Аноним'}</span>
                <span class="review-date">${formatDate(review.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

function getGameName(gameId) {
    const games = {
        '1': 'Hamster GameDev',
        '2': 'Hamster King',
        '3': 'Hamster Fight Club',
        '4': 'BitQuest'
    };
    return games[gameId] || 'Игра';
}

function showReviewModal() {
    const modal = document.getElementById('review-modal');
    modal.classList.remove('hidden');
    
    // Сброс формы
    document.getElementById('review-text').value = '';
    document.getElementById('review-chars').textContent = '0';
    
    // Настройка звезд
    const stars = document.querySelectorAll('#review-modal .star');
    stars.forEach(star => {
        star.classList.remove('active');
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            highlightReviewStars(rating);
        });
    });
    
    // Счетчик символов
    document.getElementById('review-text').addEventListener('input', function() {
        document.getElementById('review-chars').textContent = this.value.length;
    });
}

function closeReviewModal() {
    document.getElementById('review-modal').classList.add('hidden');
}

function highlightReviewStars(rating) {
    const stars = document.querySelectorAll('#review-modal .star');
    stars.forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        star.classList.toggle('active', starRating <= rating);
    });
}

function submitReview() {
    const gameId = document.getElementById('review-game-select').value;
    const text = document.getElementById('review-text').value.trim();
    const stars = document.querySelectorAll('#review-modal .star.active');
    const rating = stars.length;
    
    if (rating === 0) {
        showNotification('Пожалуйста, поставьте оценку', 'error');
        return;
    }
    
    if (text.length < 10) {
        showNotification('Отзыв должен содержать минимум 10 символов', 'error');
        return;
    }
    
    const reviews = JSON.parse(localStorage.getItem('user_reviews') || '[]');
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    
    reviews.push({
        gameId,
        rating,
        text,
        author: user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Аноним',
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous'
    });
    
    localStorage.setItem('user_reviews', JSON.stringify(reviews));
    
    // Обновляем статистику
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    userStats.reviewsWritten = (userStats.reviewsWritten || 0) + 1;
    localStorage.setItem('user_stats', JSON.stringify(userStats));
    
    closeReviewModal();
    loadUserReviews();
    showNotification('Отзыв опубликован!', 'success');
    trackEvent('review_submitted', { gameId, rating });
    
    // Проверяем достижения
    checkAchievements();
}

// Достижения
function setupAchievements() {
    loadAchievements();
}

function loadAchievements() {
    const container = document.getElementById('achievements-container');
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlocked_achievements') || '{}');
    
    container.innerHTML = Object.entries(ACHIEVEMENTS).map(([id, achievement]) => {
        const isUnlocked = unlockedAchievements[id] || achievement.condition(userStats);
        const unlockDate = unlockedAchievements[id];
        
        return `
            <div class="achievement-item ${isUnlocked ? 'unlocked' : 'locked'}" 
                 onclick="showAchievementInfo('${id}')">
                <span class="achievement-icon">${achievement.icon}</span>
                <div class="achievement-name">${achievement.name}</div>
                <div class="achievement-desc">${achievement.description}</div>
                ${unlockDate ? `<div class="achievement-date">${formatDate(unlockDate)}</div>` : ''}
            </div>
        `;
    }).join('');
}

function checkAchievements() {
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlocked_achievements') || {});
    let newAchievements = [];
    
    Object.entries(ACHIEVEMENTS).forEach(([id, achievement]) => {
        if (!unlockedAchievements[id] && achievement.condition(userStats)) {
            unlockedAchievements[id] = new Date().toISOString();
            newAchievements.push(achievement.name);
        }
    });
    
    if (newAchievements.length > 0) {
        localStorage.setItem('unlocked_achievements', JSON.stringify(unlockedAchievements));
        loadAchievements();
        
        newAchievements.forEach(achievementName => {
            showNotification(`🎉 Достижение разблокировано: ${achievementName}`, 'success');
        });
        
        trackEvent('achievement_unlocked', { achievements: newAchievements });
    }
}

function showAchievementInfo(achievementId) {
    const achievement = ACHIEVEMENTS[achievementId];
    const unlockedAchievements = JSON.parse(localStorage.getItem('unlocked_achievements') || {});
    const isUnlocked = unlockedAchievements[achievementId];
    
    if (isUnlocked) {
        showNotification(`${achievement.icon} ${achievement.name}: ${achievement.description}`, 'info');
    } else {
        showNotification(`🔒 ${achievement.name}: ${achievement.description}`, 'info');
    }
}

// Аналитика и статистика
function setupAnalytics() {
    // Инициализация базовой статистики
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    if (!userStats.firstVisit) {
        userStats.firstVisit = new Date().toISOString();
        userStats.gamesPlayed = 0;
        userStats.ratingsGiven = 0;
        userStats.reviewsWritten = 0;
        userStats.priceChecks = 0;
        userStats.uniqueGamesPlayed = [];
        localStorage.setItem('user_stats', JSON.stringify(userStats));
    }
}

function updateUserStats() {
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    
    document.getElementById('games-played').textContent = userStats.gamesPlayed || 0;
    document.getElementById('ratings-given').textContent = userStats.ratingsGiven || 0;
}

function recordGamePlay(gameId) {
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    userStats.gamesPlayed = (userStats.gamesPlayed || 0) + 1;
    
    if (!userStats.uniqueGamesPlayed) {
        userStats.uniqueGamesPlayed = [];
    }
    
    if (!userStats.uniqueGamesPlayed.includes(gameId)) {
        userStats.uniqueGamesPlayed.push(gameId);
    }
    
    localStorage.setItem('user_stats', JSON.stringify(userStats));
    updateUserStats();
}

function recordPriceCheck() {
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    userStats.priceChecks = (userStats.priceChecks || 0) + 1;
    localStorage.setItem('user_stats', JSON.stringify(userStats));
}

function showAnalytics() {
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    const analytics = JSON.parse(localStorage.getItem('analytics') || '[]');
    
    const statsElement = document.getElementById('analytics-stats');
    statsElement.innerHTML = `
        <div class="analytics-stat">
            <span class="analytics-label">🎮 Игр сыграно</span>
            <span class="analytics-value">${userStats.gamesPlayed || 0}</span>
        </div>
        <div class="analytics-stat">
            <span class="analytics-label">⭐ Оценок поставлено</span>
            <span class="analytics-value">${userStats.ratingsGiven || 0}</span>
        </div>
        <div class="analytics-stat">
            <span class="analytics-label">📝 Отзывов написано</span>
            <span class="analytics-value">${userStats.reviewsWritten || 0}</span>
        </div>
        <div class="analytics-stat">
            <span class="analytics-label">💰 Проверок курса</span>
            <span class="analytics-value">${userStats.priceChecks || 0}</span>
        </div>
        <div class="analytics-stat">
            <span class="analytics-label">📊 Уникальных игр</span>
            <span class="analytics-value">${userStats.uniqueGamesPlayed?.length || 0}/4</span>
        </div>
        <div class="analytics-stat">
            <span class="analytics-label">📅 Первый визит</span>
            <span class="analytics-value">${formatDate(userStats.firstVisit)}</span>
        </div>
    `;
    
    document.getElementById('analytics-modal').classList.remove('hidden');
}

function closeAnalyticsModal() {
    document.getElementById('analytics-modal').classList.add('hidden');
}

// Кнопка поделиться
function setupShareButton() {
    const shareButton = document.getElementById('share-button');
    
    if (shareButton) {
        shareButton.addEventListener('click', shareApp);
    }
}

function shareApp() {
    const shareText = "🎮 Открой для себя Hamster Verse - все лучшие игры в одном приложении! Присоединяйся сейчас!";
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
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Ссылка скопирована в буфер!', 'success');
        });
    }
    
    trackEvent('app_shared');
}

// Кнопка админ-панели
function setupAdminButton() {
    const adminContainer = document.getElementById('admin-button-container');
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    
    if (adminContainer) {
        adminContainer.style.display = isAdmin ? 'block' : 'none';
    }
    
    let keySequence = '';
    document.addEventListener('keydown', function(e) {
        keySequence += e.key;
        if (keySequence.length > 10) {
            keySequence = keySequence.slice(-10);
        }
        
        if (keySequence.includes('hamster2024')) {
            localStorage.setItem('is_admin', 'true');
            setupAdminButton();
            showNotification('Режим администратора активирован!', 'success');
            keySequence = '';
        }
    });
}

// Авто-обновление
function setupAutoRefresh() {
    setInterval(() => {
        if (document.querySelector('#hmstr-section.active')) {
            refreshPriceData();
        }
    }, APP_CONFIG.priceUpdateInterval);
    
    setInterval(() => {
        if (document.querySelector('#news-section.active')) {
            loadNews();
        }
    }, APP_CONFIG.newsUpdateInterval);
}

// Обработка ошибок
function setupErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e);
        trackEvent('error', { message: e.message, filename: e.filename });
    });
    
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e);
        trackEvent('promise_rejection', { reason: e.reason?.message });
    });
}

// Система трекинга
function trackEvent(eventName, data = {}) {
    const analytics = JSON.parse(localStorage.getItem('analytics') || '[]');
    
    analytics.push({
        event: eventName,
        data: data,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: window.Telegram?.WebApp?.platform || 'web'
    });
    
    if (analytics.length > 1000) {
        analytics.splice(0, analytics.length - 1000);
    }
    
    localStorage.setItem('analytics', JSON.stringify(analytics));
}

// Вспомогательные функции
function switchToSection(sectionId) {
    const navItem = document.querySelector(`.nav-item[data-section="${sectionId}"]`);
    if (navItem) {
        navItem.click();
    }
}

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
    updateUserStats();
    checkAchievements();
});

// Добавляем CSS для анимаций
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
    
    @keyframes starPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
    }
    
    .star.just-rated {
        animation: starPulse 0.5s ease;
    }
    
    .achievement-date {
        font-size: 8px;
        color: var(--text-muted);
        margin-top: 4px;
    }
`;
document.head.appendChild(style);
