import { LightningElement, api, wire } from "lwc";
import { ShowToastEvent } from "lightning/platformShowToastEvent";
import { refreshApex } from "@salesforce/apex";
import getAttendeesByEvent from "@salesforce/apex/AttendeeController.getAttendeesByEvent";
import toggleCheckIn from "@salesforce/apex/AttendeeController.toggleCheckIn";
import checkInByQRCode from "@salesforce/apex/AttendeeController.checkInByQRCode";
import deleteAttendee from "@salesforce/apex/AttendeeController.deleteAttendee";
import deleteEvent from "@salesforce/apex/EventController.deleteEvent";
import AttendeeFormModal from "c/attendeeFormModal";

export default class EventDetail extends LightningElement {
  @api event;

  searchTerm = "";
  showQR = false;
  checkInMode = false;
  scannedCode = "";
  useCameraScanner = false;

  _wiredAttendeesResult;
  attendees = [];

  @wire(getAttendeesByEvent, { eventId: "$eventId" })
  wiredAttendees(result) {
    this._wiredAttendeesResult = result;
    if (result.data) {
      this.attendees = result.data;
    } else if (result.error) {
      this.showToast("Error", "Failed to load attendees", "error");
    }
  }

  get eventId() {
    return this.event?.Id;
  }

  get formattedDate() {
    if (!this.event?.Date__c) return "";
    const d = new Date(this.event.Date__c + "T00:00:00");
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }

  get hasAttendees() {
    return this.attendees && this.attendees.length > 0;
  }

  get filteredAttendees() {
    if (!this.searchTerm) return this.attendees;
    const term = this.searchTerm.toLowerCase();
    return this.attendees.filter(
      (a) =>
        a.Name.toLowerCase().includes(term) ||
        (a.Email__c || "").toLowerCase().includes(term)
    );
  }

  get noSearchResults() {
    return this.searchTerm && this.filteredAttendees.length === 0;
  }

  get totalCountLabel() {
    return "Total: " + (this.attendees?.length || 0);
  }

  get checkedInCountLabel() {
    const count = this.attendees?.filter((a) => a.Checked_In__c).length || 0;
    return "Checked In: " + count;
  }

  get qrToggleIcon() {
    return this.showQR ? "utility:hide" : "utility:preview";
  }

  get checkInModeLabel() {
    return this.checkInMode ? "Close Scanner" : "QR Scanner";
  }

  get checkInModeVariant() {
    return this.checkInMode ? "brand" : "neutral";
  }

  get isEventActive() {
    const status = this.event?.Status__c || "Active";
    return status === "Active" || status === "Draft";
  }

  get disableCheckIn() {
    return !this.isEventActive;
  }

  get cameraScannerLabel() {
    return this.useCameraScanner ? "Use Text Input" : "Use Camera";
  }

  get showTextInput() {
    return !this.useCameraScanner;
  }

  get showCameraScanner() {
    return this.useCameraScanner;
  }

  get hasFilteredAttendees() {
    return this.filteredAttendees && this.filteredAttendees.length > 0;
  }

  handleBack() {
    this.dispatchEvent(new CustomEvent("back"));
  }

  handleSearchChange(event) {
    this.searchTerm = event.target.value;
  }

  handleToggleQR() {
    this.showQR = !this.showQR;
  }

  handleToggleCheckInMode() {
    this.checkInMode = !this.checkInMode;
    this.scannedCode = "";
    this.useCameraScanner = false;
  }

  handleToggleCameraScanner() {
    this.useCameraScanner = !this.useCameraScanner;
  }

  handleScannedCodeChange(event) {
    this.scannedCode = event.target.value;
  }

  handleCameraScan(event) {
    this.scannedCode = event.detail;
    this.handleScanCheckIn();
  }

