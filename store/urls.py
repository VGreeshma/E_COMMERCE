
from django.urls import path
from . import views

urlpatterns = [

    # Product URLs
    path('products/', views.get_products),
    path('products/<int:pk>/', views.get_product_detail),
    path('categories/', views.get_categories),

    # Cart URLs
    path('cart/', views.get_cart),
    path('cart/add_to_cart/', views.add_to_cart),
    path('cart/remove/', views.remove_from_cart),
    path('cart/update/', views.update_cart_item),

    # Authentication URLs
    path('auth/csrf/', views.get_csrf_token),
    path('auth/register/', views.register_user),
    path('auth/login/', views.login_user),
    path('auth/logout/', views.logout_user),
    path('auth/me/', views.current_user),

    # Checkout URL
    path('orders/checkout/', views.checkout),

]
