document.getElementById('saveButton').addEventListener('click', function() {
    const title = document.getElementById('title').value;
    const editorContent = document.getElementById('editor').innerText;

    if (!title) {
        alert('Please enter a Title under Brief.');
        return;
    }
    fileName = title.split(' ').join('_');

    // Function to identify pipe used in the formula
    function identifyPipe(formula) {
        const pipeCount = new Map();
        let accurateCategory = null;

        pipeItems.forEach(pipe => {
            // Check if the pipe category surrounded by | symbols is found
            if (formula.includes(`|${pipe.category}|`)) {
                accurateCategory = pipe.category;
            }

            pipe.items.forEach(item => {
                if (formula.includes(item)) {
                    const count = pipeCount.get(pipe.category) || 0;
                    pipeCount.set(pipe.category, count + 1);
                }
            });
        });

        // If an accurate category is found, return it immediately
        if (accurateCategory) {
            console.log('accurateCategory: ', accurateCategory)
            return accurateCategory;
        }

        let mostFrequentCategory = null;
        let maxCount = 0;
        pipeCount.forEach((count, category) => {
            if (count > maxCount) {
                mostFrequentCategory = category;
                maxCount = count;
            }
        });

        return mostFrequentCategory;
    }

    // Create a mapping of functions, attributes, and dictionaries to their respective libraries
    const libraryMapping = {
        organization: {
            functions: Object.keys(organization.functions || {}),
            attributes: Object.keys(organization.attributes || {}),
            dictionaries: Object.keys(organization.dictionaries || {})
        },
        financial: {
            functions: Object.keys(financial.functions || {}),
            attributes: Object.keys(financial.attributes || {}),
            dictionaries: Object.keys(financial.dictionaries || {})
        },
        api: {
            functions: Object.keys(api.functions || {}),
            attributes: Object.keys(api.attributes || {}),
            dictionaries: Object.keys(api.dictionaries || {})
        }
        // Add more libraries as needed
    };

    // Split the editor content by semicolons to get individual formulas
    const formulas = editorContent.split(';').map(f => f.trim()).filter(f => f);
    console.log('formulas', formulas);

    function stem(word) {
        console.log('word', word);
        const suffixes = ["ing", "ed", "ly", "es", "s", "ment"];
        let stemmedWord = word;
    
        for (let suffix of suffixes) {
            if (word.endsWith(suffix)) {
                stemmedWord = word.substring(0, word.length - suffix.length);
                break;
            }
        }
    
        return stemmedWord;
    }

    let akaDictionary = {
        'checking': ['dda'],
        'certificate': ['CD', 'COD']
    };

    function populatePipeIDs(pipe) {
        console.log('pipe', pipe);
        let stemmedWord = stem(pipe);
        let aka = akaDictionary && akaDictionary.hasOwnProperty(pipe) ? akaDictionary[pipe] : [];
        return [pipe, stemmedWord, ...aka];
    }

    function identifyLibraries(content) {
        const libraries = new Set();

        for (const [library, { functions, attributes, dictionaries }] of Object.entries(libraryMapping)) {
            for (const func of functions) {
                if (content.includes(func)) {
                    libraries.add(library);
                }
            }
            for (const attr of attributes) {
                if (content.includes(attr)) {
                    libraries.add(library);
                }
            }
            for (const dict of dictionaries) {
                if (content.includes(dict)) {
                    libraries.add(library);
                }
            }
        }

        return Array.from(libraries);
    }

    function generateColumnsString() {
        const columns = [];
        const columnCards = document.querySelectorAll('.column-card');
        
        columnCards.forEach(card => {
            const header = card.querySelector('input[name="header"]').value;
            let key;
            if (card.classList.contains('permanent-card')) {
                key = card.querySelector('input[name="key"]').value;
            } else {
                key = card.querySelector('select[name="key"]').value;
            }
            const type = card.querySelector('select[name="type"]').value;
            
            let column = { header, key, type };
            
            if (type === 'function') {
                const formula = card.querySelector('textarea[name="functionFormula"]').value;
                const pipeID = card.querySelector('select[name="pipeID"]').value;
                column.function = formula;
                column.pipeID = pipeID;
            }
            
            if (header && key && type) {
                columns.push(column);
            }
        });
    
        const columnsString = columns.map(col => {
            if (col.type === 'function') {
                return `\t\t\t\t\t{ header: '${col.header}', key: '${col.key}', type: '${col.type}', function: '${col.function}', pipeID: '${col.pipeID}' }`;
            } else {
                return `\t\t\t\t\t{ header: '${col.header}', key: '${col.key}', type: '${col.type}' }`;
            }
        }).join(',\n');
    
        const charts = [];
        const chartCards = document.querySelectorAll('.chart-card');
    
        chartCards.forEach(card => {
            const label = card.querySelector('input[name="chartLabel"]').value;
            const key = card.querySelector('select[name="chartKey"]').value;
    
            if (label && key) {
                charts.push({ key, label });
            }
        });
    
        const chartsString = charts.map(chart => {
            return `{ key: '${chart.key}', label: '${chart.label}' }`;
        }).join(',\n');
    
        const primaryKey = document.getElementById('primaryKey').value;
        const sortKey = document.getElementById('sortKey').value;
        const sortOrder = document.getElementById('sortOrder').value;
    
        return `columns: [\n${columnsString}\n\t\t\t\t],\n\t\t\t\tprimary_key: '${primaryKey}',\n\t\t\t\tsort: { key: '${sortKey}', order: '${sortOrder}' },\n\t\t\t\tcharts: [\n\t\t\t\t\t${chartsString}\n\t\t\t\t]`;
    }
        
    // Function to clean the formula by removing pipe categories and extra spaces
    function cleanFormula(formula) {
        // Remove pipe categories surrounded by | symbols and extra spaces
        return formula.replace(/\|\w+\|\s*/g, '').replace(/\s+/g, ' ').trim();
    }

    // Create components based on the formulas
    const components = formulas.map((formula, index) => {
        const associatedPipe = identifyPipe(formula);
        const cleanedFormula = cleanFormula(formula);
        console.log('associatedPipe', index, associatedPipe);
        return {
            id: associatedPipe,
            formula: cleanedFormula,
            pipeIDs: populatePipeIDs(associatedPipe)
        };
    });

    const libraries = new Set();

    formulas.forEach(formula => {
        identifyLibraries(formula).forEach(lib => libraries.add(lib));
    });

    function renderComponents(components) {
        const componentsString = components.map(component => {
            const pipeIDsString = component.pipeIDs.map(pipeID => `'${pipeID}'`).join(', ');
            return `\t\t\t\t{\n` +
                `\t\t\t\t\tid: '${component.id}',\n` +
                `\t\t\t\t\tformula: '${component.formula}',\n` +
                `\t\t\t\t\tpipeIDs: [${pipeIDsString}]\n` +
                `\t\t\t\t}`;
        }).join(',\n');
        return `components: [\n${componentsString}\n\t\t\t]`;
    }

    function renderLibraries(libraries) {
        const librariesArray = Array.from(libraries);
        const librariesString = librariesArray.map((library, index) => {
            return `\t\t\t\t'${library}'${index < librariesArray.length - 1 ? ',' : ''}\n`;
        }).join('');
        return librariesString;
    }

    const fileContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${document.getElementById("title").value}</title>
    <link rel="stylesheet" href="../styles/main.css">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
</head>
<body>
    <div id="spinnerOverlay" class="spinner-overlay">
        <div class="spinner"></div>
    </div>
    <div id="chartContainer"></div>
    <div id="resultsTableContainer" class="table-container"></div>
    <input type="checkbox" id="log-toggle"> Show Log
    <div id="log"></div>
    <div id="configModal" class="modal">
        <div class="modal-content">
            <div class="modal-header">
                <img src="../JS_box.png" alt="Logo">
                <h2 id="modalTitle"></h2>
                <span class="close">&times;</span>
            </div>
            <div class="modal-body">
                <div class="file-input-wrapper">
                    <input type="file" id="csvPipe" accept=".csv" multiple>
                    <span id="fileNames" class="file-names">No file chosen</span>
                </div>
                <button id="run">
                    Run
                </button>
                <h5>Version <span id="modalVersion"></span></h5>
                <h4>Components</h4>
                <ul class="component-list" id="componentList"></ul>
            </div>
        </div>
    </div>
    <script>
        window.buildConfig = {
            libraries: [
${renderLibraries(libraries)}
            ],
            version: '${document.getElementById("version").value}',
            title: '${document.getElementById("title").value}',
            description: '${document.getElementById("description").value}',
            author: '${document.getElementById("author").value}',
            presentation: {
                ${generateColumnsString()},
            },
            ${renderComponents(components)}
        };
    </script>
    <script src="../core/groove.js"></script>
    <script src="../core/loadLibraries.js"></script>
    <script src="../organization/translator.js"></script>
    <script src="../core/main.js"></script>
</body>
</html>`;

    const blob = new Blob([fileContent], { type: 'text/html' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${fileName}.html`;
    link.click();
});
