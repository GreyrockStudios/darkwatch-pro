from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User
    list_display = ['email', 'first_name', 'last_name', 'plan', 'is_staff']
    list_filter = ['plan', 'is_staff', 'is_active']
    fieldsets = UserAdmin.fieldsets + (
        ('DarkWatch', {'fields': ('company', 'plan', 'credits')}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('DarkWatch', {'fields': ('company', 'plan', 'credits')}),
    )
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['email']