import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

SECRET_KEY = 'ваш-секретный-ключ'  # Замените на реальный ключ

DEBUG = True

if not DEBUG:
    raise Exception("Фейковая оплата запрещена в production!")

# Настройки почты
EMAIL_BACKEND = 'django.core.mail.backends.smtp.EmailBackend'
EMAIL_HOST = 'smtp.gmail.com'
EMAIL_PORT = 587  # Для TLS
EMAIL_USE_TLS = False
EMAIL_HOST_USER = 'orlovt220905@gmail.com'  # Полный адрес Gmail
EMAIL_HOST_PASSWORD = 'dpwk ddqa dcuw zmon'  # Пароль приложения (не пароль от аккаунта!)
DEFAULT_FROM_EMAIL = 'maranimenu <orlovt220905@gmail.com>'

ALLOWED_HOSTS = ['maranirestoran.ru', 'localhost', '127.0.0.1', '141.8.193.104']

SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'main.apps.MainConfig',
    'rest_framework',  
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'marani.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'main/templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'marani.wsgi.application'

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'a1128841_123',
        'USER': 'a1128841_123',
        'PASSWORD': 'POEPapF3',
        'HOST': 'localhost',
        'PORT': '5432',
    }
}

AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

LANGUAGE_CODE = 'ru-ru'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

STATIC_URL = '/static/'


TELEGRAM_BOT_TOKEN = '7267018854:AAHPvFZ2IfliD0GcBseCosY9fX0p1l7Z2yQ'
TELEGRAM_WEBAPP_URL = 'https://localhost:8000/'  # Для разработки

CORS_ALLOWED_ORIGINS = [
    "https://telegram.org",
    "https://web.telegram.org",
]

MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

CSRF_TRUSTED_ORIGINS = [
     'http://localhost:8000',
    'http://127.0.0.1:8000',
    'https://your-domain.com'
]
CORS_ALLOWED_ORIGINS = [
    "http://localhost:8000",
    "http://127.0.0.1:8000",
]
# Для тестирования писем в консоль:
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'