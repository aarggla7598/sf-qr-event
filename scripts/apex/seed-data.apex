// Seed data for Event Management app
// Run with: sf apex run --file scripts/apex/seed-data.apex

// Create Events
Event__c evt1 = new Event__c(
    Name = 'Tech Conference 2024',
    Date__c = Date.newInstance(2024, 3, 15),
    Location__c = 'San Francisco Convention Center',
    Description__c = 'Annual technology conference featuring the latest in software development, AI, and cloud computing.'
);

Event__c evt2 = new Event__c(
    Name = 'Workshop: React Basics',
    Date__c = Date.newInstance(2024, 3, 20),
    Location__c = 'Online (Zoom)',
    Description__c = 'A beginner-friendly workshop covering React fundamentals, components, and state management.'
);

Event__c evt3 = new Event__c(
    Name = 'Networking Mixer',
    Date__c = Date.newInstance(2024, 3, 25),
    Location__c = 'Downtown Hotel, Ballroom A',
    Description__c = 'An evening of networking with professionals from various tech companies.'
);

insert new List<Event__c>{ evt1, evt2, evt3 };

// Create Attendees
Attendee__c att1 = new Attendee__c(
    Event__c = evt1.Id,
    Name = 'Alice Johnson',
    Email__c = 'alice@example.com',
    QR_Code__c = 'EV' + evt1.Id + '-ALICEJOHNSON-001',
    Checked_In__c = false
);

Attendee__c att2 = new Attendee__c(
    Event__c = evt1.Id,
    Name = 'Bob Smith',
    Email__c = 'bob@example.com',
    QR_Code__c = 'EV' + evt1.Id + '-BOBSMITH-002',
    Checked_In__c = true,
    Check_In_Time__c = DateTime.newInstance(2024, 3, 15, 9, 30, 0)
);

Attendee__c att3 = new Attendee__c(
    Event__c = evt2.Id,
    Name = 'Carol White',
    Email__c = 'carol@example.com',
    QR_Code__c = 'EV' + evt2.Id + '-CAROLWHITE-001',
    Checked_In__c = false
);

Attendee__c att4 = new Attendee__c(
    Event__c = evt2.Id,
    Name = 'David Brown',
    Email__c = 'david@example.com',
    QR_Code__c = 'EV' + evt2.Id + '-DAVIDBROWN-002',
    Checked_In__c = true,
    Check_In_Time__c = DateTime.newInstance(2024, 3, 20, 10, 0, 0)
);

Attendee__c att5 = new Attendee__c(
    Event__c = evt3.Id,
    Name = 'Eva Martinez',
    Email__c = 'eva@example.com',
    QR_Code__c = 'EV' + evt3.Id + '-EVAMARTINEZ-001',
    Checked_In__c = false
);

insert new List<Attendee__c>{ att1, att2, att3, att4, att5 };

System.debug('Seed data created successfully!');
System.debug('Events created: 3');
System.debug('Attendees created: 5');
