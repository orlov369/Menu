from django.urls import path
from .views import fake_payment, menu_view, dishes_api
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('', menu_view, name='menu'),
    path('api/dishes/', dishes_api, name='dishes_api'),
    path('fake-payment/', fake_payment, name='fake_payment'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)