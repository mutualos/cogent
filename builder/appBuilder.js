let copernicusFunctions = [];
let copernicusAttributes = [];
let copernicusDictionaries = [];
let pipeItems = [];
let functionDescriptions = {};
let attributeDescriptions = {};
let dictionaryDescriptions = {};

// Function to extract items from a library object
function extractFromLibrary(libraryObject) {
    if (libraryObject.functions) {
        for (let key in libraryObject.functions) {
            // Check if the function is an implementation
            if (libraryObject.functions[key].implementation) {
                copernicusFunctions.push(key);
                functionDescriptions[key] = libraryObject.functions[key].description;
            }
        }
    }
    if (libraryObject.attributes) {
        for (let key in libraryObject.attributes) {
            copernicusAttributes.push(key);
            attributeDescriptions[key] = libraryObject.attributes[key].description;
        }
    }
    if (libraryObject.dictionaries) {
        for (let key in libraryObject.dictionaries) {
            copernicusDictionaries.push(key);
            dictionaryDescriptions[key] = libraryObject.dictionaries[key].description;
        }
    }
}

// Function to extract items from pipes object
function extractFromPipes(pipesObject) {
    for (let category in pipesObject) {
        let categoryItems = [];
        for (let key in pipesObject[category]) {
            categoryItems.push(pipesObject[category][key]);
        }
        pipeItems.push({ category: category, items: categoryItems });
    }
}

// Function to load all libraries defined in editorConfig
function loadAllLibraries() {
    console.log('Loading the following libraries:');
    window.editorConfig.libraries.forEach(libraryName => {
        console.log(libraryName);
        if (window[libraryName]) {
            extractFromLibrary(window[libraryName]);
        }
    });

    if (window.translations) {
        extractFromPipes(window.translations.pipes);
    }

    updateSuggestionBox('attributes', copernicusAttributes, '');
    updateSuggestionBox('functions', copernicusFunctions, '');
    updateSuggestionBox('dictionaries', copernicusDictionaries, '');
    updatePipeSuggestionBox(pipeItems, '');
}

function highlightSyntax(text) {
    const colorMap = ['#1abc9c', '#3498db', '#9b59b6', '#e74c3c', '#f39c12']; // Colors for different levels of nested parentheses
    const errorColor = '#e74c3c'; // Red color for errors

    const stack = [];
    const parts = text.split(/([\(\)])/g);
    let highlighted = '';

    const allPipeItems = pipeItems.map(item => item.items).flat();

    parts.forEach(part => {
        if (part === '(') {
            const color = colorMap[stack.length % colorMap.length];
            stack.push(color);
            highlighted += `<span style="color: ${color};">${part}</span>`;
        } else if (part === ')') {
            if (stack.length > 0) {
                const color = stack.pop();
                highlighted += `<span style="color: ${color};">${part}</span>`;
            } else {
                highlighted += `<span style="color: ${errorColor};">${part}</span>`;
            }
        } else {
            highlighted += part
                .replace(/(\bfunction\b|\bvar\b|\blet\b|\bconst\b|\bif\b|\belse\b|\bfor\b|\bwhile\b)/g, '<span class="keyword">$1</span>')
                .replace(new RegExp(`\\b(${copernicusFunctions.join('|')})\\b`, 'g'), '<span class="function">$1</span>')
                .replace(new RegExp(`\\b(${copernicusAttributes.join('|')})\\b`, 'g'), '<span class="attribute">$1</span>')
                .replace(new RegExp(`\\b(${copernicusDictionaries.join('|')})\\b`, 'g'), '<span class="dictionaries">$1</span>')
                .replace(new RegExp(`\\b(${copernicusDictionaries.join('|')})\\s*:\\s*(\\d+|".*?")`, 'g'), '<span class="dictionaries">$1</span>:<span class="value">$2</span>')
                .replace(new RegExp(`\\b(${allPipeItems.join('|')})\\b`, 'g'), '<span class="pipe">$1</span>'); // Highlight pipe items
        }
    });

    // Highlight remaining unbalanced opening parentheses
    while (stack.length > 0) {
        const color = stack.pop();
        highlighted = highlighted.replace(new RegExp(`<span style="color: ${color};">\\(`), `<span style="color: ${errorColor};">(`);
    }

    return highlighted;
}

