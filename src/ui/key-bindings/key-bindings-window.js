import { getPluginsFolder, saveFileFromBinaryString } from "../../utils";
import bind from "../../../extern/function-bind";
import zoomPluginWin from "../../../extern/plug-in-bin/zoom-plugin-win";
import zoomPluginMac from "../../../extern/plug-in-bin/zoom-plugin-mac";
import { AE_OS, OS, ZOOM_PLUGIN_STATUS } from "../../constants";
import KeyBinding from "./key-binding";
import Line from "../line";
import JSON from "../../../extern/json2";
import ColumnNames from "./column-names";
import preferences from "../../preferences";
import windows from "../../windows";
import zoomPlugin from "../../zoomPlugin";

function KeyBindingsWindow() {
  zoomPlugin.resetStatus();

  this.keyBindingsArr = [];
  this.linesArr = [];

  this.element = new Window("palette", "Zoom Key Bindings", undefined, {
    resizeable: false,
  });

  this.element.onResize = function () {
    this.layout.resize();
  };

  this.element.onResizing = this.element.onResize;
  this.element.alignChildren = ["center", "center"];

  this.element.gr = this.element.add(
    "Group { \
      orientation: 'column', \
      alignChildren: ['fill', 'center'], \
      pnlInstallPlugin: Panel { \
        alignChildren: 'fill', \
      }, \
      pnlKeyBindings: Panel { \
        alignment: 'fill', \
        orientation: 'column', \
        margins: 0, \
        spacing: 0, \
        grColumnNames: Group { \
          alignment: ['fill', 'top'], \
        }, \
        grLine: Group { \
          orientation: 'column', \
          alignment: 'fill', \
        }, \
        grBindings: Group {\
          spacing: 0, \
          alignment: 'fill', \
          orientation: 'column', \
        }, \
        grAdd: Group { \
          orientation: 'column', \
          alignment: 'fill', \
          alignChildren: 'left', \
          margins: 5, \
          btnAdd: IconButton { \
            title: '+', \
            preferredSize: [100, 22], \
            helpTip: 'Add key bind', \
          }, \
        }, \
      }, \
      grButtons: Group { \
        alignChildren: ['right', 'center'], \
        btnSave: IconButton { title: 'Save', preferredSize: [100, 22] }, \
        btnCancel: IconButton { title: 'Cancel', preferredSize: [100, 22] }, \
      }, \
    }",
  );

  var pnlKeyBindings = this.element.gr.pnlKeyBindings;
  var grBindings = pnlKeyBindings.grBindings;
  var keyBindings = JSON.parse(preferences.keyBindings);

  this.element.gr.maximumSize.width = 600;
  pnlKeyBindings.maximumSize.height = 500;

  /** Create a group that holds plug-in status info */
  this.createPluginStatusGroup();

  /** Check if Zoom plug-in is available */
  this.setPluginStatus();

  /** Create column names for the key bindings table */
  pnlKeyBindings.grColumnNames.columnNames = new ColumnNames(
    pnlKeyBindings.grColumnNames,
    this,
  );

  /** Fill the key bindings table */
  if (keyBindings && keyBindings.length > 0) {
    for (var i = 0; i < keyBindings.length; i++) {
      if (!keyBindings[i].keyCodes) {
        continue;
      }

      this.keyBindingsArr.push(
        new KeyBinding(grBindings, keyBindings[i], this),
      );
      this.linesArr.push(new Line(grBindings));
    }

    /** Sync the checkbox for all items in the table */
    pnlKeyBindings.grColumnNames.columnNames.syncCheck();
  }
  Line(pnlKeyBindings.grLine);

  /** Add new key binding button */
  pnlKeyBindings.grAdd.btnAdd.onClick = bind(function () {
    windows.newKeyCaptureWindow(
      bind(function (keyNames, keyCodes) {
        this.keyBindingsArr.push(
          new KeyBinding(
            grBindings,
            {
              enabled: true,
              keyCodes: keyCodes,
              action: 0,
              amount: 1,
            },
            this,
          ),
        );

        this.linesArr.push(new Line(grBindings));
        this.element.gr.pnlKeyBindings.grColumnNames.columnNames.syncCheck();
        this.element.layout.layout(true);
      }, this),
    );
  }, this);

  /** Save the key bindings to the AE's preferences file */
  this.element.gr.grButtons.btnSave.onClick = bind(function () {
    var bindingsArr = [];
    var bindingElements = grBindings.children;

    for (var i = 0; i < bindingElements.length; i++) {
      // skip lines
      if (i % 2) {
        continue;
      }

      var bEl = bindingElements[i];

      bindingsArr.push({
        enabled: bEl.chkEnable.value,
        keyCodes: bEl.gr.grKeys.keyCombination.keyCodes,
        action: bEl.gr.ddlistAction.selection.index,
        amount: bEl.gr.grAmount.numberValue.getValue(),
      });
    }

    preferences.save("keyBindings", JSON.stringify(bindingsArr));

    /** Close the KeyBindings window */
    this.element.close();
  }, this);

  /** Cancel button */
  this.element.gr.grButtons.btnCancel.onClick = function () {
    this.window.close();
  };

  this.element.layout.layout(true);
  this.element.show();
}

