from rest_framework import serializers
from .models import Voter, KeyPerson, Candidate, ResultsCount

class KeyPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeyPerson
        fields = '__all__'

    def update(self, instance, validated_data):
        # Remove these fields from validated_data to prevent updating them
        validated_data.pop('did', None)
        validated_data.pop('biometric_template', None)
        validated_data.pop('has_template', None)
        validated_data.pop('blockchain_tx_id', None)
        validated_data.pop('blockchain_subnet_id', None)

        # Update all other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance


class VoterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voter
        fields = '__all__'
        
    def update(self, instance, validated_data):
        # Remove these fields from validated_data to prevent updating them
        validated_data.pop('did', None)
        validated_data.pop('biometric_template', None)
        validated_data.pop('has_template', None)
        validated_data.pop('blockchain_tx_id', None)
        validated_data.pop('blockchain_subnet_id', None)

        # Update all other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance


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