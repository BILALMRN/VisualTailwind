import {
  pathScripts,
  pathStyles,
  styleManagerBaseTailwindCss,
} from "./utile.js";
import {blockFiles} from "./blocks/blocks.js";

var editor = grapesjs.init({
  container: "#gjs",
  fromElement: true,
  height: "100vh",
  width: "auto",
  styleManager: styleManagerBaseTailwindCss,
  // storageManager: {
  //   type: "remote",
  //   autosave: true,
  //   autoload: true,
  //   // urlStore: "/extensions/BEdit/save",
  //   // urlLoad: "/extensions/BEdit/load",
  // },
  canvas: {
    styles: pathStyles,
    scripts: pathScripts,
  },
  plugins: ["grapesjs-custom-code"], //,'grapesjs-tooltip','grapesjs-navbar','grapesjs-component-countdown','grapesjs-blocks-flexbox'
  pluginsOpts: {},
});

editor.on("style:property:update", (property) => {
  const selectedComponent = editor.getSelected();
  if (selectedComponent) {
    if (
      property.property._changing &&
      property.property.attributes.className &&
      property.to.value
    ) {
      const classNameTemplate = property.property.attributes.className;
      const newClass = classNameTemplate.replace("{value}", property.to.value);

      let classesToRemove = [];
      if (property.property.attributes.options) {
        classesToRemove = property.property.attributes.options.map((option) =>
          classNameTemplate.replace("{value}", option.id)
        );
      }

      if (property.property.attributes.list) {
        classesToRemove = property.property.attributes.list.map(
          (item) => classNameTemplate.replace("{value}", item.value) // Return the transformed value
        );
      }

      const classPrefix = classNameTemplate.replace("{value}", "");
      const regex = new RegExp(`^${classPrefix}(\\d+(\\.\\d+)?)$`); // Create regex
      const newClassesToRemove = selectedComponent
        .getClasses()
        .filter(
          (item) =>
            classesToRemove.includes(item) ||
            regex.test(item) ||
            item === newClass
        );
      selectedComponent.removeClass(newClassesToRemove);
      selectedComponent.addClass(newClass);
    }
    editor.Css.clear();
  }
});

//#region  Panels

// Create options panel if it doesn't exist
editor.Panels.addPanel({
  id: "options",
  buttons: [],
});
// Custom panel setup
editor.Panels.addButton("options", {
  id: "undo",
  className: " bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600", // Optional: Font Awesome icon
  label: "←",
  command: "undo-command",
});

editor.Panels.addButton("options", {
  id: "redo",
  className: " bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600",
  label: "→",
  command: "redo-command",
});

editor.Panels.addButton("options", {
  id: "undoAll",
  className: " bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600", // Optional: Font Awesome icon
  label: "X",
  command: "undoAll-command",
});

editor.Panels.addButton("options", {
  id: "save",
  className:
    "bg-blue-500 text-white w-full rounded shadow-lg hover:bg-blue-600", // Optional: Font Awesome icon
  label: "Save",
  command: "save-command",
});

const undoManager = editor.UndoManager;

// Command to undo the last action
editor.Commands.add("undo-command", {
  run(editor) {
    undoManager.undo(); // Call the undo method
  },
});

// Command to redo the last undone action
editor.Commands.add("redo-command", {
  run(editor) {
    undoManager.redo(); // Call the redo method
  },
});

// Optionally, add a command to reset to the initial state
editor.Commands.add("undoAll-command", {
  run(editor) {
    undoManager.undoAll();
  },
});
//#endregion

//#region Commands

// Add the save command
editor.Commands.add("save-command", {
  run(editor) {
    const htmlContent = editor.getHtml();
    // const cssContent = editor.getCss();

    const blob = new Blob([`<html><head> </head>${htmlContent}</html>`], {
      type: "text/html",
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "design.html";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },
});

//#endregion

//#region Add custom blocks with Tailwind CSS
// Fetch the blocks from the JSON file
// Fetch all block files
Promise.all(blockFiles.map(file => fetch(`blocks/${file}`)))
  .then(responses => {
    // Check if all responses are okay
    responses.forEach(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    });
    return Promise.all(responses.map(response => response.json())); // Parse all JSON responses
  })
  .then(dataArrays => {
    // `dataArrays` is an array of arrays containing block data
    dataArrays.forEach(data => {
      data.blocks.forEach(block => {
        // Adding each block to the editor
        editor.Blocks.add(block.id, {
          label: block.label,
          content: block.content,
          category: block.category,
          attributes: block.attributes,
          onClick: (blockInstance) => {
            // Show the preview when the block is clicked
            showPreview(blockInstance.get("content")); // Your preview function
          },
        });
      });
    });
  })
  .catch(error => console.error("Error loading blocks:", error));

function showPreview(content) {
  // Create the modal element
  const modal = document.createElement("div");
  modal.className =
    "fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50"; // Tailwind classes for modal overlay

  // Create the modal content
  const modalContent = document.createElement("div");
  modalContent.className =
    "bg-white p-6 rounded-lg shadow-lg w-1/2 h-1/3 flex flex-col items-center"; // Tailwind classes for modal content
  modalContent.innerHTML = `
        <h2 class="text-xl font-semibold mb-4">Preview of the Block</h2>
        <main class="flex-grow container overflow-auto">${content}</main>
    `;
  modalContent.querySelectorAll("div").forEach(child => {
        child.style.border = "2px solid black"; // Set the desired border style
    });
  // Append modal content to modal
  modal.appendChild(modalContent);
  const canvas = editor.Canvas.getBody();
  canvas.appendChild(modal);

  // Add event listener to close modal when mouse outside element is detected
  document.body.addEventListener("mouseout", (event) => {
    // document.body.removeChild(modal); // Remove modal from body
    canvas.removeChild(modal); // Remove modal from body
  });
}
//#endregion
