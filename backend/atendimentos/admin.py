from django.contrib import admin
from django import forms
from .models import Servico, Veiculo, Atendimento, MidiaAtendimento


class AtendimentoAdminForm(forms.ModelForm):
    data_hora = forms.DateTimeField(
        widget=forms.TextInput(attrs={'placeholder': 'DD/MM/AAAA HH:MM'}),
        input_formats=['%d/%m/%Y %H:%M', '%Y-%m-%d %H:%M'],
        help_text='Formato: DD/MM/AAAA HH:MM (ex: 29/03/2026 14:30)'
    )

    class Meta:
        model = Atendimento
        fields = '__all__'


class MidiaAtendimentoInline(admin.TabularInline):
    model = MidiaAtendimento
    extra = 0
    readonly_fields = ('enviado_em',)


@admin.register(Atendimento)
class AtendimentoAdmin(admin.ModelAdmin):
    form = AtendimentoAdminForm
    inlines = [MidiaAtendimentoInline]


@admin.register(MidiaAtendimento)
class MidiaAtendimentoAdmin(admin.ModelAdmin):
    list_display = ('id', 'atendimento', 'momento', 'enviado_em')
    list_filter = ('momento',)
    readonly_fields = ('enviado_em',)


admin.site.register(Servico)
admin.site.register(Veiculo)
