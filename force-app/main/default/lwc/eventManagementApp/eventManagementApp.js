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
  statusFilter = "Active";

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

  get statusFilterOptions() {
    return [
      { label: "All", value: "All" },
      { label: "Active", value: "Active" },
      { label: "Draft", value: "Draft" },
      { label: "Completed", value: "Completed" },
      { label: "Cancelled", value: "Cancelled" }
    ];
  }

  get filteredEvents() {
    if (this.statusFilter === "All") {
      return this.events;
    }
    return this.events.filter((e) => {
      const status = e.Status__c || "Active";
      return status === this.statusFilter;
    });
  }

  handleStatusFilterChange(event) {
    this.statusFilter = event.detail.value;
  }

  async handleNewEvent() {
    const result = await EventFormModal.open({
      size: "small",
      mode: "create"
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

  async handleEditEvent(event) {
    const eventData = event.detail;
    const result = await EventFormModal.open({
      size: "small",
      mode: "edit",
      event: eventData
    });

    if (result) {
      if (result.error) {
        this.showToast("Error", result.error, "error");
      } else {
        this.showToast("Success", "Event updated successfully", "success");
        await refreshApex(this._wiredEventsResult);
        // Update selectedEvent with fresh wired data
        if (this._wiredEventsResult.data) {
          this.selectedEvent =
            this._wiredEventsResult.data.find((e) => e.Id === eventData.Id) ||
            result;
        }
      }
    }
  }

  async handleDeleteEvent() {
    this.currentView = "list";
    this.selectedEvent = null;
    await refreshApex(this._wiredEventsResult);
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }
}
