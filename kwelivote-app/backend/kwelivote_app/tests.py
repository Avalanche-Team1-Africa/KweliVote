from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import User, Voter, KeyPerson, Candidate
from bson import ObjectId
from django.utils import timezone

class KeyPersonModelTests(TestCase):
    def setUp(self):
        self.keyperson = KeyPerson.objects.create(
            nationalid="12345678",
            firstname="John",
            middlename="M",
            surname="Doe",
            role="Registration Clerk",
            did="did:example:123456789abcdefghi",
            designated_polling_station="Station A",
            created_by="admin"
        )
    
    def test_keyperson_creation(self):
        """Test that a keyperson can be created properly"""
        self.assertEqual(self.keyperson.nationalid, "12345678")
        self.assertEqual(self.keyperson.role, "Registration Clerk")
        self.assertEqual(self.keyperson.firstname, "John")
        self.assertEqual(self.keyperson.surname, "Doe")


class VoterModelTests(TestCase):
    def setUp(self):
        self.voter = Voter.objects.create(
            firstname="Jane",
            middlename="A",
            surname="Smith",
            nationalid="87654321",
            did="did:example:987654321abcdefghi",
            designated_polling_station="Station B",
            created_by="admin"
        )
    
    def test_voter_creation(self):
        """Test that a voter can be created properly"""
        self.assertEqual(self.voter.nationalid, "87654321")
        self.assertEqual(self.voter.firstname, "Jane")
        self.assertEqual(self.voter.surname, "Smith")
        self.assertEqual(self.voter.designated_polling_station, "Station B")


class CandidateModelTests(TestCase):
    def setUp(self):
        self.candidate = Candidate.objects.create(
            firstname="James",
            middlename="R",
            surname="Brown",
            nationalid="11223344",
            did="did:example:112233445566",
            candidate_type="President",
            political_party="Party X",
            created_by="admin"
        )
    
    def test_candidate_creation(self):
        """Test that a candidate can be created properly"""
        self.assertEqual(self.candidate.nationalid, "11223344")
        self.assertEqual(self.candidate.firstname, "James")
        self.assertEqual(self.candidate.candidate_type, "President")
        self.assertEqual(self.candidate.political_party, "Party X")


class UserModelTests(TestCase):
    def setUp(self):
        # First create a KeyPerson that will be linked to the User
        self.keyperson = KeyPerson.objects.create(
            nationalid="55667788",
            firstname="Admin",
            middlename="",
            surname="User",
            role="Registration Clerk",
            did="did:example:admin123",
            designated_polling_station="Station HQ",
            created_by="system"
        )
        
        # Create a User linked to the KeyPerson
        self.user = User.objects.create(
            _id=ObjectId(),
            username="admin_user",
            nationalid=self.keyperson,
            password="hashed_password_would_go_here",
            is_active=True
        )
    
    def test_user_creation(self):
        """Test that a user can be created properly and linked to a keyperson"""
        self.assertEqual(self.user.username, "admin_user")
        self.assertEqual(self.user.is_active, True)
        self.assertEqual(self.user.nationalid.nationalid, "55667788")
        self.assertEqual(self.user.nationalid.firstname, "Admin")


class APIEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create test data for KeyPerson
        self.keyperson = KeyPerson.objects.create(
            nationalid="99887766",
            firstname="API",
            middlename="T",
            surname="Test",
            role="Registration Clerk",
            did="did:example:apitest123",
            designated_polling_station="Station API",
            created_by="system"
        )
    
    def test_api_root_endpoint(self):
        """Test the API root endpoint returns 200 OK status"""
        response = self.client.get(reverse('api-root'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_keyperson_list_endpoint(self):
        """Test the keypersons list endpoint returns our test keyperson"""
        response = self.client.get(reverse('keyperson-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['nationalid'], "99887766")