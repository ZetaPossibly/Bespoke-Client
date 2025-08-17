const prefix = "chatFix"
const chatFixUi = new window.BUIM("Chat Fix", prefix);
chatFixUi.addItem("Enable Fix", "Enabled", "checkbox", 0, "true")

window.addEventListener("keyup", function (e) {
  // Only trigger when no input field is focused
  if (
    document.activeElement.tagName.toLowerCase() !== "input" &&
    document.activeElement.tagName.toLowerCase() !== "textarea"
  ) {
    // T key (keyCode 84)
    if (e.keyCode === 84 && this.localStorage.getItem(prefix + "Enabled")) {
      e.stopPropagation();
      ui.chat.showInput();
    }
  }
});
