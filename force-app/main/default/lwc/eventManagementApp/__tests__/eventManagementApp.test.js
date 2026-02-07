import { createElement } from "lwc";
import EventManagementApp from "c/eventManagementApp";
import getEvents from "@salesforce/apex/EventController.getEvents";

// Mock Apex wire adapter
jest.mock(
  "@salesforce/apex/EventController.getEvents",
  () => {
    const { createApexTestWireAdapter } = require("@salesforce/sfdx-lwc-jest");
    return { default: createApexTestWireAdapter(jest.fn()) };
  },
  { virtual: true }
);

// Mock EventFormModal
jest.mock("c/eventFormModal", () => ({ default: { open: jest.fn() } }), {
  virtual: true
});

const mockEvents = [
  {
    Id: "001000000000001",
    Name: "Test Conference",
    Date__c: "2024-03-15",
    Location__c: "Test Venue",
    Description__c: "Test description",
    Attendees__r: [{ Id: "a01" }]
  },
  {
    Id: "001000000000002",
    Name: "Workshop",
    Date__c: "2024-03-20",
    Location__c: "Online",
    Description__c: "Workshop desc",
    Attendees__r: []
  }
];

describe("c-event-management-app", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  it("renders event list after data loads", () => {
    const element = createElement("c-event-management-app", {
      is: EventManagementApp
    });
    document.body.appendChild(element);

    getEvents.emit(mockEvents);

    return Promise.resolve().then(() => {
      const eventList = element.shadowRoot.querySelector("c-event-list");
      expect(eventList).toBeTruthy();
      const eventDetail = element.shadowRoot.querySelector("c-event-detail");
      expect(eventDetail).toBeFalsy();
    });
  });

  it("shows header with New Event button", () => {
    const element = createElement("c-event-management-app", {
      is: EventManagementApp
    });
    document.body.appendChild(element);

    getEvents.emit(mockEvents);

    return Promise.resolve().then(() => {
      const heading = element.shadowRoot.querySelector("h1");
      expect(heading.textContent).toContain("Event Management");
      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const newEventBtn = Array.from(buttons).find(
        (b) => b.label === "New Event"
      );
      expect(newEventBtn).toBeTruthy();
    });
  });

  it("switches to detail view on event select", () => {
    const element = createElement("c-event-management-app", {
      is: EventManagementApp
    });
    document.body.appendChild(element);

    getEvents.emit(mockEvents);

    return Promise.resolve()
      .then(() => {
        const eventList = element.shadowRoot.querySelector("c-event-list");
        eventList.dispatchEvent(
          new CustomEvent("selectevent", { detail: "001000000000001" })
        );
      })
      .then(() => {
        const eventDetail = element.shadowRoot.querySelector("c-event-detail");
        expect(eventDetail).toBeTruthy();
        const eventList = element.shadowRoot.querySelector("c-event-list");
        expect(eventList).toBeFalsy();
      });
  });
});