KeyBindingsWindow.prototype.createPluginStatusGroup = function () {
  var pnlInstallPlugin = this.element.gr.pnlInstallPlugin;

  pnlInstallPlugin.grStatus = pnlInstallPlugin.add(
    "Group {\
      spacing: 6, \
      foldIcon: Custom { preferredSize: [8, 8] }, \
      txt: StaticText {}, \
      statusIcon: Group { preferredSize: [8, 8] }, \
    }",
  );

  var grStatus = pnlInstallPlugin.grStatus;
  var foldIcon = grStatus.foldIcon;
  var statusIcon = grStatus.statusIcon;

  grStatus.addEventListener(
    "click",
    bind(function (event) {
      if (event.eventPhase === "target") {
        this.toggleInfo();
        foldIcon.notify("onDraw");
      }
    }, this),
  );

  foldIcon.onDraw = bind(function () {
    var g = grStatus.foldIcon.graphics;
    var c = grStatus.isMouseOver
      ? [0.75, 0.75, 0.75, 1]
      : [0.55, 0.55, 0.55, 1];
    var b = g.newPen(g.PenType.SOLID_COLOR, c, 2);

    if (this.isUnfoldInfo) {
      g.moveTo(0, 2);
      g.lineTo(4, 6);
      g.lineTo(8, 2);
    } else {
      g.moveTo(0, 0);
      g.lineTo(4, 4);
      g.lineTo(0, 8);
    }

    g.strokePath(b);
  }, this);

  grStatus.addEventListener("mouseover", function (event) {
    if (event.eventPhase === "target") {
      grStatus.isMouseOver = true;
      foldIcon.notify("onDraw");
    }
  });

  grStatus.addEventListener("mouseout", function (event) {
    if (event.eventPhase === "target") {
      grStatus.isMouseOver = false;
      foldIcon.notify("onDraw");
    }
  });

  statusIcon.onDraw = bind(function () {
    var g = grStatus.statusIcon.graphics;
    var c = this.pluginFound ? [0.1, 0.85, 0.1, 1] : [1, 0, 0, 1];
    var p = g.newPen(g.PenType.SOLID_COLOR, c, 2);

    if (this.pluginFound) {
      g.moveTo(0, 3);
      g.lineTo(3, 6);
      g.lineTo(8, 0);
    } else {
      g.moveTo(0, 0);
      g.lineTo(8, 8);
      g.strokePath(p);

      g.currentPath = g.newPath();

      g.moveTo(8, 0);
      g.lineTo(0, 8);
    }

    g.strokePath(p);
  }, this);
};

