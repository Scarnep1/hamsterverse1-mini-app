// Конфигурация приложения
const APP_CONFIG = {
    version: '2.3.0',
    build: '2024.01.16',
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
        setupPlayButtons();
        setupTelegramIntegration();
        setupAdminPanel();
        setupThemeToggle();
        setupShareButton();
        
        // Загрузка данных
        loadGames();
        loadHmstrData();
        loadNews();
        
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

// Кнопки запуска игр
function setupPlayButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('play-button')) {
            e.stopPropagation();
            const url = e.target.getAttribute('data-url');
            openGame(url);
        }
        
        if (e.target.closest('.game-card')) {
            const gameCard = e.target.closest('.game-card');
            if (!e.target.classList.contains('play-button')) {
                const playButton = gameCard.querySelector('.play-button');
                const url = playButton.getAttribute('data-url');
                openGame(url);
            }
        }
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
        // Расширяем на весь экран
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            updateUserProfile(user);
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

// Управление играми
function loadGames() {
    const games = JSON.parse(localStorage.getItem('admin_games') || '[]');
    
    if (games.length === 0) {
        // Загрузка стандартных игр
        const defaultGames = [
            {
                id: 1,
                title: "Hamster GameDev",
                description: "Создай игровую студию и стань лидером",
                url: "https://t.me/Hamster_GAme_Dev_bot/start?startapp=kentId6823288584",
                image: "images/hamster-gamedev.jpg",
                players: "128K"
            },
            {
                id: 2,
                title: "Hamster King",
                description: "Стань королём в эпических битвах",
                url: "https://t.me/hamsterking_game_bot?startapp=6823288584",
                image: "images/hamster-king.jpg",
                players: "256K"
            },
            {
                id: 3,
                title: "Hamster Fight Club",
                description: "Бойцовский клуб для чемпионов",
                url: "https://t.me/hamster_fightclub_bot?startapp=NWE1YjA2YWUtZTAyYS01ZjA1LTg4ZTYtMGZmZjUwNDQwNjU5",
                image: "images/hamstr-fight-club.jpg",
                players: "189K"
            },
            {
                id: 4,
                title: "BitQuest",
                description: "Крипто-приключение с наградами",
                url: "https://t.me/BitquestgamesBot/start?startapp=kentId_6823288584",
                image: "images/bitquest.jpg",
                players: "312K"
            }
        ];
        localStorage.setItem('admin_games', JSON.stringify(defaultGames));
        displayGames(defaultGames);
        updateAdminGamesList(defaultGames);
    } else {
        displayGames(games);
        updateAdminGamesList(games);
    }
}

function displayGames(games) {
    const container = document.getElementById('games-container');
    
    container.innerHTML = games.map(game => `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-image">
                <img src="${game.image}" alt="${game.title}" class="game-avatar" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIGZpbGw9IiM2NjdlZWEiLz4KPC9zdmc+Cg=='">
            </div>
            <div class="game-info">
                <h3>${game.title}</h3>
                <p>${game.description}</p>
                <div class="players-count">${game.players} игроков</div>
            </div>
            <button class="play-button" data-url="${game.url}">
                Играть
            </button>
        </div>
    `).join('');
}

function addGame() {
    const title = document.getElementById('game-title').value.trim();
    const description = document.getElementById('game-description').value.trim();
    const url = document.getElementById('game-url').value.trim();
    const image = document.getElementById('game-image').value.trim();
    const players = document.getElementById('game-players').value.trim();
    
    if (!title || !description || !url) {
        showNotification('Заполните название, описание и ссылку', 'error');
        return;
    }
    
    const games = JSON.parse(localStorage.getItem('admin_games') || '[]');
    const newGame = {
        id: Date.now(),
        title,
        description,
        url,
        image: image || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIGZpbGw9IiM2NjdlZWEiLz4KPC9zdmc+Cg==',
        players: players || "0"
    };
    
    games.push(newGame);
    localStorage.setItem('admin_games', JSON.stringify(games));
    
    displayGames(games);
    updateAdminGamesList(games);
    
    // Очищаем форму
    document.getElementById('game-title').value = '';
    document.getElementById('game-description').value = '';
    document.getElementById('game-url').value = '';
    document.getElementById('game-image').value = '';
    document.getElementById('game-players').value = '';
    
    showNotification('Игра успешно добавлена!', 'success');
}

