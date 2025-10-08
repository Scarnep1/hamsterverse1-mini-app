// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupReferralLink();
    setupPlayButtons();
    setupTelegramIntegration();
    setupRealPriceData();
    setupDailyBonus();
    setupGuideButton();
    setupThemeToggle();
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
        window.open(url, '_blank');
    }
}

function setupReferralLink() {
    const copyBtn = document.getElementById('copy-btn');
    const referralInput = document.getElementById('referral-input');
    const notification = document.getElementById('notification');
    
    if (copyBtn && referralInput && notification) {
        copyBtn.addEventListener('click', function() {
            referralInput.select();
            referralInput.setSelectionRange(0, 99999);
            
            navigator.clipboard.writeText(referralInput.value).then(function() {
                notification.classList.add('show');
                setTimeout(function() {
                    notification.classList.remove('show');
                }, 2000);
            }).catch(function(err) {
                console.error('Failed to copy text: ', err);
                try {
                    document.execCommand('copy');
                    notification.classList.add('show');
                    setTimeout(function() {
                        notification.classList.remove('show');
                    }, 2000);
                } catch (e) {
                    console.error('Fallback copy failed: ', e);
                }
            });
        });
    }
}

function setupTelegramIntegration() {
    if (window.Telegram && window.Telegram.WebApp) {
        window.Telegram.WebApp.expand();
        
        const user = window.Telegram.WebApp.initDataUnsafe?.user;
        
        if (user) {
            const avatar = document.getElementById('tg-avatar');
            if (user.photo_url) {
                avatar.innerHTML = `<img src="${user.photo_url}" alt="Avatar" style="width: 100%; height: 100%; border-radius: 50%;">`;
            } else {
                avatar.textContent = user.first_name?.[0] || 'U';
            }
            
            const name = document.getElementById('tg-name');
            const username = document.getElementById('tg-username');
            
            if (user.first_name) {
                name.textContent = `${user.first_name} ${user.last_name || ''}`.trim();
            }
            
            if (user.username) {
                username.textContent = `@${user.username}`;
            }
        }
        
        const themeParams = window.Telegram.WebApp.themeParams;
        if (themeParams) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-button-color', themeParams.button_color || '#667eea');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', themeParams.button_text_color || '#ffffff');
        }
    }
}

// Глобальные переменные для данных цены
let currentHMSTRPrice = 0.00061234;
let currentHMSTRChange = -4.92;
let priceChart = null;

// ОСНОВНАЯ ФУНКЦИЯ: Работа с ценой HMSTR
async function setupRealPriceData() {
    await updateHMSTRPrice();
    createTONStyleChart();
    
    // Обновляем каждые 30 секунд
    setInterval(updateHMSTRPrice, 30000);
}

// Функция обновления цены HMSTR
async function updateHMSTRPrice() {
    try {
        // Пробуем получить реальные данные
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hamster-combat&vs_currencies=usd&include_24hr_change=true');
        
        if (response.ok) {
            const data = await response.json();
            if (data['hamster-combat']) {
                currentHMSTRPrice = data['hamster-combat'].usd;
                currentHMSTRChange = data['hamster-combat'].usd_24h_change;
            }
        }
    } catch (error) {
        console.log('Используем локальные данные HMSTR');
        // Симулируем небольшие изменения цены
        const randomChange = (Math.random() - 0.5) * 2; // ±1%
        currentHMSTRPrice = currentHMSTRPrice * (1 + randomChange / 100);
        currentHMSTRChange = currentHMSTRChange + randomChange;
        
        // Ограничиваем изменения разумными пределами
        currentHMSTRChange = Math.max(-20, Math.min(20, currentHMSTRChange));
    }
    
    updatePriceDisplay();
    updateChartData();
}

// Обновление отображения цены
function updatePriceDisplay() {
    const priceElement = document.getElementById('hmstr-price');
    const changeElement = document.getElementById('hmstr-change');
    
    if (priceElement && changeElement) {
        priceElement.textContent = formatPrice(currentHMSTRPrice);
        changeElement.textContent = `${currentHMSTRChange >= 0 ? '+' : ''}${currentHMSTRChange.toFixed(2)}%`;
        
        if (currentHMSTRChange >= 0) {
            changeElement.className = 'change positive';
        } else {
            changeElement.className = 'change negative';
        }
    }
}

// Форматирование цены
function formatPrice(price) {
    if (price >= 1) {
        return `$${price.toFixed(4)}`;
    } else if (price >= 0.1) {
        return `$${price.toFixed(5)}`;
    } else if (price >= 0.01) {
        return `$${price.toFixed(6)}`;
    } else {
        return `$${price.toFixed(8)}`;
    }
}

