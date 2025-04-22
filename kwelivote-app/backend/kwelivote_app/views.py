from rest_framework import viewsets, status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from .models import User, Voter, KeyPerson, Candidate, ResultsCount
from .serializers import (
    UserSerializer, 
    VoterSerializer, 
    KeyPersonSerializer, 
    CandidateSerializer,
    ResultsCountSerializer
)

@api_view(['GET'])
def api_root(request, format=None):
    """
    API Root endpoint providing links to all available endpoints
    """
    return Response({
        'users': reverse('user-list', request=request, format=format),
        'voters': reverse('voter-list', request=request, format=format),
        'keypersons': reverse('keyperson-list', request=request, format=format),
        'candidates': reverse('candidate-list', request=request, format=format),
        'resultscount': reverse('resultscount-list', request=request, format=format),
    })


class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing users
    """
    queryset = User.objects.all().order_by('username')
    serializer_class = UserSerializer


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