import { createElement } from "lwc";
import EventDetail from "c/eventDetail";
import getAttendeesByEvent from "@salesforce/apex/AttendeeController.getAttendeesByEvent";

// Mock Apex wire adapter
jest.mock(
  "@salesforce/apex/AttendeeController.getAttendeesByEvent",
  () => {
    const { createApexTestWireAdapter } = require("@salesforce/sfdx-lwc-jest");
    return { default: createApexTestWireAdapter(jest.fn()) };
  },
  { virtual: true }
);

// Mock imperative Apex methods
jest.mock(
  "@salesforce/apex/AttendeeController.toggleCheckIn",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/AttendeeController.checkInByQRCode",
  () => ({ default: jest.fn() }),
  { virtual: true }
);
jest.mock(
  "@salesforce/apex/AttendeeController.deleteAttendee",
  () => ({ default: jest.fn() }),
  { virtual: true }
);

// Mock LightningModal
jest.mock("c/attendeeFormModal", () => ({ default: { open: jest.fn() } }), {
  virtual: true
});

const mockEvent = {
  Id: "001000000000001",
  Name: "Test Conference",
  Date__c: "2024-03-15",
  Location__c: "Test Venue",
  Description__c: "Test description"
};

const mockAttendees = [
  {
    Id: "a01000000000001",
    Name: "Alice Johnson",
    Email__c: "alice@example.com",
    QR_Code__c: "EV001-ALICE-001",
    Checked_In__c: false,
    Check_In_Time__c: null
  },
  {
    Id: "a01000000000002",
    Name: "Bob Smith",
    Email__c: "bob@example.com",
    QR_Code__c: "EV001-BOB-002",
    Checked_In__c: true,
    Check_In_Time__c: "2024-03-15T09:30:00.000Z"
  }
];

function findByLabel(elements, label) {
  return Array.from(elements).find((el) => el.label === label);
}

describe("c-event-detail", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  function createComponent() {
    const element = createElement("c-event-detail", { is: EventDetail });
    element.event = mockEvent;
    document.body.appendChild(element);
    return element;
  }

  it("displays event name in card title", () => {
    const element = createComponent();
    getAttendeesByEvent.emit(mockAttendees);

    return Promise.resolve().then(() => {
      const cards = element.shadowRoot.querySelectorAll("lightning-card");
      const eventCard = Array.from(cards).find(
        (c) => c.title === "Test Conference"
      );
      expect(eventCard).toBeTruthy();
    });
  });

  it("displays back button", () => {
    const element = createComponent();
    getAttendeesByEvent.emit(mockAttendees);

    return Promise.resolve().then(() => {
      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const backBtn = findByLabel(buttons, "Back to Events");
      expect(backBtn).toBeTruthy();
    });
  });

  it("dispatches back event when back button clicked", () => {
    const element = createComponent();
    getAttendeesByEvent.emit(mockAttendees);
    const handler = jest.fn();
    element.addEventListener("back", handler);

    return Promise.resolve().then(() => {
      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const backBtn = findByLabel(buttons, "Back to Events");
      backBtn.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  it("renders attendee cards", () => {
    const element = createComponent();
    getAttendeesByEvent.emit(mockAttendees);

    return Promise.resolve().then(() => {
      const attendeeCards =
        element.shadowRoot.querySelectorAll("c-attendee-card");
      expect(attendeeCards.length).toBe(2);
    });
  });

  it("shows total and checked-in counts", () => {
    const element = createComponent();
    getAttendeesByEvent.emit(mockAttendees);

    return Promise.resolve().then(() => {
      const badges = element.shadowRoot.querySelectorAll("lightning-badge");
      const labels = Array.from(badges).map((b) => b.label);
      expect(labels).toContain("Total: 2");
      expect(labels).toContain("Checked In: 1");
    });
  });

  it("filters attendees by search term", () => {
    const element = createComponent();
    getAttendeesByEvent.emit(mockAttendees);

    return Promise.resolve()
      .then(() => {
        const inputs = element.shadowRoot.querySelectorAll("lightning-input");
        const searchInput = Array.from(inputs).find((i) => i.type === "search");
        searchInput.value = "alice";
        searchInput.dispatchEvent(
          new CustomEvent("change", {
            bubbles: true,
            composed: true
          })
        );
      })
      .then(() => {
        const attendeeCards =
          element.shadowRoot.querySelectorAll("c-attendee-card");
        expect(attendeeCards.length).toBe(1);
      });
  });

  it("shows Add Attendee button", () => {
    const element = createComponent();
    getAttendeesByEvent.emit(mockAttendees);

    return Promise.resolve().then(() => {
      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const addBtn = findByLabel(buttons, "Add Attendee");
      expect(addBtn).toBeTruthy();
    });
  });
});
