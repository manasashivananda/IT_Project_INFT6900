function showCustomTaxField(selectElement) {
    const customTaxContainer = document.getElementById("customTaxTypeContainer");
    const customTaxInput = document.getElementById("customTaxType");

    // Show or hide the entire container based on "Other" selection
    if (selectElement.value === "Other") {
        customTaxContainer.style.display = "block";
        customTaxInput.disabled = false;
    } else {
        customTaxContainer.style.display = "none";
        customTaxInput.value = "";
        customTaxInput.disabled = true;
    }
}

function generateInvoiceNumber() {
    const now = new Date();
    const year = now.getFullYear(); // Current year (e.g., 2024)
    const month = (now.getMonth() + 1).toString().padStart(2, '0'); // Current month (e.g., 11)

    // Retrieve the last used sequence number from localStorage
    let invoiceSequence = localStorage.getItem('invoiceSequence');

    if (!invoiceSequence) {
        // If no sequence number is found, start with 1
        invoiceSequence = 1;
    } else {
        // Increment the sequence number
        invoiceSequence = parseInt(invoiceSequence) + 1;
    }

    // Store the updated sequence number back to localStorage
    localStorage.setItem('invoiceSequence', invoiceSequence);

    // Return the formatted invoice number (INV-YYYY-MM-XXXX)
    return `INV-${year}-${month}-${invoiceSequence.toString().padStart(4, '0')}`;
}




// Save the selected tax type to localStorage when changed
document.getElementById("taxType").addEventListener("change", function () {
    localStorage.setItem("selectedTaxType", this.value);
});

// Retrieve and set the selected tax type on page load
window.onload = function () {
    const savedTax = localStorage.getItem("selectedTaxType");
    if (savedTax) {
        document.getElementById("taxType").value = savedTax;
        showCustomTaxField(document.getElementById("taxType"));
    }
};

// Function to calculate totals dynamically for each item row and the overall totals
document.addEventListener("DOMContentLoaded", () => {
    const addItemButton = document.getElementById("addItem");
    const itemsContainer = document.getElementById("items");

    // Initialize any existing rows on page load
    initializeItemButtons(document.querySelectorAll(".item"));

    // Event listener to add a new item row
    addItemButton.addEventListener("click", addItemRow);

    // Attach event listeners for totals calculation
    document.getElementById("additionalFee").addEventListener("input", calculateTotals);
    document.getElementById("discount").addEventListener("input", calculateTotals);
    document.getElementById("taxPercentage").addEventListener("input", calculateTotals); // Add listener for tax percentage change
});

// Function to add a new item row with functionality
function addItemRow() {
    const itemsContainer = document.getElementById("items");

    // Disable all existing items before adding a new one
    disableAllItems();

    // Create a new item row with HTML structure
    const newItem = document.createElement("div");
    newItem.classList.add("item");
    newItem.innerHTML = `
        <div class="item-fields">
            <input type="text" name="itemCode" placeholder="Item Code" required>
            <input type="text" name="description" placeholder="Description" required>
            <input type="number" name="quantity" placeholder="Quantity" required>
            <input type="number" name="price" placeholder="Unit Price" required>
            <label>Taxable <input type="checkbox" name="isTaxable" onchange="toggleTaxField(this)"></label>
            <input type="number" name="taxAmount" placeholder="Tax (%)" class="tax-field" style="display: none;" disabled>
            <input type="text" name="lineTotal" placeholder="Line Total" readonly>
        </div>
        <div class="item-buttons">
            <button type="button" class="edit-btn" data-action="save"><i class="fas fa-save"></i></button>
            <button type="button" class="delete-btn"><i class="fas fa-trash"></i></button>
        </div>
    `;

    // Append the new item row
    itemsContainer.appendChild(newItem);

    // Initialize functionality for the new row
    initializeItemButtons([newItem]);

    // Call calculateTotals after adding a new item
    calculateTotals();
}

