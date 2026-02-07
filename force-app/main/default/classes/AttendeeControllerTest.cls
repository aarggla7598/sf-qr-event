@IsTest
private class AttendeeControllerTest {
  @TestSetup
  static void setup() {
    Event__c evt = new Event__c(
      Name = 'Test Conference',
      Date__c = Date.today().addDays(30),
      Location__c = 'Test Venue',
      Description__c = 'Test description'
    );
    insert evt;
  }

  static Event__c getEvent() {
    return [SELECT Id FROM Event__c LIMIT 1];
  }

  @IsTest
  static void testAddAttendee() {
    Event__c evt = getEvent();

    Test.startTest();
    Attendee__c att = AttendeeController.addAttendee(
      evt.Id,
      'Alice Johnson',
      'alice@example.com'
    );
    Test.stopTest();

    System.assertNotEquals(null, att.Id);
    System.assertEquals('Alice Johnson', att.Name);
    System.assertEquals('alice@example.com', att.Email__c);
    System.assert(
      att.QR_Code__c.startsWith('EV'),
      'QR code should start with EV'
    );
    System.assertEquals(false, att.Checked_In__c);
  }

  @IsTest
  static void testAddAttendeeDuplicateEmail() {
    Event__c evt = getEvent();
    AttendeeController.addAttendee(
      evt.Id,
      'Alice Johnson',
      'alice@example.com'
    );

    Test.startTest();
    try {
      AttendeeController.addAttendee(
        evt.Id,
        'Alice Duplicate',
        'alice@example.com'
      );
      System.assert(false, 'Should have thrown exception for duplicate email');
    } catch (AuraHandledException e) {
      System.assert(
        e.getMessage().contains('already exists'),
        'Error should mention duplicate'
      );
    }
    Test.stopTest();
  }

  @IsTest
  static void testGetAttendeesByEvent() {
    Event__c evt = getEvent();
    AttendeeController.addAttendee(
      evt.Id,
      'Alice Johnson',
      'alice@example.com'
    );
    AttendeeController.addAttendee(evt.Id, 'Bob Smith', 'bob@example.com');

    Test.startTest();
    List<Attendee__c> attendees = AttendeeController.getAttendeesByEvent(
      evt.Id
    );
    Test.stopTest();

    System.assertEquals(2, attendees.size());
  }

  @IsTest
  static void testUpdateAttendee() {
    Event__c evt = getEvent();
    Attendee__c att = AttendeeController.addAttendee(
      evt.Id,
      'Alice Johnson',
      'alice@example.com'
    );

    Test.startTest();
    Attendee__c updated = AttendeeController.updateAttendee(
      att.Id,
      'Alice Smith',
      'alice.smith@example.com'
    );
    Test.stopTest();

    System.assertEquals('Alice Smith', updated.Name);
    System.assertEquals('alice.smith@example.com', updated.Email__c);
  }

  @IsTest
  static void testUpdateAttendeeDuplicateEmail() {
    Event__c evt = getEvent();
    AttendeeController.addAttendee(
      evt.Id,
      'Alice Johnson',
      'alice@example.com'
    );
    Attendee__c bob = AttendeeController.addAttendee(
      evt.Id,
      'Bob Smith',
      'bob@example.com'
    );

    Test.startTest();
    try {
      AttendeeController.updateAttendee(
        bob.Id,
        'Bob Smith',
        'alice@example.com'
      );
      System.assert(false, 'Should have thrown exception for duplicate email');
    } catch (AuraHandledException e) {
      System.assert(e.getMessage().contains('already exists'));
    }
    Test.stopTest();
  }

  @IsTest
  static void testDeleteAttendee() {
    Event__c evt = getEvent();
    Attendee__c att = AttendeeController.addAttendee(
      evt.Id,
      'Alice Johnson',
      'alice@example.com'
    );

    Test.startTest();
    AttendeeController.deleteAttendee(att.Id);
    Test.stopTest();

    List<Attendee__c> remaining = [
      SELECT Id
      FROM Attendee__c
      WHERE Event__c = :evt.Id
    ];
    System.assertEquals(0, remaining.size());
  }

  @IsTest
  static void testCheckInByQRCode() {
    Event__c evt = getEvent();
    Attendee__c att = AttendeeController.addAttendee(
      evt.Id,
      'Alice Johnson',
      'alice@example.com'
    );

    Test.startTest();
    Attendee__c checkedIn = AttendeeController.checkInByQRCode(
      evt.Id,
      att.QR_Code__c
    );
    Test.stopTest();

    System.assertEquals(true, checkedIn.Checked_In__c);
    System.assertNotEquals(null, checkedIn.Check_In_Time__c);
  }

  @IsTest
  static void testCheckInByQRCodeInvalidCode() {
    Event__c evt = getEvent();

    Test.startTest();
    try {
      AttendeeController.checkInByQRCode(evt.Id, 'INVALID-CODE');
      System.assert(false, 'Should have thrown exception for invalid QR code');
    } catch (AuraHandledException e) {
      System.assert(e.getMessage().contains('No attendee found'));
    }
    Test.stopTest();
  }

  @IsTest
  static void testCheckInByQRCodeDuplicate() {
    Event__c evt = getEvent();
    Attendee__c att = AttendeeController.addAttendee(
      evt.Id,
      'Alice Johnson',
      'alice@example.com'
    );
    AttendeeController.checkInByQRCode(evt.Id, att.QR_Code__c);

    Test.startTest();
    try {
      AttendeeController.checkInByQRCode(evt.Id, att.QR_Code__c);
      System.assert(
        false,
        'Should have thrown exception for duplicate check-in'
      );
    } catch (AuraHandledException e) {
      System.assert(e.getMessage().contains('already checked in'));
    }
    Test.stopTest();
  }

  @IsTest
  static void testToggleCheckIn() {
    Event__c evt = getEvent();
    Attendee__c att = AttendeeController.addAttendee(
      evt.Id,
      'Alice Johnson',
      'alice@example.com'
    );

    Test.startTest();
    // Check in
    Attendee__c toggled = AttendeeController.toggleCheckIn(att.Id);
    System.assertEquals(true, toggled.Checked_In__c);
    System.assertNotEquals(null, toggled.Check_In_Time__c);

    // Check out
    Attendee__c toggledBack = AttendeeController.toggleCheckIn(att.Id);
    System.assertEquals(false, toggledBack.Checked_In__c);
    System.assertEquals(null, toggledBack.Check_In_Time__c);
    Test.stopTest();
  }
}
