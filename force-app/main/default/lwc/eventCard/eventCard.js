import { LightningElement, api } from "lwc";

export default class EventCard extends LightningElement {
  @api event;

  get formattedDate() {
    if (!this.event?.Date__c) return "";
    const d = new Date(this.event.Date__c + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  get attendeeCountLabel() {
    const count = this.event?.Attendees__r?.length || 0;
    return count + (count === 1 ? " Attendee" : " Attendees");
  }

  get statusLabel() {
    return this.event?.Status__c || "Active";
  }

  get statusBadgeClass() {
    const status = (this.event?.Status__c || "Active").toLowerCase();
    return "status-badge status-" + status;
  }

  handleClick() {
    this.dispatchEvent(new CustomEvent("select", { detail: this.event.Id }));
  }
}
