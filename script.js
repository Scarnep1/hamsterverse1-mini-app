// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupPlayButtons();
    setupTelegramIntegration();
    setupThemeToggle();
}

// Навигация
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
            document.getElementById(targetSection).classList.add('active');
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
    
    // Также делаем кликабельными всю карточку игры
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('click', function() {
            const playButton = this.querySelector('.play-button');
            const url = playButton.getAttribute('data-url');
            openGame(url);
        });
    });
}

// Функция открытия игры
function openGame(url) {
    // Показываем уведомление о запуске
    showGameLaunchMessage();
    
    // Открываем игру
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank');
    }
}

// Показываем сообщение о запуске игры
function showGameLaunchMessage() {
    // Создаем простое уведомление
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--accent-gradient);
        color: white;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 8px 25px rgba(0,0,0,0.3);
    `;
    notification.textContent = '🚀 Запускаем игру...';
    
    document.body.appendChild(notification);
    
    // Убираем через 1.5 секунды
    setTimeout(() => {
        notification.remove();
    }, 1500);
}

// Интеграция с Telegram
function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        // Расширяем на весь экран
        window.Telegram.WebApp.expand();
        
        // Получаем данные пользователя
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            updateUserProfile(user);
        }
        
        // Устанавливаем тему из Telegram
        if (window.Telegram.WebApp.colorScheme === 'dark') {
            setTheme('dark');
        }
    } else {
        // Демо-данные для браузера
        updateUserProfile({
            first_name: 'Игрок',
            username: 'hamster_fan'
        });
    }
}

// Обновление профиля пользователя
function updateUserProfile(user) {
    const avatar = document.getElementById('tg-avatar');
    const headerAvatar = document.getElementById('user-avatar');
    const name = document.getElementById('tg-name');
    const username = document.getElementById('tg-username');
    
    // Устанавливаем аватар
    if (user.photo_url) {
        avatar.innerHTML = `<img src="${user.photo_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
        headerAvatar.innerHTML = `<img src="${user.photo_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
    } else {
        const initial = user.first_name?.[0] || 'И';
        avatar.textContent = initial;
        headerAvatar.textContent = initial;
    }
    
    // Устанавливаем имя
    if (user.first_name) {
        name.textContent = user.first_name;
    }
    
    // Устанавливаем username
    if (user.username) {
        username.textContent = `@${user.username}`;
    }
}

// Переключение темы
function setupThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const themeText = themeToggle.querySelector('.theme-text');
    
    // Загружаем сохраненную тему или устанавливаем светлую по умолчанию
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
    
    themeToggle.addEventListener('click', function() {
        const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    });
    
    function setTheme(theme) {
        // Устанавливаем тему
        document.documentElement.setAttribute('data-theme', theme);
        
        // Сохраняем в localStorage
        localStorage.setItem('theme', theme);
        
        // Обновляем кнопку
        if (theme === 'dark') {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'Светлая тема';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'Темная тема';
        }
    }
}

// Простая функция для показа временного сообщения
function showTemporaryMessage(message, duration = 2000) {
    const messageEl = document.createElement('div');
    messageEl.style.cssText = `
        position: fixed;
        top: 100px;
        left: 50%;
        transform: translateX(-50%);
        background: var(--accent-gradient);
        color: white;
        padding: 10px 16px;
        border-radius: 10px;
        font-weight: 600;
        z-index: 1001;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    `;
    messageEl.textContent = message;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        messageEl.remove();
    }, duration);
}

// Предотвращаем перетаскивание изображений
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
});
