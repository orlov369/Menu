from django.db import models

class Category(models.Model):
    name = models.CharField("Название", max_length=100)
    icon = models.CharField("Иконка", max_length=50, default='fa-utensils')
    order = models.PositiveIntegerField("Порядок", default=0)
    
    class Meta:
        verbose_name = "Категория"
        verbose_name_plural = "Категории"
        ordering = ['order']
    
    def __str__(self):
        return self.name

class Dish(models.Model):
    SPICY_LEVELS = [
        (0, 'Не острое'),
        (1, 'Легкая острота'),
        (2, 'Острое'),
        (3, 'Очень острое')
    ]
    
    category = models.ForeignKey(Category, on_delete=models.CASCADE, verbose_name="Категория")
    name = models.CharField("Название", max_length=200)
    description = models.TextField("Описание")
    price = models.DecimalField("Цена", max_digits=8, decimal_places=2)
    image = models.ImageField("Фото", upload_to='dishes/', blank=True, null=True)
    weight = models.PositiveIntegerField("Вес (г)", default=300)
    calories = models.PositiveIntegerField("Калории", default=0)
    protein = models.FloatField("Белки", default=0.0)
    fat = models.FloatField("Жиры", default=0.0)
    carbs = models.FloatField("Углеводы", default=0.0)
    spicy = models.IntegerField("Острота", choices=SPICY_LEVELS, default=0)
    
    class Meta:
        verbose_name = "Блюдо"
        verbose_name_plural = "Блюда"
        ordering = ['category', 'name']
    
    def __str__(self):
        return f"{self.name} ({self.category})"


class Order(models.Model):
    email = models.EmailField()
    total = models.DecimalField(max_digits=10, decimal_places=2)
    items = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_paid = models.BooleanField(default=False)
    fake_payment_id = models.CharField(max_length=36, blank=True)

    def __str__(self):
        return f"Order #{self.id} - {self.email}"  # Убрано user_id