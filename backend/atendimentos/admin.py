from django.contrib import admin
from django import forms
from .models import IncidenteOS, Servico, Veiculo, OrdemServico, MidiaOrdemServico, TagPeca


class OrdemServicoAdminForm(forms.ModelForm):
    data_hora = forms.DateTimeField(
        widget=forms.TextInput(attrs={'placeholder': 'DD/MM/AAAA HH:MM'}),
        input_formats=['%d/%m/%Y %H:%M', '%Y-%m-%d %H:%M'],
        help_text='Formato: DD/MM/AAAA HH:MM (ex: 29/03/2026 14:30)'
    )

    class Meta:
        model = OrdemServico
        fields = '__all__'


class MidiaOrdemServicoInline(admin.TabularInline):
    model = MidiaOrdemServico
    extra = 0
    readonly_fields = ('enviado_em',)


@admin.register(OrdemServico)
class OrdemServicoAdmin(admin.ModelAdmin):
    form = OrdemServicoAdminForm
    inlines = [MidiaOrdemServicoInline]
    list_display = ('id', 'veiculo', 'servico', 'status', 'data_hora', 'funcionario')
    list_filter = ('status', 'data_hora')
    search_fields = ('veiculo__placa',)


@admin.register(MidiaOrdemServico)
class MidiaOrdemServicoAdmin(admin.ModelAdmin):
    list_display = ('id', 'ordem_servico', 'momento', 'enviado_em')
    list_filter = ('momento',)
    readonly_fields = ('enviado_em',)


@admin.register(TagPeca)
class TagPecaAdmin(admin.ModelAdmin):
    list_display = ('nome', 'categoria')
    list_filter = ('categoria',)
    search_fields = ('nome',)


@admin.register(IncidenteOS)
class IncidenteOSAdmin(admin.ModelAdmin):
    list_display = ('ordem_servico', 'tag_peca', 'resolvido', 'data_registro')
    list_filter = ('resolvido', 'data_registro')


admin.site.register(Servico)
admin.site.register(Veiculo)
