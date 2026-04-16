from rest_framework import serializers
from rest_framework.validators import UniqueValidator
from accounts.models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=6)
    email = serializers.EmailField(
        validators=[
            UniqueValidator(
                queryset=User.objects.all(),
                message='Este e-mail já está cadastrado.'
            )
        ]
    )

    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'username', 'password']

    def validate(self, attrs):
        # Normaliza e-mail para evitar duplicatas silenciosas por espaços ou caixa
        attrs['email'] = attrs['email'].strip().lower()
        return attrs

    def create(self, validated_data):
        user = User.objects.create_user(
            name=validated_data['name'],
            email=validated_data['email'],
            username=validated_data['username'],
            password=validated_data['password']
        )
        return user