from django.db import models
from django.core.serializers.json import DjangoJSONEncoder
import json

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
    name = models.CharField(max_length=200, verbose_name="Название")
    category = models.ForeignKey(Category, on_delete=models.CASCADE, verbose_name="Категория")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Цена")
    description = models.TextField(verbose_name="Описание", blank=True)
    image = models.ImageField(
    upload_to='dishes/',
    verbose_name="Изображение",
    blank=True,  # Необязательное в формах
    null=True,   # Может быть NULL в базе
    help_text="Загрузите фото блюда"
    )
    is_active = models.BooleanField(default=True, verbose_name="Активно")
    
    # Новые поля для детальной информации
    weight = models.PositiveIntegerField(verbose_name="Вес (г)", blank=True, null=True)
    composition = models.TextField(verbose_name="Состав", blank=True)
    calories = models.PositiveIntegerField(verbose_name="Калории", blank=True, null=True)
    proteins = models.DecimalField(max_digits=5, decimal_places=1, verbose_name="Белки", blank=True, null=True)
    fats = models.DecimalField(max_digits=5, decimal_places=1, verbose_name="Жиры", blank=True, null=True)
    carbohydrates = models.DecimalField(max_digits=5, decimal_places=1, verbose_name="Углеводы", blank=True, null=True)

    class Meta:
        verbose_name = "Блюдо"
        verbose_name_plural = "Блюда"

    def __str__(self):
        return f"{self.name} - {self.price}₽"


class Order(models.Model):
    email = models.EmailField()
    total = models.DecimalField(max_digits=10, decimal_places=2)
    items = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_paid = models.BooleanField(default=False)
    fake_payment_id = models.CharField(max_length=36, blank=True)

    def __str__(self):
        return f"Order #{self.id} - {self.email}"  # Убрано user_id
    
    
class Promotion(models.Model):
    title = models.CharField(max_length=200, verbose_name="Название акции")
    description = models.TextField(verbose_name="Описание")
    image = models.ImageField(upload_to='promotions/', verbose_name="Изображение")
    is_active = models.BooleanField(default=True, verbose_name="Активна")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        verbose_name = "Акция"
        verbose_name_plural = "Акции"

    def __str__(self):
        return self.title