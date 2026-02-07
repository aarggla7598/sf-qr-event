import { createElement } from "lwc";
import EventList from "c/eventList";

describe("c-event-list", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  const mockEvents = [
    {
      Id: "001000000000001",
      Name: "Event 1",
      Date__c: "2024-03-15",
      Location__c: "Venue 1",
      Attendees__r: []
    },
    {
      Id: "001000000000002",
      Name: "Event 2",
      Date__c: "2024-03-20",
      Location__c: "Venue 2",
      Attendees__r: []
    }
  ];

  it("renders event cards when events provided", () => {
    const element = createElement("c-event-list", { is: EventList });
    element.events = mockEvents;
    document.body.appendChild(element);

    return Promise.resolve().then(() => {
      const cards = element.shadowRoot.querySelectorAll("c-event-card");
      expect(cards.length).toBe(2);
    });
  });

  it("renders empty state when no events", () => {
    const element = createElement("c-event-list", { is: EventList });
    element.events = [];
    document.body.appendChild(element);

    return Promise.resolve().then(() => {
      const cards = element.shadowRoot.querySelectorAll("c-event-card");
      expect(cards.length).toBe(0);
      const emptyText = element.shadowRoot.querySelector(
        ".slds-text-heading_small"
      );
      expect(emptyText.textContent).toBe("No events yet");
    });
  });

  it("bubbles selectevent from child card", () => {
    const element = createElement("c-event-list", { is: EventList });
    element.events = mockEvents;
    document.body.appendChild(element);

    const handler = jest.fn();
    element.addEventListener("selectevent", handler);

    return Promise.resolve().then(() => {
      const card = element.shadowRoot.querySelector("c-event-card");
      card.dispatchEvent(
        new CustomEvent("select", { detail: "001000000000001" })
      );
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });
});
