// Конфигурация админской панели
const ADMIN_CONFIG = {
    version: '1.0.0',
    storageKeys: {
        announcements: 'admin_announcements',
        news: 'admin_news',
        games: 'admin_games',
        tokenData: 'admin_token_data',
        settings: 'admin_settings'
    },
    apiEndpoints: {
        price: 'https://api.dexscreener.com/latest/dex/search?q=HMSTR',
        stats: '/api/stats'
    }
};

// Инициализация админки
document.addEventListener('DOMContentLoaded', function() {
    initializeAdminPanel();
});

function initializeAdminPanel() {
    setupAdminNavigation();
    setupFormHandlers();
    loadDashboardData();
    loadAnnouncements();
    loadNews();
    loadGames();
    loadTokenData();
    setupAutoSave();
    setupCharts();
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
    
    // Кнопки сохранения
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

// Загрузка данных
function loadDashboardData() {
    // Загрузка статистики пользователей
    loadUserStats();
    
    // Загрузка статистики игр
    loadGamesStats();
    
    // Загрузка данных токена
    updateTokenDisplay();
}

function loadUserStats() {
    // В реальном приложении здесь был бы API запрос
    const totalUsers = Math.floor(15000 + Math.random() * 35000);
    document.getElementById('total-users').textContent = formatNumber(totalUsers);
}

function loadGamesStats() {
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
        container.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Нет активных анонсов</td></tr>';
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
    const text = document.getElementById('announcement-text').value;
    const type = document.getElementById('announcement-type').value;
    const active = document.getElementById('announcement-active').checked;
    
    if (!text.trim()) {
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
    
    showNotification('Успех', 'Анонс сохранен', 'success');
    loadAnnouncements();
}

function previewAnnouncement() {
    const text = document.getElementById('announcement-text').value;
    const type = document.getElementById('announcement-type').value;
    
    if (!text.trim()) {
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
        container.innerHTML = '<tr><td colspan="4" style="text-align: center; color: var(--text-secondary);">Нет опубликованных новостей</td></tr>';
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
    const title = document.getElementById('news-title').value;
    const content = document.getElementById('news-content').value;
    const type = document.getElementById('news-type').value;
    
    if (!title.trim() || !content.trim()) {
        showNotification('Ошибка', 'Заполните все поля', 'error');
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
    
    showNotification('Успех', 'Новость опубликована', 'success');
    loadNews();
    loadGamesStats(); // Обновляем счетчик новостей
}

function previewNews() {
    const title = document.getElementById('news-title').value;
    const content = document.getElementById('news-content').value;
    
    if (!title.trim() || !content.trim()) {
        showNotification('Ошибка', 'Заполните все поля для предпросмотра', 'error');
        return;
    }
    
    showNotification('Предпросмотр новости', `<strong>${title}</strong><br>${content}`, 'info');
}

// Управление играми
function loadGames() {
    const games = getGames();
    const container = document.getElementById('games-list');
    
    container.innerHTML = games.map(game => `
        <tr>
            <td>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <img src="${game.image}" alt="${game.name}" style="width: 40px; height: 40px; border-radius: 8px;">
                    <div>
                        <strong>${game.name}</strong>
                        ${game.tag ? `<span class="game-tag">${game.tag}</span>` : ''}
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
    const name = document.getElementById('game-name').value;
    const tag = document.getElementById('game-tag').value;
    const description = document.getElementById('game-description').value;
    const image = document.getElementById('game-image').value;
    const url = document.getElementById('game-url').value;
    
    if (!name.trim() || !description.trim() || !image.trim() || !url.trim()) {
        showNotification('Ошибка', 'Заполните все обязательные поля', 'error');
        return;
    }
    
    const games = getGames();
    const newGame = {
        id: generateId(),
        name: name,
        tag: tag,
        description: description,
        image: image,
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
    
    showNotification('Успех', 'Игра добавлена', 'success');
    loadGames();
    loadGamesStats();
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
        // Используем API из основного приложения
        const response = await fetch('https://api.dexscreener.com/latest/dex/search?q=HMSTR');
        const data = await response.json();
        
        if (data.pairs && data.pairs.length > 0) {
            const pair = data.pairs[0];
            const usdPrice = parseFloat(pair.priceUsd);
            const change24h = parseFloat(pair.priceChange?.h24 || 0);
            
            document.getElementById('hmstr-usd').value = usdPrice;
            document.getElementById('hmstr-change').value = change24h;
            
            showNotification('Успех', 'Данные успешно обновлены', 'success');
        }
    } catch (error) {
        console.error('Ошибка получения данных:', error);
        showNotification('Ошибка', 'Не удалось обновить данные', 'error');
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
    
    showNotification('Успех', 'Цены токена обновлены', 'success');
}

function updateTokenDisplay() {
    const tokenData = getTokenData();
    
    if (tokenData) {
        const rubPrice = tokenData.usdPrice * tokenData.usdToRubRate;
        
        document.getElementById('current-usd').textContent = `$${tokenData.usdPrice.toFixed(6)}`;
        document.getElementById('current-rub').textContent = `${rubPrice.toFixed(4)} ₽`;
        document.getElementById('current-change').textContent = `${tokenData.change24h >= 0 ? '+' : ''}${tokenData.change24h.toFixed(2)}%`;
        document.getElementById('current-change').className = `data-value ${tokenData.change24h >= 0 ? 'positive' : 'negative'}`;
        document.getElementById('last-update').textContent = formatDate(tokenData.lastUpdated);
        
        document.getElementById('hmstr-price').textContent = `$${tokenData.usdPrice.toFixed(6)}`;
    }
}

// Графики
function setupCharts() {
    setupUsersChart();
    setupGamesChart();
}

function setupUsersChart() {
    const ctx = document.getElementById('users-chart').getContext('2d');
    
    // Заглушка для графика - в реальном приложении здесь были бы реальные данные
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
            datasets: [{
                label: 'Новые пользователи',
                data: [65, 59, 80, 81, 56, 55, 40],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

function setupGamesChart() {
    const ctx = document.getElementById('games-chart').getContext('2d');
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Hamster GameDev', 'Hamster King', 'Hamster Fight Club', 'BitQuest'],
            datasets: [{
                data: [30, 25, 20, 25],
                backgroundColor: [
                    '#3b82f6',
                    '#6366f1',
                    '#8b5cf6',
                    '#ec4899'
                ]
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
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
    
    // Если нет кастомных игр, возвращаем стандартные
    if (customGames.length === 0) {
        return [
            {
                id: '1',
                name: 'Hamster GameDev',
                tag: 'Beta',
                description: 'Создай игровую студию',
                image: 'images/hamster-gamedev.jpg',
                url: 'https://t.me/Hamster_GAme_Dev_bot/start?startapp=kentId6823288584'
            },
            {
                id: '2',
                name: 'Hamster King',
                description: 'Стань королём в битвах',
                image: 'images/hamster-king.jpg',
                url: 'https://t.me/hamsterking_game_bot?startapp=6823288584'
            },
            {
                id: '3',
                name: 'Hamster Fight Club',
                description: 'Бойцовский клуб',
                image: 'images/hamstr-fight-club.jpg',
                url: 'https://t.me/hamster_fightclub_bot?startapp=NWE1YjA2YWUtZTAyYS01ZjA1LTg4ZTYtMGZmZjUwNDQwNjU5'
            },
            {
                id: '4',
                name: 'BitQuest',
                description: 'Крипто-приключение',
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
        'maintenance': '🔧 Техработы'
    };
    return types[type] || type;
}

function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
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
        notification.remove();
    }, 5000);
}

function saveAllData() {
    showNotification('Сохранение', 'Все данные успешно сохранены', 'success');
}

function logout() {
    if (confirm('Вы уверены, что хотите выйти из админской панели?')) {
        window.location.href = 'index.html';
    }
}

function setupAutoSave() {
    // Автосохранение каждые 30 секунд
    setInterval(saveAllData, 30000);
}

// Функции для действий в таблицах (заглушки)
function editAnnouncement(id) {
    showNotification('Редактирование', `Редактирование анонса ${id}`, 'info');
}

function deleteAnnouncement(id) {
    if (confirm('Вы уверены, что хотите удалить этот анонс?')) {
        const announcements = getAnnouncements().filter(a => a.id !== id);
        saveAnnouncements(announcements);
        loadAnnouncements();
        showNotification('Успех', 'Анонс удален', 'success');
    }
}

function editNews(id) {
    showNotification('Редактирование', `Редактирование новости ${id}`, 'info');
}

function deleteNews(id) {
    if (confirm('Вы уверены, что хотите удалить эту новость?')) {
        const news = getNews().filter(n => n.id !== id);
        saveNews(news);
        loadNews();
        loadGamesStats();
        showNotification('Успех', 'Новость удалена', 'success');
    }
}

function editGame(id) {
    showNotification('Редактирование', `Редактирование игры ${id}`, 'info');
}

function deleteGame(id) {
    if (confirm('Вы уверены, что хотите удалить эту игру?')) {
        const games = getGames().filter(g => g.id !== id);
        saveGames(games);
        loadGames();
        loadGamesStats();
        showNotification('Успех', 'Игра удалена', 'success');
    }
}
