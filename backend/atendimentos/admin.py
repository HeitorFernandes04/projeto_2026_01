from django.contrib import admin
from django import forms
from .models import Servico, Veiculo, Atendimento


class AtendimentoAdminForm(forms.ModelForm):
    data_hora = forms.DateTimeField(
        widget=forms.TextInput(attrs={'placeholder': 'DD/MM/AAAA HH:MM'}),
        input_formats=['%d/%m/%Y %H:%M', '%Y-%m-%d %H:%M'],
        help_text='Formato: DD/MM/AAAA HH:MM (ex: 29/03/2026 14:30)'
    )

    class Meta:
        model = Atendimento
        fields = '__all__'


@admin.register(Atendimento)
class AtendimentoAdmin(admin.ModelAdmin):
    form = AtendimentoAdminForm


admin.site.register(Servico)
admin.site.register(Veiculo)
