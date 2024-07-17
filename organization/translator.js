const translations = {
    pipes: {
        loans: { 
            "Principal": "principal",
            "Rate_Over_Split": "annualRate",
            "Date_Opened": "openDate",
            "Maturity_Date": "maturityDate",
            "Risk_Rating": "riskRating",
            "Class_Code": "type",
            "Portfolio": "ID",
            "Branch_Number": "branch",
            "Opened_by_Resp_Code": "responsibility"
            // Additional mappings as necessary
        },
        checking: {
            "Portfolio": "ID",
            "Class_Code": "type",
            "Date_Opened": "openDate",
            "Previous_Average_Balance": "balance",
            "PMTD_Service_Charge": "charges",
            "PMTD_Service_Charge_Waived": "chargesWaived",
            "PMTD_Other_Charges": "otherCharges",
            "PMTD_Other_Charges_Waived": "otherChargesWaived",
            "PMTD_Interest_Earned": "interestExpense",
            "PMTD_Number_of_Deposits": "deposits",
            "Branch_Number": "branch",
            "Opened_by_Resp_Code": "responsibility"
        },
        savings: {
            "Portfolio": "ID",
            "Class_Code": "type",
            "Date_Opened": "openDate",
            "Previous_Average_Balance": "balance",
            "PMTD_Service_Charges": "charges",
            "PMTD_Service_Charge_Waived": "chargesWaived",
            "PMTD_Other_Charges": "otherCharges",
            "PMTD_Other_Charges_Waived": "otherChargesWaived",
            "PMTD_Interest_Earned": "interestExpense",
            "Number_of_Credits": "deposits",
            "Number_of_Debits": "withdrawals",
            "Branch_Number": "branch",
            "Opened_by_Resp_Code": "responsibility"
        }, 
        certificate: {
            "Portfolio": "ID",
            "Class_Code": "type",
            "Date_Opened": "openDate",
            "Current_Balance": "balance",
            "Interest_Rate": "rate",
            "Term": "term",
            "Term_Code": "termCode",
            "Branch_Number": "branch",
            "Opened_by_Resp_Code": "responsibility"
        }
    },
    responsibility: {
        "100": "Jim",
		"200": "Tonya",
        "300": "Angela",
		"400": "Bob"
    },
    branch: {
        "1": "Branch One"
    }
};
window.translations = translations;
