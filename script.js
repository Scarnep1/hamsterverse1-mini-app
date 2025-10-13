// Конфигурация приложения
const APP_CONFIG = {
    version: '2.3.0',
    features: {
        ratings: true,
        comments: true,
        news: true,
        priceUpdates: true
    }
};

// Система рейтингов
const RATINGS_SYSTEM = {
    storageKey: 'game_ratings_v2',
    maxRating: 5
};

// Система комментариев
const COMMENTS_SYSTEM = {
    storageKey: 'game_comments_v1',
    maxCommentLength: 500
};

// Коллекции Firestore
const COMMENTS_COLLECTION = "comments";
const RATINGS_COLLECTION = "ratings";

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    setupNavigation();
    setupPlayButtons();
    setupTelegramIntegration();
    setupPriceData();
    setupThemeToggle();
    setupNewsSection();
    await setupRatingSystem();
    await setupCommentsSystem();
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
            
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
            
            sections.forEach(section => {
                section.classList.remove('active');
                if (section.id === targetSection) {
                    section.classList.add('active');
                }
            });
            
            if (targetSection === 'hmstr-section') {
                refreshPriceData();
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
    
    const gameCards = document.querySelectorAll('.game-card');
    
    gameCards.forEach(card => {
        card.addEventListener('click', function(e) {
            if (!e.target.classList.contains('star') && 
                !e.target.closest('.stars-rating') &&
                !e.target.closest('.comments-toggle-btn') &&
                !e.target.closest('.comment-textarea') &&
                !e.target.closest('.submit-comment-btn') &&
                !e.target.closest('.like-btn')) {
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

// Интеграция с Telegram
function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            updateUserProfile(user);
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

// ==================== FIREBASE ФУНКЦИИ ====================

// Система рейтингов с Firebase
async function setupRatingSystem() {
    setupStarsInteractions();
    await loadAllRatings();
}

async function loadAllRatings() {
    const gameIds = ['1', '2']; // Добавьте остальные ID игр
    for (const gameId of gameIds) {
        await loadRatings(gameId);
    }
}

async function loadRatings(gameId) {
    try {
        const querySnapshot = await db.collection(RATINGS_COLLECTION)
            .where("gameId", "==", gameId)
            .get();
        
        const ratings = [];
        querySnapshot.forEach((doc) => {
            ratings.push(doc.data().rating);
        });
        
        const average = ratings.length > 0 
            ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length 
            : 0;
        
        const ratingData = {
            total: average,
            count: ratings.length,
            ratings: ratings
        };
        
        updateRatingDisplay(gameId, ratingData);
        await checkUserRating(gameId);
        
    } catch (error) {
        console.error("Error loading ratings:", error);
        loadRatingsFromLocalStorage(gameId);
    }
}

async function rateGame(gameId, rating) {
    const userId = getUserId();
    const userInfo = getUserInfo();
    
    try {
        // Проверяем, не оценивал ли уже пользователь
        const existingRatingQuery = await db.collection(RATINGS_COLLECTION)
            .where("gameId", "==", gameId)
            .where("userId", "==", userId)
            .get();
        
        if (!existingRatingQuery.empty) {
            showNotification('Вы уже оценили эту игру!', 'info');
            return;
        }
        
        // Добавляем оценку в Firebase
        await db.collection(RATINGS_COLLECTION).add({
            gameId: gameId,
            userId: userId,
            rating: rating,
            author: userInfo.name,
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // Обновляем отображение
        await loadRatings(gameId);
        
        // Блокируем возможность повторной оценки
        const ratingContainer = document.querySelector(`.stars-rating[data-game-id="${gameId}"]`);
        const stars = ratingContainer.querySelectorAll('.star');
        highlightUserRating(stars, rating);
        ratingContainer.classList.add('disabled');
        
        showNotification(`Спасибо за оценку ${rating} ⭐!`, 'success');
        
    } catch (error) {
        console.error("Error rating game:", error);
        showNotification('Ошибка при сохранении оценки', 'error');
        rateGameInLocalStorage(gameId, rating);
    }
}

async function checkUserRating(gameId) {
    const userId = getUserId();
    
    try {
        const querySnapshot = await db.collection(RATINGS_COLLECTION)
            .where("gameId", "==", gameId)
            .where("userId", "==", userId)
            .get();
        
        if (!querySnapshot.empty) {
            const userRating = querySnapshot.docs[0].data().rating;
            const ratingContainer = document.querySelector(`.stars-rating[data-game-id="${gameId}"]`);
            const stars = ratingContainer.querySelectorAll('.star');
            highlightUserRating(stars, userRating);
            ratingContainer.classList.add('disabled');
        }
    } catch (error) {
        console.error("Error checking user rating:", error);
        checkUserRatingInLocalStorage(gameId);
    }
}

// Система комментариев с Firebase
async function setupCommentsSystem() {
    setupCommentsToggle();
    setupCommentForm();
    await loadAllCommentsCount();
}

async function loadAllCommentsCount() {
    const gameIds = ['1', '2']; // Добавьте остальные ID игр
    let totalComments = 0;
    
    for (const gameId of gameIds) {
        const count = await updateCommentsCount(gameId);
        totalComments += count;
    }
    
    document.getElementById('total-comments').textContent = totalComments;
}

async function updateCommentsCount(gameId) {
    try {
        const querySnapshot = await db.collection(COMMENTS_COLLECTION)
            .where("gameId", "==", gameId)
            .get();
        
        const count = querySnapshot.size;
        const countElement = document.querySelector(`.comments-toggle-btn[data-game-id="${gameId}"] .comments-count`);
        
        if (countElement) {
            countElement.textContent = count;
        }
        
        return count;
    } catch (error) {
        console.error("Error updating comments count:", error);
        updateCommentsCountFromLocalStorage(gameId);
        return 0;
    }
}

function setupCommentsToggle() {
    document.querySelectorAll('.comments-toggle-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const gameId = this.getAttribute('data-game-id');
            const commentsContainer = document.querySelector(`.comments-container[data-game-id="${gameId}"]`);
            
            if (commentsContainer.classList.contains('hidden')) {
                commentsContainer.classList.remove('hidden');
                this.classList.add('active');
                loadComments(gameId);
            } else {
                commentsContainer.classList.add('hidden');
                this.classList.remove('active');
            }
        });
    });
}

function setupCommentForm() {
    document.querySelectorAll('.comment-textarea').forEach(textarea => {
        textarea.addEventListener('input', function() {
            const charCount = this.nextElementSibling.querySelector('.char-count');
            charCount.textContent = `${this.value.length}/500`;
            
            const submitBtn = this.nextElementSibling.querySelector('.submit-comment-btn');
            submitBtn.disabled = this.value.trim().length === 0;
        });
        
        textarea.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.key === 'Enter') {
                const gameId = this.nextElementSibling.querySelector('.submit-comment-btn').getAttribute('data-game-id');
                addComment(gameId, this.value.trim());
                this.value = '';
                this.dispatchEvent(new Event('input'));
            }
        });
    });
    
    document.querySelectorAll('.submit-comment-btn').forEach(button => {
        button.addEventListener('click', function() {
            const gameId = this.getAttribute('data-game-id');
            const textarea = this.closest('.add-comment-form').querySelector('.comment-textarea');
            const commentText = textarea.value.trim();
            
            if (commentText) {
                addComment(gameId, commentText);
                textarea.value = '';
                textarea.dispatchEvent(new Event('input'));
            }
        });
    });
}

async function loadComments(gameId) {
    try {
        const commentsList = document.getElementById(`comments-${gameId}`);
        commentsList.innerHTML = '<div class="loading-indicator"><span>Загрузка комментариев...</span></div>';
        
        const querySnapshot = await db.collection(COMMENTS_COLLECTION)
            .where("gameId", "==", gameId)
            .orderBy("timestamp", "desc")
            .get();
        
        const comments = [];
        querySnapshot.forEach((doc) => {
            comments.push({ id: doc.id, ...doc.data() });
        });
        
        if (comments.length === 0) {
            commentsList.innerHTML = `
                <div class="no-comments">
                    <p>Пока нет комментариев</p>
                    <small>Будьте первым, кто оставит отзыв!</small>
                </div>
            `;
            return;
        }
        
        const sortedComments = comments.sort((a, b) => b.likes - a.likes);
        
        commentsList.innerHTML = sortedComments.map(comment => `
            <div class="comment-item" data-comment-id="${comment.id}">
                <div class="comment-header">
                    <div class="comment-author">
                        <span class="comment-author-avatar">${comment.author.charAt(0)}</span>
                        ${comment.author}
                    </div>
                    <span class="comment-date">${formatCommentDate(comment.timestamp)}</span>
                </div>
                <div class="comment-text">${escapeHtml(comment.text)}</div>
                <div class="comment-actions">
                    <button class="like-btn ${isCommentLiked(comment.id, comment.likedBy) ? 'liked' : ''}" 
                            data-comment-id="${comment.id}"
                            data-game-id="${gameId}">
                        <span class="like-icon">❤️</span>
                        <span class="likes-count">${comment.likes}</span>
                    </button>
                </div>
            </div>
        `).join('');
        
        setupLikeButtons();
        
    } catch (error) {
        console.error("Error loading comments:", error);
        showNotification('Ошибка загрузки комментариев', 'error');
        loadCommentsFromLocalStorage(gameId);
    }
}

async function addComment(gameId, text) {
    if (text.length > COMMENTS_SYSTEM.maxCommentLength) {
        showNotification(`Комментарий слишком длинный. Максимум ${COMMENTS_SYSTEM.maxCommentLength} символов.`, 'error');
        return;
    }
    
    const userInfo = getUserInfo();
    
    try {
        const commentData = {
            gameId: gameId,
            userId: userInfo.id,
            author: userInfo.name,
            text: text,
            likes: 0,
            likedBy: [],
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        const docRef = await db.collection(COMMENTS_COLLECTION).add(commentData);
        
        // Сохраняем в localStorage как резервную копию
        saveCommentToLocalStorage({ id: docRef.id, ...commentData });
        
        // Обновляем отображение
        loadComments(gameId);
        updateCommentsCount(gameId);
        
        showNotification('Комментарий добавлен!', 'success');
        
    } catch (error) {
        console.error("Error adding comment:", error);
        showNotification('Ошибка при добавлении комментария', 'error');
        addCommentToLocalStorage(gameId, text);
    }
}

async function toggleLike(gameId, commentId) {
    const userId = getUserId();
    
    try {
        const commentRef = db.collection(COMMENTS_COLLECTION).doc(commentId);
        const commentDoc = await commentRef.get();
        
        if (!commentDoc.exists) {
            throw new Error("Comment not found");
        }
        
        const comment = commentDoc.data();
        const userLiked = comment.likedBy.includes(userId);
        
        if (userLiked) {
            // Убираем лайк
            await commentRef.update({
                likes: firebase.firestore.FieldValue.increment(-1),
                likedBy: firebase.firestore.FieldValue.arrayRemove(userId)
            });
        } else {
            // Добавляем лайк
            await commentRef.update({
                likes: firebase.firestore.FieldValue.increment(1),
                likedBy: firebase.firestore.FieldValue.arrayUnion(userId)
            });
        }
        
        // Обновляем отображение
        loadComments(gameId);
        
        // Анимация
        const likeBtn = document.querySelector(`.like-btn[data-comment-id="${commentId}"]`);
        if (!userLiked) {
            likeBtn.classList.add('liked');
        }
        
        showNotification(userLiked ? 'Лайк удален' : 'Лайк добавлен!', 'info');
        
    } catch (error) {
        console.error("Error toggling like:", error);
        toggleLikeInLocalStorage(gameId, commentId);
    }
}

function setupLikeButtons() {
    document.querySelectorAll('.like-btn').forEach(button => {
        button.addEventListener('click', function(e) {
            e.stopPropagation();
            const gameId = this.getAttribute('data-game-id');
            const commentId = this.getAttribute('data-comment-id');
            toggleLike(gameId, commentId);
        });
    });
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

function setupStarsInteractions() {
    document.querySelectorAll('.stars-rating').forEach(ratingContainer => {
        const gameId = ratingContainer.getAttribute('data-game-id');
        const stars = ratingContainer.querySelectorAll('.star');
        
        stars.forEach(star => {
            star.addEventListener('click', function() {
                const rating = parseInt(this.getAttribute('data-rating'));
                rateGame(gameId, rating);
            });
            
            star.addEventListener('mouseover', function() {
                if (!ratingContainer.classList.contains('disabled')) {
                    const rating = parseInt(this.getAttribute('data-rating'));
                    highlightStars(stars, rating);
                }
            });
            
            star.addEventListener('mouseout', function() {
                if (!ratingContainer.classList.contains('disabled')) {
                    resetStars(stars);
                }
            });
        });
    });
}

function updateRatingDisplay(gameId, gameData) {
    const gameCard = document.querySelector(`.game-card[data-game-id="${gameId}"]`);
    if (!gameCard) return;
    
    const averageElement = gameCard.querySelector('.average-rating');
    const countElement = gameCard.querySelector('.rating-count');
    const staticStars = gameCard.querySelectorAll('.stars-static .star');
    
    if (averageElement) {
        averageElement.textContent = gameData.total.toFixed(1);
    }
    
    if (countElement) {
        countElement.textContent = `(${gameData.count} оценок)`;
    }
    
    const averageRating = Math.round(gameData.total * 2) / 2;
    highlightStaticStars(staticStars, averageRating);
}

function highlightStaticStars(stars, rating) {
    stars.forEach((star, index) => {
        const starNumber = index + 1;
        
        if (rating >= starNumber) {
            star.classList.add('active');
        } else if (rating >= starNumber - 0.5) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function highlightUserRating(stars, rating) {
    stars.forEach((star, index) => {
        const starNumber = index + 1;
        if (starNumber <= rating) {
            star.classList.add('active', 'rated');
        } else {
            star.classList.remove('active', 'rated');
        }
    });
}

function highlightStars(stars, rating) {
    stars.forEach((star, index) => {
        const starNumber = index + 1;
        if (starNumber <= rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

function resetStars(stars) {
    stars.forEach(star => {
        star.classList.remove('active');
    });
}

function getUserId() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user?.id) {
        return `tg_${window.Telegram.WebApp.initDataUnsafe.user.id}`;
    }
    
    let userId = localStorage.getItem('hamster_user_id');
    if (!userId) {
        userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('hamster_user_id', userId);
        
        const userInfo = {
            id: userId,
            created: new Date().toISOString(),
            name: 'Анонимный Хомяк',
            type: 'anonymous'
        };
        localStorage.setItem('hamster_user_info', JSON.stringify(userInfo));
    }
    return userId;
}

function getUserInfo() {
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.initDataUnsafe?.user) {
        const user = window.Telegram.WebApp.initDataUnsafe.user;
        return {
            id: `tg_${user.id}`,
            name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Telegram User',
            avatar: user.photo_url || null,
            type: 'telegram'
        };
    }
    
    const storedInfo = localStorage.getItem('hamster_user_info');
    if (storedInfo) {
        return JSON.parse(storedInfo);
    }
    
    return {
        id: getUserId(),
        name: 'Анонимный Хомяк',
        avatar: null,
        type: 'anonymous'
    };
}

function isCommentLiked(commentId, likedBy = []) {
    return likedBy.includes(getUserId());
}

// ==================== FALLBACK ФУНКЦИИ (localStorage) ====================

function loadCommentsFromLocalStorage(gameId) {
    const comments = JSON.parse(localStorage.getItem(COMMENTS_SYSTEM.storageKey)) || { games: {} };
    const gameComments = comments.games[gameId] || [];
    
    const commentsList = document.getElementById(`comments-${gameId}`);
    
    if (gameComments.length === 0) {
        commentsList.innerHTML = `
            <div class="no-comments">
                <p>Пока нет комментариев</p>
                <small>Будьте первым, кто оставит отзыв!</small>
            </div>
        `;
        return;
    }
    
    const sortedComments = gameComments.sort((a, b) => b.likes - a.likes);
    
    commentsList.innerHTML = sortedComments.map(comment => `
        <div class="comment-item" data-comment-id="${comment.id}">
            <div class="comment-header">
                <div class="comment-author">
                    <span class="comment-author-avatar">${comment.author.charAt(0)}</span>
                    ${comment.author}
                </div>
                <span class="comment-date">${formatCommentDate(comment.timestamp)}</span>
            </div>
            <div class="comment-text">${escapeHtml(comment.text)}</div>
            <div class="comment-actions">
                <button class="like-btn ${isCommentLiked(comment.id, comment.likedBy) ? 'liked' : ''}" 
                        data-game-id="${gameId}" 
                        data-comment-id="${comment.id}">
                    <span class="like-icon">❤️</span>
                    <span class="likes-count">${comment.likes}</span>
                </button>
            </div>
        </div>
    `).join('');
    
    setupLikeButtons();
}

function addCommentToLocalStorage(gameId, text) {
    const comments = JSON.parse(localStorage.getItem(COMMENTS_SYSTEM.storageKey)) || { games: {} };
    const userInfo = getUserInfo();
    
    if (!comments.games[gameId]) {
        comments.games[gameId] = [];
    }
    
    const newComment = {
        id: generateCommentId(),
        author: userInfo.name,
        text: text,
        likes: 0,
        likedBy: [],
        timestamp: new Date().toISOString(),
        userId: userInfo.id
    };
    
    comments.games[gameId].unshift(newComment);
    localStorage.setItem(COMMENTS_SYSTEM.storageKey, JSON.stringify(comments));
    
    loadCommentsFromLocalStorage(gameId);
    updateCommentsCountFromLocalStorage(gameId);
    
    showNotification('Комментарий добавлен!', 'success');
}

function saveCommentToLocalStorage(comment) {
    const comments = JSON.parse(localStorage.getItem(COMMENTS_SYSTEM.storageKey)) || { games: {} };
    if (!comments.games[comment.gameId]) {
        comments.games[comment.gameId] = [];
    }
    comments.games[comment.gameId].push(comment);
    localStorage.setItem(COMMENTS_SYSTEM.storageKey, JSON.stringify(comments));
}

function updateCommentsCountFromLocalStorage(gameId) {
    const comments = JSON.parse(localStorage.getItem(COMMENTS_SYSTEM.storageKey)) || { games: {} };
    const gameComments = comments.games[gameId] || [];
    const countElement = document.querySelector(`.comments-toggle-btn[data-game-id="${gameId}"] .comments-count`);
    
    if (countElement) {
        countElement.textContent = gameComments.length;
    }
}

function toggleLikeInLocalStorage(gameId, commentId) {
    const comments = JSON.parse(localStorage.getItem(COMMENTS_SYSTEM.storageKey)) || { games: {} };
    const gameComments = comments.games[gameId];
    if (!gameComments) return;
    
    const comment = gameComments.find(c => c.id === commentId);
    if (!comment) return;
    
    const userId = getUserId();
    const userLiked = comment.likedBy.includes(userId);
    
    if (userLiked) {
        comment.likes--;
        comment.likedBy = comment.likedBy.filter(id => id !== userId);
    } else {
        comment.likes++;
        comment.likedBy.push(userId);
    }
    
    localStorage.setItem(COMMENTS_SYSTEM.storageKey, JSON.stringify(comments));
    loadCommentsFromLocalStorage(gameId);
    
    const likeBtn = document.querySelector(`.like-btn[data-comment-id="${commentId}"]`);
    if (!userLiked) {
        likeBtn.classList.add('liked');
    }
    
    showNotification(userLiked ? 'Лайк удален' : 'Лайк добавлен!', 'info');
}

function loadRatingsFromLocalStorage(gameId) {
    const ratings = JSON.parse(localStorage.getItem(RATINGS_SYSTEM.storageKey)) || { games: {}, userRatings: {} };
    const gameData = ratings.games[gameId] || { total: 0, count: 0, ratings: [] };
    updateRatingDisplay(gameId, gameData);
}

function rateGameInLocalStorage(gameId, rating) {
    const userId = getUserId();
    const ratings = JSON.parse(localStorage.getItem(RATINGS_SYSTEM.storageKey)) || { games: {}, userRatings: {} };
    
    if (ratings.userRatings[userId]?.[gameId]) {
        showNotification('Вы уже оценили эту игру!', 'info');
        return;
    }
    
    if (!ratings.userRatings[userId]) {
        ratings.userRatings[userId] = {};
    }
    ratings.userRatings[userId][gameId] = rating;
    
    if (!ratings.games[gameId]) {
        ratings.games[gameId] = { total: 0, count: 0, ratings: [] };
    }
    
    const game = ratings.games[gameId];
    game.ratings.push(rating);
    game.count = game.ratings.length;
    game.total = game.ratings.reduce((sum, r) => sum + r, 0) / game.count;
    
    localStorage.setItem(RATINGS_SYSTEM.storageKey, JSON.stringify(ratings));
    updateRatingDisplay(gameId, game);
    
    const ratingContainer = document.querySelector(`.stars-rating[data-game-id="${gameId}"]`);
    const stars = ratingContainer.querySelectorAll('.star');
    highlightUserRating(stars, rating);
    ratingContainer.classList.add('disabled');
    
    showNotification(`Спасибо за оценку ${rating} ⭐!`, 'success');
}

function checkUserRatingInLocalStorage(gameId) {
    const userId = getUserId();
    const ratings = JSON.parse(localStorage.getItem(RATINGS_SYSTEM.storageKey)) || { games: {}, userRatings: {} };
    const userRating = ratings.userRatings[userId]?.[gameId];
    
    if (userRating) {
        const ratingContainer = document.querySelector(`.stars-rating[data-game-id="${gameId}"]`);
        const stars = ratingContainer.querySelectorAll('.star');
        highlightUserRating(stars, userRating);
        ratingContainer.classList.add('disabled');
    }
}

// ==================== ОСТАЛЬНЫЕ ФУНКЦИИ ====================

// Данные токена HMSTR
let currentPriceData = {
    usd: 0.000621,
    rub: 0.056,
    change: 2.34,
    lastUpdated: new Date().toISOString()
};

function setupPriceData() {
    loadPriceData();
    updatePriceDisplay();
}

function loadPriceData() {
    const savedData = localStorage.getItem('hmstr_price_data');
    if (savedData) {
        currentPriceData = JSON.parse(savedData);
    }
}

function savePriceData() {
    localStorage.setItem('hmstr_price_data', JSON.stringify(currentPriceData));
}

function updatePriceDisplay() {
    const usdPriceElement = document.getElementById('hmstr-price-usd');
    const usdChangeElement = document.getElementById('hmstr-change-usd');
    const rubPriceElement = document.getElementById('hmstr-price-rub');
    const rubChangeElement = document.getElementById('hmstr-change-rub');
    
    if (usdPriceElement) {
        usdPriceElement.textContent = `$${currentPriceData.usd.toFixed(6)}`;
    }
    
    if (usdChangeElement) {
        usdChangeElement.textContent = `${currentPriceData.change >= 0 ? '+' : ''}${currentPriceData.change.toFixed(2)}%`;
        usdChangeElement.className = `change ${currentPriceData.change >= 0 ? 'positive' : 'negative'}`;
    }
    
    if (rubPriceElement) {
        rubPriceElement.textContent = `${currentPriceData.rub.toFixed(3)} ₽`;
    }
    
    if (rubChangeElement) {
        rubChangeElement.textContent = `${currentPriceData.change >= 0 ? '+' : ''}${currentPriceData.change.toFixed(2)}%`;
        rubChangeElement.className = `change ${currentPriceData.change >= 0 ? 'positive' : 'negative'}`;
    }
}

function refreshPriceData() {
    showPriceLoading(true);
    
    setTimeout(() => {
        const randomChange = (Math.random() - 0.5) * 10;
        const changePercent = parseFloat(randomChange.toFixed(2));
        
        currentPriceData.usd = parseFloat((currentPriceData.usd * (1 + changePercent / 100)).toFixed(6));
        currentPriceData.rub = parseFloat((currentPriceData.rub * (1 + changePercent / 100)).toFixed(3));
        currentPriceData.change = changePercent;
        currentPriceData.lastUpdated = new Date().toISOString();
        
        savePriceData();
        updatePriceDisplay();
        showPriceLoading(false);
        
        showNotification('Курс обновлен', 'success');
    }, 1500);
}

function showPriceLoading(show) {
    const loadingElement = document.getElementById('price-loading');
    if (loadingElement) {
        loadingElement.classList.toggle('hidden', !show);
    }
}

// Переключение темы
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
                <div class="news-content">Теперь вы можете оставлять комментарии и ставить лайки! Делитесь мнением об играх с сообществом.</div>
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
    return [
        {
            date: new Date().toISOString(),
            title: "Добавлена система комментариев",
            content: "Теперь вы можете оставлять комментарии к играм и ставить лайки! Самые популярные комментарии будут отображаться первыми."
        },
        {
            date: new Date(Date.now() - 86400000).toISOString(),
            title: "Новая система рейтингов",
            content: "Теперь вы можете оценивать игры! Ваша оценка помогает сообществу выбирать лучшие игры."
        }
    ];
}

// Авто-обновление
function setupAutoRefresh() {
    setInterval(() => {
        if (document.querySelector('#hmstr-section.active')) {
            refreshPriceData();
        }
    }, 120000);
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

function formatCommentDate(timestamp) {
    if (!timestamp) return 'недавно';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) {
        return 'только что';
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

function generateCommentId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
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
