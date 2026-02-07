import { LightningElement, api } from "lwc";
import { loadScript } from "lightning/platformResourceLoader";
import qrcodejs from "@salesforce/resourceUrl/qrcodejs";

export default class QrCodeDisplay extends LightningElement {
  @api value = "";
  @api size = 200;
  @api title = "";

  _qrLibLoaded = false;

  renderedCallback() {
    if (this._qrLibLoaded) {
      this._renderQR();
      return;
    }
    loadScript(this, qrcodejs)
      .then(() => {
        this._qrLibLoaded = true;
        this._renderQR();
      })
      .catch((error) => {
        console.error("Error loading QR code library", error);
      });
  }

  _renderQR() {
    if (!this.value) return;

    const container = this.refs.qrCanvas;
    if (!container) return;

    while (container.firstChild) {
      container.removeChild(container.firstChild);
    }

    try {
      /* global qrcode */
      const typeNumber = 0; // auto-detect
      const errorCorrectionLevel = "M";
      const qr = qrcode(typeNumber, errorCorrectionLevel);
      qr.addData(this.value);
      qr.make();

      const moduleCount = qr.getModuleCount();
      const cellSize = Math.floor(this.size / (moduleCount + 2));
      const svgSize = cellSize * (moduleCount + 2);
      const NS = "http://www.w3.org/2000/svg";

      const svg = document.createElementNS(NS, "svg");
      svg.setAttribute("width", svgSize);
      svg.setAttribute("height", svgSize);
      svg.setAttribute("viewBox", `0 0 ${svgSize} ${svgSize}`);

      const bg = document.createElementNS(NS, "rect");
      bg.setAttribute("width", svgSize);
      bg.setAttribute("height", svgSize);
      bg.setAttribute("fill", "white");
      svg.appendChild(bg);

      for (let row = 0; row < moduleCount; row++) {
        for (let col = 0; col < moduleCount; col++) {
          if (qr.isDark(row, col)) {
            const cell = document.createElementNS(NS, "rect");
            cell.setAttribute("x", (col + 1) * cellSize);
            cell.setAttribute("y", (row + 1) * cellSize);
            cell.setAttribute("width", cellSize);
            cell.setAttribute("height", cellSize);
            cell.setAttribute("fill", "black");
            svg.appendChild(cell);
          }
        }
      }

      container.appendChild(svg);
    } catch (error) {
      console.error("Error generating QR code", error);
    }
  }
}
