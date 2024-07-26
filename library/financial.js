const financial = {
    functions: {
        identifyType: function(type, dictionary) {
            let identifiedType = null;
            if (typeof dictionary === 'object') {    
                if (type in dictionary) {
                    identifiedType = type;
                } else {
                    for (let key in dictionary) {
                        if (dictionary[key].includes(String(type))) {
                            identifiedType = key;
                            break;
                        }
                    }
                }
            }
            return identifiedType;
        },
        greaterThan: {
            description: "return all balances or principal greater than (>) parameter",
            implementation: function(parameter, principal, balance) {
                const value = principal ? parseFloat(principal) : balance ? parseFloat(balance) : null;
                if (value > parameter) {
                    return value;
                } else {
                    return null; 
                }
            }
        },
        interestIncome: {
            description: "Calculates the interest income based on principal and annual rate",
            implementation: function(principal, annualRate) {
                console.log(principal, annualRate);
                return principal * annualRate;
            }
        },
        remainingMonths: {
            description: "Calculates the remaining months until maturity date",
            implementation: function(maturityDate) {
                if (!maturityDate) return false;
                const today = new Date();
                const maturity = new Date(maturityDate);
                const months = (maturity.getFullYear() - today.getFullYear()) * 12 + maturity.getMonth() - today.getMonth();
                return months > 0 ? months : 1;
            }
        },
        termInMonths: {
            description: "Return a financial instruments Contractual Term in months",
            implementation: function(term, termCode) {
                if (term) {
                    if (termCode == 'D') {
                        return parseInt(term / 30);
                    } else {
                        return parseInt(term);
                    }
                } else {
                    return false;
                }
            }
        },
        lifeInMonths: {
            description: "Calculates the total months from account opening until today",
            implementation: function(openDate) {
                // Check if openDate is a valid date string
                if (isNaN(Date.parse(openDate))) {
                    console.error('Invalid date format');
                    return false;
                }
                const openDateObj = new Date(openDate);
                const today = new Date();
                const time_difference = today.getTime() - openDateObj.getTime();
                const life = parseFloat(time_difference / (1000 * 60 * 60 * 24 * 30));
                return life.toFixed(2);
            }
        },
        loanPayment: {
            description: "Calculates the monthly loan payment based on principal, annual rate, and amortization months",
            implementation: function(principal, annualRate, amortizationMonths) {
                const monthlyRate = annualRate < 1 ? parseFloat(annualRate) / 12 : parseFloat(annualRate / 100) / 12;
                if (monthlyRate === 0) {
                    return (principal / amortizationMonths).toFixed(2);
                }
                const monthlyPayment = principal * (monthlyRate / (1 - Math.pow(1 + monthlyRate, -amortizationMonths)));
                return monthlyPayment.toFixed(2);
            }
        },
        averagePrincipal: {
            description: "Calculates the average principal over the loan term",
            implementation: function(principal, annualRate, termMonths = null, amortizationMonths = null, maturityDate = null) {
                if (parseFloat(principal) <= 0) return 0.00;
                var monthlyRate = annualRate < 1 ? parseFloat(annualRate) / 12 : parseFloat(annualRate / 100) / 12;
                var remainingMonths = maturityDate ? libraries.functions.remainingMonths.implementation(maturityDate) : termMonths;
                if (remainingMonths === null || remainingMonths <= 0) {
                    console.log('averagePrincipal: Invalid termMonths or maturityDate. Please provide a valid maturityDate or termMonths.', principal, annualRate, remainingMonths);
                    return 0.00;
                }
                const amortization = isNaN(amortizationMonths) ? remainingMonths : Math.max(amortizationMonths, remainingMonths);
                const payment = libraries.functions.loanPayment.implementation(principal, annualRate, amortization);
                const months = Math.max(Math.min(remainingMonths, 360), 1);
                var principalTemp = parseFloat(principal);
                var principalSum = 0;
                var month = 0;
                while (month < months && principalTemp > 0) {
                    principalSum += principalTemp;
                    principalTemp -= payment - principalTemp * monthlyRate;
                    month++;
                }
                const averagePrincipal = parseFloat(principalSum / months);
                if (averagePrincipal < 0) {
                    console.log('Warning: Average outstanding below zero.');
                }
                return averagePrincipal.toFixed(2);
            }
        },
        loanLossReserve: {
            description: "Calculates the loan loss reserve based on various factors",
            implementation: function(type, principal, annualRate, riskRating, LTV = null, guarantee = null, termMonths = null, amortizationMonths = null, maturityDate = null) {
                //const libraries = window.libraries; // Access the libraries object directly				
                if (parseFloat(principal) <= 0) return 0.00;
                const identifiedType = libraries.functions.identifyType(type, libraries.dictionaries.loanTypeID.values);
                if (identifiedType !== null) {
                    const expectedLoss = libraries.dictionaries.loanDefaultRates.values[identifiedType]; 
                    let riskFactor = 1;
                    if (libraries.dictionaries.loanRiskFactors.values[riskRating]) {
                        riskFactor = libraries.dictionaries.loanRiskFactors.values[riskRating]; 
                    } 
                    let monthlyRate = annualRate < 1 ? parseFloat(annualRate) / 12 : parseFloat(annualRate / 100) / 12;
                    let remainingMonths = maturityDate ? libraries.functions.remainingMonths.implementation(maturityDate) : termMonths;
                    if (remainingMonths === null || remainingMonths <= 0) {
                        console.log('@loanLossReserve: Invalid termMonths or maturityDate. Please provide a valid maturityDate or termMonths.', principal, annualRate, remainingMonths);
                        return 0.00;
                    }   
                    const amortization = isNaN(amortizationMonths) ? remainingMonths : Math.max(amortizationMonths, remainingMonths);
                    const payment = libraries.functions.loanPayment.implementation(principal, annualRate, amortization);
    
                    const months = Math.max(Math.min(remainingMonths, 360), 1);
                    let defaultRecovery = libraries.attributes.defaultRecoveryPerc.value;
                    if (guarantee === 1) {
                        defaultRecovery = defaultRecovery * 1.5;
                    }
                    if (LTV === null) {
                        LTV = 1;
                    }
                    let recoveryValue = principal / LTV * defaultRecovery;
                    let principalTemp = parseFloat(principal);
                    let lossReserve = 0;
                    let month = 0;
                    let exposureAtDefault = principalTemp - recoveryValue; 
                    while (month < months && principalTemp > 0) {
                        if (exposureAtDefault > 0) {
                            lossReserve += expectedLoss * exposureAtDefault / 12;
                        }
                        lossReserve += libraries.attributes.minOperatingRisk.value * principalTemp / 12;
                        principalTemp -= payment - principalTemp * monthlyRate;
                        exposureAtDefault = principalTemp - recoveryValue;
                        month++;
                    }
                    lossReserve = lossReserve / months * 12 * riskFactor;
                    return lossReserve.toFixed(2);
                } else {
                    console.error(`type not found in libraries.dictionaries.loanTypeID.values:${type}.`);
                }   
            }
        },
        originationExpense: {
            description: "Calculates the origination expense based on loan type, principal, and term",
            implementation: function(type, principal, termMonths = null, maturityDate = null) {
                const identifiedType = libraries.functions.identifyType(type, libraries.dictionaries.loanTypeID.values);
                if (identifiedType !== null) {
                    const months = maturityDate ? libraries.functions.remainingMonths.implementation(maturityDate) : termMonths;
                    const originationFactor = libraries.dictionaries.originationFactor.values[identifiedType];
                    const principalCostMax = libraries.dictionaries.principalCostMax.values[identifiedType];
                    const principalCostMin = principalCostMax / 10;
                    let expense = Math.max(principalCostMin, Math.min(principalCostMax, principal)) * originationFactor / Math.max(months, 60) * 12;
                    if (libraries.attributes.organizationEfficiency && libraries.attributes.organizationEfficiency.value !== undefined) {
                        const efficiencyAdjustmenmt =  libraries.attributes.organizationEfficiency.value / libraries.attributes.targetEfficiency.value;
                        expense = efficiencyAdjustmenmt * expense;
                    }
                    return expense.toFixed(2);
                } else {
                    console.error(`type not found in libraries.dictionaries.loanTypeID.values:${type}.`);
                }
            }
        },
        servicingExpense: {
            description: "Calculates the loan servicing expense based on principal and term",
            implementation: function(principal, termMonths = null, maturityDate = null) {
                if (libraries.attributes.loanServicingFactor.value) {
                    const months = maturityDate ? libraries.functions.remainingMonths.implementation(maturityDate) : termMonths;
                    let expense = principal * libraries.attributes.loanServicingFactor.value / months * 12;
                    if (libraries.attributes.organizationEfficiency && libraries.attributes.organizationEfficiency.value !== undefined) {
                        const efficiencyAdjustmenmt =  libraries.attributes.organizationEfficiency.value / libraries.attributes.targetEfficiency.value;
                        expense = efficiencyAdjustmenmt * expense;
                    }
                    return expense.toFixed(2);
                } else {
                    console.log('libaries are missing loanServicingFactor see library docs');
                }
            }
        },
        ddaExpense: {
            description: "Calculates annual maintenance expense of a checking account based on type-indentifier",
            implementation: function(type) {
                const identifiedType = libraries.functions.identifyType(type, libraries.dictionaries.ddaTypeID.values);
                if (identifiedType !== null) {
                    return libraries.dictionaries.ddaAnnualExpense.values[identifiedType].toFixed(2);
                } else {
                    console.error(`type not found for libraries.dictionaries.ddaOpenExpense.values:${type}.`);
                }
            } 
        },
        CDExpense: {
            description: "Calculates annual maintenance and opening expense of certificates of deposit accounts based on type-indentifier",
            implementation: function(type, term) {
                const identifiedType = libraries.functions.identifyType(type, libraries.dictionaries.CDtypeIRA.values);
                if (identifiedType !== null) {
                    const annualExpense = libraries.dictionaries.CDAnnualExpense.values[identifiedType];
                    let openExpense = 0;
                    if (term) {
                        openExpense = libraries.dictionaries.CDOpenExpense.values[identifiedType] / term * 12;
                    } else {
                        console.log('term missing, omitted openExpense');
                    }
                    return (annualExpense + openExpense).toFixed(2);
                } else {
                    console.error(`type not found for libraries.dictionaries.CDtypeIRA.values:${type}.`);
                }
            } 
        },
        chargesIncome: {
            description: "Calculates the deposit account service charges",
            implementation: function(charges, chargesWaived = null, otherCharges = null, otherChargesWaived = null) {
                charges = parseFloat(charges);
                const waived = chargesWaived == null ? 0 : parseFloat(chargesWaived); 
                const other = otherCharges == null ? 0 : parseFloat(otherCharges); 
                const otherWaived = otherChargesWaived == null ? 0 : parseFloat(otherChargesWaived); 
                return (charges - waived + other - otherWaived).toFixed(2);
            }
        },
        fraudLoss: {
            description: "Calculates the deposit account's expected fraud losses",
            implementation: function(balance) {
                return (libraries.attributes.capitalTarget.value * libraries.attributes.fraudLossFactor.value * balance).toFixed(2);
            }
        },
        openedInQuarter: {
            description: "Determines if an account or loan was opened in the last quarter or last 90 days",
            implementation: function(openDate) {
                // Check if openDate is a valid date string
                if (isNaN(Date.parse(openDate))) {
                    console.error('Invalid date format');
                    return false;
                }
                const openDateObj = new Date(openDate);
                const today = new Date();

                const last90 = new Date(today.setDate(today.getDate() - 90));
                
                // Return true if openDate is later than today minus 90 days
                return openDateObj > last90;
            }
        },
        openedInYear: {
            description: "Determines if an account or loan was opened in the last year or last 365 days",
            implementation: function(openDate) {
                // Check if openDate is a valid date string
                if (isNaN(Date.parse(openDate))) {
                    console.error('Invalid date format');
                    return false;
                }
                const openDateObj = new Date(openDate);
                const today = new Date();

                const last365 = new Date(today.setDate(today.getDate() - 365));
                
                // Return true if openDate is later than today minus 365 days
                return openDateObj > last365;
            }
        },
    },
    attributes: {
        loanServicingFactor: {
            description: "The factor used to calculate loan servicing costs",
            value: 0.0025
        },
        defaultRecoveryPerc: {
            description: "The default recovery percentage",
            value: 0.50
        },
        minOperatingRisk: {
            description: "The minimum operating risk percentage",
            value: 0.0015
        },
        depositUnitCost: {
            description: "The unit cost for deposits",
            value: 2
        },
        withdrawalUnitCost: {
            description: "The unit cost for withdrawals",
            value: 0.11
        },
        ddaReserveRequired: {
            description: "The required fed reserve for checking accounts / demand deposit accounts(DDA)",
            value: 0.10
        },
        savingsAnnualExpense: {
            description: "The savings account annual operating costs",
            value: 28
        },
        targetEfficiency: {
            description: "Banking industry target Efficiency Ratio. Efficiency Ratio is calculated by dividing an institution’s operating expenses by its total income and is therefore also referred to as an institution’s 'Cost to Income Ratio'",
            value: 0.60
        }
    },
    dictionaries: {
        originationFactor: {
            description: "Origination factors for different loan types",
            values: {
                "Agriculture": 0.01,
                "Commercial": 0.01, 
                "Commercial Real Estate": 0.015,
                "Residential Real Estate": 0.015,
                "Consumer": 0.0070,
                "Equipment": 0.0085, 
                "Home Equity": 0.015,
                "Letter of Credit": 0.00775,
                "Commercial Line": 0.0080,
                "Commercial CD Secured": 0.0085,
                "Consumer CD Secured": 0.0070,
                "Home Equity Line of Credit": 0.015,
                "Municipal": 0.01,
                "Tax Exempt Commercial": 0.01,
                "Tax Exempt Commercial Real Estate": 0.012
            }
        },
        principalCostMax: {
            description: "Max principal where costs scale with loan size",
            values: {
                "Agriculture": 1500000,
                "Commercial": 1500000,
                "Commercial Real Estate": 2500000,
                "Residential Real Estate": 500000,
                "Consumer": 100000,
                "Equipment": 500000,
                "Home Equity": 200000,
                "Letter of Credit": 1500000,
                "Commercial Line": 1500000,
                "Commercial CD Secured": 1500000,
                "Consumer CD Secured": 100000,
                "Home Equity Line of Credit": 200000,
                "Municipal": 1500000, 
                "Tax Exempt Commercial": 1500000,
                "Tax Exempt Commercial Real Estate": 2500000
            }
        },
        loanDefaultRates: {
            description: "loan default rates by loan classification",
            values: {
                "Agriculture": 0.0013,
                "Commercial": 0.0040,
                "Commercial Real Estate": 0.0024,
                "Residential Real Estate": 0.0012,
                "Consumer": 0.0265,
                "Equipment": 0.0040,
                "Home Equity": 0.0012,
                "Letter of Credit": 0.0040,
                "Commercial Line": 0.0040,
                "Commercial CD Secured": 0.0040,
                "Consumer CD Secured": 0.0265,
                "Home Equity Line of Credit": 0.0012,
                "Municipal": 0.0040, 
                "Tax Exempt Commercial": 0.0040,
                "Tax Exempt Commercial Real Estate": 0.0024
            },
        },
        ddaAnnualExpense: {
            description: "The checking account annual operating costs",
            values: {
                "Consumer": 112,
                "Commercial": 145
            }
        },
        CDAnnualExpense: {
            description: "Certificate of Deposit annual operating costs",
            values: {
                "nonIRA": 31, 
                "IRA": 70
            }
        },
        CDOpenExpense: {
            description: "Certificate of Deposit opening costs",
            values: {
                "nonIRA": 10,
                "IRA": 25
            }
        }
    }
}
window.financial = financial; // Make it globally accessible