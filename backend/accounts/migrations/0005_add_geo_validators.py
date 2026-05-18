import django.core.validators
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_reassign_detalhistas'),
    ]

    operations = [
        migrations.AlterField(
            model_name='estabelecimento',
            name='latitude',
            field=models.FloatField(
                blank=True,
                null=True,
                validators=[
                    django.core.validators.MinValueValidator(-90.0),
                    django.core.validators.MaxValueValidator(90.0),
                ],
            ),
        ),
        migrations.AlterField(
            model_name='estabelecimento',
            name='longitude',
            field=models.FloatField(
                blank=True,
                null=True,
                validators=[
                    django.core.validators.MinValueValidator(-180.0),
                    django.core.validators.MaxValueValidator(180.0),
                ],
            ),
        ),
    ]
