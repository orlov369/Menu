from django.urls import path
from .views import fake_payment, menu_view, dishes_api
from django.conf import settings
from .views import dish_detail
from django.conf.urls.static import static
from .views import get_promotions

urlpatterns = [
    path('', menu_view, name='menu'),
    path('api/dishes/', dishes_api, name='dishes_api'),
    path('fake-payment/', fake_payment, name='fake_payment'),
    path('api/promotions/', get_promotions, name='promotions'),
    path('api/dishes/<int:pk>/', dish_detail, name='dish-detail'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)   