// СОЗДАНИЕ ГРАФИКА В СТИЛЕ TON
function createTONStyleChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    // Генерируем данные для графика как в TON
    const chartData = generateTONStyleData();
    
    // Цвета как в TON
    const lineColor = currentHMSTRChange >= 0 ? '#00C851' : '#FF4444';
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    
    if (currentHMSTRChange >= 0) {
        gradient.addColorStop(0, 'rgba(0, 200, 81, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 200, 81, 0.02)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0.02)');
    }
    
    // Уничтожаем старый график если есть
    if (priceChart) {
        priceChart.destroy();
    }
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'],
            datasets: [{
                data: chartData,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 0,
                pointBackgroundColor: 'transparent',
                pointBorderColor: 'transparent'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    display: true,
                    grid: {
                        display: false,
                        drawBorder: false
                    },
                    ticks: {
                        color: isDark ? '#888888' : '#666666',
                        font: {
                            size: 11,
                            family: "'Inter', sans-serif"
                        },
                        padding: 8
                    }
                },
                y: {
                    display: false,
                    grid: {
                        display: false
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            },
            elements: {
                line: {
                    tension: 0.4
                },
                point: {
                    radius: 0
                }
            },
            layout: {
                padding: {
                    left: 0,
                    right: 0,
                    top: 5,
                    bottom: 0
                }
            }
        }
    });
}

// Генерация данных в стиле TON
function generateTONStyleData() {
    const data = [];
    const basePrice = currentHMSTRPrice / (1 + currentHMSTRChange / 100);
    const volatility = 0.0001;
    
    for (let i = 0; i < 7; i++) {
        const progress = i / 6;
        const trend = currentHMSTRChange / 100 * progress;
        const random = (Math.random() - 0.5) * volatility;
        
        let price = basePrice * (1 + trend + random);
        
        if (i === 6) {
            price = currentHMSTRPrice;
        }
        
        data.push(price);
    }
    
    return data;
}

// Обновление данных графика
function updateChartData() {
    if (!priceChart) return;
    
    const newData = generateTONStyleData();
    const isPositive = currentHMSTRChange >= 0;
    const lineColor = isPositive ? '#00C851' : '#FF4444';
    
    const ctx = priceChart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 80);
    
    if (isPositive) {
        gradient.addColorStop(0, 'rgba(0, 200, 81, 0.2)');
        gradient.addColorStop(1, 'rgba(0, 200, 81, 0.02)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 68, 68, 0.2)');
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0.02)');
    }
    
    priceChart.data.datasets[0].data = newData;
    priceChart.data.datasets[0].borderColor = lineColor;
    priceChart.data.datasets[0].backgroundColor = gradient;
    
    priceChart.update('none');
}

function setupDailyBonus() {
    const claimButton = document.getElementById('claim-daily');
    
    if (claimButton) {
        claimButton.addEventListener('click', function() {
            const lastClaim = localStorage.getItem('lastDailyClaim');
            const today = new Date().toDateString();
            
            if (lastClaim === today) {
                alert('Вы уже получили бонус сегодня! Возвращайтесь завтра.');
                return;
            }
            
            localStorage.setItem('lastDailyClaim', today);
            
            const pointsElement = document.getElementById('total-points');
            const currentPoints = parseInt(pointsElement.textContent);
            pointsElement.textContent = currentPoints + 1;
            
            const streakElement = document.getElementById('daily-streak');
            const currentStreak = parseInt(streakElement.textContent);
            streakElement.textContent = currentStreak + 1;
            
            updateUserRank(currentPoints + 1);
            
            alert('🎉 Вы получили 1 очко за ежедневный вход!');
            claimButton.disabled = true;
            claimButton.textContent = 'Получено сегодня';
        });
    }
    
    updateUserRank(parseInt(document.getElementById('total-points').textContent));
}

function updateUserRank(points) {
    const rankElement = document.getElementById('user-rank');
    const rankBadge = rankElement.querySelector('.rank-badge');
    const rankProgress = rankElement.querySelector('.rank-progress');
    
    let rank, nextRank, progress;
    
    if (points < 30) {
        rank = 'beginner';
        nextRank = 30;
        progress = `${points}/30 очков`;
    } else if (points < 300) {
        rank = 'player';
        nextRank = 300;
        progress = `${points}/300 очков`;
    } else {
        rank = 'whale';
        nextRank = '∞';
        progress = `${points}+ очков`;
    }
    
    rankBadge.className = `rank-badge ${rank}`;
    rankBadge.textContent = getRankName(rank);
    rankProgress.textContent = progress;
}

function getRankName(rank) {
    switch(rank) {
        case 'beginner': return 'Новичок';
        case 'player': return 'Игрок';
        case 'whale': return 'Кит';
        default: return 'Новичок';
    }
}

function setupGuideButton() {
    const guideButton = document.getElementById('show-guide');
    const buyGuide = document.getElementById('buy-guide');
    
    if (guideButton && buyGuide) {
        guideButton.addEventListener('click', function() {
            if (buyGuide.classList.contains('hidden')) {
                buyGuide.classList.remove('hidden');
                guideButton.textContent = '📖 Скрыть гайд';
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
    
    // Load saved theme
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
        
        // Update chart theme
        if (priceChart) {
            const isDark = theme === 'dark';
            priceChart.options.scales.x.ticks.color = isDark ? '#888888' : '#666666';
            priceChart.update();
        }
    }
}

// Prevent image drag
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.setAttribute('draggable', 'false');
    });
});
