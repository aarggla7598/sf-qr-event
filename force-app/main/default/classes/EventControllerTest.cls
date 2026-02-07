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
}
