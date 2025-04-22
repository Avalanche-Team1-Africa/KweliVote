from django.core.management.base import BaseCommand
from kwelivote_app.models import User, Voter, KeyPerson, Candidate, ResultsCount
from django.utils import timezone

class Command(BaseCommand):
    help = 'Populate the database with test data for User, Voter, KeyPerson, Candidate'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Starting database population...'))
        
        # First delete all existing data
        self.stdout.write('Deleting existing data...')
        KeyPerson.objects.all().delete()
        User.objects.all().delete()
        Voter.objects.all().delete()
        Candidate.objects.all().delete()
        ResultsCount.objects.all().delete()
        
        # First create keypersons. This will allow linking this to users
        self.stdout.write('Creating KeyPersons...')
        keypersons = [
            KeyPerson(
                nationalid='100001',
                firstname='John',
                middlename='M',
                surname='Doe',
                role='Registration Clerk',
                did='did:example:100001',
                designated_polling_station='Station A',
                created_by='admin',
                created_datetime=timezone.now()
            ),
            KeyPerson(
                nationalid='100002',
                firstname='Mary',
                middlename='N',
                surname='Smith',
                role='Presiding Officer (PO)',
                did='did:example:100002',
                designated_polling_station='Station B',
                created_by='admin',
                created_datetime=timezone.now()
            ),
            KeyPerson(
                nationalid='100003',
                firstname='James',
                middlename='O',
                surname='Brown',
                role='Deputy Presiding Officer (DPO)',
                did='did:example:100003',
                designated_polling_station='Station C',
                created_by='admin',
                created_datetime=timezone.now()
            ),
            KeyPerson(
                nationalid='100004',
                firstname='Patricia',
                middlename='P',
                surname='Johnson',
                role='Polling Clerks',
                did='did:example:100004',
                designated_polling_station='Station D',
                created_by='admin',
                created_datetime=timezone.now()
            ),
            KeyPerson(
                nationalid='100005',
                firstname='Michael',
                middlename='Q',
                surname='Williams',
                role='Party Agents',
                political_party='Party A',
                did='did:example:100005',
                designated_polling_station='Station E',
                created_by='admin',
                created_datetime=timezone.now()
            ),
            KeyPerson(
                nationalid='100006',
                firstname='Sarah',
                middlename='R',
                surname='Davis',
                role='Observers',
                observer_type='local',
                stakeholder='Local Observer Org',
                did='did:example:100006',
                designated_polling_station='Station F',
                created_by='admin',
                created_datetime=timezone.now()
            ),
            KeyPerson(
                nationalid='100007',
                firstname='Robert',
                middlename='S',
                surname='Miller',
                role='Observers',
                observer_type='international',
                stakeholder='UN',
                did='did:example:100007',
                designated_polling_station='Station G',
                created_by='admin',
                created_datetime=timezone.now()
            ),
        ]

        for keyperson in keypersons:
            keyperson.save()
        
        # Create users
        self.stdout.write('Creating Users...')
        # Get related KeyPersons
        kp1 = KeyPerson.objects.get(nationalid='100001')
        kp2 = KeyPerson.objects.get(nationalid='100002')
        kp3 = KeyPerson.objects.get(nationalid='100003')
        kp4 = KeyPerson.objects.get(nationalid='100004')
        kp5 = KeyPerson.objects.get(nationalid='100005')

        # Create User instances
        users = [
            User(username='clerk1', nationalid=kp1, password='password123', is_active=True),
            User(username='officer1', nationalid=kp2, password='password123', is_active=True),
            User(username='deputy1', nationalid=kp3, password='password123', is_active=True),
            User(username='pollclerk1', nationalid=kp4, password='password123', is_active=True),
            User(username='agent1', nationalid=kp5, password='password123', is_active=True),
        ]

        for user in users:
            user.save()

        # Create Voters
        self.stdout.write('Creating Voters...')
        voters = [
            Voter(firstname='Alice', middlename='L', surname='Johnson', nationalid='V1001', did='did:example:V1001',
                  designated_polling_station='Station A', created_by='clerk1', created_datetime=timezone.now()),
            
            Voter(firstname='Bob', middlename='M', surname='Smith', nationalid='V1002', did='did:example:V1002',
                  designated_polling_station='Station B', created_by='clerk1', created_datetime=timezone.now()),
            
            Voter(firstname='Charlie', middlename='N', surname='Ngugi', nationalid='V1003', did='did:example:V1003',
                  designated_polling_station='Station C', created_by='clerk1', created_datetime=timezone.now()),
                  
            Voter(firstname='Diana', middlename='O', surname='Wangari', nationalid='V1004', did='did:example:V1004',
                  designated_polling_station='Station A', created_by='clerk1', created_datetime=timezone.now()),
                  
            Voter(firstname='Edward', middlename='P', surname='Kamau', nationalid='V1005', did='did:example:V1005',
                  designated_polling_station='Station B', created_by='clerk1', created_datetime=timezone.now()),
        ]

        for voter in voters:
            voter.save()

        # Create Candidates
        self.stdout.write('Creating Candidates...')
        candidates = [
            Candidate(firstname='Diana', middlename='O', surname='Kenya', nationalid='C1001', did='did:example:C1001',
                      candidate_type='President', political_party='Party A', created_by='admin', created_datetime=timezone.now()),
            
            Candidate(firstname='Eli', middlename='P', surname='Wanjiku', nationalid='C1002', did='did:example:C1002',
                      candidate_type='President', political_party='Party B', created_by='admin', created_datetime=timezone.now()),
            
            Candidate(firstname='Faith', middlename='Q', surname='Omari', nationalid='C1003', did='did:example:C1003',
                      candidate_type='Governor', political_party='Party A', created_by='admin', created_datetime=timezone.now()),
                      
            Candidate(firstname='George', middlename='R', surname='Mwangi', nationalid='C1004', did='did:example:C1004',
                      candidate_type='Governor', political_party='Party B', created_by='admin', created_datetime=timezone.now()),
                      
            Candidate(firstname='Helen', middlename='S', surname='Njeri', nationalid='C1005', did='did:example:C1005',
                      candidate_type='Member of National Assembly (MP)', political_party='Party C', created_by='admin', created_datetime=timezone.now()),
                      
            Candidate(firstname='Ian', middlename='T', surname='Ochieng', nationalid='C1006', did='did:example:C1006',
                      candidate_type='Member of National Assembly (MP)', political_party='Party D', created_by='admin', created_datetime=timezone.now()),
        ]

        for candidate in candidates:
            candidate.save()

        # Create Results Count (sample results)
        self.stdout.write('Creating Results Count...')
        # Get related objects
        po = KeyPerson.objects.get(nationalid='100002')  # Presiding Officer
        dpo = KeyPerson.objects.get(nationalid='100003')  # Deputy Presiding Officer
        agent = KeyPerson.objects.get(nationalid='100005')  # Party Agent
        observer = KeyPerson.objects.get(nationalid='100006')  # Observer
        
        candidate1 = Candidate.objects.get(nationalid='C1001')
        candidate2 = Candidate.objects.get(nationalid='C1002')
        
        results = [
            ResultsCount(
                resultscount_id='RES1001',
                candidate=candidate1,
                polling_station='Station A',
                votes=120,
                presiding_officer=po,
                deputy_presiding_officer=dpo,
                party_agent=agent,
                observer=observer,
                created_by='officer1',
                created_datetime=timezone.now()
            ),
            ResultsCount(
                resultscount_id='RES1002',
                candidate=candidate2,
                polling_station='Station A',
                votes=85,
                presiding_officer=po,
                deputy_presiding_officer=dpo,
                party_agent=agent,
                observer=observer,
                created_by='officer1',
                created_datetime=timezone.now()
            ),
        ]

        for result in results:
            result.save()

        self.stdout.write(self.style.SUCCESS('Successfully populated the database with test data.'))