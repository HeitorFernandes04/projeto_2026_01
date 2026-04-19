from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from accounts.models import User, Estabelecimento, Cliente, Funcionario, Gestor, CargoChoices
from accounts.forms import MyUserCreationForm, MyUserChangeForm


@admin.register(Estabelecimento)
class EstabelecimentoAdmin(admin.ModelAdmin):
    list_display = ['nome_fantasia', 'cnpj', 'endereco_completo', 'is_active']
    list_filter = ['is_active']
    search_fields = ['nome_fantasia', 'cnpj']
    ordering = ['nome_fantasia']



@admin.register(User)
class UserAdmin(BaseUserAdmin):
    # Formulários customizados
    add_form = MyUserCreationForm
    form = MyUserChangeForm

    # Campos exibidos na lista
    list_display = ('email', 'name', 'is_active', 'is_staff', 'date_joined')
    list_filter = ('is_active', 'is_staff', 'is_superuser', 'date_joined')
    
    # Busca por e-mail e nome (customizado para seu modelo)
    search_fields = ('email', 'name')
    ordering = ('email',)

    # Estrutura do formulário de EDIÇÃO
    fieldsets = (
        (None, {'fields': ('email', 'password')}),
        ('Informações Pessoais', {'fields': ('name',)}),
        ('Permissões', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Datas Importantes', {'fields': ('last_login', 'date_joined')}),
    )

    # Estrutura do formulário de CRIAÇÃO (Novo Usuário)
    add_fieldsets = (
        (None, {
            'classes': ('advanced',),
            'fields': ('email', 'name', 'username', 'password1', 'password2', 'is_active', 'is_staff'),
        }),
    )

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