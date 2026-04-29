from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


def add_missing_incidenteos_columns(apps, schema_editor):
    from operacao.models import IncidenteOS

    connection = schema_editor.connection
    table_name = IncidenteOS._meta.db_table

    with connection.cursor() as cursor:
        existing_columns = {
            column.name
            for column in connection.introspection.get_table_description(cursor, table_name)
        }

    if 'status_anterior_os' not in existing_columns:
        schema_editor.execute(
            f"ALTER TABLE {schema_editor.quote_name(table_name)} "
            f"ADD COLUMN {schema_editor.quote_name('status_anterior_os')} "
            "varchar(25) NOT NULL DEFAULT 'EM_EXECUCAO'"
        )

    if 'gestor_resolucao_id' not in existing_columns:
        field = IncidenteOS._meta.get_field('gestor_resolucao')
        schema_editor.add_field(IncidenteOS, field)


class Migration(migrations.Migration):

    dependencies = [
        ('operacao', '0001_initial'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunPython(add_missing_incidenteos_columns, migrations.RunPython.noop),
            ],
            state_operations=[
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
                        max_length=25,
                    ),
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
            ],
        ),
    ]
