
import json
import uuid
from decimal import Decimal

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.http import require_GET, require_POST

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Product,
    Category,
    Cart,
    CartItem,
    UserProfile,
    Order,
    OrderItem,
)
from .serializer import ProductSerializer, CategorySerializer, CartSerializer


# -----------------------------------------
# PRODUCT VIEWS
# -----------------------------------------

@api_view(['GET'])
def get_products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_product_detail(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    serializer = ProductSerializer(
        product,
        context={'request': request}
    )
    return Response(serializer.data)


@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


# -----------------------------------------
# CART VIEWS
# -----------------------------------------

def get_or_create_cart(request):
    if not request.session.session_key:
        request.session.create()

    session_key = request.session.session_key

    cart, created = Cart.objects.get_or_create(
        session_key=session_key
    )

    return cart


@api_view(['GET'])
def get_cart(request):
    cart = get_or_create_cart(request)

    serializer = CartSerializer(
        cart,
        context={'request': request}
    )

    return Response(serializer.data)


@api_view(['POST'])
def add_to_cart(request):
    cart = get_or_create_cart(request)

    product_id = request.data.get('product_id')

    try:
        quantity = int(request.data.get('quantity', 1))
    except (TypeError, ValueError):
        return Response({'error': 'Invalid quantity'}, status=400)

    if quantity <= 0:
        return Response(
            {'error': 'Quantity must be greater than zero'},
            status=400
        )

    try:
        product = Product.objects.get(pk=product_id)
    except (Product.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Product not found'}, status=404)

    cart_item, created = CartItem.objects.get_or_create(
        cart=cart,
        product=product
    )

    if not created:
        cart_item.quantity += quantity
    else:
        cart_item.quantity = quantity

    cart_item.save()

    return Response({
        'message': 'Successfully added the product to cart'
    })


@api_view(['POST'])
def remove_from_cart(request):
    cart = get_or_create_cart(request)

    product_id = request.data.get('product_id')

    try:
        cart_item = CartItem.objects.get(
            cart=cart,
            product_id=product_id
        )

        cart_item.delete()

        return Response({
            'message': 'Successfully removed the product from cart'
        })

    except (CartItem.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Product not in cart'}, status=404)


@api_view(['POST'])
def update_cart_item(request):
    cart = get_or_create_cart(request)

    product_id = request.data.get('product_id')

    try:
        quantity = int(request.data.get('quantity', 1))
    except (TypeError, ValueError):
        return Response({'error': 'Invalid quantity'}, status=400)

    try:
        cart_item = CartItem.objects.get(
            cart=cart,
            product_id=product_id
        )

        if quantity <= 0:
            cart_item.delete()
        else:
            cart_item.quantity = quantity
            cart_item.save()

        return Response({'message': 'Cart updated successfully'})

    except (CartItem.DoesNotExist, ValueError, TypeError):
        return Response({'error': 'Product not in cart'}, status=404)


# -----------------------------------------
# USER AUTHENTICATION
# -----------------------------------------

@ensure_csrf_cookie
@require_GET
def get_csrf_token(request):
    return JsonResponse({
        'message': 'CSRF cookie set'
    })


def login_and_preserve_cart(request, user):
    old_session_key = request.session.session_key

    login(request, user)

    new_session_key = request.session.session_key

    if old_session_key and new_session_key:
        if old_session_key != new_session_key:
            Cart.objects.filter(
                session_key=old_session_key
            ).update(session_key=new_session_key)


@csrf_protect
@require_POST
def register_user(request):

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {'error': 'Invalid request data'},
            status=400
        )

    name = str(data.get('name', '')).strip()
    email = str(data.get('email', '')).strip().lower()
    password = data.get('password', '')
    phone = str(data.get('phone', '')).strip()

    if not name or not email or not password or not phone:
        return JsonResponse(
            {'error': 'Please fill in all fields'},
            status=400
        )

    try:
        validate_email(email)
    except ValidationError:
        return JsonResponse(
            {'error': 'Enter a valid email address'},
            status=400
        )

    if len(phone) > 15:
        return JsonResponse(
            {'error': 'Phone number must not exceed 15 characters'},
            status=400
        )

    if User.objects.filter(email__iexact=email).exists():
        return JsonResponse(
            {'error': 'This email is already registered'},
            status=400
        )

    if User.objects.filter(username__iexact=email).exists():
        return JsonResponse(
            {'error': 'This email cannot be used. Please try another'},
            status=400
        )

    from django.contrib.auth.password_validation import validate_password

    try:
        validate_password(password)
    except ValidationError as error:
        return JsonResponse(
            {'error': error.messages},
            status=400
        )

    user = User.objects.create_user(
        username=email,
        first_name=name,
        email=email,
        password=password
    )

    UserProfile.objects.create(
        user=user,
        phone=phone,
        address=''
    )

    login_and_preserve_cart(request, user)

    return JsonResponse(
        {
            'message': 'Registration successful',
            'user': {
                'id': user.id,
                'name': user.first_name,
                'email': user.email,
                'phone': phone
            }
        },
        status=201
    )


@csrf_protect
@require_POST
def login_user(request):

    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {'error': 'Invalid request data'},
            status=400
        )

    email = str(data.get('email', '')).strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return JsonResponse(
            {'error': 'Email and password are required'},
            status=400
        )

    user = authenticate(
        request,
        username=email,
        password=password
    )

    if user is None:
        return JsonResponse(
            {'error': 'Invalid email or password'},
            status=400
        )

    login_and_preserve_cart(request, user)

    phone = ''

    if hasattr(user, 'userprofile'):
        phone = user.userprofile.phone

    return JsonResponse(
        {
            'message': 'Login successful',
            'user': {
                'id': user.id,
                'name': user.first_name,
                'email': user.email,
                'phone': phone
            }
        }
    )


# -----------------------------------------
# CURRENT LOGGED-IN USER
# -----------------------------------------

@require_GET
def current_user(request):

    if not request.user.is_authenticated:
        return JsonResponse({
            'authenticated': False
        })

    phone = ''

    if hasattr(request.user, 'userprofile'):
        phone = request.user.userprofile.phone

    return JsonResponse(
        {
            'authenticated': True,
            'user': {
                'id': request.user.id,
                'name': request.user.first_name,
                'email': request.user.email,
                'phone': phone
            }
        }
    )


# -----------------------------------------
# LOGOUT
# -----------------------------------------

@csrf_protect
@require_POST
def logout_user(request):

    old_session_key = request.session.session_key

    logout(request)

    request.session.create()

    new_session_key = request.session.session_key

    if old_session_key and new_session_key:
        Cart.objects.filter(
            session_key=old_session_key
        ).update(session_key=new_session_key)

    return JsonResponse({
        'message': 'Logout successful'
    })


# -----------------------------------------
# CHECKOUT - CASH ON DELIVERY
# -----------------------------------------

@csrf_protect
@require_POST
def checkout(request):

    # Check customer login
    if not request.user.is_authenticated:
        return JsonResponse(
            {'error': 'Please login before placing an order'},
            status=401
        )

    # Read checkout details
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse(
            {'error': 'Invalid request data'},
            status=400
        )

    address = str(data.get('address', '')).strip()
    phone = str(data.get('phone', '')).strip()

    if not address or not phone:
        return JsonResponse(
            {'error': 'Delivery address and phone number are required'},
            status=400
        )

    if len(phone) < 7 or len(phone) > 15:
        return JsonResponse(
            {'error': 'Enter a valid phone number'},
            status=400
        )

    # Get the customer's cart
    if not request.session.session_key:
        return JsonResponse(
            {'error': 'Your cart is empty'},
            status=400
        )

    try:
        cart = Cart.objects.get(
            session_key=request.session.session_key
        )
    except Cart.DoesNotExist:
        return JsonResponse(
            {'error': 'Your cart is empty'},
            status=400
        )

    cart_items = list(
        cart.items.select_related('product').all()
    )

    if not cart_items:
        return JsonResponse(
            {'error': 'Your cart is empty'},
            status=400
        )

    # Calculate total using database prices
    total_amount = sum(
        (
            item.product.price * item.quantity
            for item in cart_items
        ),
        Decimal('0.00')
    )

    # Create order and order items together
    with transaction.atomic():

        order = Order.objects.create(
            user=request.user,
            order_number="HK" + uuid.uuid4().hex[:10].upper(),
            delivery_address=address,
            phone=phone,
            total_amount=total_amount,
            payment_method='COD',
            status='Pending'
        )

        for item in cart_items:
            OrderItem.objects.create(
                order=order,
                product=item.product,
                quantity=item.quantity,
                price=item.product.price
            )

        # Save customer's latest delivery information
        profile, created = UserProfile.objects.get_or_create(
            user=request.user,
            defaults={
                'phone': phone,
                'address': address
            }
        )

        if not created:
            profile.phone = phone
            profile.address = address
            profile.save()

        # Clear cart after successful order creation
        cart.items.all().delete()

    return JsonResponse(
        {
            'message': 'Order placed successfully',
            'order': {
                'order_number': order.order_number,
                'total_amount': str(order.total_amount),
                'payment_method': order.payment_method,
                'status': order.status,
                'delivery_address': order.delivery_address,
                'phone': order.phone,
                'created_at': order.created_at.isoformat()
            }
        },
        status=201
    )


import json
import uuid
from decimal import Decimal

from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import transaction
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie, csrf_protect
from django.views.decorators.http import require_GET, require_POST

from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import (
    Product,
    Category,
    Cart,
    CartItem,
    UserProfile,
    Order,
    OrderItem,
)
from .serializer import ProductSerializer, CategorySerializer, CartSerializer


# -----------------------------------------
# PRODUCT VIEWS
# -----------------------------------------

@api_view(['GET'])
def get_products(request):
    products = Product.objects.all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
def get_product_detail(request, pk):
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=404)

    serializer = ProductSerializer(
        product,
        context={'request': request}
    )
    return Response(serializer.data)


@api_view(['GET'])
def get_categories(request):
    categories = Category.objects.all()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)

