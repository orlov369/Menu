document.addEventListener('DOMContentLoaded', function() {
    // Безопасное получение элементов
    const getElement = (selector, parent = document) => {
        const el = parent.querySelector(selector);
        if (!el) console.warn(`Element not found: ${selector}`);
        return el;
    };

    // Основные элементы
    const elements = {
        categoriesContainer: getElement('#categories-container'),
        dishesContainer: getElement('#dishes-container'),
        dishesList: getElement('#dishes-list'),
        cartSidebar: getElement('#cart-sidebar'),
        cartContent: getElement('#cart-content'),
        cartCounter: getElement('#cart-counter'),
        totalAmount: getElement('#total-amount'),
        checkoutBtn: getElement('#checkout-btn'),
        cartIcon: getElement('#cart-icon'),
        closeCart: getElement('#close-cart'),
        backToCategories: getElement('#back-to-categories'),
        currentCategoryName: getElement('#current-category-name'),
        appFooter: getElement('#app-footer'),
        deliveryButton: getElement('#delivery-button'),
        deliveryModal: getElement('#delivery-modal'),
        closeDelivery: getElement('.close-modal', getElement('#delivery-modal')),
        promoButton: getElement('#promo-button'),
        promoModal: getElement('#promo-modal'),
        promoList: getElement('#promo-list'),
        closePromo: getElement('.close-modal', getElement('#promo-modal')),
        closeDetails: getElement('.close-modal', getElement('#dish-details-modal')),
        dishDetailsModal: getElement('#dish-details-modal'),
        dishDetailsContent: getElement('#dish-details-content'),
        checkoutModal: getElement('#checkout-modal'),
        orderSuccessModal: getElement('#order-success-modal'),
        restaurantTitle: getElement('.restaurant-title'),
        cancelBtn: getElement('.cancel-btn')
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
            
            if (elements.cartCounter) {
                elements.cartCounter.textContent = cart.reduce((sum, item) => sum + item.quantity, 0);
            }
            
            if (elements.totalAmount) {
                elements.totalAmount.textContent = `${calculateTotal().toFixed(2)} ₽`;
            }
            
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
                `).join('') || '<div class="empty">Корзина пуста</div>';
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

            if (dishesCache[categoryId]) {
                renderDishes(dishesCache[categoryId]);
                return;
            }

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

    // Отрисовка блюд (с кнопкой "Подробнее")
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
                        <div class="dish-actions">
                            <button class="details-btn" data-dish-id="${dish.id}">Подробнее</button>
                            <button class="add-to-cart" data-dish='${JSON.stringify(dish)}'>
                                Добавить
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    };

    // Загрузка деталей блюда
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

    // Отрисовка деталей блюда
    const renderDishDetails = (dish) => {
        if (!elements.dishDetailsContent) return;
        
        elements.dishDetailsContent.innerHTML = `
            <h3 class="dish-details-title">${dish.name}</h3>
            ${dish.image_url ? `<img src="${dish.image_url}" class="dish-details-image">` : ''}
            
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
                <div class="nutrition-item weight">
                    <div class="nutrition-value">${dish.weight}</div>
                    <div class="nutrition-label">Вес (г)</div>
                </div>` : ''}
                
                ${dish.calories ? `
                <div class="nutrition-item calories">
                    <div class="nutrition-value">${dish.calories}</div>
                    <div class="nutrition-label">Ккал</div>
                </div>` : ''}
                
                ${dish.proteins ? `
                <div class="nutrition-item proteins">
                    <div class="nutrition-value">${dish.proteins}</div>
                    <div class="nutrition-label">Белки (г)</div>
                </div>` : ''}
                
                ${dish.fats ? `
                <div class="nutrition-item fats">
                    <div class="nutrition-value">${dish.fats}</div>
                    <div class="nutrition-label">Жиры (г)</div>
                </div>` : ''}
                
                ${dish.carbohydrates ? `
                <div class="nutrition-item carbohydrates">
                    <div class="nutrition-value">${dish.carbohydrates}</div>
                    <div class="nutrition-label">Углеводы (г)</div>
                </div>` : ''}
            </div>
        `;
    };

     // Загрузка акций
const loadPromotions = async () => {
    if (!elements.promoList) return;
    
    try {
        // Показываем индикатор загрузки
        elements.promoList.innerHTML = '<div class="loading">Загрузка акций...</div>';
        
        // Добавляем небольшую задержку для демонстрации (можно убрать в продакшене)
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const response = await fetch('/api/promotions/');
        if (!response.ok) throw new Error(`Ошибка ${response.status}`);
        
        const promotions = await response.json();
        
        if (promotions.length === 0) {
            elements.promoList.innerHTML = '<div class="empty">Сейчас нет активных акций</div>';
            return;
        }
        
        renderPromotions(promotions);
    } catch (error) {
        console.error('Error loading promotions:', error);
        if (elements.promoList) {
            elements.promoList.innerHTML = `
                <div class="error">
                    ❌ Не удалось загрузить акции<br>
                    <button class="retry-btn">Повторить попытку</button>
                </div>
            `;
            
            // Добавляем обработчик для кнопки повтора
            const retryBtn = elements.promoList.querySelector('.retry-btn');
            if (retryBtn) {
                retryBtn.addEventListener('click', loadPromotions);
            }
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
                ${promo.description ? `<p class="promo-description">${promo.description}</p>` : ''}
                ${promo.created_at ? `
                    <div class="promo-date">Добавлено: ${new Date(promo.created_at).toLocaleDateString()}</div>
                ` : ''}
            </div>
        </div>
    `).join('');
};


    // Функция оформления заказа
    const handleCheckout = () => {
        if (cart.length === 0) {
            alert('🛒 Корзина пуста!');
            return;
        }

        if (elements.checkoutModal) {
            elements.checkoutModal.style.display = 'flex';
            
            // Устанавливаем шрифт как у заголовка "Марани"
            const modalTitle = elements.checkoutModal.querySelector('h3');
            if (modalTitle && elements.restaurantTitle) {
                modalTitle.style.fontFamily = getComputedStyle(elements.restaurantTitle).fontFamily;
            }
        }
    };

    // Обработчик формы оформления заказа
    const handleOrderSubmit = (e) => {
        e.preventDefault();
        
        const form = e.target;
        const formData = {
            customer_name: form.customer_name.value.trim(),
            phone: form.phone.value,
            address: form.address.value.trim(),
            payment_method: form.querySelector('input[name="payment_method"]:checked').value
        };
        
        // Валидация
        if (!formData.customer_name) {
            alert('Пожалуйста, укажите ваше имя');
            return;
        }
        
        if (!validatePhone(formData.phone)) {
            alert('Пожалуйста, укажите корректный номер телефона');
            return;
        }
        
        if (!formData.address) {
            alert('Пожалуйста, укажите адрес доставки');
            return;
        }
        
        // Закрываем модальное окно формы
        if (elements.checkoutModal) {
            elements.checkoutModal.style.display = 'none';
        }
        
        // Очищаем корзину
        cart = [];
        updateCart();
        
        // Закрываем сайдбар корзины
        if (elements.cartSidebar) {
            elements.cartSidebar.classList.remove('active');
        }
        
        // Показываем уведомление об успехе
        if (elements.orderSuccessModal) {
            elements.orderSuccessModal.style.display = 'flex';
        }
        
        // Выводим данные заказа в консоль
        console.log('Заказ оформлен:', {
            ...formData,
            items: cart,
            total: calculateTotal()
        });
    };

    // Обработчик кнопки "Отмена"
    const handleCancelOrder = () => {
        if (elements.checkoutModal) {
            elements.checkoutModal.style.display = 'none';
        }
    };

    // Функция для форматирования телефона
    function formatPhoneNumber(phone) {
        const cleaned = ('' + phone).replace(/\D/g, '');
        const isRussianNumber = cleaned.length === 11 && cleaned[0] === '8' || 
                              cleaned.length === 11 && cleaned[0] === '7' ||
                              cleaned.length === 10;
        
        if (!isRussianNumber) {
            return phone;
        }
        
        const match = cleaned.match(/^(\d|7|8)?(\d{3})(\d{3})(\d{2})(\d{2})$/);
        if (match) {
            return '+7 (' + match[2] + ') ' + match[3] + '-' + match[4] + '-' + match[5];
        }
        return phone;
    }

    // Инициализация маски телефона
    function initPhoneMask() {
        const phoneInput = document.getElementById('phone');
        if (phoneInput) {
            phoneInput.addEventListener('input', function(e) {
                const input = e.target;
                const cleaned = input.value.replace(/\D/g, '');
                let formatted = '';
                
                if (cleaned.length > 0) {
                    formatted = '+7 (';
                    if (cleaned.length > 1) {
                        formatted += cleaned.substring(1, 4);
                    }
                    if (cleaned.length > 4) {
                        formatted += ') ' + cleaned.substring(4, 7);
                    }
                    if (cleaned.length > 7) {
                        formatted += '-' + cleaned.substring(7, 9);
                    }
                    if (cleaned.length > 9) {
                        formatted += '-' + cleaned.substring(9, 11);
                    }
                }
                
                input.value = formatted;
            });
        }
    }

    // Функция валидации телефона
    function validatePhone(phone) {
        const cleaned = phone.replace(/\D/g, '');
        return cleaned.length === 11;
    }

    // Получение cookie
    const getCookie = (name) => {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
    };

    // Настройка обработчиков событий
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
        }

        // Назад к категориям
        if (elements.backToCategories) {
            elements.backToCategories.addEventListener('click', () => {
                if (elements.dishesContainer) {
                    elements.dishesContainer.style.display = 'none';
                }
            });
        }

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

        // Форма заказа
        const orderForm = document.getElementById('checkout-form');
        if (orderForm) {
            orderForm.addEventListener('submit', handleOrderSubmit);
        }

        // Кнопка "Отмена"
        if (elements.cancelBtn) {
            elements.cancelBtn.addEventListener('click', handleCancelOrder);
        }

        // Доставка
        if (elements.deliveryButton && elements.deliveryModal) {
            elements.deliveryButton.addEventListener('click', () => {
                elements.deliveryModal.style.display = 'flex';
            });
        }
        
        if (elements.closeDelivery && elements.deliveryModal) {
            elements.closeDelivery.addEventListener('click', () => {
                elements.deliveryModal.style.display = 'none';
            });
        }
        
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
        loadPromotions(); // Загружаем акции при открытии модального окна
    });
        }
        
        if (elements.closePromo && elements.promoModal) {
            elements.closePromo.addEventListener('click', () => {
                elements.promoModal.style.display = 'none';
            });
        }
        
        if (elements.promoModal) {
            elements.promoModal.addEventListener('click', (e) => {
                if (e.target === elements.promoModal) {
                    elements.promoModal.style.display = 'none';
                }
            });
        }

        // Детали блюда
        if (elements.closeDetails && elements.dishDetailsModal) {
            elements.closeDetails.addEventListener('click', () => {
                elements.dishDetailsModal.style.display = 'none';
            });
        }
        
        if (elements.dishDetailsModal) {
            elements.dishDetailsModal.addEventListener('click', (e) => {
                if (e.target === elements.dishDetailsModal) {
                    elements.dishDetailsModal.style.display = 'none';
                }
            });
        }

        // Успешное оформление заказа
        if (elements.orderSuccessModal) {
            elements.orderSuccessModal.addEventListener('click', (e) => {
                if (e.target === elements.orderSuccessModal) {
                    elements.orderSuccessModal.style.display = 'none';
                }
            });
            
            const closeSuccess = getElement('.close-success-modal', elements.orderSuccessModal);
            if (closeSuccess) {
                closeSuccess.addEventListener('click', () => {
                    elements.orderSuccessModal.style.display = 'none';
                });
            }
        }

        // Глобальные обработчики
        document.addEventListener('click', (e) => {
            // Добавление в корзину
            if (e.target.classList.contains('add-to-cart') && e.target.dataset.dish) {
                try {
                    const dish = JSON.parse(e.target.dataset.dish);
                    const existing = cart.find(item => item.id === dish.id);
                    existing ? existing.quantity++ : cart.push({...dish, quantity: 1});
                    updateCart();
                    
                    if (elements.cartIcon) {
                        elements.cartIcon.classList.add('jump');
                        setTimeout(() => elements.cartIcon.classList.remove('jump'), 500);
                    }
                } catch (error) {
                    console.error('Add to cart error:', error);
                }
            }

            // Кнопка "Подробнее"
            if (e.target.classList.contains('details-btn')) {
                const dishId = e.target.dataset.dishId;
                if (dishId) loadDishDetails(dishId);
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
    };

    // Инициализация приложения
    const initApp = () => {
        initTelegramWebApp();
        setupEventListeners();
        updateCart();
        initPhoneMask();
    };

    initApp();
});