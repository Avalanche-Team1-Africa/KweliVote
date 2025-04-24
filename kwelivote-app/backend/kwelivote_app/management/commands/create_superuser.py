from django.core.management.base import BaseCommand
from django.db import transaction
from kwelivote_app.models import KeyPerson
from django.utils import timezone


class Command(BaseCommand):
    help = 'Creates a superuser KeyPerson record'

    def add_arguments(self, parser):
        parser.add_argument('--firstname', required=True, help='First name for KeyPerson')
        parser.add_argument('--surname', required=True, help='Surname for KeyPerson')
        parser.add_argument('--nationalid', required=True, help='National ID for KeyPerson')
        parser.add_argument('--role', default="IEBC Constituency Election Coordinators (CECs)", 
                            help='Role for KeyPerson')

    @transaction.atomic
    def handle(self, *args, **options):
        nationalid = options['nationalid']
        firstname = options['firstname']
        surname = options['surname']
        role = options['role']
        
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
            
        self.stdout.write(self.style.SUCCESS(
            f'Admin KeyPerson {firstname} {surname} is ready!'))