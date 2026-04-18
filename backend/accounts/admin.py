from django.contrib import admin
from accounts.models import User, Estabelecimento, Cliente, Funcionario, Gestor, CargoChoices


@admin.register(Estabelecimento)
class EstabelecimentoAdmin(admin.ModelAdmin):
    list_display = ['nome_fantasia', 'cnpj', 'endereco_completo', 'is_active']
    list_filter = ['is_active']
    search_fields = ['nome_fantasia', 'cnpj']
    ordering = ['nome_fantasia']


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['email', 'name', 'is_active', 'date_joined']
    list_filter = ['is_active', 'date_joined']
    search_fields = ['email', 'name']
    ordering = ['email']
    readonly_fields = ['date_joined', 'last_login']


@admin.register(Cliente)
class ClienteAdmin(admin.ModelAdmin):
    list_display = ['user', 'telefone_whatsapp', 'endereco_padrao']
    list_filter = ['telefone_whatsapp']
    search_fields = ['user__email', 'user__name', 'telefone_whatsapp']
    ordering = ['user__email']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user')


@admin.register(Funcionario)
class FuncionarioAdmin(admin.ModelAdmin):
    list_display = ['user', 'cargo', 'estabelecimento']
    list_filter = ['cargo', 'estabelecimento', 'user__is_active']
    search_fields = ['user__email', 'user__name', 'estabelecimento__nome_fantasia']
    ordering = ['user__email']
    #readonly_fields = ['user']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'estabelecimento')


@admin.register(Gestor)
class GestorAdmin(admin.ModelAdmin):
    list_display = ['user', 'estabelecimento']
    list_filter = ['estabelecimento', 'user__is_active']
    search_fields = ['user__email', 'user__name', 'estabelecimento__nome_fantasia']
    ordering = ['user__email']
    #readonly_fields = ['user']
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related('user', 'estabelecimento')