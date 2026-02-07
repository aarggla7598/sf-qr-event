public with sharing class EventController {
  @AuraEnabled(cacheable=true)
  public static List<Event__c> getEvents() {
    return [
      SELECT
        Id,
        Name,
        Date__c,
        Location__c,
        Description__c,
        Status__c,
        (SELECT Id FROM Attendees__r)
      FROM Event__c
      ORDER BY Date__c ASC
    ];
  }

  @AuraEnabled(cacheable=true)
  public static Event__c getEventById(Id eventId) {
    return [
      SELECT Id, Name, Date__c, Location__c, Description__c, Status__c
      FROM Event__c
      WHERE Id = :eventId
      LIMIT 1
    ];
  }

  @AuraEnabled
  public static Event__c createEvent(
    String name,
    Date eventDate,
    String location,
    String description
  ) {
    Event__c evt = new Event__c(
      Name = name,
      Date__c = eventDate,
      Location__c = location,
      Description__c = description,
      Status__c = 'Active'
    );
    insert evt;
    return evt;
  }

  @AuraEnabled
  public static Event__c updateEvent(
    Id eventId,
    String name,
    Date eventDate,
    String location,
    String description,
    String status
  ) {
    Event__c evt = [
      SELECT Id
      FROM Event__c
      WHERE Id = :eventId
      LIMIT 1
    ];
    evt.Name = name;
    evt.Date__c = eventDate;
    evt.Location__c = location;
    evt.Description__c = description;
    evt.Status__c = status;
    update evt;
    return evt;
  }

  @AuraEnabled
  public static void deleteEvent(Id eventId) {
    // Check for checked-in attendees
    List<Attendee__c> checkedIn = [
      SELECT Id
      FROM Attendee__c
      WHERE Event__c = :eventId AND Checked_In__c = TRUE
      LIMIT 1
    ];
    if (!checkedIn.isEmpty()) {
      AuraHandledException e = new AuraHandledException(
        'Cannot delete an event that has checked-in attendees.'
      );
      e.setMessage('Cannot delete an event that has checked-in attendees.');
      throw e;
    }
    Event__c evt = [
      SELECT Id
      FROM Event__c
      WHERE Id = :eventId
      LIMIT 1
    ];
    delete evt;
  }
}
