(function () {
    const prefix = "chatFix";
    const chatFixUi = new window.BUIM("Chat Fix", prefix);

    chatFixUi.addShortcut("Keybind", "Keybind", "KeyA&,false&,false&,false&,false", (e) => {
        e.stopPropagation()
        e.preventDefault()
        ui.chat.showInput();
    });
})();