// Конфигурация приложения
const APP_CONFIG = {
    version: '2.2.0',
    build: '2024.01.15',
    lastUpdate: new Date().toISOString(),
    adminPassword: 'hamster2024',
    autoRefresh: true,
    dataSources: {
        price: 'https://api.coingecko.com/api/v3/simple/price?ids=hamster&vs_currencies=usd&include_24hr_change=true',
        news: 'https://raw.githubusercontent.com/YOUR_USERNAME/hamster-verse-data/main/news.json'
    }
};

// Конфигурация для аналитики и обратной связи
const FEEDBACK_CONFIG = {
    botToken: '', // Добавьте токен бота для уведомлений
    chatId: '',   // Добавьте ваш chat_id
    enabled: false // Включите когда добавите токен
};

// Резервные данные
const BACKUP_DATA = {
    price: 0.000621,
    change: 2.34,
    news: [
        {
            id: 1,
            date: new Date().toISOString(),
            title: "Добро пожаловать в Hamster Verse!",
            content: "Запущена новая игровая платформа с лучшими играми от Hamster. Теперь все в одном месте!",
            important: true,
            type: "update"
        },
        {
            id: 2,
            date: new Date(Date.now() - 86400000).toISOString(),
            title: "Обновление рейтинговой системы",
            content: "Добавлена возможность оценивать игры и отслеживать статистику. Ваше мнение важно для нас!",
            important: false,
            type: "update"
        }
    ]
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('🚀 Hamster Verse v' + APP_CONFIG.version + ' initializing...');
    
    try {
        setupNavigation();
        setupPlayButtons();
        setupTelegramIntegration();
        setupPriceData();
        setupGuideButton();
        setupThemeToggle();
        setupNewsSection();
        setupRatingSystem();
        setupShareButton();
        setupFeedbackSystem();
        setupAdminButton();
        setupAutoRefresh();
        setupErrorHandling();
        setupDailyRewards();
        setupGameStatistics();
        setupNewsFilters();
        
        // Загрузка данных
        await loadInitialData();
        
        // Обновление информации о версии
        document.getElementById('app-version').textContent = APP_CONFIG.version;
        document.getElementById('app-build').textContent = APP_CONFIG.build;
        
        console.log('✅ Hamster Verse initialized successfully');
        
        // Отправка аналитики о запуске
        sendAnalytics('app_launched', { version: APP_CONFIG.version });
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        showNotification('Ошибка инициализации приложения', 'error');
    }
}

// Загрузка начальных данных
async function loadInitialData() {
    await Promise.all([
        fetchRealPriceData(),
        loadNewsFromGitHub()
    ]);
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
            } else if (targetSection === 'news-section') {
                loadNewsFromGitHub();
            } else if (targetSection === 'games-section') {
                updateGamesStats();
            } else if (targetSection === 'profile-section') {
                updateProfileStats();
            }
            
            // Аналитика переключения разделов
            sendAnalytics('section_switched', { section: targetSection });
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
    
    // Клик по карточке игры (кроме рейтинга)
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('star') && !e.target.closest('.stars')) {
                const playButton = this.querySelector('.play-button');
                const url = playButton.getAttribute('data-url');
                openGame(url);
            }
        });
    });
}

