import json
import hmac
import hashlib
from django.shortcuts import render
from django.http import JsonResponse
from django.conf import settings
from django.views.decorators.csrf import csrf_exempt
from .models import Category, Dish, Order
from django.core.mail import send_mail
from django.http import HttpResponse
from django.conf import settings
import uuid
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .models import Promotion
from django.shortcuts import render

def home_view(request):
    return render(request, 'main/index.html')  # Убедитесь что шаблон существует

def validate_telegram_data(request):
    init_data = request.headers.get('X-Telegram-Init-Data', '')
    bot_token = settings.TELEGRAM_BOT_TOKEN
    
    secret_key = hashlib.sha256(bot_token.encode()).digest()
    data_check = hmac.new(secret_key, init_data.encode(), 'sha256').hexdigest()
    
    return data_check == request.headers.get('X-Telegram-Hash', '')

def menu_view(request):
    categories = Category.objects.all().order_by('order')
    return render(request, 'main/index.html', {'categories': categories})

def dishes_api(request):
    try:
        category_id = request.GET.get('category_id')
        if not category_id:
            return JsonResponse({'error': 'Не указан category_id'}, status=400)
        
        # Получаем категорию вместе с блюдами
        category = Category.objects.prefetch_related('dish_set').get(id=category_id)
        dishes = category.dish_set.all()
        
        dishes_list = []
        for dish in dishes:
            dish_data = {
                'id': dish.id,
                'name': dish.name,
                'price': float(dish.price),
                'description': dish.description,
                'image_url': request.build_absolute_uri(dish.image.url) if dish.image else None
            }
            dishes_list.append(dish_data)
        
        return JsonResponse(dishes_list, safe=False)
    
    except Category.DoesNotExist:
        return JsonResponse({'error': 'Категория не найдена'}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

@csrf_exempt
def checkout_api(request):
    if not validate_telegram_data(request):
        return JsonResponse({'error': 'Invalid request'}, status=403)
    
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            Order.objects.create(
                user_id=data['user']['id'],
                items=data['items'],
                total=data['total'],
                status='pending'
            )
            return JsonResponse({'success': True})
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
    return JsonResponse({'error': 'Invalid method'}, status=405)

def get_menu(request):
    categories = Category.objects.all().values('id', 'name', 'icon')
    return JsonResponse(list(categories), safe=False)

@api_view(['GET'])
def get_promotions(request):
    promotions = Promotion.objects.filter(is_active=True).order_by('-created_at')
    data = [{
        'id': p.id,
        'title': p.title,
        'description': p.description,
        'image_url': request.build_absolute_uri(p.image.url) if p.image else None
    } for p in promotions]
    return Response(data)

@csrf_exempt
def fake_payment(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            
            order = Order.objects.create(
                email=data['email'],
                total=data['total'],
                items=data['items'],
                is_paid=True,
                fake_payment_id=str(uuid.uuid4())
            )
            
            # Логирование для отладки
            print(f"Creating order for {data['email']}")
            print(f"Total: {data['total']}")
            print(f"Items: {data['items']}")

            send_mail(
                subject='✅ Заказ успешно оплачен',
                message='',
                html_message=f'''
                    <h2>Тестовая оплата</h2>
                    <p>Это демо-уведомление</p>
                    <ul>
                        <li>Сумма: {data['total']} ₽</li>
                        <li>Номер заказа: {order.id}</li>
                        <li>Фейковый ID: {order.fake_payment_id}</li>
                    </ul>
                ''',
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[data['email']],
                fail_silently=False
            )
            
            return JsonResponse({
                'status': 'success', 
                'order_id': order.id,
                'payment_id': order.fake_payment_id
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error', 
                'message': str(e)
            }, status=400)
    return JsonResponse({'status': 'error'}, status=405)

def dish_detail(request, pk):
    try:
        dish = Dish.objects.get(pk=pk)
        data = {
            'id': dish.id,
            'name': dish.name,
            'description': dish.description,
            'image': dish.image.url if dish.image else None,
            'composition': dish.composition,
            'weight': dish.weight,
            'calories': dish.calories,
            'proteins': dish.proteins,
            'fats': dish.fats,
            'carbohydrates': dish.carbohydrates
        }
        return JsonResponse(data)
    except Dish.DoesNotExist:
        return JsonResponse({'error': 'Dish not found'}, status=404)

