const organization = {
    attributes: {
        taxRate: {
            description: "The institution tax rate applied to financial calculations",
            value: 0.27
        },
        marginTarget: {
            description: "The institution net interest margin target",
            value: 0.03
        },
        capitalTarget: {
            description: "The institution capital to assets ratio target",
            value: 0.10
        },
        fraudLossFactor: {
            description: "ratio of fraud losses to institution total deposits",
            value: 0.005,
        },
        hurdleRate: {
            description: "lowest rate of return a project or investment must achieve acceptable",
            value: 0.18,
        }
    },
    dictionaries: {
        loanRiskFactors: {
            description: "Risk factors representing the risk associated with different loan types",
            values: {"0": 1, "1": 0, "2": 0.5, "3": 1, "3W": 2, "4": 10, "5": 100, "NULL": 1}
        },
        loanTypeID: {
            description: "Mappings of loan types to the respective indentifiers",
            values: {
                "Agriculture": [],
                "Commercial": ["31", "32", "33", "34"], 
                "Commercial Real Estate": ["4"],
                "Residential Real Estate": ["1"],
                "Consumer": ["20", "21", "22", "23", "26", "70", "71", "76"], 
                "Equipment": [], 
                "Home Equity": ["24", "25", "46"], 
                "Letter of Credit": ["35"],
                "Commercial Line": ["36", "63", "65"], 
                "Commercial CD Secured": ["30", "38", "39"],
                "Consumer CD Secured": ["27", "28", "29"],
                "Home Equity Line of Credit": ["9", "10", "72", "75"],
                "Municipal": ["37"],
                "Tax Exempt Commercial": ["40"],
                "Tax Exempt Commercial Real Estate": ["42"]
            }
        },
        ddaTypeID: {
            description: "Mappings of checking types to the respective identifiers",
            values: {
                "Consumer": ["2", "4", "7", "11", "12", "14", "16", "21", "22", "23", "25", "26", "27", "28", "29", "30", "32", "36", "37", "39", "46", "48"], 
                "Commercial": ["51", "52", "53", "54", "61", "74", "75", "76", "78", "80", "85"]
            }
        },
        CDtypeIRA: {
            description: "Mappings of Certificates of Deposit types to either an IRA or non IRA classification",
            values: {
                "nonIRA": ["16", "17", "18", "23", "24", "32", "33", "34", "35", "36", "37", "39", "41", "42", "43", "44", "46", "47", "56", "57", "58", "82", "83", "84", "86", "87", "88", "89","91"],
                "IRA": ["2", "15", "21"]  
            }
        }
    }
};
window.organization = organization;
