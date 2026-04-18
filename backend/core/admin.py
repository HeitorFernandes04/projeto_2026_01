from django.contrib import admin
from .models import Servico, Veiculo, TagPeca, VistoriaItem


@admin.register(Servico)
class ServicoAdmin(admin.ModelAdmin):
    """Admin configuration for Servico model."""
    list_display = ('nome', 'preco', 'duracao_estimada_minutos', 'estabelecimento', 'is_active')
    list_filter = ('estabelecimento', 'is_active')
    search_fields = ('nome', 'estabelecimento__nome')
    list_editable = ('is_active',)
    ordering = ('nome',)
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome', 'preco', 'duracao_estimada_minutos')
        }),
        ('Configurações', {
            'fields': ('estabelecimento', 'is_active')
        }),
    )


@admin.register(Veiculo)
class VeiculoAdmin(admin.ModelAdmin):
    """Admin configuration for Veiculo model."""
    list_display = ('placa', 'modelo', 'marca', 'cor', 'estabelecimento')
    list_filter = ('estabelecimento', 'marca', 'cor')
    search_fields = ('placa', 'modelo', 'marca')
    ordering = ('placa',)
    
    fieldsets = (
        ('Informações do Veículo', {
            'fields': ('placa', 'modelo', 'marca', 'cor')
        }),
        ('Configurações', {
            'fields': ('estabelecimento',)
        }),
    )


@admin.register(TagPeca)
class TagPecaAdmin(admin.ModelAdmin):
    """Admin configuration for TagPeca model."""
    list_display = ('nome', 'categoria', 'estabelecimento')
    list_filter = ('estabelecimento', 'categoria')
    search_fields = ('nome', 'categoria')
    ordering = ('nome',)
    
    fieldsets = (
        ('Informações da Peça', {
            'fields': ('nome', 'categoria')
        }),
        ('Configurações', {
            'fields': ('estabelecimento',)
        }),
    )


@admin.register(VistoriaItem)
class VistoriaItemAdmin(admin.ModelAdmin):
    """Admin configuration for VistoriaItem model."""
    list_display = ('ordem_servico', 'tag_peca', 'possui_avaria')
    list_filter = ('possui_avaria', 'tag_peca__categoria')
    search_fields = ('ordem_servico__id', 'tag_peca__nome')
    ordering = ('ordem_servico', 'tag_peca')
    
    fieldsets = (
        ('Informações da Vistoria', {
            'fields': ('ordem_servico', 'tag_peca', 'possui_avaria')
        }),
        ('Mídia', {
            'fields': ('foto_url',)
        }),
    )
