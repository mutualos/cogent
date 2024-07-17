function loadLibrary(library, callback) {
    var script = document.createElement('script');
    var libraryUrl;

    // Check if the library is a URL
    if (typeof library === 'string' && (library.startsWith('http://') || library.startsWith('https://'))) {
        libraryUrl = library;
    } else {
        libraryUrl = `../library/${library}.js`;
    }

    script.src = libraryUrl;

    script.onload = function() {
        console.log(`Library loaded successfully from ${libraryUrl}`);
        let libContent;

        // Extract the library content
        if (libraryUrl.startsWith('http://') || libraryUrl.startsWith('https://')) {
            libContent = window.api;  // For external libraries, assuming it's always window.api
            delete window.api; // Clean up the global namespace
        } else {
            const libName = libraryUrl.split('/').pop().split('.')[0];
            libContent = window[libName];
            delete window[libName]; // Clean up the global namespace
        }

        // Merge the library content into the combined libraries object if valid
        if (libContent) {
            mergeLibraries(window.libraries, libContent);
        } else {
            console.error(`Library content for ${libraryUrl} is undefined or null.`);
        }

        callback(null);
    };

    script.onerror = function() {
        console.error(`Failed to load library from ${script.src}`);
        callback(new Error(`Failed to load library from ${script.src}`));
    };

    document.head.appendChild(script);
}

function mergeLibraries(target, source) {
    if (source.functions) {
        target.functions = target.functions || {};
        Object.assign(target.functions, source.functions);
    }
    if (source.attributes) {
        target.attributes = target.attributes || {};
        Object.assign(target.attributes, source.attributes);
    }
    if (source.dictionaries) {
        target.dictionaries = target.dictionaries || {};
        Object.assign(target.dictionaries, source.dictionaries);
    }
}

function loadLibraries(libraries, finalCallback) {
    let loadedCount = 0;
    const totalLibraries = libraries.length;
    window.libraries = {};

    libraries.forEach(library => {
        loadLibrary(library, (error) => {
            if (!error) {
                loadedCount++;
                if (loadedCount === totalLibraries) {
                    finalCallback(window.libraries);
                }
            } else {
                console.error(error);
            }
        });
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('starting libraries load')
    if (window.buildConfig && window.buildConfig.libraries) {
        loadLibraries(window.buildConfig.libraries, (loadedLibraries) => {
            const conflicts = detectConflicts(loadedLibraries);
            if (conflicts.length > 0) {
                displayConflicts(conflicts);
            } else {
                document.dispatchEvent(new CustomEvent('allLibrariesLoaded', { detail: loadedLibraries }));
            }
        });
    } else {
        console.error('buildConfig or libraries not defined');
    }
});

function detectConflicts(libraries) {
    const conflicts = [];
    const keys = Object.keys(libraries);
    const seenKeys = new Set();

    keys.forEach(key => {
        if (typeof libraries[key] === 'function' || typeof libraries[key] === 'object') {
            if (seenKeys.has(key)) {
                conflicts.push(key);
            }
            seenKeys.add(key);
        }
    });

    return conflicts;
}

function displayConflicts(conflicts) {
    const conflictMessage = `Conflicts detected in the following identifiers: ${conflicts.join(', ')}. Please resolve these conflicts in the libraries.`;
    alert(conflictMessage);
}
