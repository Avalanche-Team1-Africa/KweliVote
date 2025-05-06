from rest_framework import viewsets, status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.reverse import reverse
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView, TokenVerifyView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db.models import Q
from .models import Voter, KeyPerson, Candidate, ResultsCount
from .serializers import (
    VoterSerializer, 
    KeyPersonSerializer, 
    CandidateSerializer,
    ResultsCountSerializer
)
from django.db import transaction
import json
from datetime import datetime

# Custom token serializer for KeyPerson model
class KeyPersonTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        
        # Add custom claims
        try:
            if hasattr(user, 'keyperson'):
                keyperson = user.keyperson
                token['nationalid'] = keyperson.nationalid
                token['role'] = keyperson.role
                token['name'] = f"{keyperson.firstname} {keyperson.surname}"
            elif hasattr(user, 'username'):
                # For admin users or other users not linked to keyperson
                token['username'] = user.username
                token['is_staff'] = user.is_staff
                token['is_superuser'] = user.is_superuser
        except Exception as e:
            print(f"Error adding custom claims to token: {e}")
            
        return token
    
    def validate(self, attrs):
        # The default result which has access and refresh tokens
        data = super().validate(attrs)
        
        # Add extra responses here
        user = self.user
        try:
            if hasattr(user, 'keyperson'):
                keyperson = user.keyperson
                data['nationalid'] = keyperson.nationalid
                data['role'] = keyperson.role
                data['name'] = f"{keyperson.firstname} {keyperson.surname}"
            elif hasattr(user, 'username'):
                # For admin users or other users not linked to keyperson
                data['username'] = user.username
                if hasattr(user, 'is_staff'):
                    data['is_staff'] = user.is_staff
                    data['is_superuser'] = user.is_superuser
                    # Provide a role for admin users so frontend routing works
                    data['role'] = 'Administrator' if user.is_superuser else 'Staff'
        except Exception as e:
            print(f"Error adding custom data to response: {e}")
            
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

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def create_user(request):
    """
    Create a user account for a keyperson
    """
    data = request.data
    try:
        # Check if required fields are provided
        if not data.get('username') or not data.get('password') or not data.get('national_id'):
            return Response(
                {'error': 'Username, password, and national_id are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if user already exists
        if User.objects.filter(username=data['username']).exists():
            return Response(
                {'error': 'Username already exists'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if keyperson exists
        try:
            keyperson = KeyPerson.objects.get(nationalid=data['national_id'])
        except KeyPerson.DoesNotExist:
            return Response(
                {'error': 'Keyperson with this national ID does not exist'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if keyperson already has a user account
        if keyperson.user:
            return Response(
                {'error': 'Keyperson already has a user account'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create user
        user = User.objects.create_user(
            username=data['username'],
            password=data['password'],
            email=f"{data['username']}@kwelivote.example.com"
        )
        
        # Associate user with keyperson
        keyperson.user = user
        keyperson.save()
        
        return Response(
            {'success': True, 'message': 'User created successfully'},
            status=status.HTTP_201_CREATED
        )
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def create_keyperson_with_user(request):
    """
    Create both a keyperson and an associated user account in a single transaction.
    If any part fails, the whole operation is rolled back.
    This endpoint is publicly accessible (no authentication required) to allow keyperson registration.
    """
    with transaction.atomic():
        try:
            data = request.data
            
            # Extract keyperson data
            keyperson_data = {
                'nationalid': data.get('nationalid'),
                'firstname': data.get('firstname'),
                'middlename': data.get('middlename'),
                'surname': data.get('surname'),
                'role': data.get('role'),
                'political_party': data.get('political_party'),
                'designated_polling_station': data.get('designated_polling_station'),
                'observer_type': data.get('observer_type'),
                'stakeholder': data.get('stakeholder'),
                'created_by': data.get('created_by', 'system'),
            }
            
            # Validate required keyperson fields
            required_fields = ['nationalid', 'firstname', 'surname', 'role', 'designated_polling_station', 'created_by']
            missing_fields = [field for field in required_fields if not keyperson_data.get(field)]
            if missing_fields:
                return Response(
                    {'error': f"Missing required keyperson fields: {', '.join(missing_fields)}"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Role-specific validation
            if keyperson_data['role'] == 'Observers' and not keyperson_data.get('observer_type'):
                return Response(
                    {'error': 'Observer type is required for Observers'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if keyperson_data['role'] == 'Party Agents' and not keyperson_data.get('political_party'):
                return Response(
                    {'error': 'Political party is required for Party Agents'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if keyperson with nationalid already exists
            if KeyPerson.objects.filter(nationalid=keyperson_data['nationalid']).exists():
                return Response(
                    {'error': f"Keyperson with National ID {keyperson_data['nationalid']} already exists"},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Create keyperson
            keyperson_serializer = KeyPersonSerializer(data=keyperson_data)
            if not keyperson_serializer.is_valid():
                return Response(
                    {'error': 'Invalid keyperson data', 'details': keyperson_serializer.errors},
                    status=status.HTTP_400_BAD_REQUEST
                )
            keyperson = keyperson_serializer.save()
            
            # For non-observer roles, create a user account
            is_observer = keyperson_data['role'] == 'Observers'
            
            if not is_observer:
                # Extract user data
                username = data.get('username')
                password = data.get('password')
                
                # Validate user data
                if not username or not password:
                    # Roll back the transaction by raising an exception
                    raise ValueError('Username and password are required for non-observer keypersons')
                
                # Check if username already exists
                if User.objects.filter(username=username).exists():
                    raise ValueError(f"Username '{username}' is already taken")
                
                # Create user and link to keyperson
                user = User.objects.create_user(
                    username=username, 
                    password=password,
                    email=f"{username}@kwelivote.example.com"
                )
                keyperson.user = user
                keyperson.save()
            
            # Check if biometric data is available and save it
            if data.get('did') and data.get('biometric_template'):
                # Save biometric data
                keyperson.did = data.get('did')
                keyperson.biometric_template = data.get('biometric_template')
                keyperson.has_template = True
                keyperson.save()
            
            return Response(
                {
                    'success': True,
                    'message': 'Keyperson successfully registered' + (' with user account' if not is_observer else ''),
                    'keyperson': keyperson_serializer.data
                },
                status=status.HTTP_201_CREATED
            )
        except ValueError as e:
            # For validation errors that we explicitly raise
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            # For unexpected errors
            return Response(
                {'error': f'An unexpected error occurred: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_voter_biometric_data(request, voter_id):
    """
    Specialized endpoint to save only the biometric data (DID, template, has_template) for a voter.
    This endpoint ensures that:
    1. The voter record already exists
    2. All fields are saved together (no partial biometric data)
    3. Existing data is preserved if no new data is provided during updates
    """
    try:
        # Check if voter exists - use nationalid as primary key
        try:
            voter = Voter.objects.get(nationalid=voter_id)
        except Voter.DoesNotExist:
            return Response(
                {'error': f'Voter with National ID {voter_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate request data
        required_fields = ['did', 'biometric_template']
        missing_fields = [field for field in required_fields if field not in request.data]
        if missing_fields:
            return Response(
                {'error': f'Missing required fields: {", ".join(missing_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get data from request
        did = request.data.get('did')
        biometric_template = request.data.get('biometric_template')
        
        # Validate DID - this is a simple validation, could be more complex
        if not did or not did.startswith('did:'):
            return Response(
                {'error': 'Invalid DID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure we have a valid biometric template
        if not biometric_template:
            return Response(
                {'error': 'Biometric template is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update voter fields with atomic transaction
        with transaction.atomic():
            # Save the biometric data
            voter.did = did
            voter.biometric_template = biometric_template
            voter.has_template = True
            voter.save()
        
        return Response({
            'success': True, 
            'message': 'Voter biometric data saved successfully',
            'voter_nationalid': voter.nationalid
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def save_keyperson_biometric_data(request, keyperson_id):
    """
    Specialized endpoint to save only the biometric data (DID, template, has_template) for a keyperson.
    This endpoint ensures that:
    1. The keyperson record already exists
    2. All fields are saved together (no partial biometric data)
    3. Existing data is preserved if no new data is provided during updates
    """
    try:
        # Check if keyperson exists - use nationalid as primary key
        try:
            keyperson = KeyPerson.objects.get(nationalid=keyperson_id)
        except KeyPerson.DoesNotExist:
            return Response(
                {'error': f'Keyperson with National ID {keyperson_id} not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Validate request data
        required_fields = ['did', 'biometric_template']
        missing_fields = [field for field in required_fields if field not in request.data]
        if missing_fields:
            return Response(
                {'error': f'Missing required fields: {", ".join(missing_fields)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get data from request
        did = request.data.get('did')
        biometric_template = request.data.get('biometric_template')
        
        # Validate DID - this is a simple validation, could be more complex
        if not did or not did.startswith('did:'):
            return Response(
                {'error': 'Invalid DID format'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Ensure we have a valid biometric template
        if not biometric_template:
            return Response(
                {'error': 'Biometric template is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update keyperson fields with atomic transaction
        with transaction.atomic():
            # Save the biometric data
            keyperson.did = did
            keyperson.biometric_template = biometric_template
            keyperson.has_template = True
            keyperson.save()
        
        return Response({
            'success': True, 
            'message': 'Keyperson biometric data saved successfully',
            'keyperson_nationalid': keyperson.nationalid
        }, status=status.HTTP_200_OK)
    
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_voters(request):
    """
    Search voters by name or national ID
    """
    try:
        q = request.GET.get('q', '')
        if not q:
            return Response([], status=status.HTTP_200_OK)
        
        # Filter voters by name or national ID
        voters = Voter.objects.filter(
            Q(nationalid__icontains=q) | 
            Q(firstname__icontains=q) | 
            Q(surname__icontains=q) | 
            Q(middlename__icontains=q) |
            Q(designated_polling_station__icontains=q)
        )[:50]  # Limit to 50 results for performance
        
        serializer = VoterSerializer(voters, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def search_keypersons(request):
    """
    Search keypersons by name, national ID, or role
    """
    try:
        q = request.GET.get('q', '')
        if not q:
            return Response([], status=status.HTTP_200_OK)
        
        # Filter keypersons by name, national ID, or role
        keypersons = KeyPerson.objects.filter(
            Q(nationalid__icontains=q) | 
            Q(firstname__icontains=q) | 
            Q(surname__icontains=q) | 
            Q(middlename__icontains=q) |
            Q(role__icontains=q) |
            Q(political_party__icontains=q)
        )[:50]  # Limit to 50 results for performance
        
        serializer = KeyPersonSerializer(keypersons, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
    
    def create(self, request, *args, **kwargs):
        # First check if biometric data is included in the request
        has_biometric = bool(request.data.get('did') and request.data.get('biometric_template'))
        
        # Create the voter with a transaction to ensure atomicity
        with transaction.atomic():
            # Standard voter creation process
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            # If biometric data is included, update the voter with this data
            if has_biometric:
                voter = serializer.instance
                voter.did = request.data.get('did')
                voter.biometric_template = request.data.get('biometric_template')
                voter.has_template = True
                voter.save()
            
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
    
    def update(self, request, *args, **kwargs):
        # Check if biometric data is included in the request
        has_biometric = bool(request.data.get('did') and request.data.get('biometric_template'))
        
        # If biometric data is present, ensure it's saved
        with transaction.atomic():
            # Get the instance to update
            instance = self.get_object()
            
            # First update non-biometric data
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            # If biometric data is provided, update those fields too
            if has_biometric:
                instance.did = request.data.get('did')
                instance.biometric_template = request.data.get('biometric_template')
                instance.has_template = True
                instance.save()
            
            return Response(serializer.data)


class KeyPersonViewSet(viewsets.ModelViewSet):
    """
    API endpoint for managing key persons
    """
    queryset = KeyPerson.objects.all().order_by('role', 'surname')
    serializer_class = KeyPersonSerializer
    
    def create(self, request, *args, **kwargs):
        # First check if biometric data is included in the request
        has_biometric = bool(request.data.get('did') and request.data.get('biometric_template'))
        
        # Create the keyperson with a transaction to ensure atomicity
        with transaction.atomic():
            # Standard keyperson creation process
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            
            # If biometric data is included, update the keyperson with this data
            if has_biometric:
                keyperson = serializer.instance
                keyperson.did = request.data.get('did')
                keyperson.biometric_template = request.data.get('biometric_template')
                keyperson.has_template = True
                keyperson.save()
            
            return Response(
                serializer.data, 
                status=status.HTTP_201_CREATED, 
                headers=headers
            )
    
    def update(self, request, *args, **kwargs):
        # Check if biometric data is included in the request
        has_biometric = bool(request.data.get('did') and request.data.get('biometric_template'))
        
        # If biometric data is present, ensure it's saved
        with transaction.atomic():
            # Get the instance to update
            instance = self.get_object()
            
            # First update non-biometric data
            serializer = self.get_serializer(instance, data=request.data, partial=kwargs.get('partial', False))
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            
            # If biometric data is provided, update those fields too
            if has_biometric:
                instance.did = request.data.get('did')
                instance.biometric_template = request.data.get('biometric_template')
                instance.has_template = True
                instance.save()
            
            return Response(serializer.data)


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