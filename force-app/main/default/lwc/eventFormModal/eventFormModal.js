import { api } from "lwc";
import LightningModal from "lightning/modal";
import createEvent from "@salesforce/apex/EventController.createEvent";
import updateEvent from "@salesforce/apex/EventController.updateEvent";

export default class EventFormModal extends LightningModal {
  @api mode = "create"; // 'create' or 'edit'
  @api event;

  name = "";
  eventDate = "";
  location = "";
  description = "";
  status = "Active";
  _initialized = false;

  connectedCallback() {
    if (this.mode === "edit" && this.event && !this._initialized) {
      this.name = this.event.Name || "";
      this.eventDate = this.event.Date__c || "";
      this.location = this.event.Location__c || "";
      this.description = this.event.Description__c || "";
      this.status = this.event.Status__c || "Active";
      this._initialized = true;
    }
  }

  get modalTitle() {
    return this.mode === "edit" ? "Edit Event" : "Create New Event";
  }

  get submitLabel() {
    return this.mode === "edit" ? "Save Changes" : "Create Event";
  }

  get isEditMode() {
    return this.mode === "edit";
  }

  get statusOptions() {
    return [
      { label: "Draft", value: "Draft" },
      { label: "Active", value: "Active" },
      { label: "Completed", value: "Completed" },
      { label: "Cancelled", value: "Cancelled" }
    ];
  }

  handleNameChange(event) {
    this.name = event.target.value;
  }

  handleDateChange(event) {
    this.eventDate = event.target.value;
  }

  handleLocationChange(event) {
    this.location = event.target.value;
  }

  handleDescriptionChange(event) {
    this.description = event.target.value;
  }

  handleStatusChange(event) {
    this.status = event.detail.value;
  }

  handleCancel() {
    this.close();
  }

  async handleSubmit() {
    if (!this.name || !this.eventDate || !this.location) {
      return;
    }

    try {
      let result;
      if (this.mode === "edit") {
        result = await updateEvent({
          eventId: this.event.Id,
          name: this.name,
          eventDate: this.eventDate,
          location: this.location,
          description: this.description || null,
          status: this.status
        });
      } else {
        result = await createEvent({
          name: this.name,
          eventDate: this.eventDate,
          location: this.location,
          description: this.description || null
        });
      }
      this.close(result);
    } catch (error) {
      this.close({ error: error.body?.message || "Operation failed" });
    }
  }
}
