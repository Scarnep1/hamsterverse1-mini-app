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
        description: "Создай игровую студию и стань лидером",
        players: "15.2K",
        url: "https://t.me/hamster_kombat_bot/start"
    },
    {
        id: "2", 
        name: "Yescoin",
        description: "Стань королём в битвах за монеты",
        players: "8.7K",
        url: "https://t.me/yescoin_coin_bot/start"
    },
    {
        id: "3",
        name: "Crypto Whales", 
        description: "Бойцовский клуб для китов",
        players: "5.3K",
        url: "https://t.me/cryptowhales_bot/start"
    },
    {
        id: "4",
        name: "Tap Fantasy",
        description: "Крипто-приключение в фэнтези мире",
        players: "12.1K",
        url: "https://t.me/tapfantasy_bot/start"
    },
    {
        id: "5",
        name: "Nut Collector",
        description: "Зарабатывай орехи и развивайся",
        players: "3.8K",
        url: "https://t.me/nutcollector_bot/start"
    }
];

// Статические данные бирж
const EXCHANGES_DATA = [
    {
        id: "1",
        name: "Binance",
        description: "Крупнейшая криптобиржа",
        url: "https://www.binance.com",
        logo: "binance",
        features: ["Spot", "Futures", "Earn"]
    },
    {
        id: "2",
        name: "Bybit",
        description: "Лучшие условия для трейдинга",
        url: "https://www.bybit.com",
        logo: "bybit",
        features: ["Futures", "Copy Trading", "Options"]
    },
    {
        id: "3",
        name: "OKX",
        description: "Много торговых пар",
        url: "https://www.okx.com",
        logo: "okx",
        features: ["Spot", "DeFi", "NFT"]
    },
    {
        id: "4",
        name: "Gate.io",
        description: "Международная платформа",
        url: "https://www.gate.io",
        logo: "gate",
        features: ["HODL", "Startup", "Labs"]
    },
    {
        id: "5",
        name: "MEXC",
        description: "Популярные листинги",
        url: "https://www.mexc.com",
        logo: "mexc",
        features: ["Spot", "ETF", "Earn"]
    }
];

// Статические данные новостей
const NEWS_DATA = [
    {
        id: "1", 
        title: "Добро пожаловать в Hamster Verse!",
        content: "Запущена новая игровая платформа с лучшими играми Telegram. Теперь все игры в одном месте!",
        date: new Date().toISOString()
    },
    {
        id: "2",
        title: "Новые игры добавлены",
        content: "В каталог добавлены популярные игры: Hamster Kombat, Yescoin, Crypto Whales и другие.",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
        id: "3",
        title: "Обновление дизайна",
        content: "Полностью обновлен интерфейс приложения. Улучшена навигация и добавлены новые функции.",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
    }
];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    console.log('🚀 Hamster Verse v' + APP_CONFIG.version + ' initializing...');
    
    try {
        setupNavigation();
        setupTelegramIntegration();
        setupThemeToggle();
        setupShareButton();
        
        // Загрузка статических данных
        displayGames(GAMES_DATA);
        displayExchanges(EXCHANGES_DATA);
        displayNews(NEWS_DATA);
        
        document.getElementById('app-version').textContent = APP_CONFIG.version;
        document.getElementById('app-build').textContent = APP_CONFIG.build;
        
        console.log('✅ Hamster Verse initialized successfully');
        
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
            <div class="game-header">
                <div class="game-info">
                    <h3 class="game-title">${game.name}</h3>
                    <p class="game-description">${game.description}</p>
                    <div class="game-footer">
                        <div class="game-players">
                            <span>👥</span>
                            <span>${game.players} игроков</span>
                        </div>
                        <button class="play-button" data-url="${game.url}">
                            Играть
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join('');
    
    setupGameButtons();
}

function displayExchanges(exchanges) {
    const container = document.getElementById('exchanges-container');
    
    if (!exchanges || exchanges.length === 0) {
        container.innerHTML = '<div class="empty-state"><p>Биржи временно недоступны</p></div>';
        return;
    }
    
    container.innerHTML = exchanges.map(exchange => `
        <a href="${exchange.url}" class="exchange-card" target="_blank" rel="noopener">
            <div class="exchange-content">
                <div class="exchange-logo ${exchange.logo}">
                    ${exchange.name.charAt(0)}
                </div>
                <div class="exchange-info">
                    <h3 class="exchange-name">${exchange.name}</h3>
                    <p class="exchange-description">${exchange.description}</p>
                    <div class="exchange-features">
                        ${exchange.features.map(feature => `
                            <span class="exchange-feature">${feature}</span>
                        `).join('')}
                    </div>
                </div>
                <div class="exchange-arrow">→</div>
            </div>
        </a>
    `).join('');
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
    const shareText = "🎮 Открой для себя Hamster Verse - все лучшие игры Telegram в одном приложении! Присоединяйся сейчас!";
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
