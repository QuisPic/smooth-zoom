function Row(parentEl) {
  this.columns = [];
  this.minSize = [0, 0];
  this.columnMargins = [5, 2, 0, 2];

  this.element = parentEl.add(
    "Group { \
      alignChildren: 'left', \
      spacing: 0, \
    }",
  );
}

Row.prototype.onClickHandler = undefined;
Row.prototype.onDoubleClickHandler = undefined;
Row.prototype.fillHandler = undefined;
Row.prototype.editHandler = undefined;

Row.prototype.setOnAllColumns = function (key, value) {
  for (var i = 0; i < this.columns.length; i++) {
    this.columns[i][key] = value;
  }
};

Row.prototype.setMinSize = function (minSize) {
  this.minSize = minSize;
  this.setOnAllRows("minimumSize", this.minSize);
};

Row.prototype.setColumnMargins = function (columnMargins) {
  this.columnMargins = columnMargins;
  this.setOnAllColumns("margins", columnMargins);
};

Row.prototype.add = function (element) {
  var columnGroup = this.element.add(
    "Group { \
      alignChildren: ['left', 'center'], \
    }",
  );

  columnGroup.minimumSize = this.minSize;
  columnGroup.margins = this.columnMargins;

  if (typeof element === "string") {
    columnGroup.element = columnGroup.add(element);
  } else if (typeof element === "function") {
    columnGroup.element = element(columnGroup);
  }

  this.columns.push(columnGroup);

  return columnGroup;
};

/** takes in the same arguments as fillHandler */
Row.prototype.edit = function (content) {
  this.clear();

  if (typeof this.fillHandler === "function") {
    this.fillHandler(content);
  }

  this.element.layout.layout(true);
};

Row.prototype.clear = function () {
  for (var i = 0; i < this.columns.length; i++) {
    if (this.columns[i] && isValid(this.columns[i])) {
      this.element.remove(this.columns[i]);
    }
  }

  this.columns.length = 0;
};

Row.prototype.setBgColor = function (color) {
  this.element.graphics.backgroundColor = this.element.graphics.newBrush(
    this.element.graphics.BrushType.SOLID_COLOR,
    color,
  );
};

Row.prototype.onClick = function (event) {
  if (event.detail === 2 && event.button === 0 && this.onDoubleClickHandler) {
    this.onDoubleClickHandler(this);
  } else if (this.onClickHandler) {
    this.onClickHandler(this);
  }
};

export default Row;