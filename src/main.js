import {
  pathScripts,
  pathStyles,
  styleManagerBaseTailwindCss,
} from "./utile.js";
import {basicBlocks} from "./blocks/basic-block.js"
import {filesBlocks} from "./blocks/blocks.js"

var editor = grapesjs.init({
  container: "#gjs",
  fromElement: true,
  telemetry: false,
  height: "100vh",
  width: "auto",
  styleManager: styleManagerBaseTailwindCss,
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
  id: "EnableCostumBlocks",
  className: `bg-blue-500  text-white p-1 rounded shadow-lg hover:bg-blue-600`,
  label: "EnableCostumBlocks",
  command: "Enable-Costum-Blocks",
});
editor.Panels.addButton("options", {
  id: "undo",
  className: "bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600", 
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
  className: " bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600", 
  label: "X",
  command: "undoAll-command",
});

editor.Panels.addButton("options", {
  id: "save",
  className:
    "bg-blue-500 text-white rounded shadow-lg hover:bg-blue-600", 
  label: "Save",
  command: "save-command",
});

//#endregion


//#region Commands

const undoManager = editor.UndoManager;
editor.Commands.add("undo-command", {
  run(editor) {
    undoManager.undo();
  },
});

editor.Commands.add("redo-command", {
  run(editor) {
    undoManager.redo(); 
  },
});

editor.Commands.add("undoAll-command", {
  run(editor) {
    undoManager.undoAll();
  },
});

// Add the save command
editor.Commands.add("save-command", {
  run(editor) {
    const htmlContent = editor.getHtml();

    const blob = new Blob([`<html><head> <script src="https://cdn.tailwindcss.com"></script> </head>${htmlContent}</html>`], {
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

editor.Commands.add("Enable-Costum-Blocks", {
  run(editor) {
    filesBlocks.map(blocks => 
    blocks.forEach(block => {
      editor.Blocks.add(block.id, {
        label: block.label,
        content: block.content,
        category: block.category,
        attributes: block.attributes,
        onClick: (blockInstance) => {
          showPreview(blockInstance.get("content"));
        },
      });
    })
);

  },
});

//#endregion

//#region Add custom blocks with Tailwind CSS
basicBlocks.forEach(block => {
  editor.Blocks.add(block.id, {
    label: block.label,
    content: block.content,
    category: block.category,
    attributes: block.attributes,
    onClick: (blockInstance) => {
      showPreview(blockInstance.get("content")); 
    },
  });
})

function showPreview(content) {
  const modal = document.createElement("div");
  modal.className = "fixed inset-0 flex items-center justify-center z-50 bg-white "; 

  const modalContent = document.createElement("div");
  modalContent.className =
    "w-full h-full flex items-center"; 
  modalContent.innerHTML = `<main class="w-full h-full">${content}</main>`;
  // Append modal content to modal
  modal.appendChild(modalContent);
  const canvas = editor.Canvas.getBody();
  canvas.appendChild(modal);

  // Add event listener to close modal when mouse outside element is detected
  document.body.addEventListener("mouseout", (event) => {
    canvas.removeChild(modal); 
  });
}
//#endregion
