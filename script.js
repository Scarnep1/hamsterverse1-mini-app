// Конфигурация Supabase
const SUPABASE_CONFIG = {
    url: 'https://hubgtmchajwzerldgtjh.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh1Ymd0bWNoYWp3emVybGRndGpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2NDMyNjAsImV4cCI6MjA3NjIxOTI2MH0.bHMgD-GMSwAwd7tO_I1v_aHC82yYrWQgEySRAoHbJ5o'
};

// Инициализация Supabase
const supabase = supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);

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
        
        // Загрузка данных из Supabase
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

// ==================== SUPABASE FUNCTIONS ====================

// Слушатели реального времени
function setupRealtimeListeners() {
    console.log('🔔 Настройка слушателей реального времени Supabase...');
    
    // Слушатель для игр
    supabase
        .channel('games-changes')
        .on('postgres_changes', 
            { event: '*', schema: 'public', table: 'games' },
            (payload) => {
                console.log('🔄 Обновление игр из Supabase:', payload);
                loadGames();
            }
        )
        .subscribe();

    // Слушатель для цены
    supabase
        .channel('price-changes')
        .on('postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'settings', filter: 'id=eq.price' },
            (payload) => {
                console.log('🔄 Обновление курса из Supabase:', payload);
                updatePriceDisplay(payload.new);
            }
        )
        .subscribe();

    // Слушатель для новостей
    supabase
        .channel('news-changes')
        .on('postgres_changes',
            { event: '*', schema: 'public', table: 'news' },
            (payload) => {
                console.log('🔄 Обновление новостей из Supabase:', payload);
                loadNews();
            }
        )
        .subscribe();
}

async function loadAllData() {
    try {
        console.log('🔄 Загрузка данных из Supabase...');
        
        // Настраиваем слушатели реального времени
        setupRealtimeListeners();
        
        // Загружаем начальные данные
        await Promise.all([
            loadGames(),
            loadPriceData(),
            loadNews()
        ]);

        console.log('✅ Данные загружены из Supabase');
        
    } catch (error) {
        console.log('⚠️ Ошибка Supabase:', error);
        showNotification('Используем кешированные данные', 'info');
        loadCachedData();
    }
}

async function loadGames() {
    try {
        const { data: games, error } = await supabase
            .from('games')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        displayGames(games || []);
        updateCache('games', games);
        return games;
        
    } catch (error) {
        console.error('Ошибка загрузки игр:', error);
        return [];
    }
}

async function loadPriceData() {
    try {
        const { data: price, error } = await supabase
            .from('settings')
            .select('*')
            .eq('id', 'price')
            .single();

        if (error) throw error;

        updatePriceDisplay(price || getDefaultPrice());
        updateCache('price', price);
        return price;
        
    } catch (error) {
        console.error('Ошибка загрузки курса:', error);
        return getDefaultPrice();
    }
}

async function loadNews() {
    try {
        const { data: news, error } = await supabase
            .from('news')
            .select('*')
            .eq('is_published', true)
            .order('publish_date', { ascending: false });

        if (error) throw error;

        displayNews(news || []);
        updateCache('news', news);
        return news;
        
    } catch (error) {
        console.error('Ошибка загрузки новостей:', error);
        return [];
    }
}

function updateCache(type, data) {
    const cached = JSON.parse(localStorage.getItem('cached_data') || '{}');
    cached[type] = data;
    cached.cache_time = Date.now();
    localStorage.setItem('cached_data', JSON.stringify(cached));
}

function loadCachedData() {
    const cached = localStorage.getItem('cached_data');
    if (cached) {
        const data = JSON.parse(cached);
        displayGames(data.games || []);
        updatePriceDisplay(data.price || getDefaultPrice());
        displayNews(data.news || []);
    } else {
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
            image_url: "https://placehold.co/100x100/667eea/white?text=HG",
            game_url: "https://t.me/Hamster_GAme_Dev_bot/start?startapp=kentId6823288584",
            players_count: "12.8K",
            is_beta: true
        }
    ];
}

