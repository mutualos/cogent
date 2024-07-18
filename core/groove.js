document.addEventListener('DOMContentLoaded', function () {
    // Get the modal
    var modal = document.getElementById("configModal");
    var span = document.getElementsByClassName("close")[0];

    // Set the modal title and version
    document.getElementById('modalTitle').textContent = window.buildConfig.title;
    document.getElementById('modalVersion').textContent = window.buildConfig.version;

    // Display component IDs and formulas in the modal
    var componentList = document.getElementById("componentList");
    window.buildConfig.components.forEach(function(component) {
        var li = document.createElement("li");
        li.innerHTML = `
            ${component.id}
            <div class="formula">${component.formula}</div>
        `;
        componentList.appendChild(li);

        li.addEventListener('click', function() {
            var formula = this.querySelector('.formula');
            if (formula.style.display === 'none' || formula.style.display === '') {
                formula.style.display = 'block';
            } else {
                formula.style.display = 'none';
            }
        });
    });

    // Show the modal onload
    modal.style.display = "block";

    // Close the modal
    span.onclick = function() {
        modal.style.display = "none";
    }

    // Close the modal when clicking outside of it
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Close the modal when the run button is clicked
    document.getElementById('run').addEventListener('click', function() {
        modal.style.display = "none";
    });

    // Update file names when files are chosen
    document.getElementById('csvPipe').addEventListener('change', function() {
        var fileNames = Array.from(this.files).map(file => file.name).join(', ');
        document.getElementById('fileNames').textContent = fileNames || 'No file chosen';
    });
});

//Name Mash
document.getElementById('log-toggle').addEventListener('change', toggleLogVisibility);
const log = {};

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        showSpinner();
        readCSVInChunks(file, processCSV);
    }
}

async function readCSVInChunks(file, callback) {
    const CHUNK_SIZE = 1024 * 1024; // 1MB chunks
    const fileSize = file.size;
    let offset = 0;
    const csvData = [];

    while (offset < fileSize) {
        const chunk = await readFileChunk(file, offset, CHUNK_SIZE);
        const rows = chunk.split('\n');
        rows.forEach(row => {
            if (row.trim() !== '') {
                const columns = row.split(',');
                const id = columns[0].replace(/['"]/g, '').trim();
                const name = columns[1].replace(/['"]/g, '').trim();
                csvData.push({ id, name });
            }
        });
        offset += CHUNK_SIZE;
    }

    callback(csvData);
}

function readFileChunk(file, offset, chunkSize) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            resolve(e.target.result);
        };
        reader.onerror = function(e) {
            reject(e.target.error);
        };
        const slice = file.slice(offset, offset + chunkSize);
        reader.readAsText(slice);
    });
}

function processCSV(csvData) {
    const table = document.getElementById('result-table');
    const rowsInTable = table.getElementsByTagName('tr');

    for (let row of rowsInTable) {
        const cells = row.getElementsByTagName('td');
        if (cells.length > 0) {
            const cell = cells[0];
            const cellText = cell.textContent;
            const numericMatch = cellText.match(/^(\d+)/);
            const stringMatch = cellText.match(/^([A-Za-z\s]+)/);
            const tableId = numericMatch ? numericMatch[1] : (stringMatch ? stringMatch[1].trim() : null);

            if (tableId) {
                const csvRow = csvData.find(item => item.id === tableId);
                if (csvRow) {
                    const remainingText = cellText.replace(/^[\dA-Za-z\s]+/, '');
                    cell.textContent = csvRow.name + remainingText;
                } else {
                    logCombineEntry(`${cellText} unmatched`);
                }
            }
        }
    }
    hideSpinner();
}

function logCombineEntry(entry) {
    console.warn(entry);
    if (log[entry]) {
        log[entry]++;
    } else {
        log[entry] = 1;
    }
}

function updateLog() {
    const logDiv = document.getElementById('log');
    logDiv.innerHTML = '';
    for (const entry in log) {
        const logEntry = document.createElement('div');
        logEntry.textContent = `${entry}: ${log[entry]} instance(s)`;
        logDiv.appendChild(logEntry);
    }
}

function toggleLogVisibility() {
    const logDiv = document.getElementById('log');
    if (document.getElementById('log-toggle').checked) {
        logDiv.style.display = 'block';
    } else {
        logDiv.style.display = 'none';
    }
}
