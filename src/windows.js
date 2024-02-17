// import ExperimentalSettings from "./ui/experimental-window";
// import KeyBindingsWindow from "./ui/key-bindings/key-bindings-window";

import SettingsWindow from "./ui/settings/settings-window";
import KeyCapture from "./ui/settings/key-bindings/key-capture";
import zoomPlugin from "./zoomPlugin";

function ZoomWindows() {
  this.zoom = undefined;
  // this.keyBindings = undefined;
  // this.experimental = undefined;
  this.settings = undefined;
  this.keyCapture = undefined;
}

function closeWindowIfOpen(uiObj) {
  if (uiObj && uiObj.element && isValid(uiObj.element)) {
    uiObj.element.close();
  }
}

// ZoomWindows.prototype.newKeyBindingsWindow = function () {
//   closeWindowIfOpen(this.keyBindings);
//   closeWindowIfOpen(this.keyCapture);
//
//   this.keyBindings = new KeyBindingsWindow();
// };
//
// ZoomWindows.prototype.newExperimentalWindow = function () {
//   closeWindowIfOpen(this.experimental);
//
//   this.experimental = new ExperimentalSettings();
// };

ZoomWindows.prototype.newSettingsWindow = function () {
  closeWindowIfOpen(this.settings);

  this.settings = new SettingsWindow();
};

ZoomWindows.prototype.newKeyCaptureWindow = function (onEnterKeyFn) {
  closeWindowIfOpen(this.keyCapture);

  if (zoomPlugin.isAvailable()) {
    this.keyCapture = new KeyCapture(onEnterKeyFn);
  } else {
    alert(
      "Zoom plug-in is not found.\nPlease install Zoom plug-in to use key bindings.",
    );
  }
};

var windows = new ZoomWindows();

export default windows;
