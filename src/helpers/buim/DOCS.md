# Bespoke UI Manager Documentation

## Overview
The Bespoke UI Manager (BUIM) is a lightweight UI management system designed for GeoFS addons. It provides a centralized menu system where multiple addons can register their UI components and settings.

## Features
- Persistent settings using localStorage
- Multiple input types support (checkbox, text, number, etc.)
- Keyboard shortcuts integration
- Hierarchical menu structure
- Reset functionality for each addon
- Automatic menu compilation and updates

## Getting Started

### Basic Usage
```javascript
const ui = new window.BUIM("My Addon", "myAddon_");

// Add basic settings
ui.addItem("Enable Sound", "sound", "checkbox", 0, "true");
ui.addItem("Volume Level", "volume", "range", 1, "50", "min='0' max='100'");
```

### Constructor Parameters
- `name`: Display name of your addon in the menu
- `prefix`: Unique prefix for localStorage keys (e.g., "myAddon_")

## API Reference

### addItem(description, lsName, type, level, defaultValue, options?)
Adds a new input item to the menu.

Parameters:
- `description`: Label text for the input
- `lsName`: localStorage key suffix (will be prefixed)
- `type`: HTML input type ("checkbox", "text", "range", etc.)
- `level`: Indentation level (0 = no indent)
- `defaultValue`: Initial value if not set
- `options`: Optional HTML attributes string

Example:
```javascript
ui.addItem("Aircraft Speed", "speed", "number", 1, "0", "min='0' max='1000'");
```

### addKBShortcut(description, lsName, level, defaultValue, fn)
Adds a keyboard shortcut with associated function.

Parameters:
- `description`: Label text for the shortcut
- `lsName`: localStorage key suffix
- `level`: Indentation level
- `defaultValue`: Default key/code
- `fn`: Function to execute when shortcut is triggered

Example:
```javascript
ui.addKBShortcut("Toggle HUD", "hudKey", 0, "H", () => {
    // Toggle HUD code here
});
```

### addButton(title, fn, options?)
Adds a clickable button to the menu.

Parameters:
- `title`: Button text
- `fn`: Click handler function
- `options`: Optional HTML attributes string

Example:
```javascript
ui.addButton("Calibrate", () => {
    // Calibration code here
}, "class='primary-button'");
```

### addHeader(level, text)
Adds a header to organize menu sections.

Parameters:
- `level`: Header level (2-6 recommended)
- `text`: Header text

Example:
```javascript
ui.addHeader(2, "Display Settings");
```

## Best Practices

### Prefix Naming
- Use unique, descriptive prefixes to avoid conflicts
- Include underscore suffix in prefix: "myAddon_"
- Keep prefixes short but meaningful

```javascript
// Good
const ui = new window.BUIM("Flight Computer", "fltComp_");

// Bad - too generic
const ui = new window.BUIM("My Addon", "addon_");
```

### Menu Organization
1. Start with an enable/disable checkbox (added automatically)
2. Group related settings under headers
3. Use indentation levels for hierarchical settings
4. Place keyboard shortcuts near related settings

```javascript
const ui = new window.BUIM("Radio System", "radio_");
ui.addHeader(2, "Communication");
ui.addItem("Channel", "channel", "number", 0, "1");
ui.addItem("Squelch", "squelch", "checkbox", 1, "true");
ui.addKBShortcut("Push-to-Talk", "ptt", 1, "Space", transmit);
```

### Performance Considerations
- Avoid frequent menu updates
- Group related changes together
- Use appropriate input types for data

### Storage Management
- Always provide sensible default values
- Use string values for localStorage
- Handle potential storage errors
- Clean up unused storage keys

## Common Scenarios

### Basic Settings Panel
```javascript
const ui = new window.BUIM("Weather Radar", "wxRadar_");
ui.addHeader(2, "Display");
ui.addItem("Range (nm)", "range", "number", 0, "40");
ui.addItem("Show Lightning", "lightning", "checkbox", 0, "true");
```

### Advanced Configuration
```javascript
const ui = new window.BUIM("Flight Computer", "fmc_");

// Main settings
ui.addHeader(2, "Navigation");
ui.addItem("Display Mode", "mode", "text", 0, "LNAV");
ui.addItem("Waypoint Alert", "wpAlert", "checkbox", 1, "true");

// Keyboard controls
ui.addHeader(2, "Controls");
ui.addKBShortcut("Next Page", "nextPage", 0, "PageDown", nextPage);
ui.addKBShortcut("Prev Page", "prevPage", 0, "PageUp", prevPage);

// Actions
ui.addHeader(2, "Actions");
ui.addButton("Direct To", directTo);
ui.addButton("Clear Route", clearRoute);
```

## Troubleshooting

### Common Issues

1. **Settings Not Saving**
   - Check prefix uniqueness
   - Verify localStorage availability
   - Ensure values are strings

2. **Menu Not Appearing**
   - Verify GeoFS UI initialization
   - Check for CSS conflicts
   - Ensure proper initialization timing

3. **Keyboard Shortcuts Not Working**
   - Verify event listener registration
   - Check for shortcut conflicts
   - Ensure proper key codes/names

## Tips and Tricks

1. **Conditional UI Updates**
```javascript
if (localStorage.getItem("myAddon_enabled") === "true") {
    // Update UI only when enabled
}
```

2. **Dynamic Options**
```javascript
// Update options based on conditions
ui.addItem("Speed", "speed", "number", 0, "0", 
    `min='0' max='${aircraft.maxSpeed}'`);
```

3. **Grouped Settings**
```javascript
ui.addHeader(2, "Radio 1");
ui.addItem("Frequency", "r1_freq", "text", 1, "118.00");
ui.addItem("Standby", "r1_stby", "text", 1, "136.97");

ui.addHeader(2, "Radio 2");
ui.addItem("Frequency", "r2_freq", "text", 1, "124.85");
ui.addItem("Standby", "r2_stby", "text", 1, "121.50");
```

## Security Considerations

1. **Input Validation**
   - Sanitize user inputs
   - Validate ranges and formats
   - Handle malicious inputs

2. **Storage Limits**
   - Monitor localStorage usage
   - Handle storage quota errors
   - Clean up unused data

## Future Considerations

1. **Potential Enhancements**
   - Custom styling support
   - Input validation hooks
   - Event system for changes
   - State management integration

2. **Maintenance**
   - Regular cleanup of stored data
   - Version compatibility checks
   - Performance monitoring

## Contributing
When extending or modifying the UI system:
1. Maintain backward compatibility
2. Follow existing naming conventions
3. Document new features
4. Test across different scenarios
