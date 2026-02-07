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
        (SELECT Id FROM Attendees__r)
      FROM Event__c
      ORDER BY Date__c ASC
    ];
  }

  @AuraEnabled(cacheable=true)
  public static Event__c getEventById(Id eventId) {
    return [
      SELECT Id, Name, Date__c, Location__c, Description__c
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
      Description__c = description
    );
    insert evt;
    return evt;
  }
}
