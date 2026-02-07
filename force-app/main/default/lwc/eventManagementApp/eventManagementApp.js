import { LightningElement, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import getEvents from "@salesforce/apex/EventController.getEvents";
import EventFormModal from "c/eventFormModal";

export default class EventManagementApp extends LightningElement {
  currentView = "list"; // 'list' or 'detail'
  selectedEvent = null;
  events = [];
  isLoading = true;

  _wiredEventsResult;

  @wire(getEvents)
  wiredEvents(result) {
    this._wiredEventsResult = result;
    this.isLoading = false;
    if (result.data) {
      this.events = result.data;
    } else if (result.error) {
      this.showToast("Error", "Failed to load events", "error");
    }
  }

  get isListView() {
    return this.currentView === "list";
  }

  get isDetailView() {
    return this.currentView === "detail";
  }

  async handleNewEvent() {
    const result = await EventFormModal.open({
      size: "small"
    });

    if (result) {
      if (result.error) {
        this.showToast("Error", result.error, "error");
      } else {
        this.showToast("Success", "Event created successfully", "success");
        await refreshApex(this._wiredEventsResult);
      }
    }
  }

  handleSelectEvent(event) {
    const eventId = event.detail;
    this.selectedEvent = this.events.find((e) => e.Id === eventId);
    this.currentView = "detail";
  }

  async handleBackToList() {
    this.currentView = "list";
    this.selectedEvent = null;
    await refreshApex(this._wiredEventsResult);
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }
}
