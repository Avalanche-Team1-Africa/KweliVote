from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from .models import Voter, KeyPerson, Candidate, ResultsCount
from .serializers import (
    VoterSerializer, 
    KeyPersonSerializer, 
    CandidateSerializer,
    ResultsCountSerializer
)

# Custom token serializer for KeyPerson model
class KeyPersonTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims for KeyPerson
        try:
            keyperson = user.keyperson
            token['nationalid'] = keyperson.nationalid
            token['role'] = keyperson.role
            token['name'] = f"{keyperson.firstname} {keyperson.surname}"
        except:
            pass
            
        return token
    
    def validate(self, attrs):
        # The default result which has access and refresh tokens
        data = super().validate(attrs)
        
        # Add extra responses here
        user = self.user
        try:
            keyperson = user.keyperson
            data['nationalid'] = keyperson.nationalid
            data['role'] = keyperson.role
            data['name'] = f"{keyperson.firstname} {keyperson.surname}"
        except:
            pass
            
        return data

# Custom token view for KeyPerson model
class KeyPersonTokenObtainPairView(TokenObtainPairView):
    serializer_class = KeyPersonTokenObtainPairSerializer

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_user_info(request):
    """
    Get authenticated user information
    """
    user = request.user
    if hasattr(user, 'keyperson'):
        keyperson = user.keyperson
        return Response({
            'username': user.username,
            'nationalid': keyperson.nationalid,
            'name': f"{keyperson.firstname} {keyperson.surname}",
            'role': keyperson.role,
            'polling_station': keyperson.designated_polling_station
        })
    return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['GET'])
def api_root(request, format=None):
    """
    API Root endpoint providing links to all available endpoints
    """
    return Response({
        'voters': reverse('voter-list', request=request, format=format),
        'keypersons': reverse('keyperson-list', request=request, format=format),
        'candidates': reverse('candidate-list', request=request, format=format),
        'resultscount': reverse('resultscount-list', request=request, format=format),
        'token': reverse('token_obtain_pair', request=request, format=format),
        'token_refresh': reverse('token_refresh', request=request, format=format),
        'token_verify': reverse('token_verify', request=request, format=format),
        'user_info': reverse('user_info', request=request, format=format),
    })


class VoterViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing voters
    """
    queryset = Voter.objects.all().order_by('surname')
    serializer_class = VoterSerializer


class KeyPersonViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing key persons
    """
    queryset = KeyPerson.objects.all().order_by('role', 'surname')
    serializer_class = KeyPersonSerializer


class CandidateViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing candidates
    """
    queryset = Candidate.objects.all().order_by('candidate_type', 'surname')
    serializer_class = CandidateSerializer


class ResultsCountViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing election results
    """
    queryset = ResultsCount.objects.all().order_by('polling_station')
    serializer_class = ResultsCountSerializer