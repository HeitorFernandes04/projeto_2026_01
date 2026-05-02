from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from accounts.models import User, Estabelecimento, Cliente, Funcionario, Gestor, CargoChoices


class EstabelecimentoSerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Estabelecimento
        fields = ['id', 'nome_fantasia', 'cnpj', 'endereco_completo', 'is_active', 'slug', 'logo', 'logo_url']

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class EstabelecimentoUpdateSerializer(serializers.ModelSerializer):
    """Serializer restrito para atualização de configurações pelo Gestor."""
    logo_url = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Estabelecimento
        fields = ['nome_fantasia', 'cnpj', 'endereco_completo', 'slug', 'logo', 'logo_url']
        read_only_fields = ['slug']

    def get_logo_url(self, obj):
        if obj.logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.logo.url)
            return obj.logo.url
        return None


class ClienteSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=False,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='Este e-mail já está cadastrado.'
            )
        ]
    )
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)
    telefone_whatsapp = serializers.CharField(max_length=20, required=False, allow_blank=True)
    endereco_padrao = serializers.CharField(max_length=255, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'username', 'password', 'telefone_whatsapp', 'endereco_padrao']

    def validate(self, attrs):
        # Validação mandatória apenas para novas contas (POST)
        password = attrs.get('password')
        email = attrs.get('email')

        if not self.instance:
            if not email:
                raise serializers.ValidationError({"email": "Este campo é obrigatório para novos cadastros."})
            if not password:
                raise serializers.ValidationError({"password": "Este campo é obrigatório para novos cadastros."})

        # Se for edição (PATCH) e a senha veio vazia, removemos dos attrs para não tentar salvar
        if self.instance and 'password' in attrs and not password:
            attrs.pop('password')

        # Normaliza e-mail para evitar duplicatas (apenas se fornecido)
        if email:
            attrs['email'] = email.strip().lower()
        return attrs

    def create(self, validated_data):
        telefone_whatsapp = validated_data.pop('telefone_whatsapp', '')
        endereco_padrao = validated_data.pop('endereco_padrao', '')
        user = User.objects.create_user(**validated_data)
        Cliente.objects.create(
            user=user,
            telefone_whatsapp=telefone_whatsapp,
            endereco_padrao=endereco_padrao
        )
        return user


class FuncionarioSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=False,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='Este e-mail já está cadastrado.'
            )
        ]
    )
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)
    estabelecimento = serializers.PrimaryKeyRelatedField(
        queryset=Estabelecimento.objects.all(),
        write_only=True,
        required=False
    )
    cargo = serializers.ChoiceField(
        choices=CargoChoices.choices,
        default=CargoChoices.LAVADOR
    )

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'username', 'password', 'estabelecimento', 'cargo', 'is_active', 'last_login', 'date_joined']
        read_only_fields = ['last_login', 'date_joined']

    def to_representation(self, instance):
        ret = super().to_representation(instance)
        if hasattr(instance, 'perfil_funcionario'):
            ret['cargo'] = instance.perfil_funcionario.cargo
        return ret

    def validate(self, attrs):
        password = attrs.get('password')
        email = attrs.get('email')

        # Validação mandatória apenas para novos colaboradores (POST)
        if not self.instance:
            if not email:
                raise serializers.ValidationError({"email": "Este campo é obrigatório para novos cadastros."})
            if not password:
                raise serializers.ValidationError({"password": "Este campo é obrigatório para novos cadastros."})
            if not attrs.get('estabelecimento'):
                raise serializers.ValidationError({"estabelecimento": "Este campo é obrigatório para novos cadastros."})

        # Se for edição (PATCH) e a senha veio vazia, removemos para ignorar a mudança
        if self.instance and 'password' in attrs and not password:
            attrs.pop('password')

        # Normaliza e-mail apenas se presente
        if email:
            attrs['email'] = email.strip().lower()
        
        # Bloqueio de Cargo GESTOR no fluxo de funcionários
        if attrs.get('cargo') == CargoChoices.GESTOR:
            raise serializers.ValidationError({"cargo": "Não é permitido cadastrar gestores através deste fluxo."})
            
        return attrs

    def create(self, validated_data):
        estabelecimento = validated_data.pop('estabelecimento')
        cargo = validated_data.pop('cargo', CargoChoices.LAVADOR)
        user = User.objects.create_user(**validated_data)
        Funcionario.objects.create(
            user=user,
            estabelecimento=estabelecimento,
            cargo=cargo
        )
        return user


class GestorSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=False,
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='Este e-mail já está cadastrado.'
            )
        ]
    )
    password = serializers.CharField(write_only=True, min_length=6, required=False, allow_blank=True)
    estabelecimento = serializers.PrimaryKeyRelatedField(
        queryset=Estabelecimento.objects.all(),
        write_only=True,
        required=False
    )

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'username', 'password', 'estabelecimento']

    def validate(self, attrs):
        password = attrs.get('password')
        email = attrs.get('email')

        # Validação mandatória apenas para novos gestores (POST)
        if not self.instance:
            if not email:
                raise serializers.ValidationError({"email": "Este campo é obrigatório para novos cadastros."})
            if not password:
                raise serializers.ValidationError({"password": "Este campo é obrigatório para novos cadastros."})
            if not attrs.get('estabelecimento'):
                raise serializers.ValidationError({"estabelecimento": "Este campo é obrigatório para novos cadastros."})

        # Se for edição (PATCH) e a senha veio vazia, removemos
        if self.instance and 'password' in attrs and not password:
            attrs.pop('password')

        # Normaliza e-mail apenas se fornecido
        if email:
            attrs['email'] = email.strip().lower()
        return attrs

    def create(self, validated_data):
        estabelecimento = validated_data.pop('estabelecimento')
        user = User.objects.create_user(**validated_data)
        Gestor.objects.create(
            user=user,
            estabelecimento=estabelecimento
        )
        return user


RegisterSerializer = FuncionarioSerializer