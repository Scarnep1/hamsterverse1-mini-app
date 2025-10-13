// Конфигурация админ-панели
const ADMIN_CONFIG = {
    version: '1.0.0',
    storageKeys: {
        announcements: 'admin_announcements',
        news: 'admin_news',
        games: 'admin_games',
        tokenData: 'admin_token_data',
        settings: 'admin_settings'
    }
};

// Инициализация админ-панели
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

function initializeAdminPanel() {
    checkAdminAccess();
    setupAdminNavigation();
    setupFormHandlers();
    loadDashboardData();
    loadAnnouncements();
    loadNews();
    loadGames();
    loadTokenData();
    loadSettings();
    setupCharts();
    
    console.log('Admin Panel v' + ADMIN_CONFIG.version + ' initialized');
}

// Проверка доступа к админ-панели
function checkAdminAccess() {
    const isAdmin = localStorage.getItem('is_admin') === 'true';
    if (!isAdmin) {
        alert('Доступ запрещен. Пожалуйста, войдите через основное приложение.');
        window.location.href = 'index.html';
    }
}

// Навигация по вкладкам
function setupAdminNavigation() {
    const sidebarItems = document.querySelectorAll('.sidebar-item');
    
    sidebarItems.forEach(item => {
        item.addEventListener('click', function() {
            const targetTab = this.getAttribute('data-tab');
            
            // Обновляем активные элементы
            sidebarItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            // Показываем соответствующую вкладку
            const tabs = document.querySelectorAll('.admin-tab');
            tabs.forEach(tab => tab.classList.remove('active'));
            
            const targetElement = document.getElementById(`${targetTab}-tab`);
            if (targetElement) {
                targetElement.classList.add('active');
            }
        });
    });
}

// Обработчики форм
function setupFormHandlers() {
    // Анонсы
    setupAnnouncementForm();
    
    // Новости
    setupNewsForm();
    
    // Игры
    setupGamesForm();
    
    // Токен
    setupTokenForm();
    
    // Настройки
    setupSettingsForm();
    
    // Общие кнопки
    document.getElementById('save-btn').addEventListener('click', saveAllData);
    document.getElementById('logout-btn').addEventListener('click', logout);
}

function setupAnnouncementForm() {
    const textInput = document.getElementById('announcement-text');
    const charCount = document.getElementById('announcement-chars');
    
    textInput.addEventListener('input', function() {
        charCount.textContent = this.value.length;
    });
    
    document.getElementById('save-announcement').addEventListener('click', saveAnnouncement);
    document.getElementById('preview-announcement').addEventListener('click', previewAnnouncement);
}

function setupNewsForm() {
    const titleInput = document.getElementById('news-title');
    const contentInput = document.getElementById('news-content');
    const titleChars = document.getElementById('news-title-chars');
    const contentChars = document.getElementById('news-content-chars');
    
    titleInput.addEventListener('input', function() {
        titleChars.textContent = this.value.length;
    });
    
    contentInput.addEventListener('input', function() {
        contentChars.textContent = this.value.length;
    });
    
    document.getElementById('publish-news').addEventListener('click', publishNews);
    document.getElementById('preview-news').addEventListener('click', previewNews);
}

function setupGamesForm() {
    document.getElementById('add-game').addEventListener('click', addGame);
}

function setupTokenForm() {
    document.getElementById('save-prices').addEventListener('click', saveTokenPrices);
    document.getElementById('fetch-prices').addEventListener('click', fetchRealPrices);
}

function setupSettingsForm() {
    document.getElementById('save-settings').addEventListener('click', saveSettings);
}

// Загрузка данных дашборда
function loadDashboardData() {
    // Статистика пользователей
    updateUserStats();
    
    // Статистика игр
    updateGamesStats();
    
    // Данные токена
    updateTokenDisplay();
}

function updateUserStats() {
    // В реальном приложении здесь был бы API запрос
    const totalUsers = localStorage.getItem('total_users') || '15,247';
    document.getElementById('total-users').textContent = totalUsers;
}

function updateGamesStats() {
    const games = getGames();
    document.getElementById('active-games').textContent = games.length;
    
    const news = getNews();
    document.getElementById('total-news').textContent = news.length;
}

