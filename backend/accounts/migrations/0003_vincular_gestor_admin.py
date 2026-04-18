from django.db import migrations

def vincular_admin_ao_gestor(apps, schema_editor):
    # Usamos apps.get_model para evitar importações diretas em migrações
    User = apps.get_model('accounts', 'User')  # Seu Custom User Model
    Estabelecimento = apps.get_model('accounts', 'Estabelecimento')
    Gestor = apps.get_model('accounts', 'Gestor')

    # 1. Busca o superuser (admin)
    admin = User.objects.filter(is_superuser=True).first()
    
    if admin:
        # 2. Garante um estabelecimento padrão (Axioma Multi-tenant)
        est, _ = Estabelecimento.objects.get_or_create(
            cnpj="00000000000000",
            defaults={
                'nome_fantasia': "Lava-Me Matriz",
                'endereco_completo': "Endereço Administrativo"
            }
        )

        # 3. Vincula o perfil de Gestor (update_or_create para evitar IntegrityError)
        Gestor.objects.update_or_create(
            user=admin,
            defaults={'estabelecimento': est}
        )

class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0002_estabelecimento_cliente_funcionario_gestor'), # Verifique se este é o nome da sua última migração
    ]

    operations = [
        migrations.RunPython(vincular_admin_ao_gestor),
    ]