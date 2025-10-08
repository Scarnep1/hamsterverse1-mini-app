// Initialize the app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

function initializeApp() {
    setupNavigation();
    setupReferralLink();
    setupPlayButtons();
    setupTelegramIntegration();
    setupWalletPriceData();
    setupDailyBonus();
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
let currentHMSTRPrice = 0.000621;
let currentPeriod = '1D';
let priceChart = null;

// Данные для разных периодов (реальные данные с CoinGecko)
const periodData = {
    '1D': { change: -3.98, amount: -0.000026, label: 'Сегодня' },
    '7D': { change: 0.37, amount: 0.0000023, label: 'За неделю' },
    '1M': { change: 10.88, amount: 0.000076, label: 'За месяц' },
    '1Y': { change: -86.78, amount: -0.0041, label: 'За год' },
    'ALL': { change: -90.40, amount: -0.0059, label: 'За всё время' }
};

// ОСНОВНАЯ ФУНКЦИЯ: Работа с ценой HMSTR в стиле Telegram Wallet
async function setupWalletPriceData() {
    await updateHMSTRPrice();
    setupTimeSelector();
    createWalletChart();
    
    // Обновляем каждые 30 секунд
    setInterval(updateHMSTRPrice, 30000);
}

// Настройка переключателя периодов
function setupTimeSelector() {
    const timeButtons = document.querySelectorAll('.time-btn');
    
    timeButtons.forEach(button => {
        button.addEventListener('click', function() {
            // Убираем активный класс у всех кнопок
            timeButtons.forEach(btn => btn.classList.remove('active'));
            // Добавляем активный класс текущей кнопке
            this.classList.add('active');
            
            // Обновляем период
            currentPeriod = this.getAttribute('data-period');
            updatePeriodDisplay();
            updateChartForPeriod();
        });
    });
}

// Обновление отображения периода
function updatePeriodDisplay() {
    const periodData = getCurrentPeriodData();
    const changeMain = document.getElementById('hmstr-change-main');
    const changePeriod = document.getElementById('hmstr-change-period');
    
    if (changeMain && changePeriod) {
        const isPositive = periodData.change >= 0;
        const changeClass = isPositive ? 'positive' : 'negative';
        const changeSign = isPositive ? '+' : '';
        
        changeMain.innerHTML = `
            <span class="change-percent ${changeClass}">${changeSign}${periodData.change}%</span>
            <span class="change-amount">${changeSign}${periodData.amount} $</span>
        `;
        changePeriod.textContent = periodData.label;
    }
}

// Получение данных для текущего периода
function getCurrentPeriodData() {
    return periodData[currentPeriod] || periodData['1D'];
}

// Функция обновления цены HMSTR
async function updateHMSTRPrice() {
    try {
        // Пробуем получить реальные данные с CoinGecko
        const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=hamster-combat&vs_currencies=usd&include_24hr_change=true');
        
        if (response.ok) {
            const data = await response.json();
            if (data['hamster-combat']) {
                currentHMSTRPrice = data['hamster-combat'].usd;
                // Обновляем данные для периода 1D
                periodData['1D'].change = data['hamster-combat'].usd_24h_change;
                periodData['1D'].amount = (data['hamster-combat'].usd_24h_change / 100) * currentHMSTRPrice;
            }
        }
    } catch (error) {
        console.log('Используем локальные данные HMSTR');
        // Симулируем небольшие изменения цены
        const randomChange = (Math.random() - 0.5) * 2;
        currentHMSTRPrice = currentHMSTRPrice * (1 + randomChange / 100);
        
        // Обновляем данные для периода 1D
        periodData['1D'].change = randomChange;
        periodData['1D'].amount = (randomChange / 100) * currentHMSTRPrice;
    }
    
    updatePriceDisplay();
    updatePeriodDisplay();
}

// Обновление отображения цены
function updatePriceDisplay() {
    const priceElement = document.getElementById('hmstr-price');
    
    if (priceElement) {
        priceElement.textContent = `${currentHMSTRPrice.toFixed(6).replace('.', ',')} $`;
    }
}

// СОЗДАНИЕ ГРАФИКА В СТИЛЕ TELEGRAM WALLET
function createWalletChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    const chartData = generateChartDataForPeriod(currentPeriod);
    const periodData = getCurrentPeriodData();
    const isPositive = periodData.change >= 0;
    
    // Цвета как в Telegram Wallet
    const lineColor = isPositive ? '#00C851' : '#FF4444';
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    
    if (isPositive) {
        gradient.addColorStop(0, 'rgba(0, 200, 81, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 200, 81, 0.02)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 68, 68, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0.02)');
    }
    
    // Уничтожаем старый график если есть
    if (priceChart) {
        priceChart.destroy();
    }
    
    priceChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                data: chartData.prices,
                borderColor: lineColor,
                backgroundColor: gradient,
                borderWidth: 3,
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
                            size: 12,
                            family: "'Inter', sans-serif"
                        },
                        padding: 10
                    }
                },
                y: {
                    display: true,
                    position: 'right',
                    grid: {
                        display: true,
                        color: isDark ? '#2A2A2A' : '#F0F0F0',
                        drawBorder: false
                    },
                    ticks: {
                        color: isDark ? '#888888' : '#666666',
                        font: {
                            size: 11,
                            family: "'Inter', sans-serif"
                        },
                        padding: 8,
                        callback: function(value) {
                            return value.toFixed(6);
                        }
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
                    right: 10,
                    top: 10,
                    bottom: 0
                }
            }
        }
    });
}

