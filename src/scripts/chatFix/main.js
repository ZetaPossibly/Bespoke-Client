(function () {
    const prefix = "chatFix";
    const chatFixUi = new window.BUIM("Chat Fix", prefix);

    chatFixUi.addShortcut("Keybind", "Keybind", "KeyT&,false&,false&,false&,false", ui.chat.showInput);
})();