// Управление анонсами
function loadAnnouncements() {
    const announcements = getAnnouncements();
    const container = document.getElementById('announcements-list');
    
    if (announcements.length === 0) {
        container.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Нет активных анонсов</td></tr>';
        return;
    }
    
    container.innerHTML = announcements.map(announcement => `
        <tr>
            <td>${announcement.text}</td>
            <td>
                <span class="announcement-type ${announcement.type}">
                    ${getAnnouncementTypeLabel(announcement.type)}
                </span>
            </td>
            <td>
                <span class="status ${announcement.active ? 'active' : 'inactive'}">
                    ${announcement.active ? 'Активен' : 'Неактивен'}
                </span>
            </td>
            <td class="table-actions">
                <button class="table-btn edit" onclick="editAnnouncement('${announcement.id}')">
                    Редактировать
                </button>
                <button class="table-btn delete" onclick="deleteAnnouncement('${announcement.id}')">
                    Удалить
                </button>
            </td>
        </tr>
    `).join('');
}

function saveAnnouncement() {
    const text = document.getElementById('announcement-text').value.trim();
    const type = document.getElementById('announcement-type').value;
    const active = document.getElementById('announcement-active').checked;
    
    if (!text) {
        showNotification('Ошибка', 'Введите текст анонса', 'error');
        return;
    }
    
    const announcements = getAnnouncements();
    const newAnnouncement = {
        id: generateId(),
        text: text,
        type: type,
        active: active,
        createdAt: new Date().toISOString()
    };
    
    announcements.push(newAnnouncement);
    saveAnnouncements(announcements);
    
    // Очищаем форму
    document.getElementById('announcement-text').value = '';
    document.getElementById('announcement-chars').textContent = '0';
    
    showNotification('Успех', 'Анонс успешно сохранен', 'success');
    loadAnnouncements();
}

function previewAnnouncement() {
    const text = document.getElementById('announcement-text').value.trim();
    const type = document.getElementById('announcement-type').value;
    
    if (!text) {
        showNotification('Ошибка', 'Введите текст для предпросмотра', 'error');
        return;
    }
    
    showNotification('Предпросмотр анонса', text, 'info');
}

// Управление новостями
function loadNews() {
    const news = getNews();
    const container = document.getElementById('news-list');
    
    if (news.length === 0) {
        container.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Нет опубликованных новостей</td></tr>';
        return;
    }
    
    container.innerHTML = news.map(item => `
        <tr>
            <td>${item.title}</td>
            <td>
                <span class="news-type ${item.type}">
                    ${getNewsTypeLabel(item.type)}
                </span>
            </td>
            <td>${formatDate(item.date)}</td>
            <td class="table-actions">
                <button class="table-btn edit" onclick="editNews('${item.id}')">
                    Редактировать
                </button>
                <button class="table-btn delete" onclick="deleteNews('${item.id}')">
                    Удалить
                </button>
            </td>
        </tr>
    `).join('');
}

function publishNews() {
    const title = document.getElementById('news-title').value.trim();
    const content = document.getElementById('news-content').value.trim();
    const type = document.getElementById('news-type').value;
    
    if (!title || !content) {
        showNotification('Ошибка', 'Заполните все обязательные поля', 'error');
        return;
    }
    
    const news = getNews();
    const newNews = {
        id: generateId(),
        title: title,
        content: content,
        type: type,
        date: new Date().toISOString()
    };
    
    news.unshift(newNews);
    saveNews(news);
    
    // Очищаем форму
    document.getElementById('news-title').value = '';
    document.getElementById('news-content').value = '';
    document.getElementById('news-title-chars').textContent = '0';
    document.getElementById('news-content-chars').textContent = '0';
    
    showNotification('Успех', 'Новость успешно опубликована', 'success');
    loadNews();
    updateGamesStats();
}

function previewNews() {
    const title = document.getElementById('news-title').value.trim();
    const content = document.getElementById('news-content').value.trim();
    
    if (!title || !content) {
        showNotification('Ошибка', 'Заполните все поля для предпросмотра', 'error');
        return;
    }
    
    showNotification('Предпросмотр новости', `<strong>${title}</strong><br><br>${content}`, 'info');
}

