// Конфигурация приложения
const APP_CONFIG = {
    version: '2.2.0',
    build: '2024.01.15',
    adminPassword: 'hamster2024'
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    console.log('🚀 Hamster Verse v' + APP_CONFIG.version + ' initializing...');
    
    try {
        setupNavigation();
        setupTelegramIntegration();
        setupPriceData();
        setupGuideButton();
        setupThemeToggle();
        setupShareButton();
        setupFeedbackSystem();
        setupAdminButton();
        
        // Загрузка данных
        loadGames();
        loadNews();
        loadPriceData();
        
        // Обновление информации о версии
        document.getElementById('app-version').textContent = APP_CONFIG.version;
        document.getElementById('app-build').textContent = APP_CONFIG.build;
        
        console.log('✅ Hamster Verse initialized successfully');
        
    } catch (error) {
        console.error('❌ App initialization failed:', error);
        showNotification('Ошибка инициализации приложения', 'error');
    }
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
        });
    });
}

// Интеграция с Telegram
function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            updateUserProfile(user);
        }
        
        if (window.Telegram.WebApp.colorScheme === 'dark') {
            setTheme('dark');
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

// Загрузка игр
function loadGames() {
    const games = JSON.parse(localStorage.getItem('admin_games')) || getDefaultGames();
    const container = document.getElementById('games-container');
    
    container.innerHTML = games.map(game => `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-image">
                <img src="${game.image}" alt="${game.name}" class="game-avatar" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJNMTIgMTNWMTVNMTIgN1Y3TTQgMTJIMjBNMTIgMjBWMjBNMTIgMTZWMTZNOCA4TDUgNU04IDhMMTIgNE04IDE2TDEyIDIwTTggMTZMMTUgOU0xNiA4TDE5IDVNMTYgOEwyMCA0TTE2IDE2TDIwIDEyTTE2IDE2TDEyIDIwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cjwvc3ZnPgo='">
            </div>
            <div class="game-info">
                <div class="game-header">
                    <h3>${game.name}</h3>
                    ${game.beta ? '<span class="game-beta">Beta</span>' : ''}
                </div>
                <p>${game.description}</p>
                <div class="game-players">👥 ${game.players} игроков</div>
            </div>
            <button class="play-button" data-url="${game.url}">
                Играть
            </button>
        </div>
    `).join('');
    
    // Добавляем обработчики для кнопок
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

function getDefaultGames() {
    return [
        {
            id: 1,
            name: "Hamster GameDev",
            description: "Создай игровую студию и стань лидером",
            image: "images/hamster-gamedev.jpg",
            url: "https://t.me/Hamster_GAme_Dev_bot/start?startapp=kentId6823288584",
            players: "12.8K",
            beta: true
        },
        {
            id: 2,
            name: "Hamster King",
            description: "Стань королём в эпических битвах",
            image: "images/hamster-king.jpg",
            url: "https://t.me/hamsterking_game_bot?startapp=6823288584",
            players: "25.6K"
        },
        {
            id: 3,
            name: "Hamster Fight Club",
            description: "Бойцовский клуб для чемпионов",
            image: "images/hamstr-fight-club.jpg",
            url: "https://t.me/hamster_fightclub_bot?startapp=NWE1YjA2YWUtZTAyYS01ZjA1LTg4ZTYtMGZmZjUwNDQwNjU5",
            players: "18.9K"
        },
        {
            id: 4,
            name: "BitQuest",
            description: "Крипто-приключение с наградами",
            image: "images/bitquest.jpg",
            url: "https://t.me/BitquestgamesBot/start?startapp=kentId_6823288584",
            players: "31.2K"
        }
    ];
}

function openGame(url) {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank', 'noopener,noreferrer');
    }
}

// Данные токена HMSTR
function setupPriceData() {
    loadPriceData();
}

function loadPriceData() {
    const priceData = JSON.parse(localStorage.getItem('admin_price_data'));
    
    if (priceData) {
        updatePriceDisplay(priceData);
    } else {
        // Данные по умолчанию
        updatePriceDisplay({
            price: 0.000621,
            change: 2.34,
            marketCap: "12.5",
            volume: "1.2"
        });
    }
}

function updatePriceDisplay(data) {
    document.getElementById('hmstr-price-usd').textContent = `~$${data.price.toFixed(6)}`;
    document.getElementById('hmstr-change-usd').textContent = `${data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}%`;
    document.getElementById('hmstr-change-usd').className = `change ${data.change >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('market-cap').textContent = `~$${data.marketCap}M`;
    document.getElementById('volume-24h').textContent = `~$${data.volume}M`;
}

// Новости
function loadNews() {
    const news = JSON.parse(localStorage.getItem('admin_news')) || getDefaultNews();
    const container = document.getElementById('news-container');
    
    container.innerHTML = news.map(item => `
        <div class="news-item">
            <span class="news-date">${formatDate(item.date)}</span>
            <div class="news-title">${item.title}</div>
            <div class="news-content">${item.content}</div>
            ${item.image ? `<img src="${item.image}" alt="News image" class="news-image">` : ''}
        </div>
    `).join('');
}

function getDefaultNews() {
    return [
        {
            id: 1,
            date: new Date().toISOString(),
            title: "Добро пожаловать в Hamster Verse!",
            content: "Запущена новая игровая платформа с лучшими играми от Hamster. Теперь все в одном месте!",
            image: ""
        }
    ];
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
    
    setTimeout(() => {
        const textarea = document.getElementById('feedback-text');
        textarea.focus();
    }, 100);
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    modal.classList.add('closing');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('closing');
    }, 300);
}

function sendFeedback() {
    const textarea = document.getElementById('feedback-text');
    const feedback = textarea.value.trim();
    
    if (!feedback) {
        showNotification('Пожалуйста, введите ваше сообщение', 'error');
        return;
    }
    
    showNotification('Спасибо за ваш отзыв!', 'success');
    closeFeedbackModal();
    textarea.value = '';
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
        
        if (keySequence.includes(APP_CONFIG.adminPassword)) {
            localStorage.setItem('is_admin', 'true');
            setupAdminButton();
            showNotification('Режим администратора активирован!', 'success');
            keySequence = '';
        }
    });
}

// Вспомогательные функции
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

document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
    
    checkAnnouncementState();
});
