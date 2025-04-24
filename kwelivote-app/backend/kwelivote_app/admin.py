from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import Voter, KeyPerson, Candidate, ResultsCount

# Define an inline admin for KeyPerson to show in User admin
class KeyPersonInline(admin.StackedInline):
    model = KeyPerson
    can_delete = False
    verbose_name_plural = 'Key Person Information'
    fk_name = 'user'

# Extend the User admin to include KeyPerson inline
class UserAdmin(BaseUserAdmin):
    inlines = (KeyPersonInline,)
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'get_keyperson_role')
    
    def get_keyperson_role(self, obj):
        try:
            return obj.keyperson.role if hasattr(obj, 'keyperson') else None
        except KeyPerson.DoesNotExist:
            return None
    get_keyperson_role.short_description = 'Role'

# Re-register UserAdmin with our customized version
admin.site.unregister(User)
admin.site.register(User, UserAdmin)

@admin.register(KeyPerson)
class KeyPersonAdmin(admin.ModelAdmin):
    list_display = ('nationalid', 'firstname', 'surname', 'role', 'designated_polling_station', 'get_username')
    list_filter = ('role', 'observer_type')
    search_fields = ('nationalid', 'firstname', 'surname', 'did', 'user__username')
    autocomplete_fields = ['user']
    
    def get_username(self, obj):
        return obj.user.username if obj.user else "No user account"
    get_username.short_description = 'Username'
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        # Show only users that are not already linked to a KeyPerson
        if db_field.name == "user":
            kwargs["queryset"] = User.objects.filter(keyperson__isnull=True)
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

    def save_model(self, request, obj, form, change):
        # Make sure observers don't need user accounts but other roles do
        if obj.role == "Observers":
            # For observers, user account is optional
            super().save_model(request, obj, form, change)
        elif not obj.user:
            # Raise error if non-observer keyperson has no user
            from django.core.exceptions import ValidationError
            raise ValidationError("All KeyPersons except Observers must have a user account")
        else:
            # Save normally for other keypersons with users
            super().save_model(request, obj, form, change)


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