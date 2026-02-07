public with sharing class AttendeeController {
  @AuraEnabled(cacheable=true)
  public static List<Attendee__c> getAttendeesByEvent(Id eventId) {
    return [
      SELECT
        Id,
        Name,
        Email__c,
        QR_Code__c,
        Checked_In__c,
        Check_In_Time__c,
        Event__c
      FROM Attendee__c
      WHERE Event__c = :eventId
      ORDER BY Name ASC
    ];
  }

  @AuraEnabled
  public static Attendee__c addAttendee(Id eventId, String name, String email) {
    // Check for duplicate email within same event
    List<Attendee__c> existing = [
      SELECT Id
      FROM Attendee__c
      WHERE Event__c = :eventId AND Email__c = :email
      LIMIT 1
    ];
    if (!existing.isEmpty()) {
      AuraHandledException e = new AuraHandledException(
        'An attendee with this email already exists for this event.'
      );
      e.setMessage(
        'An attendee with this email already exists for this event.'
      );
      throw e;
    }

    // Generate QR code: EV{eventId}-{NAME}-{number}
    String nameUpper = name.toUpperCase().replaceAll('[^A-Z]', '');
    Integer attendeeCount = [
      SELECT COUNT()
      FROM Attendee__c
      WHERE Event__c = :eventId
    ];
    String qrCode =
      'EV' +
      eventId +
      '-' +
      nameUpper +
      '-' +
      String.valueOf(attendeeCount + 1).leftPad(3, '0');

    Attendee__c att = new Attendee__c(
      Event__c = eventId,
      Name = name,
      Email__c = email,
      QR_Code__c = qrCode,
      Checked_In__c = false
    );
    insert att;

    // Send QR code email to attendee
    Event__c evt = [
      SELECT Name, Date__c, Location__c
      FROM Event__c
      WHERE Id = :eventId
      LIMIT 1
    ];
    sendQRCodeEmail(att, evt);

    return att;
  }

  private static void sendQRCodeEmail(Attendee__c att, Event__c evt) {
    Messaging.SingleEmailMessage mail = new Messaging.SingleEmailMessage();
    mail.setToAddresses(new List<String>{ att.Email__c });
    mail.setSubject('Your QR Code for ' + evt.Name);
    mail.setSaveAsActivity(false);

    String formattedDate = evt.Date__c != null ? evt.Date__c.format() : 'TBD';
    String qrImageUrl =
      'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' +
      EncodingUtil.urlEncode(att.QR_Code__c, 'UTF-8');

    String body =
      '<html><body style="font-family: Arial, sans-serif; color: #333;">' +
      '<h2 style="color: #0176d3;">You\'re registered!</h2>' +
      '<p>Hi ' +
      att.Name.escapeHtml4() +
      ',</p>' +
      '<p>You have been registered for <strong>' +
      evt.Name.escapeHtml4() +
      '</strong>.</p>' +
      '<table style="margin: 16px 0; border-collapse: collapse;">' +
      '<tr><td style="padding: 4px 12px 4px 0; color: #706e6b;">Date</td>' +
      '<td style="padding: 4px 0;">' +
      formattedDate +
      '</td></tr>' +
      '<tr><td style="padding: 4px 12px 4px 0; color: #706e6b;">Location</td>' +
      '<td style="padding: 4px 0;">' +
      evt.Location__c.escapeHtml4() +
      '</td></tr>' +
      '</table>' +
      '<p>Please present this QR code at check-in:</p>' +
      '<div style="text-align: center; margin: 20px 0;">' +
      '<img src="' +
      qrImageUrl +
      '" alt="QR Code" width="200" height="200" ' +
      'style="border: 1px solid #e5e5e5; border-radius: 8px; padding: 8px; background: #fff;" />' +
      '<p style="font-family: monospace; font-size: 14px; color: #706e6b; margin-top: 8px;">' +
      att.QR_Code__c.escapeHtml4() +
      '</p>' +
      '</div>' +
      '<p style="font-size: 12px; color: #999; margin-top: 24px;">This is an automated message from Event Management.</p>' +
      '</body></html>';

    mail.setHtmlBody(body);

    // Plain text fallback
    String plainBody =
      'Hi ' +
      att.Name +
      ',\n\n' +
      'You have been registered for ' +
      evt.Name +
      '.\n\n' +
      'Date: ' +
      formattedDate +
      '\n' +
      'Location: ' +
      evt.Location__c +
      '\n\n' +
      'Your QR Code: ' +
      att.QR_Code__c +
      '\n\n' +
      'Please present this code at check-in.';
    mail.setPlainTextBody(plainBody);

    try {
      Messaging.sendEmail(new List<Messaging.SingleEmailMessage>{ mail });
    } catch (Exception e) {
      // Log but don't fail the attendee creation if email fails
      System.debug(
        LoggingLevel.ERROR,
        'Failed to send QR code email: ' + e.getMessage()
      );
    }
  }

  @AuraEnabled
  public static Attendee__c updateAttendee(
    Id attendeeId,
    String name,
    String email
  ) {
    Attendee__c att = [
      SELECT Id, Name, Email__c, Event__c
      FROM Attendee__c
      WHERE Id = :attendeeId
      LIMIT 1
    ];

    // Check for duplicate email if email changed
    if (email != att.Email__c) {
      List<Attendee__c> existing = [
        SELECT Id
        FROM Attendee__c
        WHERE
          Event__c = :att.Event__c
          AND Email__c = :email
          AND Id != :attendeeId
        LIMIT 1
      ];
      if (!existing.isEmpty()) {
        AuraHandledException e = new AuraHandledException(
          'An attendee with this email already exists for this event.'
        );
        e.setMessage(
          'An attendee with this email already exists for this event.'
        );
        throw e;
      }
    }

    att.Name = name;
    att.Email__c = email;
    update att;
    return att;
  }

  @AuraEnabled
  public static void deleteAttendee(Id attendeeId) {
    Attendee__c att = [
      SELECT Id
      FROM Attendee__c
      WHERE Id = :attendeeId
      LIMIT 1
    ];
    delete att;
  }

  @AuraEnabled
  public static Attendee__c checkInByQRCode(Id eventId, String qrCode) {
    List<Attendee__c> attendees = [
      SELECT Id, Name, Email__c, QR_Code__c, Checked_In__c, Check_In_Time__c
      FROM Attendee__c
      WHERE Event__c = :eventId AND QR_Code__c = :qrCode
      LIMIT 1
    ];

    if (attendees.isEmpty()) {
      AuraHandledException ex = new AuraHandledException(
        'No attendee found with this QR code.'
      );
      ex.setMessage('No attendee found with this QR code.');
      throw ex;
    }

    Attendee__c att = attendees[0];
    if (att.Checked_In__c) {
      String msg = att.Name + ' is already checked in.';
      AuraHandledException ex = new AuraHandledException(msg);
      ex.setMessage(msg);
      throw ex;
    }

    att.Checked_In__c = true;
    att.Check_In_Time__c = DateTime.now();
    update att;
    return att;
  }

  @AuraEnabled
  public static Attendee__c toggleCheckIn(Id attendeeId) {
    Attendee__c att = [
      SELECT Id, Name, Checked_In__c, Check_In_Time__c
      FROM Attendee__c
      WHERE Id = :attendeeId
      LIMIT 1
    ];

    att.Checked_In__c = !att.Checked_In__c;
    att.Check_In_Time__c = att.Checked_In__c ? DateTime.now() : null;
    update att;
    return att;
  }
}
