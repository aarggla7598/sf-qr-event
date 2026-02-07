import { LightningElement } from "lwc";

export default class LightningModal extends LightningElement {
  static open = jest.fn().mockResolvedValue(null);

  close(result) {
    // no-op in test
  }
}
