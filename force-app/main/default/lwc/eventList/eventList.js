import { LightningElement, api } from "lwc";

export default class EventList extends LightningElement {
  @api events = [];

  get hasEvents() {
    return this.events && this.events.length > 0;
  }

  handleSelectEvent(event) {
    this.dispatchEvent(
      new CustomEvent("selectevent", { detail: event.detail })
    );
  }
}
