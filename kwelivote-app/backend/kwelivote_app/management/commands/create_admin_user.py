from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db import transaction

User = get_user_model()

class Command(BaseCommand):
    help = 'Creates a Django superuser with username "admin" and password "admin"'

    @transaction.atomic
    def handle(self, *args, **options):
        username = 'admin'
        password = 'admin'
        email = 'admin@example.com'
        
        # Check if user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(
                f'User with username "{username}" already exists. No action taken.'))
            return

        # Create superuser
        User.objects.create_superuser(
            username=username,
            email=email,
            password=password
        )
            
        self.stdout.write(self.style.SUCCESS(
            f'Superuser "{username}" created successfully!'))