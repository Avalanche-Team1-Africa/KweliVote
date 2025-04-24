from rest_framework_simplejwt.authentication import JWTAuthentication
from django.utils.translation import gettext_lazy as _
from rest_framework import authentication, exceptions
from django.conf import settings
from .models import KeyPerson

class CustomJWTAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication for KweliVote's KeyPerson model.
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
            # Since we no longer have User model, authenticate using KeyPerson
            keyperson = KeyPerson.objects.get(nationalid=user_id)
            # We're returning the KeyPerson as the authenticated user
            return keyperson
        except KeyPerson.DoesNotExist:
            raise exceptions.AuthenticationFailed(_('User not found'))