import { createElement } from "lwc";
import EventCard from "c/eventCard";

describe("c-event-card", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  function createComponent(event) {
    const element = createElement("c-event-card", { is: EventCard });
    element.event = event;
    document.body.appendChild(element);
    return element;
  }

  const mockEvent = {
    Id: "001000000000001",
    Name: "Test Conference",
    Date__c: "2024-03-15",
    Location__c: "Test Venue",
    Description__c: "A test description",
    Attendees__r: [{ Id: "a01" }, { Id: "a02" }]
  };

  it("displays event name", () => {
    const element = createComponent(mockEvent);
    return Promise.resolve().then(() => {
      const heading = element.shadowRoot.querySelector("h2");
      expect(heading.textContent).toBe("Test Conference");
    });
  });

  it("displays location", () => {
    const element = createComponent(mockEvent);
    return Promise.resolve().then(() => {
      const spans = element.shadowRoot.querySelectorAll("span");
      const locationSpan = Array.from(spans).find(
        (s) => s.textContent === "Test Venue"
      );
      expect(locationSpan).toBeTruthy();
    });
  });

  it("displays attendee count badge", () => {
    const element = createComponent(mockEvent);
    return Promise.resolve().then(() => {
      const badge = element.shadowRoot.querySelector("lightning-badge");
      expect(badge.label).toBe("2 Attendees");
    });
  });

  it("displays singular attendee label for 1 attendee", () => {
    const singleAttendeeEvent = { ...mockEvent, Attendees__r: [{ Id: "a01" }] };
    const element = createComponent(singleAttendeeEvent);
    return Promise.resolve().then(() => {
      const badge = element.shadowRoot.querySelector("lightning-badge");
      expect(badge.label).toBe("1 Attendee");
    });
  });

  it("dispatches select event on click", () => {
    const element = createComponent(mockEvent);
    const handler = jest.fn();
    element.addEventListener("select", handler);

    return Promise.resolve().then(() => {
      const cardContent = element.shadowRoot.querySelector(".card-content");
      cardContent.click();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toBe(mockEvent.Id);
    });
  });

  it("displays description when provided", () => {
    const element = createComponent(mockEvent);
    return Promise.resolve().then(() => {
      const desc = element.shadowRoot.querySelector(".description-text");
      expect(desc).toBeTruthy();
      expect(desc.textContent).toBe("A test description");
    });
  });
});
