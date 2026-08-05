from rest_framework import serializers
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'company', 'plan', 'credits', 'is_active')
        read_only_fields = ('id', 'is_active')


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    invite_token = serializers.CharField(write_only=True, required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'company', 'password', 'password_confirm', 'invite_token')
        extra_kwargs = {'password': {'write_only': True, 'min_length': 8}}

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match'})
        invite_token = data.get('invite_token')
        if invite_token:
            from apps.teams.services import get_pending_invite_for_token

            invite = get_pending_invite_for_token(invite_token)
            if data['email'].lower() != invite.email.lower():
                raise serializers.ValidationError({'invite_token': 'Invite email does not match registration email'})
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        invite_token = validated_data.pop('invite_token', '')
        password = validated_data.pop('password')
        user = User.objects.create_user(**validated_data, password=password)
        if invite_token:
            from apps.teams.services import accept_invite_for_user

            accept_invite_for_user(invite_token, user)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)
    confirm_password = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({'confirm_password': 'Passwords do not match'})
        if not self.context['request'].user.check_password(data['current_password']):
            raise serializers.ValidationError({'current_password': 'Current password is incorrect'})
        return data


# Since our User model has USERNAME_FIELD = 'email', SimpleJWT's TokenObtainPairSerializer
# already uses 'email' as the field name. We just use it directly.
class CustomTokenObtainPairView(TokenObtainPairView):
    """Uses the default TokenObtainPairSerializer which works with our email-based User model."""
    pass
