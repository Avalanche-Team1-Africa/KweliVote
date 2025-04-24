from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.db import transaction
from kwelivote_app.models import KeyPerson
import random
import string


class Command(BaseCommand):
    help = 'Creates user accounts for all KeyPersons who are not Observers and links them'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes',
        )
        
    def generate_password(self, length=12):
        """Generate a strong random password"""
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        return ''.join(random.choice(chars) for _ in range(length))
        
    def generate_username(self, keyperson):
        """Generate a username based on keyperson information"""
        base_username = f"{keyperson.firstname.lower()}_{keyperson.nationalid[-4:]}"
        # Check if username exists
        if User.objects.filter(username=base_username).exists():
            # Add random suffix if username exists
            suffix = ''.join(random.choices(string.digits, k=3))
            return f"{base_username}_{suffix}"
        return base_username

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options.get('dry-run', False)
        
        # Get all KeyPersons without users who are not Observers
        keypersons = KeyPerson.objects.filter(
            user__isnull=True
        ).exclude(
            role="Observers"
        )
        
        if dry_run:
            self.stdout.write(f"Found {keypersons.count()} KeyPersons that need user accounts:")
            for kp in keypersons:
                self.stdout.write(f"  - {kp.firstname} {kp.surname} ({kp.nationalid}): {kp.role}")
            return
        
        created_count = 0
        for keyperson in keypersons:
            username = self.generate_username(keyperson)
            password = self.generate_password()
            
            # Create user
            user = User.objects.create_user(
                username=username,
                email=f"{username}@kwelivote.example.com",
                password=password,
                first_name=keyperson.firstname,
                last_name=keyperson.surname
            )
            
            # Link user to KeyPerson
            keyperson.user = user
            keyperson.save()
            
            self.stdout.write(self.style.SUCCESS(
                f"Created user '{username}' for {keyperson.firstname} {keyperson.surname} "
                f"({keyperson.role}) with password '{password}'"
            ))
            created_count += 1
            
        self.stdout.write(self.style.SUCCESS(
            f"Successfully created {created_count} user accounts for KeyPersons"
        ))