document.getElementById('editor').addEventListener('input', (e) => {
    const editor = e.target;
    const text = editor.innerText;
    const highlightedText = highlightSyntax(text);
    editor.innerHTML = highlightedText;
    placeCaretAtEnd(editor);
    updateSuggestions(text);
});

function placeCaretAtEnd(el) {
    el.focus();
    if (typeof window.getSelection !== "undefined" && typeof document.createRange !== "undefined") {
        const range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        const sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

function updateSuggestions(text) {
    const words = text.split(/\s+/);
    const lastWord = words[words.length - 1].toLowerCase(); // Convert to lowercase for case-insensitive match

    // Update suggestions for attributes, functions, dictionaries, and pipes
    updateSuggestionBox('attributes', copernicusAttributes, lastWord);
    updateSuggestionBox('functions', copernicusFunctions, lastWord);
    updateSuggestionBox('dictionaries', copernicusDictionaries, lastWord);
    updatePipeSuggestionBox(pipeItems, lastWord);
}

function updateSuggestionBox(id, suggestions, filter) {
    const container = document.getElementById(id);
    container.innerHTML = `<h3 class="${id}">${id.charAt(0).toUpperCase() + id.slice(1)}</h3>`;

    suggestions.filter(word => word.toLowerCase().includes(filter)).forEach(suggestion => {
        let description = '';
        if (id === 'functions') {
            description = functionDescriptions[suggestion] || '';
        } else if (id === 'attributes') {
            description = attributeDescriptions[suggestion] || '';
        } else if (id === 'dictionaries') {
            description = dictionaryDescriptions[suggestion] || '';
        }
        
        const item = document.createElement('div');
        item.className = `suggestion-item ${id}`;
        item.innerText = suggestion;
        item.setAttribute('title', description); // Add tooltip
        item.addEventListener('click', () => {
            insertSuggestion(document.getElementById('editor'), suggestion, id);
        });
        container.appendChild(item);
    });
}

function updatePipeSuggestionBox(pipeItems, filter) {
    const container = document.getElementById('pipes');
    container.innerHTML = `<h3>Pipes</h3>`;

    pipeItems.forEach(pipe => {
        const categoryContainer = document.createElement('div');
        categoryContainer.innerHTML = `<h4 class="pipe_category">${pipe.category}</h4>`;
        pipe.items.filter(word => word.toLowerCase().includes(filter)).forEach(suggestion => {
            const item = document.createElement('div');
            item.className = `suggestion-item pipe`;
            item.innerText = suggestion;
            item.addEventListener('click', () => {
                insertSuggestionAndCategory(document.getElementById('editor'), suggestion, pipe.category);
            });
            categoryContainer.appendChild(item);
        });
        container.appendChild(categoryContainer);
    });
}

function insertSuggestionAndCategory(editor, suggestion, category) {
    if (!editor) return;

    // Insert the pipe suggestion first
    insertSuggestion(editor, suggestion, 'pipe');

    // Get the updated text
    const text = editor.innerText;
    const lastSemicolonIndex = text.lastIndexOf(';');
    const categoryWithPipes = `|${category}|`;

    // Check if the category already exists in the text
    if (text.includes(categoryWithPipes)) {
        return;
    }

    let updatedText;
    if (lastSemicolonIndex === -1) {
        updatedText = `${categoryWithPipes} ${text}`;
    } else {
        updatedText = `${text.slice(0, lastSemicolonIndex + 1)} ${categoryWithPipes} ${text.slice(lastSemicolonIndex + 1)}`;
    }

    editor.innerText = updatedText;

    // Reapply syntax highlighting
    const highlightedText = highlightSyntax(updatedText);
    editor.innerHTML = highlightedText;
    placeCaretAtEnd(editor);
}

function insertSuggestion(editor, suggestion, type) {
    if (!editor) return;

    const text = editor.innerText;
    const words = text.split(/\s+/);

    let updatedSuggestion = suggestion;
    if (type === 'dictionaries') {
        updatedSuggestion = `${suggestion}: `;
    } else if (type === 'functions') {
        updatedSuggestion = `${suggestion}()`;
    } else {
        updatedSuggestion = `${suggestion}`;
    }

    words[words.length - 1] = updatedSuggestion;
    const newText = words.join(' ');
    editor.innerText = newText;

    // Reapply syntax highlighting
    const highlightedText = highlightSyntax(newText);
    editor.innerHTML = highlightedText;
    placeCaretAtEnd(editor);
}

const loadScript = (src) => {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
};

const loadLibraryScripts = () => {
    return Promise.all(
        window.editorConfig.libraries.map(library => loadScript(`../library/${library}.js`))
    );
};


document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
            if (content.id === tab.dataset.tab) {
                content.classList.add('active');
            }
        });
    });
});

