from django.core.management.base import BaseCommand
from django.db import transaction
from kwelivote_app.models import KeyPerson, User
from django.utils import timezone


class Command(BaseCommand):
    help = 'Creates a superuser with the required KeyPerson record'

    def add_arguments(self, parser):
        parser.add_argument('--username', required=True, help='Superuser username')
        parser.add_argument('--password', required=True, help='Superuser password')
        parser.add_argument('--firstname', required=True, help='First name for KeyPerson')
        parser.add_argument('--surname', required=True, help='Surname for KeyPerson')
        parser.add_argument('--nationalid', required=True, help='National ID for KeyPerson')
        parser.add_argument('--role', default="IEBC Constituency Election Coordinators (CECs)", 
                            help='Role for KeyPerson')

    @transaction.atomic
    def handle(self, *args, **options):
        username = options['username']
        password = options['password']
        nationalid = options['nationalid']
        firstname = options['firstname']
        surname = options['surname']
        role = options['role']

        # Check if the user already exists
        if User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f'User with username {username} already exists.'))
            return
        
        # Check if KeyPerson already exists
        keyperson, created = KeyPerson.objects.get_or_create(
            nationalid=nationalid,
            defaults={
                'firstname': firstname,
                'surname': surname,
                'role': role,
                'did': f"did:kweli:{nationalid}",  # Generate a simple DID
                'designated_polling_station': 'ADMIN',
                'created_by': 'SYSTEM',
                'created_datetime': timezone.now()
            }
        )

        if not created:
            self.stdout.write(self.style.WARNING(
                f'Using existing KeyPerson with National ID {nationalid}'))
        else:
            self.stdout.write(self.style.SUCCESS(
                f'KeyPerson created successfully with National ID {nationalid}'))

        # Create the superuser
        user = User.objects.create(
            username=username,
            nationalid=keyperson,
            is_active=True,
            is_staff=True,
            is_superuser=True,
            date_joined=timezone.now()
        )
        user.set_password(password)
        user.save()

        self.stdout.write(self.style.SUCCESS(
            f'Superuser {username} created successfully!'))