function openGame(url) {
    // Аналитика запуска игры
    const gameCard = event.target.closest('.game-card');
    const gameId = gameCard?.getAttribute('data-game-id');
    sendAnalytics('game_launched', { gameId, url });
    
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

// Интеграция с Telegram
function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        // Расширяем на весь экран
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            updateUserProfile(user);
        }
        
        // Настройка основной кнопки
        window.Telegram.WebApp.MainButton.setText('🎮 Открыть игры');
        window.Telegram.WebApp.MainButton.show();
        window.Telegram.WebApp.MainButton.onClick(function() {
            switchToSection('games-section');
        });
        
        // Настройка цветовой схемы Telegram
        if (window.Telegram.WebApp.colorScheme === 'dark') {
            setTheme('dark');
        }
        
    } else {
        // Заглушка для браузера
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
let currentPriceData = {
    usd: BACKUP_DATA.price,
    change: BACKUP_DATA.change,
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
    
    if (usdPriceElement) {
        usdPriceElement.textContent = `$${currentPriceData.usd.toFixed(6)}`;
    }
    
    if (usdChangeElement) {
        usdChangeElement.textContent = `${currentPriceData.change >= 0 ? '+' : ''}${currentPriceData.change.toFixed(2)}%`;
        usdChangeElement.className = `change ${currentPriceData.change >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Обновляем капитализацию и объем (примерные расчеты)
    const marketCapElement = document.getElementById('market-cap');
    const volumeElement = document.getElementById('volume-24h');
    
    if (marketCapElement) {
        const marketCap = (currentPriceData.usd * 20000000000).toFixed(1); // Примерный расчет
        marketCapElement.textContent = `$${marketCap}M`;
    }
    
    if (volumeElement) {
        const volume = (currentPriceData.usd * 2000000).toFixed(1); // Примерный расчет
        volumeElement.textContent = `$${volume}M`;
    }
}

async function fetchRealPriceData() {
    try {
        showPriceLoading(true);
        
        const response = await fetch(APP_CONFIG.dataSources.price);
        if (response.ok) {
            const data = await response.json();
            if (data.hamster) {
                currentPriceData.usd = data.hamster.usd;
                currentPriceData.change = data.hamster.usd_24h_change;
                currentPriceData.lastUpdated = new Date().toISOString();
                savePriceData();
                updatePriceDisplay();
                showPriceLoading(false);
                return;
            }
        }
    } catch (error) {
        console.log('Using backup price data');
    }
    
    // Fallback к локальным данным
    currentPriceData = {
        usd: BACKUP_DATA.price,
        change: BACKUP_DATA.change,
        lastUpdated: new Date().toISOString()
    };
    updatePriceDisplay();
    showPriceLoading(false);
}

function refreshPriceData() {
    fetchRealPriceData();
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
                sendAnalytics('guide_opened', { type: 'buy_guide' });
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
    
    // Загружаем сохраненную тему
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        sendAnalytics('theme_changed', { theme: newTheme });
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
        
        // Загружаем сохраненные рейтинги
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
}

function rateGame(gameId, rating, container) {
    saveRating(gameId, rating);
    
    const stars = container.querySelectorAll('.star');
    highlightStars(stars, rating);
    updateRatingText(gameId, rating);
    
    // Анимация
    const clickedStar = container.querySelector(`.star[data-rating="${rating}"]`);
    clickedStar.classList.add('just-rated');
    setTimeout(() => clickedStar.classList.remove('just-rated'), 500);
    
    // Аналитика
    sendAnalytics('game_rated', { gameId, rating });
    
    showNotification(`Оценка ${rating} ⭐ сохранена!`, 'success');
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
        // Обновляем средний рейтинг
        const currentRatings = JSON.parse(localStorage.getItem('game_ratings_stats') || '{}');
        currentRatings[gameId] = currentRatings[gameId] || { total: 0, count: 0 };
        currentRatings[gameId].total += rating;
        currentRatings[gameId].count += 1;
        
        const average = (currentRatings[gameId].total / currentRatings[gameId].count).toFixed(1);
        averageElement.textContent = average;
        
        localStorage.setItem('game_ratings_stats', JSON.stringify(currentRatings));
    }
    
    if (countElement && rating > 0) {
        const currentCount = parseInt(countElement.textContent) || 0;
        countElement.textContent = currentCount + 1;
    }
}

// Новости
function setupNewsSection() {
    setupNewsFilters();
}

function setupNewsFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    
    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            // Обновляем активную кнопку
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filter = this.getAttribute('data-filter');
            filterNews(filter);
        });
    });
}

async function loadNewsFromGitHub() {
    const newsContainer = document.getElementById('news-container');
    const loadingElement = document.getElementById('news-loading');
    
    if (loadingElement) {
        loadingElement.classList.remove('hidden');
    }
    
    try {
        const response = await fetch(APP_CONFIG.dataSources.news);
        if (response.ok) {
            const data = await response.json();
            const news = data.news || [];
            
            localStorage.setItem('cached_news', JSON.stringify(news));
            localStorage.setItem('news_last_update', new Date().toISOString());
            
            displayNews(news);
            
            if (loadingElement) {
                loadingElement.classList.add('hidden');
            }
            return;
        }
    } catch (error) {
        console.log('Using cached news from GitHub');
    }
    
    // Используем кешированные новости
    const cachedNews = localStorage.getItem('cached_news');
    if (cachedNews) {
        displayNews(JSON.parse(cachedNews));
    } else {
        displayNews(BACKUP_DATA.news);
    }
    
    if (loadingElement) {
        loadingElement.classList.add('hidden');
    }
}

function displayNews(news) {
    const newsContainer = document.getElementById('news-container');
    
    if (!news || news.length === 0) {
        newsContainer.innerHTML = `
            <div class="news-item">
                <span class="news-date">${new Date().toLocaleDateString('ru-RU')}</span>
                <div class="news-title">Новости пока отсутствуют</div>
                <div class="news-content">Следите за обновлениями, скоро здесь появятся свежие новости!</div>
            </div>
        `;
        return;
    }
    
    // Сортируем новости по дате (новые сначала)
    const sortedNews = news.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    newsContainer.innerHTML = sortedNews.map(item => `
        <div class="news-item ${item.important ? 'important' : ''}" data-type="${item.type || 'general'}">
            <span class="news-date">${formatDate(item.date)}</span>
            <div class="news-title">${item.title}</div>
            <div class="news-content">${item.content}</div>
            ${item.important ? '<div class="news-badge">Важно</div>' : ''}
        </div>
    `).join('');
}

function filterNews(filter) {
    const newsItems = document.querySelectorAll('.news-item');
    
    newsItems.forEach(item => {
        const type = item.getAttribute('data-type');
        
        switch (filter) {
            case 'all':
                item.style.display = 'block';
                break;
            case 'important':
                item.style.display = item.classList.contains('important') ? 'block' : 'none';
                break;
            case 'updates':
                item.style.display = type === 'update' ? 'block' : 'none';
                break;
            default:
                item.style.display = 'block';
        }
    });
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
    
    sendAnalytics('share_attempted', { platform: 'telegram' });
    
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
            showNotification('Ссылка скопирована в буфер!', 'success');
        }).catch(() => {
            showNotification('Скопируйте ссылку вручную: ' + shareUrl, 'info');
        });
    }
}

// Система обратной связи
function setupFeedbackSystem() {
    const feedbackButton = document.getElementById('feedback-button');
    
    if (feedbackButton) {
        feedbackButton.addEventListener('click', openFeedbackModal);
    }
}

function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.remove('hidden');
    sendAnalytics('feedback_opened', {});
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('hidden');
}

function sendFeedback() {
    const textarea = document.getElementById('feedback-text');
    const feedback = textarea.value.trim();
    
    if (!feedback) {
        showNotification('Пожалуйста, введите ваше сообщение', 'error');
        return;
    }
    
    // Сохраняем feedback локально
    const feedbacks = JSON.parse(localStorage.getItem('user_feedback') || '[]');
    feedbacks.push({
        text: feedback,
        date: new Date().toISOString(),
        user: document.getElementById('tg-name').textContent
    });
    
    localStorage.setItem('user_feedback', JSON.stringify(feedbacks));
    
    // Отправляем аналитику
    sendAnalytics('feedback_submitted', { length: feedback.length });
    
    // Пытаемся отправить в Telegram если настроено
    if (FEEDBACK_CONFIG.enabled && FEEDBACK_CONFIG.botToken && FEEDBACK_CONFIG.chatId) {
        sendFeedbackToTelegram(feedback);
    }
    
    showNotification('Спасибо за ваш отзыв!', 'success');
    closeFeedbackModal();
    textarea.value = '';
}

async function sendFeedbackToTelegram(feedback) {
    try {
        const user = document.getElementById('tg-name').textContent;
        const message = `📝 Новый отзыв от ${user}:\n\n${feedback}`;
        
        await fetch(`https://api.telegram.org/bot${FEEDBACK_CONFIG.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: FEEDBACK_CONFIG.chatId,
                text: message
            })
        });
    } catch (error) {
        console.log('Failed to send feedback to Telegram');
    }
}

