// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC7ET2n5MJ6V_jFMjNWaDycd4LRyfkZnMw",
    authDomain: "hamsterversehost.firebaseapp.com",
    projectId: "hamsterversehost",
    storageBucket: "hamsterversehost.firebasestorage.app",
    messagingSenderId: "895206280147",
    appId: "1:895206280147:web:64e4929ee7e1599ca47d26"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Конфигурация приложения
const APP_CONFIG = {
    version: '2.3.0',
    build: '2024.01.20',
    adminPassword: 'games2024'
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('🚀 Games Verse v' + APP_CONFIG.version + ' initializing...');
    
    try {
        setupNavigation();
        setupTelegramIntegration();
        setupThemeToggle();
        setupShareButton();
        setupFeedbackSystem();
        setupAdminButton();
        
        // Загрузка данных из Firebase
        await loadAllData();
        
        document.getElementById('app-version').textContent = APP_CONFIG.version;
        document.getElementById('app-build').textContent = APP_CONFIG.build;
        
        console.log('✅ Games Verse initialized successfully');
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        showNotification('Ошибка загрузки приложения', 'error');
        loadCachedData();
    }
}

// ==================== FIREBASE FUNCTIONS ====================

async function loadAllData() {
    try {
        console.log('🔄 Загрузка данных из Firebase...');
        
        const [gamesSnapshot, newsSnapshot] = await Promise.all([
            db.collection('games').get(),
            db.collection('news').orderBy('date', 'desc').get()
        ]);

        const games = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const news = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const allData = { games, news };
        
        // Сохраняем в кеш
        localStorage.setItem('cached_data', JSON.stringify(allData));
        localStorage.setItem('cache_time', Date.now().toString());
        
        // Обновляем интерфейс
        displayGames(games);
        displayNews(news);
        
        console.log('✅ Данные загружены из Firebase');
        
    } catch (error) {
        console.log('⚠️ Ошибка Firebase:', error);
        showNotification('Используем кешированные данные', 'info');
        loadCachedData();
    }
}

function loadCachedData() {
    const cached = localStorage.getItem('cached_data');
    if (cached) {
        const data = JSON.parse(cached);
        displayGames(data.games || []);
        displayNews(data.news || []);
    } else {
        // Данные по умолчанию
        displayGames(getDefaultGames());
        displayNews(getDefaultNews());
    }
}

function getDefaultGames() {
    return [
        {
            id: "1",
            name: "Hamster Kombat",
            description: "Тапы и комбо для максимум прибыли. Участвуй в ежедневных миссиях!",
            image: "https://via.placeholder.com/70",
            url: "https://t.me/hamster_kombat_bot/start?startapp=kentId6823288584",
            players: "15.2K",
            rating: 4.5,
            beta: false,
            trending: true,
            new: false,
            popular: true
        },
        {
            id: "2", 
            name: "Yescoin",
            description: "Свайпай и зарабатывай монеты. Новая механика игры!",
            image: "https://via.placeholder.com/70",
            url: "https://t.me/yescoin_coin_bot/start?startapp=ref_6823288584",
            players: "8.7K",
            rating: 4.2,
            beta: true,
            trending: false,
            new: true,
            popular: false
        },
        {
            id: "3",
            name: "Crypto Whales",
            description: "Собирай криптовалюту и становись китом!",
            image: "https://via.placeholder.com/70", 
            url: "https://t.me/cryptowhales_bot/start?startapp=ref_6823288584",
            players: "5.3K",
            rating: 3.8,
            beta: false,
            trending: false,
            new: false,
            popular: true
        }
    ];
}

function getDefaultNews() {
    return [
        {
            id: "1", 
            title: "Добро пожаловать в Games Verse!",
            content: "Запущена новая игровая платформа с лучшими играми Telegram",
            date: new Date().toISOString(),
            image: ""
        }
    ];
}

// ==================== UI FUNCTIONS ====================

