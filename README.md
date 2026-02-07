# SF QR Event - Salesforce Event Management with QR Check-in

A Salesforce Lightning Web Components (LWC) application for managing events and attendees with QR code-based check-in. Built on Salesforce Platform (API v65.0).

## Features

- Create and manage events with date, location, and description
- Register attendees with automatic QR code generation
- Email attendees their unique QR code upon registration
- Check in attendees by scanning/entering their QR code
- Manual check-in toggle with timestamps
- Real-time attendance tracking and search/filter
- Client-side QR code rendering (SVG) via qrcodejs library

## Project Structure

```
force-app/main/default/
├── classes/            # Apex controllers + tests
├── lwc/
│   ├── eventManagementApp/   # Root app component
│   ├── eventList/            # Event grid view
│   ├── eventCard/            # Single event card
│   ├── eventDetail/          # Event detail + attendee management
│   ├── eventFormModal/       # Create event modal
│   ├── attendeeCard/         # Single attendee card
│   ├── attendeeFormModal/    # Add/edit attendee modal
│   └── qrCodeDisplay/       # QR code SVG renderer
├── objects/
│   ├── Event__c/             # Custom event object
│   └── Attendee__c/          # Custom attendee object (Master-Detail to Event)
├── permissionsets/           # Event_Management_User permission set
├── staticresources/          # qrcodejs library
├── flexipages/               # App home page layout
└── tabs/                     # Event Management tab
```

## Setup & Deployment

### Prerequisites

- [Salesforce CLI (sf)](https://developer.salesforce.com/tools/salesforcecli)
- A Salesforce org (scratch org or sandbox)
- Node.js (for LWC Jest tests and dev tooling)

### Deploy to an Org

```bash
# Authenticate to your org
sf org login web --alias my-org

# Deploy all metadata
sf project deploy start --target-org my-org

# Assign the permission set to your user
sf org assign permset --name Event_Management_User --target-org my-org
```

### Scratch Org Setup

```bash
# Create a scratch org
sf org create scratch --definition-file config/project-scratch-def.json --alias pss-scratch --duration-days 30

# Push source
sf project deploy start --target-org pss-scratch

# Assign permission set
sf org assign permset --name Event_Management_User --target-org pss-scratch

# (Optional) Load sample data
sf apex run --file scripts/apex/seed-data.apex --target-org pss-scratch

# Open the org
sf org open --target-org pss-scratch
```

### Run Tests

```bash
# Apex tests
sf apex run test --target-org my-org --wait 10

# LWC Jest tests
npm install
npm test
```

## QR Code System

### How QR Codes Are Generated

When an attendee is registered via **Add Attendee**, the system automatically generates a unique QR code string using this format:

```
EV{eventId}-{NAME}-{number}
```

- `{eventId}` - The Salesforce record ID of the event
- `{NAME}` - Alphabetic characters from the attendee's name, uppercased
- `{number}` - A sequential counter (padded to 3 digits) based on existing attendees for that event

**Example:** `EV001000000000001-ALICEJOHNSON-001`

This happens in `AttendeeController.addAttendee()` — the QR code is stored in the `QR_Code__c` field on the `Attendee__c` record.

### QR Code Email Delivery

Immediately after registration, the attendee receives an HTML email containing:

- Event name, date, and location
- A visual QR code image generated via the [qrserver.com API](https://goqr.me/api/)
- The raw QR code string as fallback text

The email uses this endpoint to render the QR image:

```
https://api.qrserver.com/v1/create-qr-code/?size=200x200&data={encoded_qr_code}
```

If the email fails to send (e.g., sandbox restrictions), the attendee record is still created successfully — email delivery does not block registration.

### QR Code Display in the App

In the event detail view, staff can toggle QR code visibility with the eye icon. When enabled, each attendee card renders a QR code using the **qrCodeDisplay** LWC component, which:

1. Loads the `qrcodejs` static resource (JavaScript library)
2. Generates an SVG QR code client-side
3. Displays it at a configurable size (default 200px)

This is a purely client-side render — no external API calls are made for in-app display.

### Check-in via QR Code

There are two ways to check in attendees:

**1. QR Scanner Mode**

1. In the event detail view, switch to QR Scanner mode
2. Scan the attendee's QR code with a barcode/QR scanner device (the scanner types the decoded string into the input field)
3. Alternatively, manually type or paste the QR code string
4. Click **Check In**
5. The system matches the QR code to the attendee, marks them as checked in, and records the timestamp

**2. Manual Check-in**

- Click the **Check In** button directly on any attendee's card
- The check-in status can be toggled (checked in / not checked in)

### QR Code Data Model

| Field         | API Name           | Type       | Description                              |
| ------------- | ------------------ | ---------- | ---------------------------------------- |
| QR Code       | `QR_Code__c`       | Text (255) | Auto-generated unique QR code string     |
| Checked In    | `Checked_In__c`    | Checkbox   | Whether the attendee has been checked in |
| Check In Time | `Check_In_Time__c` | DateTime   | Timestamp of when check-in occurred      |

## Custom Objects

### Event\_\_c

| Field       | API Name         | Type           | Required |
| ----------- | ---------------- | -------------- | -------- |
| Event Name  | `Name`           | Text           | Yes      |
| Date        | `Date__c`        | Date           | Yes      |
| Location    | `Location__c`    | Text (255)     | Yes      |
| Description | `Description__c` | Long Text Area | No       |

### Attendee**c (Master-Detail to Event**c)

| Field         | API Name           | Type          | Required            |
| ------------- | ------------------ | ------------- | ------------------- |
| Attendee Name | `Name`             | Text          | Yes                 |
| Email         | `Email__c`         | Email         | Yes                 |
| Event         | `Event__c`         | Master-Detail | Yes                 |
| QR Code       | `QR_Code__c`       | Text (255)    | No (auto-generated) |
| Checked In    | `Checked_In__c`    | Checkbox      | No                  |
| Check In Time | `Check_In_Time__c` | DateTime      | No                  |

## Development

### Code Quality

The project includes pre-commit hooks (Husky) that run:

- **Prettier** formatting (Apex + LWC + XML)
- **ESLint** on LWC components
- **Jest** tests with coverage

### Seed Data

Load sample events and attendees for development:

```bash
sf apex run --file scripts/apex/seed-data.apex --target-org my-org
```

This creates 3 sample events and 5 attendees with pre-generated QR codes.