// Function to calculate the totals
function calculateTotals() {
    const additionalFee = parseFloat(document.getElementById("additionalFee").value) || 0;
    const discount = parseFloat(document.getElementById("discount").value) || 0;
    const overallTaxPercentage = parseFloat(document.getElementById("taxPercentage").value) || 0;

    let totalTax = 0;
    let totalLineAmount = 0; // Initialize total line amount to calculate grand total
    const items = document.querySelectorAll(".item");

    items.forEach(item => {
        const quantityInput = item.querySelector("input[name='quantity']");
        const priceInput = item.querySelector("input[name='price']");
        const lineTotalInput = item.querySelector("input[name='lineTotal']");
        const taxCheckbox = item.querySelector("input[name='isTaxable']");
        const taxInput = item.querySelector("input[name='taxAmount']");

        const quantity = parseFloat(quantityInput.value) || 0;
        const unitPrice = parseFloat(priceInput.value) || 0;

        // Calculate line total
        let lineTotal = quantity * unitPrice;
        lineTotalInput.value = lineTotal.toFixed(2); // Update line total display

        totalLineAmount += lineTotal;

        // Calculate tax for taxable items
        if (taxCheckbox.checked && taxInput.value) {
            const itemTaxPercentage = parseFloat(taxInput.value) || 0;
            const itemTaxAmount = (lineTotal * itemTaxPercentage) / 100; // Calculate tax for this item
            totalTax += itemTaxAmount; // Add item tax to total tax
        }
    });

    // Calculate overall tax based on total line amount
    totalTax += (totalLineAmount * overallTaxPercentage) / 100; // Include overall tax

    // Update the Total Tax field
    document.getElementById("taxTotal").value = totalTax.toFixed(2);

    // Calculate Grand Total as: Total Line Amount + Total Tax + Additional Fees - Discounts
    const grandTotal = totalLineAmount + totalTax + additionalFee - discount;
    document.getElementById("grandTotal").value = grandTotal.toFixed(2);

    // Update the displayed total amount with the selected currency
    const currencyCode = document.getElementById("currencyCode").value; // Get selected currency
    const customCurrencyCode = document.getElementById("customCurrencyCode").value; // Get custom currency if applicable

    // Use custom currency if selected
    const displayCurrency = (currencyCode === "Other" && customCurrencyCode) ? customCurrencyCode : currencyCode;

    // Assuming you have a way to get the symbol based on the currency
    const currencySymbol = getCurrencySymbol(displayCurrency); // Function to map currency code to symbol

    const totalAmountDisplay = document.getElementById("totalAmount");
    totalAmountDisplay.textContent = `${currencySymbol} ${grandTotal.toFixed(2)} (${displayCurrency})`; // Display total amount with currency
}

// Function to map currency codes to symbols
function getCurrencySymbol(currencyCode) {
    switch (currencyCode) {
        case 'USD':
            return '$';
        case 'EUR':
            return '€';
        case 'MYR':
            return 'RM';
        case 'IND':
            return '₹';
        case 'AUD':
            return 'A$';
        default:
            return '';
    }
}

// Function to disable all items in the items container
function disableAllItems() {
    const allItems = document.querySelectorAll(".item");
    allItems.forEach(item => {
        const inputs = item.querySelectorAll("input, select");
        inputs.forEach(input => {
            input.disabled = true;
            input.classList.add("disabled");
        });
        const editButton = item.querySelector(".edit-btn");
        if (editButton) {
            editButton.dataset.action = "edit";
            editButton.innerHTML = `<i class="fas fa-edit"></i>`;
        }
    });
}

// Function to initialize event listeners for save/edit, delete, and line total calculation
function initializeItemButtons(rows) {
    rows.forEach(row => {
        const editButton = row.querySelector(".edit-btn");
        const deleteButton = row.querySelector(".delete-btn");
        const quantityInput = row.querySelector("input[name='quantity']");
        const priceInput = row.querySelector("input[name='price']");
        const lineTotalInput = row.querySelector("input[name='lineTotal']");
        const taxCheckbox = row.querySelector("input[name='isTaxable']");
        const taxInput = row.querySelector("input[name='taxAmount']");

        // Attach event listeners for save/edit and delete actions
        if (editButton) {
            editButton.addEventListener("click", () => handleSaveEdit(row, editButton));
        }
        if (deleteButton) {
            deleteButton.addEventListener("click", () => {
                deleteRow(row);
                calculateTotals(); // Recalculate totals after deletion
            });
        }

        // Add event listeners for quantity, price, and tax inputs to calculate line total
        if (quantityInput && priceInput && lineTotalInput) {
            quantityInput.addEventListener("input", () => {
                calculateLineTotal(quantityInput, priceInput, taxCheckbox, taxInput, lineTotalInput);
                calculateTotals(); // Recalculate totals on quantity input change
            });
            priceInput.addEventListener("input", () => {
                calculateLineTotal(quantityInput, priceInput, taxCheckbox, taxInput, lineTotalInput);
                calculateTotals(); // Recalculate totals on price input change
            });
        }

        // Add event listener for tax checkbox and tax input field
        if (taxCheckbox) {
            taxCheckbox.addEventListener("change", () => {
                calculateLineTotal(quantityInput, priceInput, taxCheckbox, taxInput, lineTotalInput);
                calculateTotals(); // Recalculate totals on tax checkbox change
            });
        }
        if (taxInput) {
            taxInput.addEventListener("input", () => {
                calculateLineTotal(quantityInput, priceInput, taxCheckbox, taxInput, lineTotalInput);
                calculateTotals(); // Recalculate totals on tax input change
            });
        }

        // Calculate line total for existing items on page load
        calculateLineTotal(quantityInput, priceInput, taxCheckbox, taxInput, lineTotalInput);
    });
}