document.getElementById('addColumnBtn').addEventListener('click', () => {
    const columnsContainer = document.getElementById('columnsContainer');
    const columnCard = document.createElement('div');
    columnCard.className = 'column-card';
    columnCard.innerHTML = `
        <button class="remove-btn" onclick="removeColumnCard(this)">X</button>
        <table>
            <tr>
                <th>
                    <div class="form-group">
                        <input type="text" name="header" class="form-control" required>
                    </div>
                </th>
            </tr>
            <tr>
                <td>
                    <div class="form-group">
                        <label for="key">Key:</label>
                        <select name="key" class="form-control"></select>
                    </div>
                    <div class="form-group">
                        <label for="type">Type:</label>
                        <select name="type" class="form-control" onchange="handleTypeChange(this)">
                            <option value="float">Float</option>
                            <option value="integer">Integer</option>
                            <option value="USD">USD</option>
                            <option value="currency">Currency</option>
                            <option value="percentage">Percentage</option>
                            <option value="upper">Upper</option>
                            <option value="category">Category</option>
                            <option value="function">Function</option>
                        </select>
                    </div>
                    <div class="function-fields" style="display:none;">
                        <label for="functionFormula">Formula:</label>
                        <textarea name="functionFormula" class="form-control" rows="3"></textarea>
                        <label for="pipeID">Pipe ID:</label>
                        <select name="pipeID" class="form-control">
                            <!-- Options will be populated dynamically -->
                        </select>
                    </div>
                </td>
            </tr>
        </table>
    `;
    columnsContainer.prepend(columnCard);
    attachChangeListeners(columnCard);
    populatePipeIDOptions(columnCard);
    updateSelectOptions();
});

document.getElementById('addChartBtn').addEventListener('click', () => {
    const chartsContainer = document.getElementById('chartsContainer');
    const chartCard = document.createElement('div');
    chartCard.className = 'chart-card';
    chartCard.innerHTML = `
        <button class="remove-btn" onclick="removeChartCard(this)">X</button>
        <div class="form-group">
            <label for="chartLabel">Chart Label:</label>
            <input type="text" name="chartLabel" class="form-control" placeholder="Label" required>
        </div>
        <div class="bar-icon"></div>
        <div class="form-group">
            <label for="chartKey">Chart Key:</label>
            <select name="chartKey" class="form-control">
                <!-- Options will be populated dynamically -->
            </select>
        </div>
    `;
    chartsContainer.prepend(chartCard);
    updateSelectOptions();
});

function removeColumnCard(button) {
    button.parentElement.remove();
    updateSelectOptions();
}

function removeChartCard(button) {
    button.parentElement.remove();
    updateSelectOptions();
}

function handleTypeChange(select) {
    // Traverse up to the nearest column-card ancestor
    const columnCard = select.closest('.column-card');
    // Find the function-fields element within the column card
    const functionFields = columnCard.querySelector('.function-fields');

    if (select.value === 'function') {
        functionFields.style.display = 'block';
    } else {
        functionFields.style.display = 'none';
    }
}

