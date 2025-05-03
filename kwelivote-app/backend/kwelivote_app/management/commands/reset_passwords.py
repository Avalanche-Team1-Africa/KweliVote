from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils.crypto import get_random_string
import csv
import os
from datetime import datetime

User = get_user_model()

class Command(BaseCommand):
    help = 'Reset passwords for all users and export the new credentials to a CSV file'

    def add_arguments(self, parser):
        parser.add_argument(
            '--length',
            type=int,
            default=12,
            help='Length of the generated passwords'
        )
        parser.add_argument(
            '--prefix',
            type=str,
            default='KweliVote',
            help='Prefix for the generated passwords'
        )
        parser.add_argument(
            '--output',
            type=str,
            default='user_passwords.csv',
            help='Output CSV file path'
        )
        parser.add_argument(
            '--exclude-superusers',
            action='store_true',
            help='Exclude superusers from password reset'
        )

    def handle(self, *args, **options):
        password_length = options['length']
        password_prefix = options['prefix']
        output_file = options['output']
        exclude_superusers = options['exclude_superusers']
        
        # Create output directory if it doesn't exist
        output_dir = os.path.dirname(output_file)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)
        
        # Get all users
        if exclude_superusers:
            users = User.objects.filter(is_superuser=False)
            self.stdout.write(self.style.WARNING(f'Excluding superusers from password reset'))
        else:
            users = User.objects.all()
        
        self.stdout.write(self.style.SUCCESS(f'Found {users.count()} users to update'))
        
        # Create a timestamp for the password reset
        timestamp = datetime.now().strftime('%Y%m%d%H%M%S')
        
        # Prepare CSV file
        with open(output_file, 'w', newline='') as csvfile:
            writer = csv.writer(csvfile)
            writer.writerow(['Username', 'Email', 'New Password', 'Reset Time'])
            
            # Reset passwords for all users
            for user in users:
                # Generate a secure password with the prefix
                new_password = f"{password_prefix}_{get_random_string(password_length)}"
                
                # Set the new password
                user.set_password(new_password)
                user.save()
                
                # Write to CSV
                writer.writerow([user.username, user.email, new_password, timestamp])
                
                self.stdout.write(f'Reset password for user: {user.username}')
                
        self.stdout.write(self.style.SUCCESS(f'Successfully reset passwords for {users.count()} users'))
        self.stdout.write(self.style.SUCCESS(f'New credentials saved to {output_file}'))
        
        # Security warning
        self.stdout.write(self.style.WARNING('IMPORTANT: Make sure to secure the credentials file and delete it after use!'))