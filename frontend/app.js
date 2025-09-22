const tg = window.Telegram.WebApp;
tg.ready();
tg.expand();

const API_URL = '/api';
let currentGoal = null;
let currentTransactionType = null;
let allGoals = [];

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

        // Более детальная обработка ошибок
        if (error.message.includes('400')) {
            if (endpoint.includes('transaction')) {
                tg.showAlert('Вы пытаетесь снять больше, чем у вас есть');
            } else {
                tg.showAlert('Неверные данные. Проверьте введенную информацию.');
            }
        } else if (error.message.includes('404')) {
            tg.showAlert('Цель не найдена');
        } else {
            tg.showAlert('Произошла ошибка. Попробуйте позже.');
        }
        throw error;
    }
}

async function loadUserData() {
    try {
        const user = await apiRequest('/savings/user');
        const goals = await apiRequest('/savings/goals');

        allGoals = goals;

        if (goals && goals.length > 0) {
            showGoalsList();
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
    document.getElementById('goals-list').style.display = 'none';
}

function showGoalsList() {
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('main').style.display = 'none';
    document.getElementById('goals-list').style.display = 'flex';
    displayGoalsList();
}

function showMainScreen(goal) {
    currentGoal = goal;
    document.getElementById('onboarding').style.display = 'none';
    document.getElementById('goals-list').style.display = 'none';
    document.getElementById('main').style.display = 'flex';
    updateGoalDisplay();
}

function displayGoalsList() {
    const container = document.getElementById('goals-container');

    if (allGoals.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: var(--tg-theme-hint-color);">Нет целей. Создайте первую цель!</p>';
        return;
    }

    container.innerHTML = allGoals.map(goal => {
        const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);

        return `
            <div class="goal-card">
                <div class="goal-card-content" onclick="openGoal(${goal.id})">
                    <div class="goal-card-header">
                        <div class="goal-card-title">${goal.name}</div>
                        <div class="goal-card-amount">${formatNumber(goal.current_amount)} / ${formatNumber(goal.target_amount)} ₽</div>
                    </div>
                    <div class="goal-card-progress">
                        <div class="goal-card-progress-fill" style="width: ${progress}%"></div>
                    </div>
                    <div class="goal-card-percent">${progress.toFixed(1)}%</div>
                </div>
                <button class="goal-delete-btn" onclick="event.stopPropagation(); confirmDeleteGoalFromList(${goal.id})" title="Удалить цель">
                    🗑️
                </button>
            </div>
        `;
    }).join('');
}

function openGoal(goalId) {
    const goal = allGoals.find(g => g.id === goalId);
    if (goal) {
        showMainScreen(goal);
    }
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


function formatNumber(num) {
    return new Intl.NumberFormat('ru-RU').format(Math.round(num));
}

function showTransactionModal(type) {
    currentTransactionType = type;
    const modal = document.getElementById('transaction-modal');
    const title = document.getElementById('modal-title');
    const templates = document.getElementById('amount-templates');

    title.textContent = type === 'deposit' ? 'Пополнить копилку' : 'Снять из копилки';
    document.getElementById('transaction-amount').value = '';

    // Показываем шаблоны только для пополнения
    templates.style.display = type === 'deposit' ? 'grid' : 'none';

    modal.style.display = 'flex';
}

function addTemplateAmount(amount) {
    const input = document.getElementById('transaction-amount');
    const currentValue = parseFloat(input.value) || 0;
    const newValue = currentValue + amount;

    input.value = newValue;

    // Добавляем тактильную обратную связь
    tg.HapticFeedback.impactOccurred('light');
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
            amount: amount,
            goal_id: currentGoal.id
        });

        currentGoal.current_amount = result.current_amount;
        updateGoalDisplay();
        closeTransactionModal();

        tg.HapticFeedback.notificationOccurred('success');
    } catch (error) {
        console.error('Transaction failed:', error);
    }
}

// Обработчик для формы на экране onboarding
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
        const newGoal = await apiRequest('/savings/goal', 'POST', {
            name,
            target_amount: targetAmount,
            initial_amount: initialAmount
        });

        allGoals.push(newGoal);
        showMainScreen(newGoal);
        tg.HapticFeedback.notificationOccurred('success');
    } catch (error) {
        console.error('Failed to create goal:', error);
    }
});

// Обработчик для новой формы создания цели
document.getElementById('new-goal-form').addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('new-goal-name').value;
    const targetAmount = parseFloat(document.getElementById('new-goal-amount').value);
    const initialAmount = parseFloat(document.getElementById('new-initial-amount').value) || 0;

    if (!name || !targetAmount || targetAmount <= 0) {
        tg.showAlert('Заполните все поля корректно');
        return;
    }

    try {
        const newGoal = await apiRequest('/savings/goal', 'POST', {
            name,
            target_amount: targetAmount,
            initial_amount: initialAmount
        });

        allGoals.push(newGoal);
        hideCreateGoalForm();
        displayGoalsList();
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

function confirmDeleteGoal() {
    if (!currentGoal) return;

    tg.showConfirm(`Удалить цель "${currentGoal.name}"? Это действие нельзя отменить.`, (result) => {
        if (result) {
            deleteGoal();
        }
    });
}

async function deleteGoal() {
    if (!currentGoal) return;

    try {
        await apiRequest(`/savings/goal/${currentGoal.id}`, 'DELETE');

        allGoals = allGoals.filter(g => g.id !== currentGoal.id);

        if (allGoals.length > 0) {
            showGoalsList();
        } else {
            showOnboardingScreen();
        }

        tg.HapticFeedback.notificationOccurred('success');
    } catch (error) {
        console.error('Failed to delete goal:', error);
        tg.showAlert('Ошибка при удалении цели');
    }
}

// Функции для управления формой создания цели
function showCreateGoalForm() {
    document.getElementById('create-goal-form').style.display = 'block';
    document.getElementById('new-goal-name').value = '';
    document.getElementById('new-goal-amount').value = '';
    document.getElementById('new-initial-amount').value = '0';
}

function hideCreateGoalForm() {
    document.getElementById('create-goal-form').style.display = 'none';
}

function showCreateGoalFromMain() {
    showGoalsList();
    showCreateGoalForm();
}

function confirmDeleteGoalFromList(goalId) {
    const goal = allGoals.find(g => g.id === goalId);
    if (!goal) return;

    tg.showConfirm(`Удалить цель "${goal.name}"? Это действие нельзя отменить.`, async (result) => {
        if (result) {
            try {
                await apiRequest(`/savings/goal/${goalId}`, 'DELETE');
                allGoals = allGoals.filter(g => g.id !== goalId);

                if (allGoals.length > 0) {
                    displayGoalsList();
                } else {
                    showOnboardingScreen();
                }

                tg.HapticFeedback.notificationOccurred('success');
            } catch (error) {
                console.error('Failed to delete goal:', error);
                tg.showAlert('Ошибка при удалении цели');
            }
        }
    });
}

if (tg.themeParams) {
    const root = document.documentElement;
    Object.entries(tg.themeParams).forEach(([key, value]) => {
        root.style.setProperty(`--tg-theme-${key.replace(/_/g, '-')}`, value);
    });
}

loadUserData();