KeyBindingsWindow.prototype.setPluginStatus = function () {
  var pnlInstallPlugin = this.element.gr.pnlInstallPlugin;
  var grStatus = pnlInstallPlugin.grStatus;

  this.pluginFound = zoomPlugin.isAvailable();

  pnlInstallPlugin.graphics.backgroundColor =
    pnlInstallPlugin.graphics.newBrush(
      pnlInstallPlugin.graphics.BrushType.SOLID_COLOR,
      this.pluginFound ? [0.12, 0.2, 0.12, 1] : [0.2, 0.12, 0.12, 1],
    );

  switch (zoomPlugin.status()) {
    case ZOOM_PLUGIN_STATUS.NOT_FOUND:
      grStatus.txt.text = "Zoom plug-in is not installed";
      break;
    case ZOOM_PLUGIN_STATUS.FOUND_NOT_INITIALIZED:
      grStatus.txt.text = "Unable to initialize Zoom plug-in";
      break;
    case ZOOM_PLUGIN_STATUS.FINISHED:
      grStatus.txt.text = "Zoom plug-in stopped working";
      break;
    case ZOOM_PLUGIN_STATUS.INITIALIZATION_ERROR:
      grStatus.txt.text = "Error initializing Zoom plugin";
      break;
    case ZOOM_PLUGIN_STATUS.INITIALIZED:
      grStatus.txt.text = "Zoom plug-in installed";
      break;
    default:
      grStatus.txt.text = "Unknown status";
      break;
  }

  grStatus.txt.size = grStatus.txt.graphics.measureString(grStatus.txt.text);

  if (!this.pluginFound) {
    this.unfoldInfo();
  } else if (this.unfoldInfo) {
    this.foldInfo();
  }
};

KeyBindingsWindow.prototype.fillInstallInfo = function (parentGr) {
  var grInstallInfo = parentGr.add(
    "Group { \
      orientation: 'column', \
      alignChildren: ['left', 'center'], \
      txt0: StaticText { text: 'To use key bindings, you must first install Zoom plug-in.' }, \
      grSave: Group { \
        margins: [0, 10, 0, 10], \
        alignment: ['fill', 'bottom'], \
        alignChildren: ['center', 'center'], \
        btnSaveWin: IconButton { title: 'Save Plug-in (Windows)' }, \
        btnSaveMac: IconButton { title: 'Save Plug-in (macOS)' }, \
      }, \
      txt1: StaticText { text: '1. Click on \"Save Plug-in\" for your platform.' }, \
      txt2: StaticText { text: '2. Save the zip archive to your disk and unzip it.' }, \
      txt3: StaticText { text: '3. Copy the unzipped file (Zoom.aex or Zoom.plugin) to:' }, \
      grWin: Group { \
        grSpace: Group { size: [6, 1] }, \
        txtWin: StaticText { text: 'Windows:' }, \
        alignment: ['fill', 'center' ], \
        txtPath: EditText { \
          text: 'C:/Program Files/Adobe/Adobe After Effects [version]/Support Files/Plug-ins/', \
          alignment: ['fill', 'center' ], \
          properties: { readonly: true }, \
        }, \
      }, \
      grMac: Group { \
        grSpace: Group { size: [6, 1] }, \
        txtMac: StaticText { text: 'macOS:' }, \
        alignment: ['fill', 'center' ], \
        txtPath: EditText { \
          text: '/Applications/Adobe After Effects [version]/Plug-ins/', \
          alignment: ['fill', 'center' ], \
          properties: { readonly: true }, \
        }, \
      }, \
      txt4: StaticText { text: '4. Restart After Effects.' }, \
    }",
  );

  parentGr.grInstallInfo = grInstallInfo;
  var pluginsFolder = getPluginsFolder();

  if (pluginsFolder) {
    if (AE_OS === OS.WIN) {
      grInstallInfo.grWin.txtPath.text = pluginsFolder.fsName + "\\";
    } else if (AE_OS === OS.MAC) {
      grInstallInfo.grMac.txtPath.text = pluginsFolder.fsName + "/";
    }
  }

  var txtMac = grInstallInfo.grMac.txtMac;
  var g = txtMac.graphics;
  txtMac.size = g.measureString("Windows:");

  grInstallInfo.grSave.btnSaveWin.onClick = function () {
    saveFileFromBinaryString(zoomPluginWin, "Zoom-Windows.zip");
  };

  grInstallInfo.grSave.btnSaveMac.onClick = function () {
    saveFileFromBinaryString(zoomPluginMac, "Zoom-macOS.zip");
  };
};

