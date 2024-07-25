const fiDashboard = {
    functions: {
        returnOnEquity: {
            description: "Calculate the return on equity of an asset",
            implementation: function(netIncome, averagePrincipal, capital_target) {
                const riskWeight = 1; //starting with 100% for demos
                const capitalContrib = parseFloat(averagePrincipal) * parseFloat(capital_target); //simple regulatory calculation--Future will include economic capital
                return (parseFloat(netIncome) / parseFloat(capitalContrib) * riskWeight * 100).toFixed(2);    
            },
        },
        gradeROE: {
            description: "Letter grade an assets' return on equity to compare asset performance",
            implementation: function(netIncome, averagePrincipal, capital_target, ROE_hurdle ) {
                console.log('netIncome, averagePrincipal, capital_target, ROE_hurdle', netIncome, averagePrincipal, capital_target, ROE_hurdle);
                const ROE = libraries.functions.returnOnEquity.implementation(netIncome, averagePrincipal, capital_target) / 100;
                const ROE_floor = Math.round(ROE_hurdle / 4 * 100) / 100; //demo ROE_hurdle .18, so REO_floor is .05 
                const distSize = (ROE_hurdle - ROE_floor) / 3; //(.18 - .05) / 3 = .04333
                console.log('ROE, ROE_floor, distSize', ROE, ROE_floor, distSize);
                const gradeLetters = ['D', 'C', 'B', 'A'];
                const gradeKey = Math.trunc(Math.max(Math.min(ROE, ROE_hurdle), .001) / distSize);
                console.log('gradeKey', gradeKey)
                return [gradeLetters[gradeKey-1], ROE];
            },
        },
    }
}
window.fiDashboard = fiDashboard; // Make it globally accessible