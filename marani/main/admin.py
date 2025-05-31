from django.contrib import admin
from django import forms
from django.utils.html import format_html
from .models import Category, Dish, Order
from .models import Promotion

class CategoryAdminForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = '__all__'
        widgets = {
            'icon': forms.TextInput(attrs={'placeholder': 'Пример: fas fa-utensils'}),
        }

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    form = CategoryAdminForm
    list_display = ('name', 'icon_preview', 'order')
    list_editable = ('order',)
    search_fields = ('name',)
    
    def icon_preview(self, obj):
        return format_html(f'<i class="{obj.icon} fa-lg"></i>') if obj.icon else "-"
    icon_preview.short_description = 'Иконка'

@admin.register(Dish)
class DishAdmin(admin.ModelAdmin):
    list_display = ('name', 'category', 'price', 'weight', 'is_active')
    list_filter = ('category', 'is_active')
    search_fields = ('name', 'description')
    fieldsets = (
        ('Основная информация', {
            'fields': ('name', 'category', 'price', 'image', 'is_active')
        }),
        ('Описание', {
            'fields': ('description',)
        }),
        ('Детали', {
            'fields': ('weight', 'composition', 'calories', 
                      'proteins', 'fats', 'carbohydrates'),
            'classes': ('collapse',)  # Сворачиваемый блок
        }),
    )
    
    def image_preview(self, obj):
        if obj.image:
            return format_html(f'<img src="{obj.image.url}" style="max-height: 50px;"/>')
        return "-"
    image_preview.short_description = 'Превью'

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        'id', 
        'email', 
        'total', 
        'created_at', 
        'is_paid', 
        'fake_payment_id'
    )
    list_filter = ('is_paid', 'created_at')
    search_fields = ('email', 'fake_payment_id')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)

    fieldsets = (
        (None, {
            'fields': ('email', 'total', 'items')
        }),
        ('Payment Info', {
            'fields': ('is_paid', 'fake_payment_id', 'created_at')
        }),
    )

@admin.register(Promotion)
class PromotionAdmin(admin.ModelAdmin):
    list_display = ('title', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('title', 'description')
    readonly_fields = ('created_at',)