KeyBindingsWindow.prototype.fillErrorInfo = function (parentGr) {
  var grErrorInfo = parentGr.add(
    "Group { \
      orientation: 'column', \
      alignChildren: ['center', 'top'], \
      txt: StaticText { \
        alignment: 'fill', \
        properties: { \
          multiline: true, \
        }, \
      }, \
      btnReload: Button { text: 'Reload' }, \
    }",
  );

  parentGr.grErrorInfo = grErrorInfo;

  var errorText = "";
  if (zoomPlugin.foundEO) {
    try {
      errorText = zoomPlugin.getError();
    } catch (error) {
      /**/
    }
  }

  if (errorText) {
    grErrorInfo.txt.text = errorText;
    grErrorInfo.txt.characters = 50; // this fixes the height of the text
  }

  grErrorInfo.btnReload.onClick = bind(function () {
    if (zoomPlugin.foundEO) {
      zoomPlugin.reload();

      this.setPluginStatus();
      this.element.layout.layout(true);
    }
  }, this);
};

KeyBindingsWindow.prototype.toggleInfo = function () {
  if (this.isUnfoldInfo) {
    this.foldInfo();
  } else {
    this.unfoldInfo();
  }
};

KeyBindingsWindow.prototype.unfoldInfo = function () {
  if (this.isUnfoldInfo) {
    this.foldInfo();
  }

  var grInfo = this.element.gr.pnlInstallPlugin.add(
    "Group { \
        orientation: 'column', \
        alignChildren: ['fill', 'fill'], \
        grLine: Group { alignment: 'fill', orientation: 'column' }, \
    }",
  );
  Line(grInfo.grLine);

  switch (zoomPlugin.status()) {
    case ZOOM_PLUGIN_STATUS.INITIALIZED:
    case ZOOM_PLUGIN_STATUS.NOT_FOUND:
      this.fillInstallInfo(grInfo);
      break;
    case ZOOM_PLUGIN_STATUS.FOUND_NOT_INITIALIZED:
    case ZOOM_PLUGIN_STATUS.FINISHED:
    case ZOOM_PLUGIN_STATUS.INITIALIZATION_ERROR:
      this.fillErrorInfo(grInfo);
      break;
  }

  this.element.gr.pnlInstallPlugin.grInfo = grInfo;
  this.element.layout.layout(true);
  this.isUnfoldInfo = true;
};

KeyBindingsWindow.prototype.foldInfo = function () {
  if (!this.isUnfoldInfo) {
    return;
  }

  var grInfo = this.element.gr.pnlInstallPlugin.grInfo;

  if (grInfo && isValid(grInfo)) {
    grInfo.parent.remove(grInfo);
  }

  this.element.layout.layout(true);
  this.element.layout.resize();
  this.isUnfoldInfo = false;
};

KeyBindingsWindow.prototype.findKeyBindingIndex = function (keyBinding) {
  var kbInd;

  for (var i = 0; i < this.keyBindingsArr.length; i++) {
    if (keyBinding === this.keyBindingsArr[i]) {
      kbInd = i;
    }
  }

  return kbInd;
};

KeyBindingsWindow.prototype.removeKeyBinding = function (keyBindingOrInd) {
  var kbInd;

  if (keyBindingOrInd instanceof KeyBinding) {
    kbInd = this.findKeyBindingIndex(keyBindingOrInd);
  } else if (typeof keyBindingOrInd === "number") {
    kbInd = keyBindingOrInd;
  }

  if (kbInd !== undefined) {
    this.keyBindingsArr[kbInd].element.parent.remove(
      this.keyBindingsArr[kbInd].element,
    );

    this.linesArr[kbInd].element.parent.remove(this.linesArr[kbInd].element);

    this.keyBindingsArr.splice(kbInd, 1);
    this.linesArr.splice(kbInd, 1);

    this.element.layout.layout(true);
  } else {
    alert("Can not remove Key Binding:\nThe Key Binding is not found.");
  }
};

KeyBindingsWindow.prototype.onOffKeyBinding = function (val, keyBindingOrInd) {
  var kbInd;

  if (keyBindingOrInd instanceof KeyBinding) {
    kbInd = this.findKeyBindingIndex(keyBindingOrInd);
  } else if (typeof keyBindingOrInd === "number") {
    kbInd = keyBindingOrInd;
  }

  if (kbInd !== undefined) {
    this.keyBindingsArr[kbInd].onOff(val);
  } else {
    alert("Can not enble/disable Key Binding:\nThe Key Binding is not found.");
  }
};

export default KeyBindingsWindow;
