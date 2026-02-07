import { api } from "lwc";
import LightningModal from "lightning/modal";
import createEvent from "@salesforce/apex/EventController.createEvent";

export default class EventFormModal extends LightningModal {
  @api label = "Create New Event";

  name = "";
  eventDate = "";
  location = "";
  description = "";

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

  handleCancel() {
    this.close();
  }

  async handleCreate() {
    if (!this.name || !this.eventDate || !this.location) {
      return;
    }

    try {
      const result = await createEvent({
        name: this.name,
        eventDate: this.eventDate,
        location: this.location,
        description: this.description || null
      });
      this.close(result);
    } catch (error) {
      this.close({ error: error.body?.message || "Failed to create event" });
    }
  }
}