// Генерация данных для разных периодов
function generateChartDataForPeriod(period) {
    const basePrice = currentHMSTRPrice;
    let labels = [];
    let prices = [];
    let dataPoints = 24;
    
    switch(period) {
        case '1D':
            labels = generateTimeLabels(24, 'hour');
            prices = generatePriceData(basePrice, 0.02, 24);
            break;
        case '7D':
            labels = generateTimeLabels(7, 'day');
            prices = generatePriceData(basePrice, 0.05, 7);
            break;
        case '1M':
            labels = generateTimeLabels(30, 'day');
            prices = generatePriceData(basePrice, 0.15, 30);
            break;
        case '1Y':
            labels = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
            prices = generatePriceData(basePrice, 0.8, 12);
            break;
        case 'ALL':
            labels = ['2023', '2024', '2025'];
            prices = [0.005, 0.001, basePrice];
            break;
    }
    
    return { labels, prices };
}

// Генерация меток времени
function generateTimeLabels(count, type) {
    const labels = [];
    const now = new Date();
    
    for (let i = count - 1; i >= 0; i--) {
        if (type === 'hour') {
            const hour = (now.getHours() - i + 24) % 24;
            labels.push(`${hour}:00`);
        } else {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            labels.push(date.getDate().toString());
        }
    }
    
    return labels;
}

// Генерация данных цены
function generatePriceData(basePrice, volatility, count) {
    const prices = [];
    let price = basePrice;
    
    for (let i = 0; i < count; i++) {
        const change = (Math.random() - 0.5) * volatility;
        price = Math.max(0.0001, price * (1 + change));
        prices.push(price);
    }
    
    return prices;
}

// Обновление графика для периода
function updateChartForPeriod() {
    if (!priceChart) return;
    
    const chartData = generateChartDataForPeriod(currentPeriod);
    const periodData = getCurrentPeriodData();
    const isPositive = periodData.change >= 0;
    const lineColor = isPositive ? '#00C851' : '#FF4444';
    
    const ctx = priceChart.ctx;
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    
    if (isPositive) {
        gradient.addColorStop(0, 'rgba(0, 200, 81, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 200, 81, 0.02)');
    } else {
        gradient.addColorStop(0, 'rgba(255, 68, 68, 0.3)');
        gradient.addColorStop(1, 'rgba(255, 68, 68, 0.02)');
    }
    
    priceChart.data.labels = chartData.labels;
    priceChart.data.datasets[0].data = chartData.prices;
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
            priceChart.options.scales.y.ticks.color = isDark ? '#888888' : '#666666';
            priceChart.options.scales.y.grid.color = isDark ? '#2A2A2A' : '#F0F0F0';
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