// Управление играми
function loadGames() {
    const games = getGames();
    const container = document.getElementById('games-list');
    
    container.innerHTML = games.map(game => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="width: 40px; height: 40px; border-radius: 8px; background: #667eea; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                        ${game.name.charAt(0)}
                    </div>
                    <div>
                        <strong>${game.name}</strong>
                        ${game.tag ? `<span style="background: #667eea; color: white; padding: 2px 6px; border-radius: 8px; font-size: 10px; margin-left: 8px;">${game.tag}</span>` : ''}
                    </div>
                </div>
            </td>
            <td>${game.description}</td>
            <td>
                <code style="font-size: 0.75rem; background: var(--bg-primary); padding: 0.25rem 0.5rem; border-radius: 0.25rem;">
                    ${game.url.substring(0, 30)}...
                </code>
            </td>
            <td class="table-actions">
                <button class="table-btn edit" onclick="editGame('${game.id}')">
                    Редактировать
                </button>
                <button class="table-btn delete" onclick="deleteGame('${game.id}')">
                    Удалить
                </button>
            </td>
        </tr>
    `).join('');
}

function addGame() {
    const name = document.getElementById('game-name').value.trim();
    const tag = document.getElementById('game-tag').value.trim();
    const description = document.getElementById('game-description').value.trim();
    const image = document.getElementById('game-image').value.trim();
    const url = document.getElementById('game-url').value.trim();
    
    if (!name || !description || !url) {
        showNotification('Ошибка', 'Заполните все обязательные поля', 'error');
        return;
    }
    
    const games = getGames();
    const newGame = {
        id: generateId(),
        name: name,
        tag: tag,
        description: description,
        image: image || `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIHZpZXdCb3g9IjAgMCA1MCA1MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiByeD0iMTIiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSIxMiIgeT0iMTIiIHdpZHRoPSIyNiIgaGVpZ2h0PSIyNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJNMTIgMTNWMTVNMTIgN1Y3TTQgMTJIMjBNMTIgMjBWMjBNMTIgMTZWMTZNOCA4TDUgNU04IDhMMTIgNE04IDE2TDEyIDIwTTggMTZMMTUgOU0xNiA4TDE5IDVNMTYgOEwyMCA0TTE2IDE2TDIwIDEyTTE2IDE2TDEyIDIwIiBzdHJva2UtbGluZWNhcD0icm91bmQiLz4KPC9zdmc+Cjwvc3ZnPgo=`,
        url: url
    };
    
    games.push(newGame);
    saveGames(games);
    
    // Очищаем форму
    document.getElementById('game-name').value = '';
    document.getElementById('game-tag').value = '';
    document.getElementById('game-description').value = '';
    document.getElementById('game-image').value = '';
    document.getElementById('game-url').value = '';
    
    showNotification('Успех', 'Игра успешно добавлена', 'success');
    loadGames();
    updateGamesStats();
}

// Управление данными токена
function loadTokenData() {
    const tokenData = getTokenData();
    
    if (tokenData) {
        document.getElementById('hmstr-usd').value = tokenData.usdPrice || '';
        document.getElementById('hmstr-change').value = tokenData.change24h || '';
        document.getElementById('usd-rub-rate').value = tokenData.usdToRubRate || '';
        
        updateTokenDisplay();
    }
}

async function fetchRealPrices() {
    showNotification('Информация', 'Обновление данных с бирж...', 'info');
    
    try {
        // Имитация API запроса
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Случайные данные для демонстрации
        const usdPrice = 0.000621 + (Math.random() - 0.5) * 0.0001;
        const change24h = (Math.random() - 0.5) * 10;
        const usdToRubRate = 90 + (Math.random() - 0.5) * 5;
        
        document.getElementById('hmstr-usd').value = usdPrice.toFixed(6);
        document.getElementById('hmstr-change').value = change24h.toFixed(2);
        document.getElementById('usd-rub-rate').value = usdToRubRate.toFixed(2);
        
        showNotification('Успех', 'Данные успешно обновлены с бирж', 'success');
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        showNotification('Ошибка', 'Не удалось обновить данные с бирж', 'error');
    }
}

function saveTokenPrices() {
    const usdPrice = parseFloat(document.getElementById('hmstr-usd').value);
    const change24h = parseFloat(document.getElementById('hmstr-change').value);
    const usdToRubRate = parseFloat(document.getElementById('usd-rub-rate').value);
    
    if (isNaN(usdPrice) || isNaN(change24h) || isNaN(usdToRubRate)) {
        showNotification('Ошибка', 'Введите корректные числовые значения', 'error');
        return;
    }
    
    const tokenData = {
        usdPrice: usdPrice,
        change24h: change24h,
        usdToRubRate: usdToRubRate,
        lastUpdated: new Date().toISOString()
    };
    
    saveTokenData(tokenData);
    updateTokenDisplay();
    
    showNotification('Успех', 'Цены токена успешно обновлены', 'success');
}

function updateTokenDisplay() {
    const tokenData = getTokenData();
    
    if (tokenData) {
        const rubPrice = tokenData.usdPrice * tokenData.usdToRubRate;
        
        document.getElementById('current-usd').textContent = `$${tokenData.usdPrice.toFixed(6)}`;
        document.getElementById('current-rub').textContent = `${rubPrice.toFixed(3)} ₽`;
        document.getElementById('current-change').textContent = `${tokenData.change24h >= 0 ? '+' : ''}${tokenData.change24h.toFixed(2)}%`;
        document.getElementById('current-change').className = `data-value ${tokenData.change24h >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('last-update').textContent = formatDate(tokenData.lastUpdated);
        
        document.getElementById('hmstr-price').textContent = `$${tokenData.usdPrice.toFixed(6)}`;
    }
}

// Настройки
function loadSettings() {
    const settings = getSettings();
    
    if (settings) {
        document.getElementById('platform-name').value = settings.platformName || 'Hamster Verse';
        document.getElementById('platform-description').value = settings.platformDescription || 'Ваша игровая вселенная';
        document.getElementById('enable-ratings').checked = settings.enableRatings !== false;
        document.getElementById('enable-news').checked = settings.enableNews !== false;
    }
}

function saveSettings() {
    const settings = {
        platformName: document.getElementById('platform-name').value,
        platformDescription: document.getElementById('platform-description').value,
        enableRatings: document.getElementById('enable-ratings').checked,
        enableNews: document.getElementById('enable-news').checked,
        lastUpdated: new Date().toISOString()
    };
    
    saveSettingsData(settings);
    showNotification('Успех', 'Настройки успешно сохранены', 'success');
}

// Графики
function setupCharts() {
    setupUsersChart();
    setupGamesChart();
}

function setupUsersChart() {
    const ctx = document.getElementById('users-chart');
    if (!ctx) return;
    
    // Простой график для демонстрации
    ctx.innerHTML = `
        <div style="display: flex; align-items: end; justify-content: center; height: 100%; gap: 8px; padding: 20px;">
            <div style="width: 20px; height: 60%; background: #3b82f6; border-radius: 4px;"></div>
            <div style="width: 20px; height: 80%; background: #3b82f6; border-radius: 4px;"></div>
            <div style="width: 20px; height: 45%; background: #3b82f6; border-radius: 4px;"></div>
            <div style="width: 20px; height: 90%; background: #3b82f6; border-radius: 4px;"></div>
            <div style="width: 20px; height: 70%; background: #3b82f6; border-radius: 4px;"></div>
            <div style="width: 20px; height: 85%; background: #3b82f6; border-radius: 4px;"></div>
            <div style="width: 20px; height: 95%; background: #3b82f6; border-radius: 4px;"></div>
        </div>
        <div style="text-align: center; color: var(--text-secondary); margin-top: 10px;">
            Активность пользователей за неделю
        </div>
    `;
}

function setupGamesChart() {
    const ctx = document.getElementById('games-chart');
    if (!ctx) return;
    
    // Простая круговая диаграмма для демонстрации
    ctx.innerHTML = `
        <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 10px;">
            <div style="display: flex; gap: 15px; flex-wrap: wrap; justify-content: center;">
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width: 12px; height: 12px; background: #3b82f6; border-radius: 50%;"></div>
                    <span style="font-size: 12px;">Hamster GameDev (30%)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width: 12px; height: 12px; background: #6366f1; border-radius: 50%;"></div>
                    <span style="font-size: 12px;">Hamster King (25%)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width: 12px; height: 12px; background: #8b5cf6; border-radius: 50%;"></div>
                    <span style="font-size: 12px;">Fight Club (20%)</span>
                </div>
                <div style="display: flex; align-items: center; gap: 5px;">
                    <div style="width: 12px; height: 12px; background: #ec4899; border-radius: 50%;"></div>
                    <span style="font-size: 12px;">BitQuest (25%)</span>
                </div>
            </div>
            <div style="text-align: center; color: var(--text-secondary); margin-top: 10px;">
                Распределение пользователей по играм
            </div>
        </div>
    `;
}

// Вспомогательные функции
function getAnnouncements() {
    return JSON.parse(localStorage.getItem(ADMIN_CONFIG.storageKeys.announcements) || '[]');
}

function saveAnnouncements(announcements) {
    localStorage.setItem(ADMIN_CONFIG.storageKeys.announcements, JSON.stringify(announcements));
}

function getNews() {
    return JSON.parse(localStorage.getItem(ADMIN_CONFIG.storageKeys.news) || '[]');
}

function saveNews(news) {
    localStorage.setItem(ADMIN_CONFIG.storageKeys.news, JSON.stringify(news));
}

function getGames() {
    const customGames = JSON.parse(localStorage.getItem(ADMIN_CONFIG.storageKeys.games) || '[]');
    
    if (customGames.length === 0) {
        return [
            {
                id: '1',
                name: 'Hamster GameDev',
                tag: 'Beta',
                description: 'Создай игровую студию и стань лидером',
                image: 'images/hamster-gamedev.jpg',
                url: 'https://t.me/Hamster_GAme_Dev_bot/start?startapp=kentId6823288584'
            },
            {
                id: '2',
                name: 'Hamster King',
                description: 'Стань королём в эпических битвах',
                image: 'images/hamster-king.jpg',
                url: 'https://t.me/hamsterking_game_bot?startapp=6823288584'
            },
            {
                id: '3',
                name: 'Hamster Fight Club',
                description: 'Бойцовский клуб для чемпионов',
                image: 'images/hamstr-fight-club.jpg',
                url: 'https://t.me/hamster_fightclub_bot?startapp=NWE1YjA2YWUtZTAyYS01ZjA1LTg4ZTYtMGZmZjUwNDQwNjU5'
            },
            {
                id: '4',
                name: 'BitQuest',
                description: 'Крипто-приключение с наградами',
                image: 'images/bitquest.jpg',
                url: 'https://t.me/BitquestgamesBot/start?startapp=kentId_6823288584'
            }
        ];
    }
    
    return customGames;
}

function saveGames(games) {
    localStorage.setItem(ADMIN_CONFIG.storageKeys.games, JSON.stringify(games));
}

function getTokenData() {
    return JSON.parse(localStorage.getItem(ADMIN_CONFIG.storageKeys.tokenData));
}

function saveTokenData(tokenData) {
    localStorage.setItem(ADMIN_CONFIG.storageKeys.tokenData, JSON.stringify(tokenData));
}

function getSettings() {
    return JSON.parse(localStorage.getItem(ADMIN_CONFIG.storageKeys.settings));
}

function saveSettingsData(settings) {
    localStorage.setItem(ADMIN_CONFIG.storageKeys.settings, JSON.stringify(settings));
}

function getAnnouncementTypeLabel(type) {
    const types = {
        'info': '📢 Информация',
        'warning': '⚠️ Предупреждение',
        'success': '🎉 Обновление',
        'error': '❌ Проблема'
    };
    return types[type] || type;
}

function getNewsTypeLabel(type) {
    const types = {
        'update': '🔄 Обновление',
        'announcement': '📢 Анонс',
        'event': '🎉 Событие',
        'maintenance': '🔧 Технические работы'
    };
    return types[type] || type;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showNotification(title, message, type = 'info') {
    const notifications = document.getElementById('admin-notifications');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    
    notification.innerHTML = `
        <div class="notification-icon">${icons[type]}</div>
        <div class="notification-content">
            <div class="notification-title">${title}</div>
            <div class="notification-message">${message}</div>
        </div>
    `;
    
    notifications.appendChild(notification);
    
    // Автоматическое удаление уведомления через 5 секунд
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 5000);
}

function saveAllData() {
    showNotification('Сохранение', 'Все данные успешно сохранены', 'success');
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти из админ-панели?')) {
        window.location.href = 'index.html';
    }
}

