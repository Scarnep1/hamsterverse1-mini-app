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
            description: "Тапай и зарабатывай монеты в этой увлекательной игре с хомяками!",
            image: "https://via.placeholder.com/400x200/667eea/764ba2?text=Hamster+Kombat",
            url: "https://t.me/hamster_kombat_bot/start?startapp=kentId6823288584",
            players: "15.2K",
            beta: false,
            popular: true,
            rating: 4.8
        },
        {
            id: "2", 
            name: "Yescoin",
            description: "Собирай монеты и развивай свою ферму в стильной аркадной игре",
            image: "https://via.placeholder.com/400x200/00cec9/0984e3?text=Yescoin",
            url: "https://t.me/yescoin_coin_bot/start?startapp=ref_6823288584",
            players: "8.7K",
            beta: true,
            rating: 4.5
        },
        {
            id: "3",
            name: "Crypto World",
            description: "Строй свою крипто-империю и торгуй с игроками со всего мира",
            image: "https://via.placeholder.com/400x200/fdcb6e/e17055?text=Crypto+World",
            url: "https://t.me/cryptoworld_bot/start",
            players: "12.4K",
            beta: false,
            popular: true,
            rating: 4.7
        }
    ];
}

function getDefaultNews() {
    return [
        {
            id: "1", 
            title: "Добро пожаловать в Games Verse!",
            content: "Запущена новая игровая платформа с лучшими играми Telegram. Теперь все ваши любимые игры в одном месте!",
            date: new Date().toISOString(),
            image: ""
        },
        {
            id: "2",
            title: "Новые игры уже доступны",
            content: "Мы добавили самые популярные игры этого сезона. Проверьте раздел игр для ознакомления!",
            date: new Date(Date.now() - 86400000).toISOString(),
            image: ""
        }
    ];
}

// ==================== UI FUNCTIONS ====================

function displayGames(games) {
    const container = document.getElementById('games-container');
    
    if (!games || games.length === 0) {
        container.innerHTML = `
            <div class="no-games">
                <div class="no-games-icon">🎮</div>
                <h3>Игры временно недоступны</h3>
                <p>Попробуйте обновить страницу позже</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = games.map((game, index) => `
        <div class="game-card ${index === 0 ? 'featured' : ''}" data-game-id="${game.id}">
            <div class="game-image">
                <img src="${game.image}" alt="${game.name}" class="game-avatar" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSJ1cmwoI2dyYWRpZW50KSIvPgo8ZGVmcz4KPGxpbmVhckdyYWRpZW50IGlkPSJncmFkaWVudCIgeDE9IjAiIHkxPSIwIiB4Mj0iMjAwIiB5Mj0iMjAwIiBncmFkaWVudFVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+CjxzdG9wIG9mZnNldD0iMCIgc3RvcC1jb2xvcj0iIzY2N2VlYSIvPgo8c3RvcCBvZmZzZXQ9IjEiIHN0b3AtY29sb3I9IiM3NjRiYTIiLz4KPC9saW5lYXJHcmFkaWVudD4KPC9kZWZzPgo8L3N2Zz4K'">
                <div class="game-badges">
                    ${game.beta ? '<span class="game-beta">Beta</span>' : ''}
                    ${game.popular ? '<span class="game-popular">Популярная</span>' : ''}
                </div>
            </div>
            <div class="game-content">
                <div class="game-header">
                    <div class="game-info">
                        <h3>${game.name}</h3>
                        ${game.rating ? `
                            <div class="game-rating">
                                <div class="stars">
                                    ${'★'.repeat(Math.floor(game.rating))}${'☆'.repeat(5-Math.floor(game.rating))}
                                </div>
                                <span class="rating-value">${game.rating.toFixed(1)}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
                <p class="game-description">${game.description}</p>
                <div class="game-stats">
                    <div class="game-players">
                        <span class="player-icon">👥</span>
                        ${game.players} игроков
                    </div>
                    <button class="play-button" data-url="${game.url}">
                        Играть →
                    </button>
                </div>
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

function setupShareButton() {
    const shareButton = document.getElementById('share-button');
    
    if (shareButton) {
        shareButton.addEventListener('click', shareApp);
    }
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