function deleteGame(gameId) {
    const games = JSON.parse(localStorage.getItem('admin_games') || '[]');
    const updatedGames = games.filter(game => game.id !== gameId);
    
    localStorage.setItem('admin_games', JSON.stringify(updatedGames));
    displayGames(updatedGames);
    updateAdminGamesList(updatedGames);
    
    showNotification('Игра удалена', 'success');
}

function updateAdminGamesList(games) {
    const container = document.getElementById('admin-games-list');
    
    container.innerHTML = games.map(game => `
        <div class="admin-item">
            <div class="admin-item-header">
                <h4 class="admin-item-title">${game.title}</h4>
                <div class="admin-item-actions">
                    <button class="admin-btn danger" onclick="deleteGame(${game.id})">Удалить</button>
                </div>
            </div>
            <div class="admin-item-content">${game.description}</div>
            <div class="admin-item-meta">
                Игроков: ${game.players} | URL: ${game.url.substring(0, 30)}...
            </div>
        </div>
    `).join('');
}

// Управление данными HMSTR
function loadHmstrData() {
    const hmstrData = JSON.parse(localStorage.getItem('admin_hmstr_data') || '{}');
    
    if (Object.keys(hmstrData).length === 0) {
        // Данные по умолчанию
        const defaultData = {
            price: "0.000621",
            change: "+2.34",
            marketcap: "12.5M",
            volume: "1.2M"
        };
        localStorage.setItem('admin_hmstr_data', JSON.stringify(defaultData));
        updateHmstrDisplay(defaultData);
        
        // Заполняем форму в админке
        document.getElementById('hmstr-price').value = defaultData.price;
        document.getElementById('hmstr-change').value = defaultData.change;
        document.getElementById('hmstr-marketcap').value = defaultData.marketcap;
        document.getElementById('hmstr-volume').value = defaultData.volume;
    } else {
        updateHmstrDisplay(hmstrData);
        
        // Заполняем форму в админке
        document.getElementById('hmstr-price').value = hmstrData.price;
        document.getElementById('hmstr-change').value = hmstrData.change;
        document.getElementById('hmstr-marketcap').value = hmstrData.marketcap;
        document.getElementById('hmstr-volume').value = hmstrData.volume;
    }
}

function updateHmstrDisplay(data) {
    document.getElementById('hmstr-price-usd').textContent = `~$${data.price}`;
    document.getElementById('hmstr-change-usd').textContent = `~${data.change}%`;
    document.getElementById('hmstr-change-usd').className = `change ${data.change.includes('+') ? 'positive' : 'negative'}`;
    document.getElementById('market-cap').textContent = `~$${data.marketcap}`;
    document.getElementById('volume-24h').textContent = `~$${data.volume}`;
}

function updateHmstrData() {
    const price = document.getElementById('hmstr-price').value.trim();
    const change = document.getElementById('hmstr-change').value.trim();
    const marketcap = document.getElementById('hmstr-marketcap').value.trim();
    const volume = document.getElementById('hmstr-volume').value.trim();
    
    if (!price || !change || !marketcap || !volume) {
        showNotification('Заполните все поля', 'error');
        return;
    }
    
    const hmstrData = { price, change, marketcap, volume };
    localStorage.setItem('admin_hmstr_data', JSON.stringify(hmstrData));
    
    updateHmstrDisplay(hmstrData);
    showNotification('Данные HMSTR обновлены!', 'success');
}

// Управление новостями
function loadNews() {
    const news = JSON.parse(localStorage.getItem('admin_news') || '[]');
    
    if (news.length === 0) {
        // Новости по умолчанию
        const defaultNews = [
            {
                id: 1,
                date: new Date().toISOString(),
                title: "Добро пожаловать в Hamster Verse!",
                content: "Запущена новая игровая платформа с лучшими играми от Hamster. Теперь все в одном месте!",
                image: ""
            }
        ];
        localStorage.setItem('admin_news', JSON.stringify(defaultNews));
        displayNews(defaultNews);
        updateAdminNewsList(defaultNews);
    } else {
        displayNews(news);
        updateAdminNewsList(news);
    }
}