function updateSelectOptions() {
    const keys = ['ID', 'result'];
    const primaryKeySelect = document.getElementById('primaryKey');
    const sortKeySelect = document.getElementById('sortKey');
    const chartKeySelects = document.querySelectorAll('select[name="chartKey"]');
    const presentationKeySelects = document.querySelectorAll('select[name="key"]');

    // Function to add options to select element
    function addOptions(select, keys, allowCustom = true) {
        select.innerHTML = '';
        keys.forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.text = key;
            select.appendChild(option.cloneNode(true));
        });

        if (allowCustom) {
            // Add a custom key option
            const customOption = document.createElement('option');
            customOption.value = 'custom';
            customOption.text = 'Custom...';
            select.appendChild(customOption);

            // Handle custom key input
            select.addEventListener('change', function () {
                if (this.value === 'custom') {
                    const customKey = prompt('Enter custom key:');
                    if (customKey && !keys.includes(customKey)) {
                        const newOption = document.createElement('option');
                        newOption.value = customKey;
                        newOption.text = customKey;
                        keys.push(customKey);
                        this.insertBefore(newOption, customOption);
                        this.value = customKey;

                        // Update all selects with the new custom key
                        updateAllSelectsWithCustomKey(customKey);
                    }
                }
            });
        }
    }

    // Update all selects with the new custom key
    function updateAllSelectsWithCustomKey(customKey) {
        const allSelects = document.querySelectorAll('select[name="key"], #primaryKey, #sortKey');
        allSelects.forEach(select => {
            if (!Array.from(select.options).some(option => option.value === customKey)) {
                const option = document.createElement('option');
                option.value = customKey;
                option.text = customKey;
                select.appendChild(option);
            }
        });
    }

    // Collect keys from column cards
    const columnCards = document.querySelectorAll('.column-card');
    columnCards.forEach(card => {
        const keySelect = card.querySelector('select[name="key"]');
        if (keySelect) {
            const key = keySelect.value;
            if (key && !keys.includes(key)) {
                keys.push(key);
            }
        }
    });

    // Update presentation key selects
    presentationKeySelects.forEach(select => {
        const formulas = document.getElementById('editor').innerText.split(';').map(f => f.trim()).filter(f => f);
        formulas.forEach(formula => {
            pipeItems.forEach(pipe => {
                pipe.items.forEach(item => {
                    if (formula.includes(item) && !keys.includes(item)) {
                        keys.push(item);
                    }
                });
            });
        });
        addOptions(select, keys);
    });

    // Update primary key and sort key selects
    addOptions(primaryKeySelect, keys);
    addOptions(sortKeySelect, keys);

    // Update chart key selects (no customization allowed)
    chartKeySelects.forEach(select => {
        select.innerHTML = '<option value="count">count</option>';
        keys.forEach(key => {
            const option = document.createElement('option');
            option.value = key;
            option.text = key;
            select.appendChild(option.cloneNode(true));
        });
    });
}

function populatePipeIDOptions(card) {
    const pipeIDSelects = card.querySelectorAll('select[name="pipeID"]');
    const pipes = Object.keys(translations.pipes);

    pipeIDSelects.forEach(select => {
        select.innerHTML = '';
        pipes.forEach(pipe => {
            const option = document.createElement('option');
            option.value = pipe;
            option.text = pipe;
            select.appendChild(option.cloneNode(true));
        });
    });
}

function attachChangeListeners(card) {
    const inputs = card.querySelectorAll('input[name="header"], input[name="key"], select[name="type"]');
    inputs.forEach(input => {
        input.addEventListener('input', updateSelectOptions);
        input.addEventListener('change', updateSelectOptions);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    loadLibraryScripts()
        .then(() => loadScript("../organization/translator.js"))
        .then(() => loadScript("saveApp.js"))
        .then(() => {
            // Call loadAllLibraries and log debug information
            loadAllLibraries();
            console.log('Pipe Items:', pipeItems); // Log pipe items for debugging
            console.log('Function Descriptions:', functionDescriptions); // Log function descriptions for debugging
            console.log('Attribute Descriptions:', attributeDescriptions); // Log attribute descriptions for debugging
            console.log('Dictionary Descriptions:', dictionaryDescriptions); // Log dictionary descriptions for debugging
        })
        .catch((error) => {
            console.error('Error loading scripts:', error);
        });
});

// Initially attach change listeners to existing column cards
document.querySelectorAll('.column-card').forEach(attachChangeListeners);