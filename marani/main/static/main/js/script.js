document.addEventListener('DOMContentLoaded', () => {
    // Безопасное получение элементов
    const getElement = (selector, parent = document) => {
        const el = parent.querySelector(selector);
        if (!el) console.warn(`Element not found: ${selector}`);
        return el;
    };

    // Основные элементы
    const elements = {
        // Основные контейнеры
        categoriesContainer: getElement('#categories-container'),
        dishesContainer: getElement('#dishes-container'),
        dishesList: getElement('#dishes-list'),
        cartSidebar: getElement('#cart-sidebar'),

        dishDetailsModal: document.getElementById('dish-details-modal'),
        dishDetailsContainer: document.getElementById('dish-details-container'),
        closeDetails: document.querySelector('.close-details'),
        
        deliveryButton: document.getElementById('delivery-button'),
        deliveryModal: document.getElementById('delivery-modal'),
        closeDelivery: document.querySelector('.close-delivery'),

        // Элементы корзины
        cartContent: getElement('#cart-content'),
        cartCounter: getElement('#cart-counter'),
        totalAmount: getElement('#total-amount'),
        checkoutBtn: getElement('#checkout-btn'),
        
        // Кнопки и триггеры
        cartIcon: getElement('#cart-icon'),
        closeCart: getElement('#close-cart'),
        backToCategories: getElement('#back-to-categories'),
        
        // Информационные элементы
        currentCategoryName: getElement('#current-category-name'),
        appFooter: getElement('#app-footer'),

        promoButton: getElement('#promo-button'),
        promoModal: getElement('#promo-modal'),
        promoList: getElement('#promo-list'),
        closePromo: getElement('.close-promo')
    };

    // Состояние приложения
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    let currentCategory = null;
    const dishesCache = {};

    // Инициализация Telegram WebApp
    const initTelegramWebApp = () => {
        if (window.Telegram?.WebApp?.version && elements.appFooter) {
            elements.appFooter.style.paddingBottom = 'calc(1.5rem + env(safe-area-inset-bottom))';
        }
    };

    // Обновление корзины
    const updateCart = () => {
        try {
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // Обновление счетчика
            if (elements.cartCounter) {
                elements.cartCounter.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
            }
            
            // Обновление общей суммы
            if (elements.totalAmount) {
                elements.totalAmount.textContent = `${calculateTotal().toFixed(2)} ₽`;
            }
            
            // Отрисовка элементов корзины
            if (elements.cartContent) {
                elements.cartContent.innerHTML = cart.map(item => `
                    <div class="cart-item">
                        <div class="item-info">
                            <h4>${item.name}</h4>
                            <span class="item-price">${(item.price * item.quantity).toFixed(2)} ₽</span>
                            <span>${item.price} ₽ × ${item.quantity}</span>
                        </div>
                        <div class="item-controls">
                            <button class="btn-quantity" data-id="${item.id}" data-action="decrease">−</button>
                            <button class="btn-quantity" data-id="${item.id}" data-action="increase">+</button>
                            <button class="btn-remove" data-id="${item.id}">×</button>
                        </div>
                    </div>
                `).join('');
            }

        } catch (error) {
            console.error('Cart update error:', error);
        }
    };

    // Расчет общей суммы
    const calculateTotal = () => {
        return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    };

    // Загрузка блюд категории
    const loadCategoryDishes = async (categoryId, categoryName) => {
        if (!elements.dishesList || !elements.currentCategoryName) return;
        
        try {
            elements.currentCategoryName.textContent = categoryName;
            elements.dishesList.innerHTML = '<div class="loading">⌛ Загрузка...</div>';
            
            if (elements.dishesContainer) {
                elements.dishesContainer.style.display = 'block';
            }
            
            currentCategory = categoryId;

            // Проверка кэша
            if (dishesCache[categoryId]) {
                renderDishes(dishesCache[categoryId]);
                return;
            }

            // Запрос данных
            const response = await fetch(`/api/dishes/?category_id=${categoryId}`);
            if (!response.ok) throw new Error(`Ошибка ${response.status}`);
            
            const dishes = await response.json();
            dishesCache[categoryId] = dishes;
            renderDishes(dishes);

        } catch (error) {
            console.error('Category load error:', error);
            if (elements.dishesList) {
                elements.dishesList.innerHTML = `
                    <div class="error">
                        ❌ Ошибка загрузки: ${error.message}<br>
                        <button class="retry-btn">Повторить попытку</button>
                    </div>
                `;
                
                getElement('.retry-btn', elements.dishesList)?.addEventListener('click', 
                    () => loadCategoryDishes(categoryId, categoryName));
            }
        }
    };

    // Отрисовка блюд
    const renderDishes = (dishes) => {
        if (!elements.dishesList) return;
        
        elements.dishesList.innerHTML = dishes.map(dish => `
            <div class="dish-card">
                ${dish.image_url ? `
                    <img src="${dish.image_url}" class="dish-image" loading="lazy" alt="${dish.name}">
                ` : ''}
                <div class="dish-info">
                    <h3>${dish.name}</h3>
                    ${dish.description ? `<p>${dish.description}</p>` : ''}
                    <div class="dish-footer">
                        <span>${dish.price} ₽</span>
                        <button class="add-to-cart" data-dish='${JSON.stringify(dish)}'>
                            Добавить
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    };

    // Обработчики событий
    const setupEventListeners = () => {
        // Категории
        if (elements.categoriesContainer) {
            elements.categoriesContainer.addEventListener('click', (e) => {
                const card = e.target.closest('.category-card');
                if (card) {
                    const categoryId = card.dataset.categoryId;
                    const categoryName = getElement('.category-name', card)?.textContent;
                    if (categoryId && categoryName) {
                        loadCategoryDishes(categoryId, categoryName);
                    }
                }
            });


    document.body.addEventListener('click', (e) => {
        if (e.target.classList.contains('details-button')) {
            const dishId = e.target.dataset.dishId;
            loadDishDetails(dishId);
        }
    });
    
    // Закрытие модального окна деталей
    if (elements.closeDetails) {
        elements.closeDetails.addEventListener('click', () => {
            elements.dishDetailsModal.style.display = 'none';
        });
    }
    
    // Закрытие по клику вне окна
    if (elements.dishDetailsModal) {
        elements.dishDetailsModal.addEventListener('click', (e) => {
            if (e.target === elements.dishDetailsModal) {
                elements.dishDetailsModal.style.display = 'none';
            }
        });
    }

    // Обработчик кнопки доставки
    if (elements.deliveryButton && elements.deliveryModal) {
        elements.deliveryButton.addEventListener('click', () => {
            elements.deliveryModal.style.display = 'flex';
        });
    }
    
    // Закрытие модального окна доставки
    if (elements.closeDelivery) {
        elements.closeDelivery.addEventListener('click', () => {
            elements.deliveryModal.style.display = 'none';
        });
    }
    
    // Закрытие по клику вне окна
    if (elements.deliveryModal) {
        elements.deliveryModal.addEventListener('click', (e) => {
            if (e.target === elements.deliveryModal) {
                elements.deliveryModal.style.display = 'none';
            }
        });
    }

        // Акции
    if (elements.promoButton && elements.promoModal) {
        elements.promoButton.addEventListener('click', () => {
            elements.promoModal.style.display = 'flex';
            loadPromotions();
        });
    }
    
    if (elements.closePromo && elements.promoModal) {
        elements.closePromo.addEventListener('click', () => {
            elements.promoModal.style.display = 'none';
        });
    }
    
    // Закрытие по клику вне окна
    if (elements.promoModal) {
        elements.promoModal.addEventListener('click', (e) => {
            if (e.target === elements.promoModal) {
                elements.promoModal.style.display = 'none';
            }
        });
    }
        }

        // Назад к категориям
        if (elements.backToCategories) {
            elements.backToCategories.addEventListener('click', () => {
                if (elements.dishesContainer) {
                    elements.dishesContainer.style.display = 'none';
                }
            });
        }

const loadDishDetails = async (dishId) => {
    try {
        const response = await fetch(`/api/dishes/${dishId}/`);
        if (!response.ok) throw new Error('Ошибка загрузки');
        
        const dish = await response.json();
        renderDishDetails(dish);
        
        if (elements.dishDetailsModal) {
            elements.dishDetailsModal.style.display = 'flex';
        }
    } catch (error) {
        console.error('Error loading dish details:', error);
    }
};

    document.addEventListener('click', function(e) {
    if (e.target.classList.contains('details-btn')) {
        const dishId = e.target.getAttribute('data-dish-id');
        loadDishDetails(dishId);
    }
    
    if (e.target.classList.contains('close-modal')) {
        document.getElementById('dish-details-modal').style.display = 'none';
    }
});

// Функция отрисовки деталей блюда
const renderDishDetails = (dish) => {
    if (!elements.dishDetailsContainer) return;
    
    elements.dishDetailsContainer.innerHTML = `
        <h3>${dish.name}</h3>
        ${dish.image ? `<img src="${dish.image}" class="dish-image-modal">` : ''}
        
        <div class="dish-details-section">
            <h4>Описание</h4>
            <p>${dish.description || 'Нет описания'}</p>
        </div>
        
        ${dish.composition ? `
        <div class="dish-details-section">
            <h4>Состав</h4>
            <p>${dish.composition}</p>
        </div>` : ''}
        
        <div class="nutrition-facts">
            ${dish.weight ? `
            <div class="nutrition-item">
                <div class="nutrition-value">${dish.weight}</div>
                <div class="nutrition-label">Вес (г)</div>
            </div>` : ''}
            
            ${dish.calories ? `
            <div class="nutrition-item">
                <div class="nutrition-value">${dish.calories}</div>
                <div class="nutrition-label">Ккал</div>
            </div>` : ''}
            
            ${dish.proteins ? `
            <div class="nutrition-item">
                <div class="nutrition-value">${dish.proteins}</div>
                <div class="nutrition-label">Белки </div>
            </div>` : ''}
            
            ${dish.fats ? `
            <div class="nutrition-item">
                <div class="nutrition-value">${dish.fats}</div>
                <div class="nutrition-label">Жиры </div>
            </div>` : ''}
            
            ${dish.carbohydrates ? `
            <div class="nutrition-item">
                <div class="nutrition-value">${dish.carbohydrates}</div>
                <div class="nutrition-label">Углеводы </div>
            </div>` : ''}
        </div>
    `;
};



const loadPromotions = async () => {
    if (!elements.promoList) return;
    
    try {
        elements.promoList.innerHTML = '<div class="loading">Загрузка акций...</div>';
        
        const response = await fetch('/api/promotions/');
        if (!response.ok) throw new Error('Ошибка загрузки');
        
        const promotions = await response.json();
        renderPromotions(promotions);
    } catch (error) {
        console.error('Error loading promotions:', error);
        if (elements.promoList) {
            elements.promoList.innerHTML = '<div class="error">Не удалось загрузить акции</div>';
        }
    }
};

// Отрисовка акций
const renderPromotions = (promotions) => {
    if (!elements.promoList) return;
    
    elements.promoList.innerHTML = promotions.map(promo => `
        <div class="promo-item">
            ${promo.image_url ? `
                <img src="${promo.image_url}" class="promo-image" loading="lazy" alt="${promo.title}">
            ` : ''}
            <div class="promo-info">
                <h3 class="promo-title">${promo.title}</h3>
                ${promo.description ? `<p>${promo.description}</p>` : ''}
            </div>
        </div>
    `).join('');
};

        // Глобальные обработчики
        document.body.addEventListener('click', (e) => {
            // Добавление в корзину
            if (e.target.classList.contains('add-to-cart') && e.target.dataset.dish) {
                try {
                    const dish = JSON.parse(e.target.dataset.dish);
                    const existing = cart.find(item => item.id === dish.id);
                    existing ? existing.quantity++ : cart.push({...dish, quantity: 1});
                    updateCart();
                    
                    // Анимация иконки корзины
                    if (elements.cartIcon) {
                        elements.cartIcon.classList.add('jump');
                        setTimeout(() => elements.cartIcon.classList.remove('jump'), 500);
                    }
                } catch (error) {
                    console.error('Add to cart error:', error);
                }
            }

            // Управление количеством
            if (e.target.classList.contains('btn-quantity') && e.target.dataset.id) {
                const item = cart.find(i => i.id == e.target.dataset.id);
                if (item) {
                    const action = e.target.dataset.action;
                    if (action === 'increase') item.quantity++;
                    if (action === 'decrease') item.quantity = Math.max(1, item.quantity - 1);
                    updateCart();
                }
            }

            // Удаление товара
            if (e.target.classList.contains('btn-remove') && e.target.dataset.id) {
                cart = cart.filter(item => item.id != e.target.dataset.id);
                updateCart();
            }
        });

        // Корзина
        if (elements.cartIcon && elements.cartSidebar) {
            elements.cartIcon.addEventListener('click', () => 
                elements.cartSidebar.classList.add('active'));
        }
        
        if (elements.closeCart && elements.cartSidebar) {
            elements.closeCart.addEventListener('click', () => 
                elements.cartSidebar.classList.remove('active'));
        }

        // Оформление заказа
        if (elements.checkoutBtn) {
            elements.checkoutBtn.addEventListener('click', handleCheckout);
        }
    };

    // Оформление заказа
    const handleCheckout = async () => {
        if (cart.length === 0) {
            alert('🛒 Корзина пуста!');
            return;
        }

        try {
            if (window.Telegram?.WebApp?.version) {
                tg.sendData(JSON.stringify({
                    items: cart,
                    total: calculateTotal()
                }));
                return;
            }

            const email = prompt('Введите email для получения чека:');
            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                alert('📧 Некорректный email!');
                return;
            }

            const response = await fetch('/fake-payment/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken') || ''
                },
                body: JSON.stringify({
                    email,
                    total: calculateTotal(),
                    items: cart
                })
            });

            const result = await response.json();
            if (result.status === 'success') {
                cart = [];
                updateCart();
                if (elements.cartSidebar) elements.cartSidebar.classList.remove('active');
                alert('✅ Заказ успешно оформлен! Чек отправлен на email');
            } else {
                throw new Error(result.message || 'Ошибка сервера');
            }
        } catch (error) {
            alert(`❌ Ошибка: ${error.message}`);
            console.error('Checkout error:', error);
        }
    };

    // Вспомогательные функции
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    // Инициализация приложения
    const initApp = () => {
        initTelegramWebApp();
        setupEventListeners();
        updateCart();
    };

    initApp();
});