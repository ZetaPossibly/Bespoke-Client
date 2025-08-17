const prefix = "chatFix"
const chatFixUi = new window.BUIM("Chat Fix", prefix);

chatFixUi.addItem("Keybind", "keybind", "text", 0, "t")

document.getElementById(prefix+"Keybind").addEventListener("input", e => {
  if (e.target.value == "") {
		e.target.value = "t";
	} else {
    e.target.value = e.target.value.toLowerCase()
  }
})

window.addEventListener("keyup", function (e) {
  // Only trigger when no input field is focused
  if (
    document.activeElement.tagName.toLowerCase() !== "input" &&
    document.activeElement.tagName.toLowerCase() !== "textarea"
  ) {
    // T key (keyCode 84)
    if (e.key.toLowerCase() === this.localStorage.getItem("chatFixKeybind") && this.localStorage.getItem(prefix + "Enabled")) {
      e.stopPropagation();
      ui.chat.showInput();
    }
  }
});
