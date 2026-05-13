from django.db import migrations


def reatribuir_detalhistas(apps, schema_editor):
    Funcionario = apps.get_model('accounts', 'Funcionario')
    Funcionario.objects.filter(cargo='DETALHISTA').update(cargo='LAVADOR')


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_estabelecimento_latitude_estabelecimento_longitude_and_more'),
    ]

    operations = [
        migrations.RunPython(reatribuir_detalhistas, migrations.RunPython.noop),
    ]
