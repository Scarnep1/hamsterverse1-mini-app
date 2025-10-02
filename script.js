// Add to initializeApp function
function initializeApp() {
    setupNavigation();
    setupReferralLink();
    setupPlayButtons();
    setupTelegramIntegration();
    setupPriceData();
    setupDailyBonus();
    setupGuideButton();
    setupThemeToggle(); // Добавь эту строку
}

// Add new function for theme toggle
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
        
        // Update chart if it exists
        updateChartTheme();
    }
}

function updateChartTheme() {
    const chartCanvas = document.getElementById('priceChart');
    if (chartCanvas) {
        const chart = Chart.getChart(chartCanvas);
        if (chart) {
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            
            chart.options.scales.x.ticks.color = isDark ? '#b0b0b0' : '#666';
            chart.options.plugins.tooltip.backgroundColor = isDark ? 'rgba(45, 45, 45, 0.9)' : 'rgba(255, 255, 255, 0.9)';
            chart.options.plugins.tooltip.bodyColor = isDark ? '#ffffff' : '#1a1a1a';
            chart.options.plugins.tooltip.titleColor = isDark ? '#ffffff' : '#1a1a1a';
            
            chart.update();
        }
    }
}

// Update createPriceChart function to be theme-aware
function createPriceChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    
    const prices = [];
    let currentPrice = 0.01;
    
    for (let i = 0; i < 7; i++) {
        const change = (Math.random() - 0.5) * 0.008;
        currentPrice = Math.max(0.005, currentPrice * (1 + change));
        prices.push(currentPrice);
    }
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['6d', '5d', '4d', '3d', '2d', '1d', 'Now'],
            datasets: [{
                data: prices,
                borderColor: '#667eea',
                backgroundColor: 'rgba(102, 126, 234, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#667eea',
                pointBorderColor: isDark ? '#2d2d2d' : '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: isDark ? 'rgba(45, 45, 45, 0.9)' : 'rgba(255, 255, 255, 0.9)',
                    bodyColor: isDark ? '#ffffff' : '#1a1a1a',
                    titleColor: isDark ? '#ffffff' : '#1a1a1a',
                    callbacks: {
                        label: function(context) {
                            return `$${context.parsed.y.toFixed(4)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: {
                        color: isDark ? '#b0b0b0' : '#666',
                        font: { size: 9 }
                    }
                },
                y: { display: false }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}
