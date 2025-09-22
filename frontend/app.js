const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const API_URL = '/api';
let currentGoal = null;
let currentTransactionType = null;

const initData = tg.initData;

async function apiRequest(endpoint, method = 'GET', body = null) {
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'x-telegram-init-data': initData || 'test-data'
        }
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, options);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        tg.showAlert('Произошла ошибка. Попробуйте позже.');
        throw error;
    }
}

async function loadUserData() {
    try {
        const user = await apiRequest('/savings/user');
        const goal = await apiRequest('/savings/goal');

        if (goal) {
            currentGoal = goal;
            showMainScreen();
            loadTransactions();
        } else {
            showOnboardingScreen();
        }
    } catch (error) {
        console.error('Failed to load user data:', error);
    } finally {
        hideLoader();
    }
}

function showOnboardingScreen() {
    document.getElementById('onboarding').style.display = 'flex';
    document.getElementById('main').style.display = 'none';
}

function showMainScreen() {
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('main').style.display = 'flex';
    updateGoalDisplay();
}

function hideLoader() {
    document.getElementById('loader').style.display = 'none';
}

function updateGoalDisplay() {
    if (!currentGoal) return;

    document.getElementById('goal-title').textContent = currentGoal.name;
    document.getElementById('current-amount').textContent = formatNumber(currentGoal.current_amount);
    document.getElementById('target-amount').textContent = formatNumber(currentGoal.target_amount);

    const progress = Math.min((currentGoal.current_amount / currentGoal.target_amount) * 100, 100);
    document.getElementById('progress-fill').style.width = `${progress}%`;
    document.getElementById('progress-percent').textContent = `${progress.toFixed(1)}%`;

    if (progress >= 100) {
        tg.showPopup({
            title: '🎉 Поздравляем!',
            message: 'Вы достигли своей цели!',
            buttons: [{type: 'ok'}]
        });
    }
}

async function loadTransactions() {
    try {
        const transactions = await apiRequest('/savings/transactions?limit=10');
        displayTransactions(transactions);
    } catch (error) {
        console.error('Failed to load transactions:', error);
    }
}

function displayTransactions(transactions) {
    const container = document.getElementById('transactions-list');

    if (transactions.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--tg-theme-hint-color);">Нет операций</p>';
        return;
    }

    container.innerHTML = transactions.map(transaction => {
        const date = new Date(transaction.created_at);
        const isDeposit = transaction.type === 'deposit';

        return `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-info">
                    <span class="transaction-type">${isDeposit ? 'Пополнение' : 'Снятие'}</span>
                    <span class="transaction-date">${date.toLocaleString('ru-RU')}</span>
                </div>
                <span class="transaction-amount ${isDeposit ? 'positive' : 'negative'}">
                    ${isDeposit ? '+' : '-'}${formatNumber(transaction.amount)} ₽
                </span>
            </div>
        `;
    }).join('');
}

function formatNumber(num) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(num));
}

function showTransactionModal(type) {
    currentTransactionType = type;
    const modal = document.getElementById('transaction-modal');
    const title = document.getElementById('modal-title');

    title.textContent = type === 'deposit' ? 'Пополнить копилку' : 'Снять из копилки';
    document.getElementById('transaction-amount').value = '';
    modal.style.display = 'flex';
}

function closeTransactionModal() {
    document.getElementById('transaction-modal').style.display = 'none';
    currentTransactionType = null;
}

async function processTransaction() {
    const amount = parseFloat(document.getElementById('transaction-amount').value);

    if (!amount || amount <= 0) {
        tg.showAlert('Введите корректную сумму');
        return;
    }

    try {
        const result = await apiRequest('/savings/transaction', 'POST', {
            type: currentTransactionType,
            amount: amount
        });

        currentGoal.current_amount = result.current_amount;
        updateGoalDisplay();
        loadTransactions();
        closeTransactionModal();

        tg.HapticFeedback.notificationOccurred('success');
    } catch (error) {
        console.error('Transaction failed:', error);
    }
}

document.getElementById('goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('goal-name').value;
    const targetAmount = parseFloat(document.getElementById('goal-amount').value);
    const initialAmount = parseFloat(document.getElementById('initial-amount').value) || 0;

    if (!name || !targetAmount || targetAmount <= 0) {
        tg.showAlert('Заполните все поля корректно');
        return;
    }

    try {
        currentGoal = await apiRequest('/savings/goal', 'POST', {
            name,
            target_amount: targetAmount,
            initial_amount: initialAmount
        });

        showMainScreen();
        loadTransactions();
        tg.HapticFeedback.notificationOccurred('success');
    } catch (error) {
        console.error('Failed to create goal:', error);
    }
});

document.getElementById('transaction-modal').addEventListener('click', (e) => {
    if (e.target.id === 'transaction-modal') {
        closeTransactionModal();
    }
});

if (tg.themeParams) {
    const root = document.documentElement;
    Object.entries(tg.themeParams).forEach(([key, value]) => {
        root.style.setProperty(`--tg-theme-${key.replace(/_/g, '-')}`, value);
    });
}

loadUserData();