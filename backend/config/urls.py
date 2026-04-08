from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from api.admin import admin_site


def handler400(request, exception=None):
    return JsonResponse({'error': 'Bad request'}, status=400)


def handler403(request, exception=None):
    return JsonResponse({'error': 'Forbidden'}, status=403)


def handler404(request, exception=None):
    return JsonResponse({'error': 'Not found'}, status=404)


def handler500(request):
    return JsonResponse({'error': 'Internal server error'}, status=500)


urlpatterns = [
    path('admin/', admin_site.urls),
    path('api/', include('api.urls')),
]

urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