// Кнопка админ-панели
function setupAdminButton() {
    const adminContainer = document.getElementById('admin-button-container');
    
    // Показываем кнопку админ-панели только если пользователь знает пароль
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    
    if (adminContainer) {
        adminContainer.style.display = isAdmin ? 'block' : 'none';
    }
    
    // Секретная комбинация для доступа к админке
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

// Ежедневные награды
function setupDailyRewards() {
    checkDailyReward();
}

function checkDailyReward() {
    const lastReward = localStorage.getItem('last_reward_date');
    const today = new Date().toDateString();
    const rewardSection = document.getElementById('daily-reward');
    
    if (lastReward !== today) {
        rewardSection.style.display = 'block';
        rewardSection.classList.add('reward-pulse');
        
        // Напоминаем о награде
        setTimeout(() => {
            showNotification('🎁 Не забудьте зайти в игры для получения ежедневной награды!', 'info');
        }, 3000);
    } else {
        rewardSection.style.display = 'none';
    }
}

// Статистика игр
function setupGameStatistics() {
    const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
    
    // Отслеживаем запуски игр
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('play-button')) {
            const gameCard = e.target.closest('.game-card');
            const gameId = gameCard.getAttribute('data-game-id');
            
            stats[gameId] = stats[gameId] || { plays: 0, lastPlayed: null };
            stats[gameId].plays++;
            stats[gameId].lastPlayed = new Date().toISOString();
            
            localStorage.setItem('game_stats', JSON.stringify(stats));
            sendAnalytics('game_played', { gameId, plays: stats[gameId].plays });
            
            // Отмечаем получение ежедневной награды
            localStorage.setItem('last_reward_date', new Date().toDateString());
            document.getElementById('daily-reward').style.display = 'none';
        }
    });
}