// Функции для действий в таблицах
function editAnnouncement(id) {
    showNotification('Редактирование', `Редактирование анонса ${id}`, 'info');
    // В реальном приложении здесь была бы форма редактирования
}

function deleteAnnouncement(id) {
    if (confirm('Вы уверены, что хотите удалить этот анонс?')) {
        const announcements = getAnnouncements().filter(a => a.id !== id);
        saveAnnouncements(announcements);
        loadAnnouncements();
        showNotification('Успех', 'Анонс успешно удален', 'success');
    }
}

function editNews(id) {
    showNotification('Редактирование', `Редактирование новости ${id}`, 'info');
    // В реальном приложении здесь была бы форма редактирования
}

function deleteNews(id) {
    if (confirm('Вы уверены, что хотите удалить эту новость?')) {
        const news = getNews().filter(n => n.id !== id);
        saveNews(news);
        loadNews();
        updateGamesStats();
        showNotification('Успех', 'Новость успешно удалена', 'success');
    }
}

function editGame(id) {
    showNotification('Редактирование', `Редактирование игры ${id}`, 'info');
    // В реальном приложении здесь была бы форма редактирования
}

function deleteGame(id) {
    if (confirm('Вы уверены, что хотите удалить эту игру?')) {
        const games = getGames().filter(g => g.id !== id);
        saveGames(games);
        loadGames();
        updateGamesStats();
        showNotification('Успех', 'Игра успешно удалена', 'success');
    }
}