// Function to calculate the line total based on quantity, unit price, and tax
function calculateLineTotal(quantityInput, priceInput, taxCheckbox, taxInput, lineTotalInput) {
    if (!quantityInput || !priceInput || !lineTotalInput) {
        console.error("One or more inputs are missing.");
        return;
    }

    const quantity = parseFloat(quantityInput.value) || 0;
    const unitPrice = parseFloat(priceInput.value) || 0;
    let lineTotal = quantity * unitPrice;

    lineTotalInput.value = lineTotal.toFixed(2); // Update line total display


}

// Function to toggle between save and edit states
function handleSaveEdit(itemRow, button) {
    const inputs = itemRow.querySelectorAll("input, select");

    if (button.dataset.action === "save") {
        inputs.forEach(input => {
            input.disabled = true;
            input.classList.add("disabled");
        });
        button.innerHTML = `<i class="fas fa-edit"></i>`;
        button.dataset.action = "edit";
    } else {
        inputs.forEach(input => {
            input.disabled = false;
            input.classList.remove("disabled");
        });
        button.innerHTML = `<i class="fas fa-save"></i>`;
        button.dataset.action = "save";
    }
}

// Function to delete a row
function deleteRow(row) {
    row.remove();
}

// Function to show/hide tax field based on 'Taxable' checkbox
function toggleTaxField(checkbox) {
    const taxField = checkbox.closest(".item-fields").querySelector(".tax-field");

    if (checkbox.checked) {
        taxField.style.display = "inline-block";
        taxField.disabled = false;
        taxField.focus();
    } else {
        taxField.style.display = "none";
        taxField.value = "";
        taxField.disabled = true;
    }
}

// Show custom currency field if "Other" is selected
function showCustomCurrencyField(selectElement) {
    const customCurrencyField = document.getElementById("customCurrencyCode");

    // Show the custom currency field if "Other" is selected
    if (selectElement.value === "Other") {
        customCurrencyField.style.display = "block";
    } else {
        customCurrencyField.style.display = "none";
        customCurrencyField.value = ""; // Clear the custom field if not needed
    }
}

// Save the selected currency to localStorage when changed
document.getElementById("currencyCode").addEventListener("change", function () {
    localStorage.setItem("selectedCurrency", this.value);
});

