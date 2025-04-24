from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from .models import KeyPerson
import random
import string

def generate_username(keyperson):
    """Generate a username based on keyperson information"""
    base_username = f"{keyperson.firstname.lower()}_{keyperson.nationalid[-4:]}"
    # Check if username exists
    if User.objects.filter(username=base_username).exists():
        # Add random suffix if username exists
        suffix = ''.join(random.choices(string.digits, k=3))
        return f"{base_username}_{suffix}"
    return base_username

def generate_password(length=12):
    """Generate a strong random password"""
    chars = string.ascii_letters + string.digits + "!@#$%^&*"
    return ''.join(random.choice(chars) for _ in range(length))

@receiver(pre_save, sender=KeyPerson)
def create_user_for_keyperson(sender, instance, **kwargs):
    """Create a user account for a non-Observer KeyPerson if it doesn't exist yet"""
    
    # Skip if this is an Observer or if user is already set
    if instance.role == "Observers" or instance.user is not None:
        return
    
    # Try to get the original object from the database to see if it's a new record
    try:
        # If this is an existing record and no changes to user, skip
        original = KeyPerson.objects.get(pk=instance.pk)
        if original.user == instance.user:
            return
    except KeyPerson.DoesNotExist:
        # This is a new record, continue with user creation
        pass
    
    # Generate username and password
    username = generate_username(instance)
    password = generate_password()
    
    # Create the user
    user = User.objects.create_user(
        username=username,
        email=f"{username}@kwelivote.example.com",
        password=password,
        first_name=instance.firstname,
        last_name=instance.surname
    )
    
    # Assign the user to the KeyPerson
    instance.user = user
    
    # Print information about the created user (in development)
    print(f"Created new user '{username}' with password '{password}' for {instance.firstname} {instance.surname}")