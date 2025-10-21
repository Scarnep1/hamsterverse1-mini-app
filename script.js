// Конфигурация приложения
const APP_CONFIG = {
    version: '2.3.0',
    build: '2024.01.20'
};

// Статические данные игр
const GAMES_DATA = [
    {
        id: "1",
        name: "Hamster Kombat",
        description: "Тапы и комбо для максимум прибыли. Участвуй в ежедневных миссиях!",
        image: "https://img.icons8.com/color/70/000000/hamster.png",
        url: "https://t.me/hamster_kombat_bot/start",
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
        image: "https://img.icons8.com/color/70/000000/coin.png",
        url: "https://t.me/yescoin_coin_bot/start",
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
        image: "https://img.icons8.com/color/70/000000/whale.png", 
        url: "https://t.me/cryptowhales_bot/start",
        players: "5.3K",
        rating: 3.8,
        beta: false,
        trending: false,
        new: false,
        popular: true
    },
    {
        id: "4",
        name: "Tap Fantasy",
        description: "Фэнтези тап-игра с RPG элементами",
        image: "https://img.icons8.com/color/70/000000/fantasy.png",
        url: "https://t.me/tapfantasy_bot/start",
        players: "12.1K",
        rating: 4.3,
        beta: false,
        trending: true,
        new: false,
        popular: true
    }
];

// Статические данные новостей
const NEWS_DATA = [
    {
        id: "1", 
        title: "Добро пожаловать в Games Verse!",
        content: "Запущена новая игровая платформа с лучшими играми Telegram. Теперь все игры в одном месте!",
        date: new Date().toISOString(),
        image: ""
    },
    {
        id: "2",
        title: "Новая игра: Hamster Kombat",
        content: "Добавлена популярная игра Hamster Kombat с ежедневными наградами и комбо-системой.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        image: ""
    },
    {
        id: "3",
        title: "Обновление дизайна",
        content: "Полностью обновлен интерфейс приложения. Улучшена навигация и добавлены новые функции.",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        image: ""
    }
];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Games Verse v' + APP_CONFIG.version + ' initializing...');
    
    try {
        setupNavigation();
        setupTelegramIntegration();
        setupThemeToggle();
        setupShareButton();
        
        // Загрузка статических данных
        displayGames(GAMES_DATA);
        displayNews(NEWS_DATA);
        
        document.getElementById('app-version').textContent = APP_CONFIG.version;
        document.getElementById('app-build').textContent = APP_CONFIG.build;
        
        console.log('✅ Games Verse initialized successfully');
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        showNotification('Ошибка загрузки приложения', 'error');
    }
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
    const game = GAMES_DATA.find(g => g.id === gameId);
    if (game) {
        showNotification(`Информация о "${game.name}" скоро будет доступна!`, 'info');
    }
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
