document.addEventListener('DOMContentLoaded', () => {
    // Элементы интерфейса
    const UI = {
        dishesContainer: document.getElementById('dishes-container'),
        dishesList: document.getElementById('dishes-list'),
        cartContent: document.getElementById('cart-content'),
        cartCounter: document.getElementById('cart-counter'),
        totalAmount: document.getElementById('total-amount'),
        cartSidebar: document.getElementById('cart-sidebar'),
        closeCart: document.getElementById('close-cart'),
        checkoutBtn: document.getElementById('checkout-btn'),
        cartIcon: document.getElementById('cart-icon'),
        backToCategories: document.getElementById('back-to-categories'),
        currentCategoryName: document.getElementById('current-category-name'),
        // Новые элементы
        modal: document.createElement('div'),
        modalContent: document.createElement('div')
    };

    // Состояние приложения
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let currentCategory = null;
    const dishesCache = {}; // Кэш для блюд
    let tg = null;

    // ======================
    // Инициализация
    // ======================
    const init = () => {
        setupEventListeners();
        setupModal();
        updateCart();
        
        // Инициализация Telegram Web Apps
        if (window.Telegram && Telegram.WebApp) {
            tg = Telegram.WebApp;
            tg.expand();
            tg.enableClosingConfirmation();
            console.log('Telegram Web App initialized');
        }
        
        console.log('App initialized');
    };

    // ======================
    // Настройка модального окна
    // ======================
    const setupModal = () => {
        UI.modal.className = 'modal';
        UI.modalContent.className = 'modal-content';
        
        UI.modalContent.innerHTML = `
            <h3>Оформление заказа</h3>
            <form id="checkout-form">
                <div class="form-group">
                    <label for="email">Email для чека</label>
                    <input type="email" id="email" name="email" required>
                </div>
                <div class="form-actions">
                    <button type="button" id="cancel-checkout">Отмена</button>
                    <button type="submit">Подтвердить</button>
                </div>
            </form>
        `;
        
        UI.modal.appendChild(UI.modalContent);
        document.body.appendChild(UI.modal);
        
        // Обработчики для модалки
        document.getElementById('cancel-checkout').addEventListener('click', closeModal);
        document.getElementById('checkout-form').addEventListener('submit', handleCheckout);
    };

    const openModal = () => UI.modal.style.display = 'flex';
    const closeModal = () => UI.modal.style.display = 'none';

    // ======================
    // Основные функции
    // ======================
    const updateCart = () => {
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Обновление UI
            UI.cartCounter.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
            UI.totalAmount.textContent = `${calculateTotal().toFixed(2)} ₽`;
            
            // Отрисовка элементов корзины
            UI.cartContent.innerHTML = cart.map(item => `
                <div class="cart-item">
                    <div class="item-info">
                        <h4>${item.name}</h4>
                        <span class="item-price">${(item.price * item.quantity).toFixed(2)} ₽</span>
                        <span>${item.price} ₽ × ${item.quantity}</span>
                    </div>
                    <div class="item-controls">
                        <button class="btn-quantity" 
                                data-id="${item.id}" 
                                data-action="decrease">−</button>
                        <button class="btn-quantity" 
                                data-id="${item.id}" 
                                data-action="increase">+</button>
                        <button class="btn-remove" 
                                data-id="${item.id}">×</button>
                    </div>
                </div>
            `).join('');

        } catch (error) {
            console.error('Cart update error:', error);
            showError('Ошибка обновления корзины');
        }
    };

    // ======================
    // Работа с категориями и блюдами
    // ======================
    const loadCategoryDishes = async (categoryId, categoryName) => {
        try {
            // Обновляем UI
            UI.currentCategoryName.textContent = categoryName;
            UI.dishesList.innerHTML = '<div class="loading">⌛ Загрузка...</div>';
            UI.dishesContainer.style.display = 'block';
            currentCategory = categoryId;

            // Проверяем кэш
            if (dishesCache[categoryId]) {
                renderDishes(dishesCache[categoryId]);
                return;
            }

            // Запрос данных
            const response = await fetch(`/api/dishes/?category_id=${categoryId}`);
            
            if (!response.ok) {
                throw new Error(`Ошибка ${response.status}`);
            }

            const dishes = await response.json();
            
            // Кэшируем результат
            dishesCache[categoryId] = dishes;
            
            // Отрисовываем блюда
            renderDishes(dishes);

        } catch (error) {
            console.error('Category load error:', error);
            UI.dishesList.innerHTML = `
                <div class="error">
                    ❌ Ошибка загрузки: ${error.message}<br>
                    <button class="retry-btn">Повторить попытку</button>
                </div>
            `;
            
            // Добавляем обработчик для кнопки повтора
            document.querySelector('.retry-btn')?.addEventListener('click', 
                () => loadCategoryDishes(categoryId, categoryName));
        }
    };

    const renderDishes = (dishes) => {
        UI.dishesList.innerHTML = dishes.map(dish => `
            <div class="dish-card">
                ${dish.image_url ? `
                    <img src="${dish.image_url}" 
                         class="dish-image" 
                         loading="lazy"
                         alt="${dish.name}">
                ` : ''}
                <div class="dish-info">
                    <h3>${dish.name}</h3>
                    ${dish.description ? `<p>${dish.description}</p>` : ''}
                    <div class="dish-footer">
                        <span>${dish.price} ₽</span>
                        <button class="add-to-cart" 
                                data-dish='${JSON.stringify(dish)}'>
                            Добавить
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    };

    // ======================
    // Обработчики событий
    // ======================
    const setupEventListeners = () => {
        // Категории
        document.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', () => {
                const categoryId = card.dataset.categoryId;
                const categoryName = card.querySelector('.category-name').textContent;
                loadCategoryDishes(categoryId, categoryName);
            });
        });

        // Назад к категориям
        UI.backToCategories.addEventListener('click', () => {
            UI.dishesContainer.style.display = 'none';
        });

        // Глобальные обработчики
        document.body.addEventListener('click', (e) => {
            // Добавление в корзину
            if (e.target.classList.contains('add-to-cart')) {
                const dish = JSON.parse(e.target.dataset.dish);
                const existing = cart.find(item => item.id === dish.id);
                
                if (existing) {
                    existing.quantity++;
                } else {
                    cart.push({...dish, quantity: 1});
                }
                
                updateCart();
                
                // Анимация иконки корзины
                UI.cartIcon.classList.add('jump');
                setTimeout(() => UI.cartIcon.classList.remove('jump'), 500);
            }

            // Управление количеством
            if (e.target.classList.contains('btn-quantity')) {
                const item = cart.find(i => i.id == e.target.dataset.id);
                const action = e.target.dataset.action;
                
                if (action === 'increase') item.quantity++;
                if (action === 'decrease') item.quantity = Math.max(1, item.quantity - 1);
                
                updateCart();
            }

            // Удаление товара
            if (e.target.classList.contains('btn-remove')) {
                cart = cart.filter(item => item.id != e.target.dataset.id);
                updateCart();
            }
        });

        // Корзина
        UI.cartIcon.addEventListener('click', () => 
            UI.cartSidebar.classList.add('active'));
        
        UI.closeCart.addEventListener('click', () => 
            UI.cartSidebar.classList.remove('active'));

        // Оформление заказа
        UI.checkoutBtn.addEventListener('click', () => {
            if (cart.length === 0) {
                showError('🛒 Корзина пуста!');
                return;
            }
            openModal();
        });
    };

    // ======================
    // Оформление заказа
    // ======================
    const handleCheckout = async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        
        if (!validateEmail(email)) {
            showError('📧 Некорректный email!');
            return;
        }

        try {
            // Используем Telegram API если доступно
            if (tg) {
                const data = {
                    email: email,
                    total: calculateTotal(),
                    items: cart.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    }))
                };
                
                tg.sendData(JSON.stringify(data));
                tg.close();
                return;
            }

            // Стандартная обработка
            const response = await fetch('/fake-payment/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCSRFToken()
                },
                body: JSON.stringify({
                    email: email,
                    total: calculateTotal(),
                    items: cart.map(item => ({
                        id: item.id,
                        name: item.name,
                        price: item.price,
                        quantity: item.quantity
                    }))
                })
            });

            const result = await response.json();
            
            if (result.status === 'success') {
                // Очистка корзины
                cart = [];
                updateCart();
                UI.cartSidebar.classList.remove('active');
                closeModal();
                showSuccess('✅ Заказ успешно оформлен! Чек отправлен на email');
            } else {
                throw new Error(result.message || 'Ошибка сервера');
            }
        } catch (error) {
            showError(`❌ Ошибка: ${error.message}`);
            console.error('Checkout error:', error);
        }
    };

    // ======================
    // Вспомогательные функции
    // ======================
    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    const validateEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    };

    const getCSRFToken = () => {
        return document.cookie
            .split('; ')
            .find(row => row.startsWith('csrftoken='))
            ?.split('=')[1] || '';
    };

    const showError = (message) => {
        alert(message);
    };

    const showSuccess = (message) => {
        alert(message);
    };

    // Запуск приложения
    init();
});