// MongoDB script to populate the kwelivote_db database with test data

// First clean up existing data
db = db.getSiblingDB('kwelivote_db');
db.keypersons.drop();
db.users.drop();
db.voters.drop();
db.candidates.drop();
db.resultscount.drop();

// Create KeyPersons collection
print('Creating KeyPersons...');
db.keypersons.insertMany([
  {
    nationalid: '100001',
    
    firstname: 'John',
    middlename: 'M',
    surname: 'Doe',
    role: 'Registration Clerk',
    did: 'did:example:100001',
    designated_polling_station: 'Station A',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    nationalid: '100002',
    firstname: 'Mary',
    middlename: 'N',
    surname: 'Smith',
    role: 'Presiding Officer (PO)',
    did: 'did:example:100002',
    designated_polling_station: 'Station B',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    nationalid: '100003',
    firstname: 'James',
    middlename: 'O',
    surname: 'Brown',
    role: 'Deputy Presiding Officer (DPO)',
    did: 'did:example:100003',
    designated_polling_station: 'Station C',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    nationalid: '100004',
    firstname: 'Patricia',
    middlename: 'P',
    surname: 'Johnson',
    role: 'Polling Clerks',
    did: 'did:example:100004',
    designated_polling_station: 'Station D',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    nationalid: '100005',
    firstname: 'Michael',
    middlename: 'Q',
    surname: 'Williams',
    role: 'Party Agents',
    political_party: 'Party A',
    did: 'did:example:100005',
    designated_polling_station: 'Station E',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    nationalid: '100006',
    firstname: 'Sarah',
    middlename: 'R',
    surname: 'Davis',
    role: 'Observers',
    observer_type: 'local',
    stakeholder: 'Local Observer Org',
    did: 'did:example:100006',
    designated_polling_station: 'Station F',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    nationalid: '100007',
    firstname: 'Robert',
    middlename: 'S',
    surname: 'Miller',
    role: 'Observers',
    observer_type: 'international',
    stakeholder: 'UN',
    did: 'did:example:100007',
    designated_polling_station: 'Station G',
    created_by: 'admin',
    created_datetime: new Date()
  }
]);

// Create Users collection
print('Creating Users...');
db.users.insertMany([
  {
    _id: new ObjectId(),
    username: 'clerk1',
    nationalid: '100001', // Reference to KeyPerson
    password: 'password123',
    is_active: true
  },
  {
    _id: new ObjectId(),
    username: 'officer1',
    nationalid: '100002', // Reference to KeyPerson
    password: 'password123',
    is_active: true
  },
  {
    _id: new ObjectId(),
    username: 'deputy1',
    nationalid: '100003', // Reference to KeyPerson
    password: 'password123',
    is_active: true
  },
  {
    _id: new ObjectId(),
    username: 'pollclerk1',
    nationalid: '100004', // Reference to KeyPerson
    password: 'password123',
    is_active: true
  },
  {
    _id: new ObjectId(),
    username: 'agent1',
    nationalid: '100005', // Reference to KeyPerson
    password: 'password123',
    is_active: true
  }
]);

// Create Voters collection
print('Creating Voters...');
db.voters.insertMany([
  {
    firstname: 'Alice',
    middlename: 'L',
    surname: 'Johnson',
    nationalid: 'V1001',
    did: 'did:example:V1001',
    designated_polling_station: 'Station A',
    created_by: 'clerk1',
    created_datetime: new Date()
  },
  {
    firstname: 'Bob',
    middlename: 'M',
    surname: 'Smith',
    nationalid: 'V1002',
    did: 'did:example:V1002',
    designated_polling_station: 'Station B',
    created_by: 'clerk1',
    created_datetime: new Date()
  },
  {
    firstname: 'Charlie',
    middlename: 'N',
    surname: 'Ngugi',
    nationalid: 'V1003',
    did: 'did:example:V1003',
    designated_polling_station: 'Station C',
    created_by: 'clerk1',
    created_datetime: new Date()
  },
  {
    firstname: 'Diana',
    middlename: 'O',
    surname: 'Wangari',
    nationalid: 'V1004',
    did: 'did:example:V1004',
    designated_polling_station: 'Station A',
    created_by: 'clerk1',
    created_datetime: new Date()
  },
  {
    firstname: 'Edward',
    middlename: 'P',
    surname: '2',
    nationalid: 'V1005',
    did: 'did:example:V1005',
    designated_polling_station: 'Station B',
    created_by: 'clerk1',
    created_datetime: new Date()
  }
]);

// Create Candidates collection
print('Creating Candidates...');
db.candidates.insertMany([
  {
    firstname: 'Diana',
    middlename: 'O',
    surname: 'Kenya',
    nationalid: 'C1001',
    did: 'did:example:C1001',
    candidate_type: 'President',
    political_party: 'Party A',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    firstname: 'Eli',
    middlename: 'P',
    surname: 'Wanjiku',
    nationalid: 'C1002',
    did: 'did:example:C1002',
    candidate_type: 'President',
    political_party: 'Party B',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    firstname: 'Faith',
    middlename: 'Q',
    surname: 'Omari',
    nationalid: 'C1003',
    did: 'did:example:C1003',
    candidate_type: 'Governor',
    political_party: 'Party A',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    firstname: 'George',
    middlename: 'R',
    surname: 'Mwangi',
    nationalid: 'C1004',
    did: 'did:example:C1004',
    candidate_type: 'Governor',
    political_party: 'Party B',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    firstname: 'Helen',
    middlename: 'S',
    surname: 'Njeri',
    nationalid: 'C1005',
    did: 'did:example:C1005',
    candidate_type: 'Member of National Assembly (MP)',
    political_party: 'Party C',
    created_by: 'admin',
    created_datetime: new Date()
  },
  {
    firstname: 'Ian',
    middlename: 'T',
    surname: 'Ochieng',
    nationalid: 'C1006',
    did: 'did:example:C1006',
    candidate_type: 'Member of National Assembly (MP)',
    political_party: 'Party D',
    created_by: 'admin',
    created_datetime: new Date()
  }
]);

// Create Results Count collection
print('Creating Results Count...');
db.resultscount.insertMany([
  {
    resultscount_id: 'RES1001',
    candidate: 'C1001', // Reference to Candidate
    polling_station: 'Station A',
    votes: 120,
    presiding_officer: '100002', // Reference to KeyPerson
    deputy_presiding_officer: '100003', // Reference to KeyPerson
    party_agent: '100005', // Reference to KeyPerson
    observer: '100006', // Reference to KeyPerson
    created_by: 'officer1',
    created_datetime: new Date()
  },
  {
    resultscount_id: 'RES1002',
    candidate: 'C1002', // Reference to Candidate
    polling_station: 'Station A',
    votes: 85,
    presiding_officer: '100002', // Reference to KeyPerson
    deputy_presiding_officer: '100003', // Reference to KeyPerson
    party_agent: '100005', // Reference to KeyPerson
    observer: '100006', // Reference to KeyPerson
    created_by: 'officer1',
    created_datetime: new Date()
  }
]);

print('Database population completed successfully!');
