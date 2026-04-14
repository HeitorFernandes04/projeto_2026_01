from django.db import migrations

def popular_pecas(apps, schema_editor):
    TagPeca = apps.get_model('atendimentos', 'TagPeca')
    
    pecas = [
        ('Capô', 'frente'),
        ('Pára-choque Dianteiro', 'frente'),
        ('Farol Esquerdo', 'frente'),
        ('Farol Direito', 'frente'),
        ('Porta Dianteira Esq', 'lateral_esq'),
        ('Porta Traseira Esq', 'lateral_esq'),
        ('Retrovisor Esq', 'lateral_esq'),
        ('Porta Dianteira Dir', 'lateral_dir'),
        ('Porta Traseira Dir', 'lateral_dir'),
        ('Retrovisor Dir', 'lateral_dir'),
        ('Pára-choque Traseiro', 'traseira'),
        ('Tampa do Porta-malas', 'traseira'),
        ('Teto', 'interior'),
        ('Painel', 'interior'),
        ('Bancos Dianteiros', 'interior'),
    ]

    for nome, cat in pecas:
        TagPeca.objects.get_or_create(nome=nome, categoria=cat)

def remover_pecas(apps, schema_editor):
    TagPeca = apps.get_model('atendimentos', 'TagPeca')
    TagPeca.objects.all().delete()

class Migration(migrations.Migration):

    dependencies = [
        # Esta linha garante que as tabelas sejam criadas ANTES de tentarmos inserir dados
        ('atendimentos', '0004_tagpeca_alter_atendimento_status_and_more'),
    ]

    operations = [
        migrations.RunPython(popular_pecas, reverse_code=remover_pecas),
    ]