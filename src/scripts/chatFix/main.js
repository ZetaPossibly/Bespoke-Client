const prefix = "chatFix";
const chatFixUi = new window.BUIM("Chat Fix", prefix);

chatFixUi.addItem("Keybind", "Keybind", "text", 0, "t");

document.getElementById(prefix + "Keybind").addEventListener("change", (e) => {
  console.log(e)
  if (e.target.value == "" || e.target.value.length > 1) {
    e.target.value = "t";
  } else {
    e.target.value = e.target.value.toLowerCase();
  }
  localStorage.setItem(prefix+"Keybind", e.target.value)
});

window.addEventListener("keydown", function (e) {
  // Only trigger when no input field is focused
  if (
    document.activeElement.tagName.toLowerCase() !== "input" &&
    document.activeElement.tagName.toLowerCase() !== "textarea"
  ) {
    if (
      e.key.toLowerCase() === this.localStorage.getItem("chatFixKeybind") &&
      this.localStorage.getItem(prefix + "Enabled")
    ) {
      ui.chat.showInput();
      e.stopPropagation();
    }
  }
});
