const prefix = "chatFix";
const chatFixUi = new window.BUIM("Chat Fix", prefix);

chatFixUi.addItem("Keybind", "Keybind", "text", 0, "t");

document.getElementById(prefix + "Keybind").addEventListener("change", (e) => {
  let newValue = e.target.value.toLowerCase();
  
  // Ensure we have a valid single character, otherwise reset to default
  if (newValue === "" || newValue.length > 1) {
    newValue = "t";
  }
  
  // Update both the input and localStorage
  e.target.value = newValue;
  localStorage.setItem(prefix + "Keybind", newValue);
});

window.addEventListener("keydown", function (e) {
  if (
    document.activeElement.tagName.toLowerCase() !== "input" &&
    document.activeElement.tagName.toLowerCase() !== "textarea"
  ) {
    if (
      e.key.toLowerCase() === localStorage.getItem(prefix + "Keybind") &&
      localStorage.getItem(prefix + "Enabled") === "true"
    ) {
      e.stopPropagation();
      ui.chat.showInput();
    }
  }
});