function updateGamesStats() {
    const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
    const statsSection = document.getElementById('games-stats');
    const statsGrid = document.getElementById('user-stats');
    
    if (Object.keys(stats).length > 0) {
        statsSection.style.display = 'block';
        
        let totalPlays = 0;
        Object.values(stats).forEach(gameStats => {
            totalPlays += gameStats.plays;
        });
        
        statsGrid.innerHTML = `
            <div class="stat-item">
                <span class="stat-value">${totalPlays}</span>
                <span class="stat-label">Всего игр</span>
            </div>
            <div class="stat-item">
                <span class="stat-value">${Object.keys(stats).length}</span>
                <span class="stat-label">Активных игр</span>
            </div>
        `;
    } else {
        statsSection.style.display = 'none';
    }
}

function updateProfileStats() {
    const stats = JSON.parse(localStorage.getItem('game_stats') || '{}');
    const ratings = JSON.parse(localStorage.getItem('game_ratings') || '{}');
    
    let totalPlays = 0;
    Object.values(stats).forEach(gameStats => {
        totalPlays += gameStats.plays;
    });
    
    const ratingsGiven = Object.values(ratings).filter(r => r > 0).length;
    
    document.getElementById('games-played').textContent = totalPlays;
    document.getElementById('ratings-given').textContent = ratingsGiven;
}

// Авто-обновление
function setupAutoRefresh() {
    // Обновляем курс каждые 2 минуты
    setInterval(() => {
        if (document.querySelector('#hmstr-section.active')) {
            refreshPriceData();
        }
    }, 120000);
    
    // Проверяем обновления новостей каждые 30 минут
    setInterval(() => {
        if (document.querySelector('#news-section.active')) {
            loadNewsFromGitHub();
        }
    }, 1800000);
}

// Обработка ошибок
function setupErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e);
        sendAnalytics('error_occurred', { error: e.message, stack: e.error?.stack });
    });
    
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e);
        sendAnalytics('promise_rejection', { reason: e.reason?.message });
    });
}

// Аналитика
function sendAnalytics(event, data) {
    const analytics = JSON.parse(localStorage.getItem('app_analytics') || '{}');
    
    // Собираем базовую статистику
    analytics.totalVisits = (analytics.totalVisits || 0) + 1;
    analytics.lastVisit = new Date().toISOString();
    analytics.events = analytics.events || [];
    
    analytics.events.push({ 
        event, 
        data, 
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        platform: window.Telegram?.WebApp?.platform || 'web'
    });
    
    // Сохраняем только последние 100 событий
    if (analytics.events.length > 100) {
        analytics.events = analytics.events.slice(-100);
    }
    
    localStorage.setItem('app_analytics', JSON.stringify(analytics));
    
    // Отправляем важные события в Telegram если настроено
    if (FEEDBACK_CONFIG.enabled && ['error_occurred', 'feedback_submitted'].includes(event)) {
        sendTelegramNotification(event, data);
    }
}

async function sendTelegramNotification(event, data) {
    if (!FEEDBACK_CONFIG.botToken || !FEEDBACK_CONFIG.chatId) return;
    
    const message = `📊 Hamster Verse Analytics\nEvent: ${event}\nData: ${JSON.stringify(data)}\nTime: ${new Date().toLocaleString()}`;
    
    try {
        await fetch(`https://api.telegram.org/bot${FEEDBACK_CONFIG.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: FEEDBACK_CONFIG.chatId,
                text: message
            })
        });
    } catch (error) {
        console.log('Telegram notification failed');
    }
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
    // Создаем уведомление
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-content">
            <div class="notification-title">${type === 'success' ? 'Успешно' : type === 'error' ? 'Ошибка' : 'Информация'}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('slide-out');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
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
    
    @keyframes starPulse {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
    }
    
    .star.just-rated {
        animation: starPulse 0.5s ease;
    }
    
    .news-badge {
        background: var(--positive-color);
        color: white;
        padding: 2px 8px;
        border-radius: 8px;
        font-size: 10px;
        font-weight: 600;
        margin-top: 8px;
        display: inline-block;
    }
    
    .news-item.important {
        border-left: 4px solid var(--positive-color);
    }
`;
document.head.appendChild(style);