function getDefaultPrice() {
    return {
        hmstr_price: 0.000621,
        price_change: 2.34,
        market_cap: "12.5",
        volume_24h: "1.2"
    };
}

function getDefaultNews() {
    return [
        {
            id: "1", 
            title: "Добро пожаловать в Hamster Verse!",
            content: "Запущена новая игровая платформа с лучшими играми",
            publish_date: new Date().toISOString(),
            image_url: ""
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
                <img src="${game.image_url}" alt="${game.name}" class="game-avatar" 
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIGZpbGw9IiM2NjdlZWEiLz4KPC9zdmc+'">
            </div>
            <div class="game-info">
                <div class="game-header">
                    <h3>${game.name}</h3>
                    ${game.is_beta ? '<span class="game-beta">Beta</span>' : ''}
                </div>
                <p>${game.description}</p>
                <div class="game-players">👥 ${game.players_count} игроков</div>
            </div>
            <button class="play-button" data-url="${game.game_url}">
                Играть
            </button>
        </div>
    `).join('');
    
    setupGameButtons();
}

function updatePriceDisplay(priceData) {
    if (!priceData) return;
    
    document.getElementById('hmstr-price-usd').textContent = `~$${priceData.hmstr_price?.toFixed(6) || '0.000000'}`;
    
    const changeValue = priceData.price_change || 0;
    document.getElementById('hmstr-change-usd').textContent = `${changeValue >= 0 ? '+' : ''}${changeValue.toFixed(2)}%`;
    document.getElementById('hmstr-change-usd').className = `change ${changeValue >= 0 ? 'positive' : 'negative'}`;
    
    document.getElementById('market-cap').textContent = `~$${priceData.market_cap || '0'}M`;
    document.getElementById('volume-24h').textContent = `~$${priceData.volume_24h || '0'}M`;
}

function displayNews(news) {
    const container = document.getElementById('news-container');
    
    if (!news || news.length === 0) {
        container.innerHTML = '<div class="news-item"><p>Новости временно недоступны</p></div>';
        return;
    }
    
    container.innerHTML = news.map(item => `
        <div class="news-item">
            <span class="news-date">${formatDate(item.publish_date)}</span>
            <div class="news-title">${item.title}</div>
            <div class="news-content">${item.content}</div>
            ${item.image_url ? `<img src="${item.image_url}" alt="News image" class="news-image">` : ''}
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
            
            // Убираем активный класс у всех кнопок
            navItems.forEach(nav => nav.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Скрываем все секции
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Показываем целевую секцию
            const targetElement = document.getElementById(targetSection);
            if (targetElement) {
                targetElement.classList.add('active');
            }
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
    if (!themeToggle) return;
    
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
    if (!shareButton) return;
    
    shareButton.addEventListener('click', shareApp);
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
    if (!feedbackButton) return;
    
    feedbackButton.addEventListener('click', openFeedbackModal);
}

function openFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    setTimeout(() => {
        const textarea = document.getElementById('feedback-text');
        if (textarea) textarea.focus();
    }, 100);
}

function closeFeedbackModal() {
    const modal = document.getElementById('feedback-modal');
    if (!modal) return;
    
    modal.classList.add('closing');
    
    setTimeout(() => {
        modal.classList.add('hidden');
        modal.classList.remove('closing');
    }, 300);
}

function sendFeedback() {
    const textarea = document.getElementById('feedback-text');
    if (!textarea) return;
    
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
    if (!adminContainer) return;
    
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
    if (!dateString) return '';
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

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
    
    checkAnnouncementState();
    
    // Добавляем обработчики для модального окна
    const closeModalBtn = document.querySelector('.close-modal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeFeedbackModal);
    }
    
    const modalOverlay = document.getElementById('feedback-modal');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                closeFeedbackModal();
            }
        });
    }
});
