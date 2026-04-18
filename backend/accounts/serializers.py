from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from accounts.models import User, Estabelecimento, Cliente, Funcionario, Gestor, CargoChoices


class EstabelecimentoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Estabelecimento
        fields = ['id', 'nome_fantasia', 'cnpj', 'endereco_completo', 'is_active']


class ClienteSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='Este e-mail já está cadastrado.'
            )
        ]
    )
    password = serializers.CharField(write_only=True, min_length=6)
    telefone_whatsapp = serializers.CharField(max_length=20, required=False, allow_blank=True)
    endereco_padrao = serializers.CharField(max_length=255, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'username', 'password', 'telefone_whatsapp', 'endereco_padrao']

    def validate(self, attrs):
        # Normaliza e-mail para evitar duplicatas silenciosos por espaços ou caixa
        attrs['email'] = attrs['email'].strip().lower()
        return attrs

    def create(self, validated_data):
        # Extrair dados do perfil cliente
        telefone_whatsapp = validated_data.pop('telefone_whatsapp', '')
        endereco_padrao = validated_data.pop('endereco_padrao', '')
        
        # Criar usuário
        user = User.objects.create_user(**validated_data)
        
        # Criar perfil cliente
        Cliente.objects.create(
            user=user,
            telefone_whatsapp=telefone_whatsapp,
            endereco_padrao=endereco_padrao
        )
        
        return user


class FuncionarioSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='Este e-mail já está cadastrado.'
            )
        ]
    )
    password = serializers.CharField(write_only=True, min_length=6)
    estabelecimento = serializers.PrimaryKeyRelatedField(
        queryset=Estabelecimento.objects.all(),
        write_only=True
    )
    cargo = serializers.ChoiceField(
        choices=CargoChoices.choices,
        default=CargoChoices.LAVADOR
    )

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'username', 'password', 'estabelecimento', 'cargo']

    def validate(self, attrs):
        # Normaliza e-mail para evitar duplicatas silenciosos por espaços ou caixa
        attrs['email'] = attrs['email'].strip().lower()
        return attrs

    def create(self, validated_data):
        # Extrair dados do perfil funcionário
        estabelecimento = validated_data.pop('estabelecimento')
        cargo = validated_data.pop('cargo', CargoChoices.LAVADOR)
        
        # Criar usuário
        user = User.objects.create_user(**validated_data)
        
        # Criar perfil funcionário
        Funcionario.objects.create(
            user=user,
            estabelecimento=estabelecimento,
            cargo=cargo
        )
        
        return user


class GestorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='Este e-mail já está cadastrado.'
            )
        ]
    )
    password = serializers.CharField(write_only=True, min_length=6)
    estabelecimento = serializers.PrimaryKeyRelatedField(
        queryset=Estabelecimento.objects.all(),
        write_only=True
    )

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'username', 'password', 'estabelecimento']

    def validate(self, attrs):
        # Normaliza e-mail para evitar duplicatas silenciosos por espaços ou caixa
        attrs['email'] = attrs['email'].strip().lower()
        return attrs

    def create(self, validated_data):
        # Extrair dados do perfil gestor
        estabelecimento = validated_data.pop('estabelecimento')
        
        # Criar usuário
        user = User.objects.create_user(**validated_data)
        
        # Criar perfil gestor
        Gestor.objects.create(
            user=user,
            estabelecimento=estabelecimento
        )
        
        return user


# RegisterSerializer mantido para compatibilidade, mas agora é um alias para FuncionarioSerializer
RegisterSerializer = FuncionarioSerializer