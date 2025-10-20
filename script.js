const APP_CONFIG = {
    version: '3.1.0',
    lastUpdate: new Date().toISOString()
};

document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupPlayButtons();
    setupTelegramIntegration();
    setupRatingSystem();
    setupReviewSystem();
    setupThemeToggle();
    setupUserStats();
    setupGuideButton();
    setupShareButton();
    
    console.log('Hamster Verse v' + APP_CONFIG.version + ' initialized');
}

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
            
            if (targetSection === 'games-section') {
                loadUserReviews();
            }
        });
    });
}

function setupPlayButtons() {
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
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('star') && 
                !e.target.closest('.stars') && 
                !e.target.classList.contains('play-button')) {
                const playButton = this.querySelector('.play-button');
                const url = playButton.getAttribute('data-url');
                openGame(url);
            }
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

function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            updateUserProfile(user);
        }
        
        window.Telegram.WebApp.MainButton.setText('Открыть игры');
        window.Telegram.WebApp.MainButton.show();
        window.Telegram.WebApp.MainButton.onClick(function() {
            switchToSection('games-section');
        });
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
    const randomIndex = Math.floor(Math.random() * names.length);
    const name = names[randomIndex];
    
    document.getElementById('tg-name').textContent = name;
    document.getElementById('tg-username').textContent = '@пользователь';
}

function setupRatingSystem() {
    const starsContainers = document.querySelectorAll('.stars');
    
    starsContainers.forEach(container => {
        const stars = container.querySelectorAll('.star');
        const gameId = container.getAttribute('data-game-id');
        
        loadRating(gameId, container);
        
        stars.forEach(star => {
            star.addEventListener('click', function(e) {
                e.stopPropagation();
                const rating = parseInt(this.getAttribute('data-rating'));
                rateGame(gameId, rating, container);
            });
        });
    });
}

function loadRating(gameId, container) {
    const savedRating = getSavedRating(gameId);
    const stars = container.querySelectorAll('.star');
    
    highlightStars(stars, savedRating);
}

function getSavedRating(gameId) {
    const ratings = JSON.parse(localStorage.getItem('game_ratings') || '{}');
    return ratings[gameId] || 0;
}

function saveRating(gameId, rating) {
    const ratings = JSON.parse(localStorage.getItem('game_ratings') || '{}');
    ratings[gameId] = rating;
    localStorage.setItem('game_ratings', JSON.stringify(ratings));
    
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    userStats.ratingsGiven = (userStats.ratingsGiven || 0) + 1;
    localStorage.setItem('user_stats', JSON.stringify(userStats));
    updateUserStats();
}

function rateGame(gameId, rating, container) {
    saveRating(gameId, rating);
    
    const stars = container.querySelectorAll('.star');
    highlightStars(stars, rating);
    
    const clickedStar = container.querySelector(`.star[data-rating="${rating}"]`);
    clickedStar.classList.add('just-rated');
    setTimeout(() => clickedStar.classList.remove('just-rated'), 500);
    
    showNotification(`Оценка ${rating} ⭐ сохранена!`, 'success');
}

function highlightStars(stars, rating) {
    stars.forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        star.classList.toggle('active', starRating <= rating);
    });
}

function setupReviewSystem() {
    const addReviewBtn = document.querySelector('.add-review-btn');
    if (addReviewBtn) {
        addReviewBtn.addEventListener('click', showReviewModal);
    }
    
    loadUserReviews();
}

function loadUserReviews() {
    const reviews = JSON.parse(localStorage.getItem('user_reviews') || '[]');
    const reviewsList = document.getElementById('reviews-list');
    
    if (!reviewsList) return;
    
    if (reviews.length === 0) {
        reviewsList.innerHTML = `
            <div class="review-item">
                <div class="review-text" style="text-align: center; color: var(--text-muted);">
                    Пока нет отзывов. Будьте первым!
                </div>
            </div>
        `;
        return;
    }
    
    reviews.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    
    reviewsList.innerHTML = reviews.slice(0, 5).map(review => `
        <div class="review-item">
            <div class="review-header">
                <div class="review-game">${getGameName(review.gameId)}</div>
                <div class="review-rating">${'★'.repeat(review.rating)}${'☆'.repeat(5 - review.rating)}</div>
            </div>
            <div class="review-text">${review.text}</div>
            <div class="review-meta">
                <span class="review-author">${review.author || 'Аноним'}</span>
                <span class="review-date">${formatDate(review.timestamp)}</span>
            </div>
        </div>
    `).join('');
}

function getGameName(gameId) {
    const games = {
        '1': 'Hamster GameDev',
        '2': 'Hamster King',
        '3': 'Hamster Fight Club',
        '4': 'BitQuest'
    };
    return games[gameId] || 'Игра';
}

function showReviewModal() {
    const modal = document.getElementById('review-modal');
    if (!modal) return;
    
    modal.classList.remove('hidden');
    
    document.getElementById('review-text').value = '';
    document.getElementById('review-chars').textContent = '0';
    
    const stars = document.querySelectorAll('#review-modal .star');
    let currentRating = 0;
    
    stars.forEach(star => {
        star.classList.remove('active');
        star.addEventListener('click', function() {
            const rating = parseInt(this.getAttribute('data-rating'));
            currentRating = rating;
            highlightReviewStars(rating);
        });
    });
    
    document.getElementById('review-text').addEventListener('input', function() {
        document.getElementById('review-chars').textContent = this.value.length;
    });
    
    window.currentReviewRating = currentRating;
}

function closeReviewModal() {
    const modal = document.getElementById('review-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function highlightReviewStars(rating) {
    const stars = document.querySelectorAll('#review-modal .star');
    stars.forEach(star => {
        const starRating = parseInt(star.getAttribute('data-rating'));
        star.classList.toggle('active', starRating <= rating);
    });
    window.currentReviewRating = rating;
}

function submitReview() {
    const gameId = document.getElementById('review-game-select').value;
    const text = document.getElementById('review-text').value.trim();
    const rating = window.currentReviewRating || 0;
    
    if (rating === 0) {
        showNotification('Пожалуйста, поставьте оценку', 'error');
        return;
    }
    
    if (text.length < 10) {
        showNotification('Отзыв должен содержать минимум 10 символов', 'error');
        return;
    }
    
    const reviews = JSON.parse(localStorage.getItem('user_reviews') || '[]');
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    
    reviews.push({
        gameId,
        rating,
        text,
        author: user ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Аноним',
        timestamp: new Date().toISOString(),
        userId: user?.id || 'anonymous'
    });
    
    localStorage.setItem('user_reviews', JSON.stringify(reviews));
    
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    userStats.reviewsWritten = (userStats.reviewsWritten || 0) + 1;
    localStorage.setItem('user_stats', JSON.stringify(userStats));
    
    closeReviewModal();
    loadUserReviews();
    showNotification('Отзыв опубликован!', 'success');
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

function setupUserStats() {
    updateUserStats();
}

function updateUserStats() {
    const userStats = JSON.parse(localStorage.getItem('user_stats') || '{}');
    
    const gamesPlayedElement = document.getElementById('games-played');
    const ratingsGivenElement = document.getElementById('ratings-given');
    
    if (gamesPlayedElement) {
        gamesPlayedElement.textContent = userStats.gamesPlayed || 0;
    }
    
    if (ratingsGivenElement) {
        ratingsGivenElement.textContent = userStats.ratingsGiven || 0;
    }
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
    updateUserStats();
});

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
