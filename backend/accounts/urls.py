from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView
from accounts.views import RegisterView
from accounts.views import register_page
from accounts.views import RegisterView, register_page, login_page

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', TokenObtainPairView.as_view(), name='login'),
    path('register-page/', register_page, name='register-page'),
    path('login-page/', login_page, name='login-page'),
]