from django.contrib import admin
from .models import User, Voter, KeyPerson, Candidate, ResultsCount

@admin.register(KeyPerson)
class KeyPersonAdmin(admin.ModelAdmin):
    list_display = ('nationalid', 'firstname', 'surname', 'role', 'designated_polling_station')
    list_filter = ('role', 'observer_type')
    search_fields = ('nationalid', 'firstname', 'surname', 'did')


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'get_keyperson_name', 'get_role', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('username',)

    def get_keyperson_name(self, obj):
        return f"{obj.nationalid.firstname} {obj.nationalid.surname}"
    get_keyperson_name.short_description = 'Name'
    
    def get_role(self, obj):
        return obj.nationalid.role
    get_role.short_description = 'Role'


@admin.register(Voter)
class VoterAdmin(admin.ModelAdmin):
    list_display = ('nationalid', 'firstname', 'surname', 'designated_polling_station')
    list_filter = ('designated_polling_station',)
    search_fields = ('nationalid', 'firstname', 'surname', 'did')


@admin.register(Candidate)
class CandidateAdmin(admin.ModelAdmin):
    list_display = ('nationalid', 'firstname', 'surname', 'candidate_type', 'political_party')
    list_filter = ('candidate_type', 'political_party')
    search_fields = ('nationalid', 'firstname', 'surname')


@admin.register(ResultsCount)
class ResultsCountAdmin(admin.ModelAdmin):
    list_display = ('resultscount_id', 'get_candidate_name', 'polling_station', 'votes')
    list_filter = ('polling_station',)
    search_fields = ('candidate__firstname', 'candidate__surname', 'polling_station')
    
    def get_candidate_name(self, obj):
        return f"{obj.candidate.firstname} {obj.candidate.surname}"
    get_candidate_name.short_description = 'Candidate'