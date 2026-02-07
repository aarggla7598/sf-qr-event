import { createElement } from "lwc";
import AttendeeCard from "c/attendeeCard";

describe("c-attendee-card", () => {
  afterEach(() => {
    while (document.body.firstChild) {
      document.body.removeChild(document.body.firstChild);
    }
  });

  const mockAttendee = {
    Id: "a01000000000001",
    Name: "Alice Johnson",
    Email__c: "alice@example.com",
    QR_Code__c: "EV001-ALICEJOHNSON-001",
    Checked_In__c: false,
    Check_In_Time__c: null
  };

  const checkedInAttendee = {
    ...mockAttendee,
    Checked_In__c: true,
    Check_In_Time__c: "2024-03-15T09:30:00.000Z"
  };

  function createComponent(attendee, showQR = false) {
    const element = createElement("c-attendee-card", { is: AttendeeCard });
    element.attendee = attendee;
    element.showQR = showQR;
    document.body.appendChild(element);
    return element;
  }

  it("displays attendee name and email", () => {
    const element = createComponent(mockAttendee);
    return Promise.resolve().then(() => {
      const name = element.shadowRoot.querySelector("h3");
      expect(name.textContent).toBe("Alice Johnson");
      const spans = element.shadowRoot.querySelectorAll("span");
      const emailSpan = Array.from(spans).find(
        (s) => s.textContent === "alice@example.com"
      );
      expect(emailSpan).toBeTruthy();
    });
  });

  it("shows Not Checked In badge for unchecked attendee", () => {
    const element = createComponent(mockAttendee);
    return Promise.resolve().then(() => {
      const badge = element.shadowRoot.querySelector("lightning-badge");
      expect(badge.label).toBe("Not Checked In");
    });
  });

  it("shows Checked In badge for checked-in attendee", () => {
    const element = createComponent(checkedInAttendee);
    return Promise.resolve().then(() => {
      const badge = element.shadowRoot.querySelector("lightning-badge");
      expect(badge.label).toBe("Checked In");
    });
  });

  it("dispatches togglecheckin event", () => {
    const element = createComponent(mockAttendee);
    const handler = jest.fn();
    element.addEventListener("togglecheckin", handler);

    return Promise.resolve().then(() => {
      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const checkInBtn = Array.from(buttons).find(
        (b) => b.label === "Check In"
      );
      checkInBtn.click();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toBe(mockAttendee.Id);
    });
  });

  it("dispatches edit event", () => {
    const element = createComponent(mockAttendee);
    const handler = jest.fn();
    element.addEventListener("edit", handler);

    return Promise.resolve().then(() => {
      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const editBtn = Array.from(buttons).find((b) => b.label === "Edit");
      editBtn.click();
      expect(handler).toHaveBeenCalledTimes(1);
    });
  });

  it("dispatches delete event", () => {
    const element = createComponent(mockAttendee);
    const handler = jest.fn();
    element.addEventListener("delete", handler);

    return Promise.resolve().then(() => {
      const buttons = element.shadowRoot.querySelectorAll("lightning-button");
      const deleteBtn = Array.from(buttons).find((b) => b.label === "Delete");
      deleteBtn.click();
      expect(handler).toHaveBeenCalledTimes(1);
      expect(handler.mock.calls[0][0].detail).toBe(mockAttendee.Id);
    });
  });
});
