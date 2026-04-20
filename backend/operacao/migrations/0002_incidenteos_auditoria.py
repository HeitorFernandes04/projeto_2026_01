from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('operacao', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='incidenteos',
            name='status_anterior_os',
            field=models.CharField(
                choices=[
                    ('PATIO', 'Pátio'),
                    ('VISTORIA_INICIAL', 'Vistoria Inicial'),
                    ('EM_EXECUCAO', 'Em Execução'),
                    ('LIBERACAO', 'Liberação'),
                    ('FINALIZADO', 'Finalizado'),
                    ('BLOQUEADO_INCIDENTE', 'Bloqueado por Incidente'),
                    ('CANCELADO', 'Cancelado'),
                ],
                default='EM_EXECUCAO',
                max_length=25,
            ),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='incidenteos',
            name='gestor_resolucao',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='incidentes_resolvidos',
                to=settings.AUTH_USER_MODEL,
            ),
        ),
    ]
