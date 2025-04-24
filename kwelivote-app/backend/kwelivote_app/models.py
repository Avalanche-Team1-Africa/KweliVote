from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError

# ------------------------
# KeyPersons Collection
# ------------------------
class KeyPerson(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, null=True, blank=True, related_name='keyperson')
    nationalid = models.CharField(primary_key=True, max_length=20)
    firstname = models.CharField(max_length=100)
    middlename = models.CharField(max_length=100, blank=True, null=True)
    surname = models.CharField(max_length=100)
    
    ROLE_CHOICES = [
        ("Registration Clerk", "Registration Clerk"),
        ("IEBC Constituency Election Coordinators (CECs)", "IEBC Constituency Election Coordinators (CECs)"),
        ("Polling Clerks", "Polling Clerks"),
        ("Party Agents", "Party Agents"),
        ("Observers", "Observers"),
        ("Presiding Officer (PO)", "Presiding Officer (PO)"),
        ("Deputy Presiding Officer (DPO)", "Deputy Presiding Officer (DPO)"),
    ]
    role = models.CharField(max_length=100, choices=ROLE_CHOICES)
    
    did = models.CharField(max_length=255)
    political_party = models.CharField(max_length=100, blank=True, null=True)
    designated_polling_station = models.CharField(max_length=100)

    OBSERVER_TYPE_CHOICES = [
        ("local", "Local"),
        ("international", "International")
    ]
    observer_type = models.CharField(max_length=20, choices=OBSERVER_TYPE_CHOICES, blank=True, null=True)
    
    stakeholder = models.CharField(max_length=255, blank=True, null=True, help_text="Name of country or organization")
    created_by = models.CharField(max_length=100)
    created_datetime = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.role} - {self.firstname} {self.surname}"
    
    def clean(self):
        # Validate that non-Observer KeyPersons have user accounts
        if self.role != "Observers" and not self.user:
            raise ValidationError("All KeyPersons except Observers must have a user account")
        
        # Validate that Observers have observer_type set
        if self.role == "Observers" and not self.observer_type:
            raise ValidationError("Observers must have an observer type specified")
        
        # Validate that Party Agents have political_party set
        if self.role == "Party Agents" and not self.political_party:
            raise ValidationError("Party Agents must have a political party specified")
    
    def save(self, *args, **kwargs):
        self.clean()  # Run validation before saving
        super().save(*args, **kwargs)


# ------------------------
# Voters Collection
# ------------------------
class Voter(models.Model):
    firstname = models.CharField(max_length=100)
    middlename = models.CharField(max_length=100, blank=True, null=True)
    surname = models.CharField(max_length=100)
    nationalid = models.CharField(primary_key=True, max_length=20)
    did = models.CharField(max_length=255)
    designated_polling_station = models.CharField(max_length=100)
    created_by = models.CharField(max_length=100)
    created_datetime = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.firstname} {self.surname}"


# ------------------------
# Candidates Collection
# ------------------------
class Candidate(models.Model):
    firstname = models.CharField(max_length=100)
    middlename = models.CharField(max_length=100, blank=True, null=True)
    surname = models.CharField(max_length=100)
    nationalid = models.CharField(primary_key=True, max_length=20)
    did = models.CharField(max_length=255)

    CANDIDATE_TYPE_CHOICES = [
        ("President", "President"),
        ("Member of National Assembly (MP)", "Member of National Assembly (MP)"),
        ("Senator", "Senator"),
        ("County Woman Representative", "County Woman Representative"),
        ("Governor", "Governor"),
        ("Member of County Assembly (MCA)", "Member of County Assembly (MCA)")
    ]
    candidate_type = models.CharField(max_length=50, choices=CANDIDATE_TYPE_CHOICES)
    political_party = models.CharField(max_length=100)
    created_by = models.CharField(max_length=100)
    created_datetime = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.candidate_type}: {self.firstname} {self.surname} ({self.nationalid})"


# ------------------------
# ResultsCount Collection
# ------------------------
class ResultsCount(models.Model):
    resultscount_id = models.CharField(primary_key=True, max_length=20)
    candidate = models.ForeignKey(Candidate, on_delete=models.CASCADE)
    polling_station = models.CharField(max_length=100)
    votes = models.IntegerField()
    
    # Validators
    presiding_officer = models.ForeignKey(KeyPerson, on_delete=models.CASCADE, related_name='po_validations')
    deputy_presiding_officer = models.ForeignKey(KeyPerson, on_delete=models.CASCADE, related_name='dpo_validations', blank=True, null=True)
    party_agent = models.ForeignKey(KeyPerson, on_delete=models.CASCADE, related_name='party_validations', blank=True, null=True)
    observer = models.ForeignKey(KeyPerson, on_delete=models.CASCADE, related_name='observer_validations', blank=True, null=True)
    
    created_by = models.CharField(max_length=100)
    created_datetime = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"Results for {self.candidate} - {self.votes} votes"

    class Meta:
        verbose_name_plural = "Results Count"