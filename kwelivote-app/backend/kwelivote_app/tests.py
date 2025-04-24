from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from .models import Voter, KeyPerson, Candidate
from django.utils import timezone

class KeyPersonModelTests(TestCase):
    def setUp(self):
        self.keyperson = KeyPerson.objects.create(
            nationalid="12345678",
            firstname="Test",
            middlename="",
            surname="User",
            role="Registration Clerk",
            did="did:example:12345678",
            designated_polling_station="Test Station",
            created_by="system"
        )
    
    def test_keyperson_creation(self):
        """Test that a keyperson can be created properly"""
        self.assertEqual(self.keyperson.nationalid, "12345678")
        self.assertEqual(self.keyperson.firstname, "Test")
        self.assertEqual(self.keyperson.role, "Registration Clerk")


class VoterModelTests(TestCase):
    def setUp(self):
        self.voter = Voter.objects.create(
            nationalid="V12345",
            firstname="Voter",
            middlename="",
            surname="Test",
            did="did:example:voter12345",
            designated_polling_station="Test Station",
            created_by="system"
        )
    
    def test_voter_creation(self):
        """Test that a voter can be created properly"""
        self.assertEqual(self.voter.nationalid, "V12345")
        self.assertEqual(self.voter.firstname, "Voter")
        self.assertEqual(self.voter.surname, "Test")


class CandidateModelTests(TestCase):
    def setUp(self):
        self.candidate = Candidate.objects.create(
            nationalid="C12345",
            firstname="Candidate",
            middlename="",
            surname="Test",
            did="did:example:candidate12345",
            candidate_type="President",
            political_party="Test Party",
            created_by="system"
        )
    
    def test_candidate_creation(self):
        """Test that a candidate can be created properly"""
        self.assertEqual(self.candidate.nationalid, "C12345")
        self.assertEqual(self.candidate.firstname, "Candidate")
        self.assertEqual(self.candidate.candidate_type, "President")


class APIEndpointTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create a test KeyPerson
        self.keyperson = KeyPerson.objects.create(
            nationalid="K12345",
            firstname="API",
            surname="Test",
            role="Registration Clerk",
            did="did:example:api12345",
            designated_polling_station="API Station",
            created_by="system"
        )
        
        # Create a test Voter
        self.voter = Voter.objects.create(
            nationalid="V54321",
            firstname="Voter",
            surname="API",
            did="did:example:voter54321",
            designated_polling_station="API Station",
            created_by="system"
        )
    
    def test_api_root(self):
        """Test the API root endpoint"""
        response = self.client.get(reverse('api-root'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('voters', response.data)
        self.assertIn('keypersons', response.data)
        self.assertIn('candidates', response.data)
    
    def test_keyperson_list(self):
        """Test the API can list keypersons"""
        response = self.client.get(reverse('keyperson-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)
    
    def test_voter_list(self):
        """Test the API can list voters"""
        response = self.client.get(reverse('voter-list'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) > 0)