  async handleScanCheckIn() {
    if (!this.scannedCode) {
      this.showToast("Error", "Please enter a QR code", "error");
      return;
    }

    try {
      const result = await checkInByQRCode({
        eventId: this.eventId,
        qrCode: this.scannedCode
      });
      this.showToast(
        "Success",
        result.Name + " has been checked in!",
        "success"
      );
      this.scannedCode = "";
      await refreshApex(this._wiredAttendeesResult);
    } catch (error) {
      this.showToast(
        "Error",
        error.body?.message || "Check-in failed",
        "error"
      );
    }
  }

  async handleToggleCheckIn(event) {
    const attendeeId = event.detail;
    try {
      const result = await toggleCheckIn({ attendeeId });
      const action = result.Checked_In__c ? "checked in" : "checked out";
      this.showToast("Success", result.Name + " has been " + action, "success");
      await refreshApex(this._wiredAttendeesResult);
    } catch (error) {
      this.showToast("Error", error.body?.message || "Toggle failed", "error");
    }
  }

  async handleAddAttendee() {
    const result = await AttendeeFormModal.open({
      size: "small",
      mode: "add",
      eventId: this.eventId
    });

    if (result) {
      if (result.error) {
        this.showToast("Error", result.error, "error");
      } else {
        this.showToast("Success", "Attendee added successfully", "success");
        await refreshApex(this._wiredAttendeesResult);
      }
    }
  }

  async handleEditAttendee(event) {
    const attendee = event.detail;
    const result = await AttendeeFormModal.open({
      size: "small",
      mode: "edit",
      eventId: this.eventId,
      attendee
    });

    if (result) {
      if (result.error) {
        this.showToast("Error", result.error, "error");
      } else {
        this.showToast("Success", "Attendee updated successfully", "success");
        await refreshApex(this._wiredAttendeesResult);
      }
    }
  }

  async handleDeleteAttendee(event) {
    const attendeeId = event.detail;
    try {
      await deleteAttendee({ attendeeId });
      this.showToast("Success", "Attendee deleted successfully", "success");
      await refreshApex(this._wiredAttendeesResult);
    } catch (error) {
      this.showToast("Error", error.body?.message || "Delete failed", "error");
    }
  }

  handleEditEvent() {
    this.dispatchEvent(new CustomEvent("editevent", { detail: this.event }));
  }

  async handleDeleteEvent() {
    try {
      await deleteEvent({ eventId: this.eventId });
      this.showToast("Success", "Event deleted successfully", "success");
      this.dispatchEvent(new CustomEvent("deleteevent"));
    } catch (error) {
      this.showToast(
        "Error",
        error.body?.message || "Failed to delete event",
        "error"
      );
    }
  }

  handleExportAttendees() {
    const attendeesToExport = this.filteredAttendees;
    if (!attendeesToExport || attendeesToExport.length === 0) {
      this.showToast("Info", "No attendees to export.", "info");
      return;
    }

    const headers = ["Name", "Email", "QR Code", "Checked In", "Check-In Time"];
    const rows = attendeesToExport.map((a) => [
      this._escapeCsvField(a.Name),
      this._escapeCsvField(a.Email__c),
      this._escapeCsvField(a.QR_Code__c),
      a.Checked_In__c ? "Yes" : "No",
      a.Check_In_Time__c
        ? this._escapeCsvField(new Date(a.Check_In_Time__c).toLocaleString())
        : ""
    ]);

    const csvContent =
      "\uFEFF" +
      headers.join(",") +
      "\n" +
      rows.map((r) => r.join(",")).join("\n");

    const eventName = (this.event?.Name || "Event").replace(
      /[^a-zA-Z0-9]/g,
      "_"
    );
    const today = new Date().toISOString().slice(0, 10);
    const filename = eventName + "_attendees_" + today + ".csv";

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.showToast(
      "Success",
      "Exported " + attendeesToExport.length + " attendees.",
      "success"
    );
  }

  _escapeCsvField(value) {
    if (value == null) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
  }

  showToast(title, message, variant) {
    this.dispatchEvent(new ShowToastEvent({ title, message, variant }));
  }
}
