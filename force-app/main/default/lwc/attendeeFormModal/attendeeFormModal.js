import { api } from "lwc";
import LightningModal from "lightning/modal";
import addAttendee from "@salesforce/apex/AttendeeController.addAttendee";
import updateAttendee from "@salesforce/apex/AttendeeController.updateAttendee";

export default class AttendeeFormModal extends LightningModal {
  @api mode = "add"; // 'add' or 'edit'
  @api eventId;
  @api attendee;

  name = "";
  email = "";
  _initialized = false;

  connectedCallback() {
    if (this.mode === "edit" && this.attendee && !this._initialized) {
      this.name = this.attendee.Name;
      this.email = this.attendee.Email__c;
      this._initialized = true;
    }
  }

  get modalTitle() {
    return this.mode === "edit" ? "Edit Attendee" : "Add Attendee";
  }

  get submitLabel() {
    return this.mode === "edit" ? "Save Changes" : "Add Attendee";
  }

  handleNameChange(event) {
    this.name = event.target.value;
  }

  handleEmailChange(event) {
    this.email = event.target.value;
  }

  handleCancel() {
    this.close();
  }

  async handleSubmit() {
    if (!this.name || !this.email) {
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.email)) {
      return;
    }

    try {
      let result;
      if (this.mode === "edit") {
        result = await updateAttendee({
          attendeeId: this.attendee.Id,
          name: this.name,
          email: this.email
        });
      } else {
        result = await addAttendee({
          eventId: this.eventId,
          name: this.name,
          email: this.email
        });
      }
      this.close(result);
    } catch (error) {
      this.close({ error: error.body?.message || "Operation failed" });
    }
  }
}
