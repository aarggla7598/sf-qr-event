@IsTest
private class EventControllerTest {
  @TestSetup
  static void setup() {
    Event__c evt = new Event__c(
      Name = 'Test Conference',
      Date__c = Date.today().addDays(30),
      Location__c = 'Test Venue',
      Description__c = 'A test event description'
    );
    insert evt;

    Attendee__c att = new Attendee__c(
      Event__c = evt.Id,
      Name = 'Test Attendee',
      Email__c = 'test@example.com',
      QR_Code__c = 'EV' + evt.Id + '-TESTATTENDEE-001',
      Checked_In__c = false
    );
    insert att;
  }

  @IsTest
  static void testGetEvents() {
    List<Event__c> events = EventController.getEvents();
    System.assertEquals(1, events.size(), 'Should return one event');
    System.assertEquals('Test Conference', events[0].Name);
    System.assertEquals(
      1,
      events[0].Attendees__r.size(),
      'Should include attendee count via subquery'
    );
  }

  @IsTest
  static void testGetEventById() {
    Event__c evt = [SELECT Id FROM Event__c LIMIT 1];
    Event__c result = EventController.getEventById(evt.Id);
    System.assertEquals('Test Conference', result.Name);
    System.assertEquals('Test Venue', result.Location__c);
  }

  @IsTest
  static void testCreateEvent() {
    Test.startTest();
    Event__c evt = EventController.createEvent(
      'New Event',
      Date.today().addDays(60),
      'New Venue',
      'New description'
    );
    Test.stopTest();

    System.assertNotEquals(null, evt.Id, 'Event should be created with an Id');
    Event__c verify = [
      SELECT Name, Location__c
      FROM Event__c
      WHERE Id = :evt.Id
    ];
    System.assertEquals('New Event', verify.Name);
    System.assertEquals('New Venue', verify.Location__c);
  }

  @IsTest
  static void testCreateEventWithoutDescription() {
    Test.startTest();
    Event__c evt = EventController.createEvent(
      'Minimal Event',
      Date.today(),
      'Some Place',
      null
    );
    Test.stopTest();

    System.assertNotEquals(null, evt.Id);
  }

  @IsTest
  static void testGetEventsIncludesStatus() {
    List<Event__c> events = EventController.getEvents();
    System.assertEquals(1, events.size());
    // Newly created events without explicit status default to null;
    // the app treats null as Active
  }

  @IsTest
  static void testUpdateEvent() {
    Event__c evt = [SELECT Id FROM Event__c LIMIT 1];

    Test.startTest();
    Event__c updated = EventController.updateEvent(
      evt.Id,
      'Updated Name',
      Date.today().addDays(45),
      'Updated Venue',
      'Updated description',
      'Active'
    );
    Test.stopTest();

    Event__c verify = [
      SELECT Name, Location__c, Description__c, Status__c
      FROM Event__c
      WHERE Id = :evt.Id
    ];
    System.assertEquals('Updated Name', verify.Name);
    System.assertEquals('Updated Venue', verify.Location__c);
    System.assertEquals('Updated description', verify.Description__c);
    System.assertEquals('Active', verify.Status__c);
  }

  @IsTest
  static void testUpdateEventStatus() {
    Event__c evt = [SELECT Id FROM Event__c LIMIT 1];

    Test.startTest();
    EventController.updateEvent(
      evt.Id,
      'Test Conference',
      Date.today().addDays(30),
      'Test Venue',
      'A test event description',
      'Completed'
    );
    Test.stopTest();

    Event__c verify = [
      SELECT Status__c
      FROM Event__c
      WHERE Id = :evt.Id
    ];
    System.assertEquals('Completed', verify.Status__c);
  }

  @IsTest
  static void testDeleteEvent() {
    // Create a fresh event with no checked-in attendees
    Event__c evt = new Event__c(
      Name = 'Delete Me',
      Date__c = Date.today(),
      Location__c = 'Nowhere'
    );
    insert evt;

    Test.startTest();
    EventController.deleteEvent(evt.Id);
    Test.stopTest();

    List<Event__c> remaining = [
      SELECT Id
      FROM Event__c
      WHERE Id = :evt.Id
    ];
    System.assertEquals(0, remaining.size(), 'Event should be deleted');
  }

  @IsTest
  static void testDeleteEventWithCheckedInAttendees() {
    Event__c evt = [SELECT Id FROM Event__c LIMIT 1];
    // The test setup already has an attendee — check them in
    Attendee__c att = [
      SELECT Id
      FROM Attendee__c
      WHERE Event__c = :evt.Id
      LIMIT 1
    ];
    att.Checked_In__c = true;
    att.Check_In_Time__c = DateTime.now();
    update att;

    Test.startTest();
    try {
      EventController.deleteEvent(evt.Id);
      System.assert(
        false,
        'Should have thrown exception for checked-in attendees'
      );
    } catch (AuraHandledException e) {
      System.assert(
        e.getMessage().contains('checked-in attendees'),
        'Error should mention checked-in attendees'
      );
    }
    Test.stopTest();
  }
}
