const prefix = "chatFix";
const chatFixUi = new window.BUIM("Chat Fix", prefix);

chatFixUi.addItem("Keybind", "Keybind", "text", 0, "t");

document.getElementById(prefix + "Keybind").addEventListener("input", (e) => {
  console.log(e)
  if (e.target.value == "") {
    e.target.value = "t";
  } else {
    e.target.value = e.target.value.toLowerCase();
  }
});

window.addEventListener("keyup", function (e) {
  // Only trigger when no input field is focused
  if (
    document.activeElement.tagName.toLowerCase() !== "input" &&
    document.activeElement.tagName.toLowerCase() !== "textarea"
  ) {
    // T key (keyCode 84)
    e.stopPropagation();
    if (
      e.key.toLowerCase() === this.localStorage.getItem("chatFixKeybind") &&
      this.localStorage.getItem(prefix + "Enabled")
    ) {
      ui.chat.showInput();
    }
  }
});