function displayNews(news) {
    const container = document.getElementById('news-container');
    
    if (!news || news.length === 0) {
        container.innerHTML = `
            <div class="news-item">
                <span class="news-date">${new Date().toLocaleDateString('ru-RU')}</span>
                <div class="news-title">Новости пока отсутствуют</div>
                <div class="news-content">Следите за обновлениями, скоро здесь появятся свежие новости!</div>
            </div>
        `;
        return;
    }
    
    const sortedNews = news.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    container.innerHTML = sortedNews.map(item => `
        <div class="news-item">
            <span class="news-date">${formatDate(item.date)}</span>
            ${item.image ? `<img src="${item.image}" alt="News image" class="news-image" onerror="this.style.display='none'">` : ''}
            <div class="news-title">${item.title}</div>
            <div class="news-content">${item.content}</div>
        </div>
    `).join('');
}

function addNews() {
    const title = document.getElementById('news-title').value.trim();
    const content = document.getElementById('news-content').value.trim();
    const image = document.getElementById('news-image').value.trim();
    const date = document.getElementById('news-date').value || new Date().toISOString().split('T')[0];
    
    if (!title || !content) {
        showNotification('Заполните заголовок и содержание', 'error');
        return;
    }
    
    const news = JSON.parse(localStorage.getItem('admin_news') || '[]');
    const newNews = {
        id: Date.now(),
        date: new Date(date).toISOString(),
        title,
        content,
        image
    };
    
    news.push(newNews);
    localStorage.setItem('admin_news', JSON.stringify(news));
    
    displayNews(news);
    updateAdminNewsList(news);
    
    // Очищаем форму
    document.getElementById('news-title').value = '';
    document.getElementById('news-content').value = '';
    document.getElementById('news-image').value = '';
    document.getElementById('news-date').value = '';
    
    showNotification('Новость добавлена!', 'success');
}

function deleteNews(newsId) {
    const news = JSON.parse(localStorage.getItem('admin_news') || '[]');
    const updatedNews = news.filter(item => item.id !== newsId);
    
    localStorage.setItem('admin_news', JSON.stringify(updatedNews));
    displayNews(updatedNews);
    updateAdminNewsList(updatedNews);
    
    showNotification('Новость удалена', 'success');
}

function updateAdminNewsList(news) {
    const container = document.getElementById('admin-news-list');
    
    container.innerHTML = news.map(item => `
        <div class="admin-item">
            <div class="admin-item-header">
                <h4 class="admin-item-title">${item.title}</h4>
                <div class="admin-item-actions">
                    <button class="admin-btn danger" onclick="deleteNews(${item.id})">Удалить</button>
                </div>
            </div>
            <div class="admin-item-content">${item.content}</div>
            <div class="admin-item-meta">
                ${formatDate(item.date)} ${item.image ? '| С изображением' : ''}
            </div>
        </div>
    `).join('');
}

// Админ-панель
function setupAdminPanel() {
    setupAdminTabs();
    checkAdminAccess();
}

function setupAdminTabs() {
    const tabs = document.querySelectorAll('.admin-tab');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Обновляем активные табы
            tabs.forEach(t => t.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем соответствующий контент
            document.querySelectorAll('.admin-tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${targetTab}-tab`).classList.add('active');
        });
    });
}

function checkAdminAccess() {
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    const adminContainer = document.getElementById('admin-button-container');
    
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
        
        if (keySequence.includes(APP_CONFIG.adminPassword)) {
            localStorage.setItem('is_admin', 'true');
            checkAdminAccess();
            showNotification('Режим администратора активирован!', 'success');
            keySequence = '';
        }
    });
}

function openAdminPanel() {
    const modal = document.getElementById('admin-modal');
    modal.classList.remove('hidden');
}

function closeAdminModal() {
    const modal = document.getElementById('admin-modal');
    modal.classList.add('hidden');
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
        shareButton.addEventListener('click', function() {
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
                // Fallback - копирование в буфер
                navigator.clipboard.writeText(shareUrl).then(() => {
                    showNotification('Ссылка скопирована в буфер!', 'success');
                }).catch(() => {
                    showNotification('Скопируйте ссылку вручную: ' + shareUrl, 'info');
                });
            }
        });
    }
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
    // Создаем уведомление
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
    
    // Автоматическое удаление через 4 секунды
    setTimeout(() => {
        notification.classList.add('slide-out');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
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
