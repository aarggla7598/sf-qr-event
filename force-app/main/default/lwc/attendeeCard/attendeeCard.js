import { LightningElement, api } from "lwc";

export default class AttendeeCard extends LightningElement {
  @api attendee;
  @api showQR = false;

  get checkInStatusLabel() {
    return this.attendee?.Checked_In__c ? "Checked In" : "Not Checked In";
  }

  get checkInBadgeClass() {
    return this.attendee?.Checked_In__c
      ? "checked-in-badge"
      : "not-checked-in-badge";
  }

  get checkInButtonVariant() {
    return this.attendee?.Checked_In__c ? "success" : "neutral";
  }

  get checkInButtonLabel() {
    return this.attendee?.Checked_In__c ? "Checked In" : "Check In";
  }

  get checkInIcon() {
    return this.attendee?.Checked_In__c
      ? "utility:check"
      : "utility:toggle_off";
  }

  get formattedCheckInTime() {
    if (!this.attendee?.Check_In_Time__c) return "";
    const d = new Date(this.attendee.Check_In_Time__c);
    return d.toLocaleString();
  }

  handleToggleCheckIn() {
    this.dispatchEvent(
      new CustomEvent("togglecheckin", { detail: this.attendee.Id })
    );
  }

  handleEdit() {
    this.dispatchEvent(new CustomEvent("edit", { detail: this.attendee }));
  }

  handleDelete() {
    this.dispatchEvent(new CustomEvent("delete", { detail: this.attendee.Id }));
  }
}
