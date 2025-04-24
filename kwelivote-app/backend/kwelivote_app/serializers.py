from rest_framework import serializers
from .models import Voter, KeyPerson, Candidate, ResultsCount

class KeyPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeyPerson
        fields = '__all__'


class VoterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voter
        fields = '__all__'


class CandidateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Candidate
        fields = '__all__'


class ResultsCountSerializer(serializers.ModelSerializer):
    candidate_details = serializers.SerializerMethodField()

    class Meta:
        model = ResultsCount
        fields = '__all__'
    
    def get_candidate_details(self, obj):
        candidate = obj.candidate
        return {
            'firstname': candidate.firstname,
            'surname': candidate.surname,
            'candidate_type': candidate.candidate_type,
            'political_party': candidate.political_party
        }