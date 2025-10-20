// Конфигурация приложения
const APP_CONFIG = {
    version: '2.2.0',
    lastUpdate: new Date().toISOString(),
    adminPassword: 'hamster2024'
};

// Автономное управление курсом
let exchangeRates = {
    hmstr: {
        usd: 0.000621,
        lastUpdate: new Date().toISOString(),
        change24h: 2.34,
        manualMode: true
    }
};

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupPlayButtons();
    setupTelegramIntegration();
    setupPriceData();
    setupGuideButton();
    setupThemeToggle();
    setupNewsSection();
    setupShareButton();
    setupAdminButton();
    setupAutoRefresh();
    setupErrorHandling();
    
    console.log('Hamster Verse v' + APP_CONFIG.version + ' initialized');
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
                loadNews();
            }
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
    
    // Клик по карточке игры
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('click', function(e) {
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
        window.Telegram.WebApp.MainButton.setText('Открыть игры');
        window.Telegram.WebApp.MainButton.show();
        window.Telegram.WebApp.MainButton.onClick(function() {
            switchToSection('games-section');
        });
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
function setupPriceData() {
    loadPriceData();
    
    // Если данные устарели больше чем на 24 часа - обновляем
    const lastUpdate = new Date(exchangeRates.hmstr.lastUpdate);
    const now = new Date();
    const hoursDiff = (now - lastUpdate) / (1000 * 60 * 60);
    
    if (hoursDiff > 24 && !exchangeRates.hmstr.manualMode) {
        generateNewPrice();
    }
    
    updatePriceDisplay();
}

function loadPriceData() {
    const savedData = localStorage.getItem('hmstr_price_data');
    if (savedData) {
        const data = JSON.parse(savedData);
        if (data.usd && data.change) {
            exchangeRates.hmstr = { ...exchangeRates.hmstr, ...data };
        }
    }
}

function savePriceData() {
    localStorage.setItem('hmstr_price_data', JSON.stringify({
        usd: exchangeRates.hmstr.usd,
        change: exchangeRates.hmstr.change24h,
        lastUpdate: exchangeRates.hmstr.lastUpdate,
        manualMode: exchangeRates.hmstr.manualMode
    }));
}

function generateNewPrice() {
    // Реалистичное изменение цены ±15%
    const changePercent = (Math.random() - 0.5) * 30;
    const newPrice = exchangeRates.hmstr.usd * (1 + changePercent / 100);
    
    exchangeRates.hmstr.usd = parseFloat(Math.max(0.000001, newPrice).toFixed(6));
    exchangeRates.hmstr.change24h = parseFloat(changePercent.toFixed(2));
    exchangeRates.hmstr.lastUpdate = new Date().toISOString();
    exchangeRates.hmstr.manualMode = false;
    
    savePriceData();
    updatePriceDisplay();
}

function updatePriceDisplay() {
    const usdPriceElement = document.getElementById('hmstr-price-usd');
    const usdChangeElement = document.getElementById('hmstr-change-usd');
    const marketCapElement = document.getElementById('market-cap');
    const volumeElement = document.getElementById('volume-24h');
    
    if (usdPriceElement) {
        usdPriceElement.textContent = `$${exchangeRates.hmstr.usd.toFixed(6)}`;
    }
    
    if (usdChangeElement) {
        usdChangeElement.textContent = `${exchangeRates.hmstr.change24h >= 0 ? '+' : ''}${exchangeRates.hmstr.change24h.toFixed(2)}%`;
        usdChangeElement.className = `change ${exchangeRates.hmstr.change24h >= 0 ? 'positive' : 'negative'}`;
    }
    
    // Автоматический расчет капитализации и объема
    if (marketCapElement) {
        const marketCap = (exchangeRates.hmstr.usd * 20000000000).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        marketCapElement.textContent = marketCap;
    }
    
    if (volumeElement) {
        const volume = (exchangeRates.hmstr.usd * 2000000).toLocaleString('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        });
        volumeElement.textContent = volume;
    }
}

function refreshPriceData() {
    showPriceLoading(true);
    
    setTimeout(() => {
        if (!exchangeRates.hmstr.manualMode) {
            generateNewPrice();
        }
        showPriceLoading(false);
        showNotification('Курс обновлен', 'success');
    }, 1000);
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

// Новости
function setupNewsSection() {
    loadNews();
}

function loadNews() {
    const newsContainer = document.getElementById('news-container');
    const news = getNewsData();
    
    if (news.length === 0) {
        newsContainer.innerHTML = `
            <div class="news-item">
                <span class="news-date">Сегодня</span>
                <div class="news-title">Добро пожаловать в Hamster Verse!</div>
                <div class="news-content">Здесь будут появляться последние новости и обновления проекта. Следите за обновлениями!</div>
            </div>
        `;
        return;
    }
    
    newsContainer.innerHTML = news.map(item => `
        <div class="news-item">
            <span class="news-date">${formatDate(item.date)}</span>
            <div class="news-title">${item.title}</div>
            <div class="news-content">${item.content}</div>
        </div>
    `).join('');
}

function getNewsData() {
    const adminNews = JSON.parse(localStorage.getItem('admin_news') || '[]');
    
    if (adminNews.length > 0) {
        return adminNews.slice(0, 5).map(item => ({
            date: item.date,
            title: item.title,
            content: item.content || 'Новость от администрации'
        }));
    }
    
    // Заглушки по умолчанию
    return [
        {
            date: new Date().toISOString(),
            title: "Запуск Hamster Verse 2.0",
            content: "Мы рады представить вам обновленную игровую платформу с улучшенным дизайном и новыми функциями!"
        },
        {
            date: new Date(Date.now() - 86400000).toISOString(),
            title: "Новые игры уже доступны",
            content: "Теперь в каталоге доступны все популярные игры от Hamster в одном месте"
        }
    ];
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
        // Fallback - копирование в буфер
        navigator.clipboard.writeText(shareUrl).then(() => {
            showNotification('Ссылка скопирована в буфер!', 'success');
        }).catch(() => {
            showNotification('Скопируйте ссылку вручную: ' + shareUrl, 'info');
        });
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

// Авто-обновление
function setupAutoRefresh() {
    // Обновляем курс каждые 5 минут если не в ручном режиме
    setInterval(() => {
        if (document.querySelector('#hmstr-section.active') && !exchangeRates.hmstr.manualMode) {
            refreshPriceData();
        }
    }, 300000);
}

// Обработка ошибок
function setupErrorHandling() {
    window.addEventListener('error', function(e) {
        console.error('Global error:', e);
    });
    
    window.addEventListener('unhandledrejection', function(e) {
        console.error('Unhandled promise rejection:', e);
    });
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
    // Создаем временное уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'success' ? '#00c851' : type === 'error' ? '#ff4444' : '#667eea'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        animation: slideInRight 0.3s ease;
        font-size: 14px;
        font-weight: 500;
        max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
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
`;
document.head.appendChild(style);
