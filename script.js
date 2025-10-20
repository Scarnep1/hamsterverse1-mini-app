// Конфигурация Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCCq4W9XdanihE4d7c66CGmJmfGPY4KY_c",
    authDomain: "hamster-verse-fc1fb.firebaseapp.com",
    projectId: "hamster-verse-fc1fb",
    storageBucket: "hamster-verse-fc1fb.firebasestorage.app",
    messagingSenderId: "878070837551",
    appId: "1:878070837551:web:ec855619bc52f474d2b1da"
};

// Инициализация Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Конфигурация приложения
const APP_CONFIG = {
    version: '2.3.0',
    build: '2024.01.20',
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
        setupGuideButton();
        setupThemeToggle();
        setupShareButton();
        setupFeedbackSystem();
        setupAdminButton();
        
        // Загрузка данных из Firebase
        await loadAllData();
        
        document.getElementById('app-version').textContent = APP_CONFIG.version;
        document.getElementById('app-build').textContent = APP_CONFIG.build;
        
        console.log('✅ Hamster Verse initialized successfully');
        
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
        
        const [gamesSnapshot, priceSnapshot, newsSnapshot] = await Promise.all([
            db.collection('games').get(),
            db.collection('settings').doc('price').get(),
            db.collection('news').orderBy('date', 'desc').get()
        ]);

        const games = gamesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const price = priceSnapshot.exists ? priceSnapshot.data() : getDefaultPrice();
        const news = newsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const allData = { games, price, news };
        
        // Сохраняем в кеш
        localStorage.setItem('cached_data', JSON.stringify(allData));
        localStorage.setItem('cache_time', Date.now().toString());
        
        // Обновляем интерфейс
        displayGames(games);
        updatePriceDisplay(price);
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
        updatePriceDisplay(data.price || {});
        displayNews(data.news || []);
    } else {
        // Данные по умолчанию
        displayGames(getDefaultGames());
        updatePriceDisplay(getDefaultPrice());
        displayNews(getDefaultNews());
    }
}

function getDefaultGames() {
    return [
        {
            id: "1",
            name: "Hamster GameDev",
            description: "Создай игровую студию и стань лидером",
            image: "images/hamster-gamedev.jpg",
            url: "https://t.me/Hamster_GAme_Dev_bot/start?startapp=kentId6823288584",
            players: "12.8K",
            beta: true
        }
    ];
}

function getDefaultPrice() {
    return {
        price: 0.000621,
        change: 2.34,
        marketCap: "12.5",
        volume: "1.2"
    };
}

function getDefaultNews() {
    return [
        {
            id: "1", 
            title: "Добро пожаловать в Hamster Verse!",
            content: "Запущена новая игровая платформа с лучшими играми",
            date: new Date().toISOString(),
            image: ""
        }
    ];
}

// ==================== UI FUNCTIONS ====================

function displayGames(games) {
    const container = document.getElementById('games-container');
    
    if (!games || games.length === 0) {
        container.innerHTML = '<p>Игры временно недоступны</p>';
        return;
    }
    
    container.innerHTML = games.map(game => `
        <div class="game-card" data-game-id="${game.id}">
            <div class="game-image">
                <img src="${game.image}" alt="${game.name}" class="game-avatar" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIGZpbGw9IiM2NjdlZWEiLz4KPC9zdmc+'">
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
    
    setupGameButtons();
}

function updatePriceDisplay(priceData) {
    if (!priceData) return;
    
    document.getElementById('hmstr-price-usd').textContent = `~$${priceData.price.toFixed(6)}`;
    document.getElementById('hmstr-change-usd').textContent = `${priceData.change >= 0 ? '+' : ''}${priceData.change.toFixed(2)}%`;
    document.getElementById('hmstr-change-usd').className = `change ${priceData.change >= 0 ? 'positive' : 'negative'}`;
    document.getElementById('market-cap').textContent = `~$${priceData.marketCap}M`;
    document.getElementById('volume-24h').textContent = `~$${priceData.volume}M`;
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
