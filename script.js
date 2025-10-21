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
            description: "Тапы и комбо для максимум прибыли",
            image: "https://via.placeholder.com/50",
            url: "https://t.me/hamster_kombat_bot/start?startapp=kentId6823288584",
            players: "15.2K",
            beta: false
        },
        {
            id: "2", 
            name: "Yescoin",
            description: "Свайпай и зарабатывай монеты",
            image: "https://via.placeholder.com/50",
            url: "https://t.me/yescoin_coin_bot/start?startapp=ref_6823288584",
            players: "8.7K",
            beta: true
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

// ... остальные функции остаются такими же, как в оригинальном script.js
// (setupTelegramIntegration, updateUserProfile, setupThemeToggle, setupShareButton, setupFeedbackSystem, setupAdminButton и т.д.)

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

// ... остальной код функций остается таким же

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU');
}

function showNotification(message, type = 'info') {
    // ... код функции показа уведомлений
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