// Retrieve and set the selected currency on page load
window.onload = function () {

    // Set the auto-generated invoice number
    document.getElementById("invoiceNumber").value = generateInvoiceNumber();
    const currencySelect = document.getElementById("currencyCode");
    const savedCurrency = localStorage.getItem("selectedCurrency");

    // If there is a saved currency, show it but don't set it as selected
    if (savedCurrency) {
        currencySelect.value = ""; // This keeps it as "Select Currency"
        showCustomCurrencyField(currencySelect);
        calculateTotals();
        currencySelect.value = "";
        showCustomCurrencyField(currencySelect);
    }
};
// Form submission handling
document.getElementById('invoiceForm').addEventListener('submit', function (event) {
    event.preventDefault(); // Prevent the default form submission

    const items = [];
    document.querySelectorAll('#items .item').forEach(item => {
        const itemCode = item.querySelector('input[name="itemCode"]').value;
        const description = item.querySelector('input[name="description"]').value;
        const quantity = parseFloat(item.querySelector('input[name="quantity"]').value);
        const priceAmount = parseFloat(item.querySelector('input[name="price"]').value);
        const isTaxable = item.querySelector('input[name="isTaxable"]').checked;
        const taxAmount = isTaxable ? parseFloat(item.querySelector('input[name="taxAmount"]').value) || 0 : 0;


        // Get the tax type code from the dropdown or input
        const taxTypeCode = isTaxable ? document.getElementById("taxType").value : "No Tax"; // Define taxTypeCode here


        // Calculate line total amount
        const lineTotalAmount = (quantity * priceAmount) + (isTaxable ? (taxAmount / 100 * (quantity * priceAmount)) : 0);

        // Ensure required fields are filled before pushing to items array
        if (itemCode && description && quantity > 0 && priceAmount > 0) {
            items.push({
                itemCode,
                description,
                quantity,
                price: {
                    priceAmount,
                    baseQuantity: 1,
                    currencyCode: "USD"
                },
                isTaxable,
                tax: {
                    taxTypeCode: taxTypeCode,
                    taxAmount,
                    taxPercent: isTaxable ? (taxAmount / lineTotalAmount) * 100 : 0
                },
                lineTotalAmount,
            });
        }
    });

    // Collect taxType from the dropdown
    const taxType = document.getElementById("taxType").value;

    // Check if there are items before proceeding
    if (items.length === 0) {
        alert("Please add at least one item to the invoice.");
        return;
    }
    // Updated address structure for supplier and buyer
    const supplierAddress = {
        streetName: document.getElementById("supplierStreet").value,
        cityName: document.getElementById("supplierCity").value,
        postalZone: document.getElementById("supplierPostal").value,
        country: document.getElementById("supplierCountry").value
    };

    const buyerAddress = {
        streetName: document.getElementById("buyerStreet").value,
        cityName: document.getElementById("buyerCity").value,
        postalZone: document.getElementById("buyerPostal").value,
        country: document.getElementById("buyerCountry").value
    };

    const formData = {
        invoiceNumber: document.getElementById("invoiceNumber").value,
        issueDate: document.getElementById("invoiceDate").value,
        dueDate: document.getElementById("dueDate").value,
        currencyCode: document.getElementById("currencyCode").value,
        businessName: document.getElementById("businessName").value,
        ssmNumber: document.getElementById("ssmNumber").value,
        taxNumber: document.getElementById("taxNumber").value,
        supplierAddress,
        buyerName: document.getElementById("buyerName").value,
        buyerAddress,
        additionalFee: parseFloat(document.getElementById("additionalFee").value) || 0,
        discount: parseFloat(document.getElementById("discount").value) || 0,
        items,
        taxType // Include taxType here
    };

    localStorage.setItem('invoiceData', JSON.stringify(formData));

    // Log the formData for debugging
    console.log("Form Data:", JSON.stringify(formData, null, 2));

    fetch('/api/invoice', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
    })
        .then(response => {
            if (!response.ok) {
                return response.json().then(errData => {
                    throw new Error(`HTTP error! status: ${response.status}, message: ${errData.message}`);
                });
            }
            return response.json();
        })

        .then(data => {
            console.log("Response Data:", data); // Log the entire response data

            // Check if `data` has the expected structure and properties
            if (data && data.invoice && data.invoice.invoiceNumber && data.invoice._id) {
                console.log('Invoice Created:', data);
                console.log('Invoice ID:', data.invoice._id);

                // Redirect to the success page with query parameters
                window.location.href = `/invoice-success?invoiceNumber=${data.invoice.invoiceNumber}&invoiceId=${data.invoice._id}`;
            } else {
                // Log an error if the expected properties are not found
                console.error("Invoice number or ID not found in response:", data);
            }
        })
        .catch(error => {
            console.error('Error:', error.message);
            alert(error.message);
        });

    async function updateInvoice(invoiceId, updatedData) {
        try {
            const response = await fetch(`/api/invoice/${invoiceId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),  // Send the updated invoice data as JSON
            });

            if (!response.ok) {
                throw new Error('Failed to update the invoice');
            }

            const updatedInvoice = await response.json();
            console.log('Updated invoice:', updatedInvoice);
            return updatedInvoice;
        } catch (error) {
            console.error('Error:', error);
        }
    }

    function deleteInvoice(invoiceId) {
        fetch(`http://localhost:3000/api/invoice/delete/${invoiceId}`, {
            method: 'DELETE', // Make sure this is set to 'DELETE'
            headers: {
                'Content-Type': 'application/json'
            }
        })
            .then(response => {
                if (!response.ok) {
                    return response.json().then(errorData => {
                        throw new Error(`Error: ${errorData.message}`);
                    });
                }
                return response.json();
            })
            .then(data => {
                console.log("Invoice deleted successfully:", data);
            })
            .catch(error => {
                console.error("Error deleting invoice:", error);
            });
    }

});
