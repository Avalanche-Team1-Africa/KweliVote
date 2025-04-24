from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.translation import gettext_lazy as _
from rest_framework import authentication, exceptions
from django.conf import settings
from .models import User

class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication for KweliVote's User model.
    """
    def get_user(self, validated_token):
        """
        Return the user associated with the token.
        """
        try:
            user_id = validated_token[settings.SIMPLE_JWT['USER_ID_CLAIM']]
        except KeyError:
            raise exceptions.AuthenticationFailed(_('Token contained no recognizable user identification'))

        try:
            user = User.objects.get(username=user_id)
        except User.DoesNotExist:
            raise exceptions.AuthenticationFailed(_('User not found'))

        if not user.is_active:
            raise exceptions.AuthenticationFailed(_('User is inactive'))

        return user