function displayGames(games) {
    const container = document.getElementById('games-container');
    
    if (!games || games.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🎮</div>
                <h3>Игры временно недоступны</h3>
                <p>Попробуйте обновить страницу позже</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = games.map((game, index) => `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-card-content">
                <div class="game-image">
                    <img src="${game.image}" alt="${game.name}" class="game-avatar" 
                         onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNzAiIGhlaWdodD0iNzAiIHZpZXdCb3g9IjAgMCA3MCA3MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjcwIiBoZWlnaHQ9IjcwIiByeD0iMTgiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSIyNSIgeT0iMjUiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0id2hpdGUiPjxyZWN0IHg9IjgiIHk9IjQiIHdpZHRoPSI4IiBoZWlnaHQ9IjIiLz48cmVjdCB4PSI0IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMiIvPjxyZWN0IHg9IjIiIHk9IjEyIiB3aWR0aD0iMjAiIGhlaWdodD0iMiIvPjxyZWN0IHg9IjQiIHk9IjE2IiB3aWR0aD0iMTYiIGhlaWdodD0iMiIvPjxyZWN0IHg9IjgiIHk9IjIwIiB3aWR0aD0iOCIgaGVpZ2h0PSIyIi8+PC9zdmc+Cjwvc3ZnPg=='">
                    ${game.beta ? '<span class="game-badge">BETA</span>' : ''}
                </div>
                
                <div class="game-info">
                    <div class="game-header">
                        <div class="game-title-wrapper">
                            <h3>${game.name}</h3>
                            <div class="game-status">
                                ${game.beta ? '<span class="status-tag beta">Beta</span>' : ''}
                                ${game.trending ? '<span class="status-tag trending">🔥 Trending</span>' : ''}
                                ${game.new ? '<span class="status-tag new">New</span>' : ''}
                                ${game.popular ? '<span class="status-tag popular">Popular</span>' : ''}
                            </div>
                        </div>
                    </div>
                    
                    <div class="game-description">${game.description}</div>
                    
                    <div class="game-meta">
                        <div class="game-players">
                            <span>👥</span>
                            <span>${game.players}</span>
                        </div>
                        ${game.rating ? `
                        <div class="game-rating">
                            <span class="stars">${'⭐'.repeat(Math.floor(game.rating))}${game.rating % 1 ? '½' : ''}</span>
                            <span>${game.rating}</span>
                        </div>
                        ` : ''}
                    </div>
                </div>
            </div>
            
            <div class="game-actions">
                <button class="play-button" data-url="${game.url}">
                    Играть
                </button>
                <button class="secondary-button" onclick="event.stopPropagation(); showGameDetails('${game.id}')">
                    ℹ️
                </button>
            </div>
        </div>
    `).join('');
    
    setupGameButtons();
}

function displayNews(news) {
    const container = document.getElementById('news-container');
    
    if (!news || news.length === 0) {
        container.innerHTML = '<div class="news-item"><p>Новости временно недоступны</p></div>';
        return;
    }
    
    container.innerHTML = news.map(item => `
        <div class="news-item">
            <span class="news-date">${formatDate(item.date)}</span>
            <div class="news-title">${item.title}</div>
            <div class="news-content">${item.content}</div>
            ${item.image ? `<img src="${item.image}" alt="News image" class="news-image">` : ''}
        </div>
    `).join('');
}

function setupGameButtons() {
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
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

function showGameDetails(gameId) {
    showNotification('Детали игры скоро будут доступны!', 'info');
}

// ==================== OTHER FUNCTIONS ====================

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

function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        
        tg.expand();
        tg.enableClosingConfirmation();
        
        updateUserProfile(tg.initDataUnsafe.user);
        
        tg.ready();
    } else {
        console.log('Telegram WebApp not detected, running in browser mode');
        updateUserProfile({
            first_name: 'Пользователь',
            username: 'user'
        });
    }
}

function updateUserProfile(user) {
    if (user) {
        const name = user.first_name || 'Пользователь';
        const username = user.username ? `@${user.username}` : 'Пользователь';
        
        document.getElementById('tg-name').textContent = name;
        document.getElementById('tg-username').textContent = username;
        
        if (user.photo_url) {
            document.getElementById('tg-avatar').innerHTML = `<img src="${user.photo_url}" alt="${name}" style="width: 100%; height: 100%; border-radius: 50%;">`;
        }
    }
}

function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const themeText = themeToggle.querySelector('.theme-text');
    
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeButton(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeButton(newTheme);
    });
    
    function updateThemeButton(theme) {
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Светлая тема';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Темная тема';
        }
    }
}

function setupShareButton() {
    const shareButton = document.getElementById('share-button');
    shareButton.addEventListener('click', shareApp);
}

function shareApp() {
    const shareText = "🎮 Открой для себя Games Verse - все лучшие игры Telegram в одном приложении! Присоединяйся сейчас!";
    const shareUrl = window.location.href;
    
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.shareUrl(shareUrl, shareText);
    } else if (navigator.share) {
        navigator.share({
            title: 'Games Verse',
            text: shareText,
            url: shareUrl
        });
    } else {
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Ссылка скопирована в буфер!', 'success');
        });
    }
}

function setupFeedbackSystem() {
    const feedbackButton = document.getElementById('feedback-button');
    const feedbackModal = document.getElementById('feedback-modal');
    
    feedbackButton.addEventListener('click', function() {
        feedbackModal.classList.remove('hidden');
    });
}

function setupAdminButton() {
    const adminContainer = document.getElementById('admin-button-container');
    const isAdmin = localStorage.getItem('isAdmin') === 'true';
    
    if (isAdmin) {
        adminContainer.style.display = 'block';
    }
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('hidden');
}

function sendFeedback() {
    const feedbackText = document.getElementById('feedback-text').value.trim();
    
    if (!feedbackText) {
        showNotification('Пожалуйста, введите ваше сообщение', 'error');
        return;
    }
    
    const feedbackData = {
        text: feedbackText,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
    };
    
    try {
        db.collection('feedback').add(feedbackData)
            .then(() => {
                showNotification('Спасибо за ваш отзыв!', 'success');
                document.getElementById('feedback-text').value = '';
                closeFeedbackModal();
            })
            .catch(error => {
                console.error('Error saving feedback:', error);
                showNotification('Ошибка отправки отзыва', 'error');
            });
    } catch (error) {
        console.error('Feedback error:', error);
        showNotification('Отзыв сохранен локально', 'info');
        
        const localFeedback = JSON.parse(localStorage.getItem('feedback') || '[]');
        localFeedback.push(feedbackData);
        localStorage.setItem('feedback', JSON.stringify(localFeedback));
        
        document.getElementById('feedback-text').value = '';
        closeFeedbackModal();
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-content">
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('slide-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

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

document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
    
    checkAnnouncementState();
});
