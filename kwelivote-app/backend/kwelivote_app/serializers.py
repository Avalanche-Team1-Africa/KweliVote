from rest_framework import serializers
from .models import Voter, KeyPerson, Candidate, ResultsCount

class KeyPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = KeyPerson
        fields = '__all__'

    def update(self, instance, validated_data):
        # Only update biometric related fields if new biometric data is captured
        if 'biometric_data' in validated_data or 'biometric_template' in validated_data:
            # If we received new biometric data, update all related fields
            if 'biometric_template' in validated_data:
                instance.biometric_template = validated_data.get('biometric_template')
                instance.has_template = True
            
            if 'biometric_data' in validated_data:
                instance.biometric_data = validated_data.get('biometric_data')
            
            if 'biometric_image' in validated_data:
                instance.biometric_image = validated_data.get('biometric_image')
            
            # Only update DID if explicitly provided
            if 'did' in validated_data:
                instance.did = validated_data.get('did')
        else:
            # If no new biometric data, don't update biometric-related fields
            validated_data.pop('did', None)
            validated_data.pop('biometric_template', None)
            validated_data.pop('has_template', None)
            validated_data.pop('biometric_data', None)
            validated_data.pop('biometric_image', None)

        # Update all other fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        instance.save()
        return instance


class VoterSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voter
        fields = '__all__'
        
    def create(self, validated_data):
        # If no DID is provided, generate a temporary one based on nationalid
        if 'did' not in validated_data or not validated_data['did']:
            validated_data['did'] = f"did:temp:{validated_data['nationalid']}"
            
        return super().create(validated_data)
        
    def update(self, instance, validated_data):
        # Only update biometric related fields if new biometric data is captured
        if 'biometric_data' in validated_data or 'biometric_template' in validated_data:
            # If we received new biometric data, update all related fields
            if 'biometric_template' in validated_data:
                instance.biometric_template = validated_data.get('biometric_template')
                instance.has_template = True
            
            if 'biometric_data' in validated_data:
                instance.biometric_data = validated_data.get('biometric_data')
            
            if 'biometric_image' in validated_data:
                instance.biometric_image = validated_data.get('biometric_image')
            
            # Only update DID if explicitly provided
            if 'did' in validated_data:
                instance.did = validated_data.get('did')
        else:
            # If no new biometric data, don't update biometric-related fields
            validated_data.pop('did', None)
            validated_data.pop('biometric_template', None)
            validated_data.pop('has_template', None)
            validated_data.pop('biometric_data', None)
            validated_data.pop('biometric_image', None)

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