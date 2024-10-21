// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    // Select the form element
    const invoiceForm = document.getElementById('invoiceForm');

    invoiceForm.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent the default form submission

        const formData = new FormData(invoiceForm);
        const data = {};
        let items = [];

        // Convert FormData to a JSON object
        formData.forEach((value, key) => {
            if (key.includes('items')) {
                const [_, index, field] = key.match(/items\[(\d+)\]\[(.+)\]/);
                if (!items[index]) items[index] = {};
                items[index][field] = value;
            } else {
                data[key] = value;
            }
        });

        // Validate the items to ensure each one has required fields
        for (const item of items) {
            if (!item.itemCode || !item.description || !item.quantity || !item.price || parseFloat(item.quantity) <= 0 || parseFloat(item.price) <= 0) {
                alert('Each item must have a code, description, positive quantity, and price.');
                return;  // Stop form submission
            }
        }

        data.items = items;

        try {
            const response = await fetch('/api/invoice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                alert('Invoice created successfully!');
                invoiceForm.reset();
                document.getElementById('totalAmount').innerText = '0 MYR'; // Reset the total amount
            } else {
                alert(`Failed to create invoice: ${result.message}`);
            }
        } catch (error) {
            console.error('Error creating invoice:', error);
            alert('An error occurred while creating the invoice.');
        }
    });

    let itemCount = 0;

    // Function to initialize the item (edit and delete button events)
    function initializeItem(itemDiv) {
        const editButton = itemDiv.querySelector('.edit-btn');
        const deleteButton = itemDiv.querySelector('.delete-btn');
        const quantityInput = itemDiv.querySelector('input[name*="[quantity]"]');
        const priceInput = itemDiv.querySelector('input[name*="[price]"]');
        const taxInput = itemDiv.querySelector('input[name*="[tax]"]');
        const totalInput = itemDiv.querySelector('input[name*="[total]"]');
        const descriptionInput = itemDiv.querySelector('input[name*="[description]"]');
        const codeInput = itemDiv.querySelector('input[name*="[itemCode]"]');

        // Calculate total for the item
        function calculateTotal() {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const tax = parseFloat(taxInput.value) || 0;
            const itemTotal = (quantity * price) + ((tax / 100) * quantity * price);
            totalInput.value = itemTotal.toFixed(2);

            updateGrandTotal(); // Update grand total when item total changes
        }

        // Add event listeners for changes in quantity, price, and tax
        quantityInput.addEventListener('input', calculateTotal);
        priceInput.addEventListener('input', calculateTotal);
        taxInput.addEventListener('input', calculateTotal);

        // Edit/Save functionality
        editButton.addEventListener('click', function () {
            const isSaving = this.getAttribute('data-action') === 'save';
            [quantityInput, priceInput, taxInput, totalInput, descriptionInput, codeInput].forEach(input => input.disabled = isSaving); // Toggle disable on inputs
            this.innerHTML = isSaving ? '<i class="fas fa-pencil-alt"></i>' : '<i class="fas fa-save"></i>'; // Change icon
            this.setAttribute('data-action', isSaving ? 'edit' : 'save');
        });

        // Delete functionality
        deleteButton.addEventListener('click', function () {
            itemDiv.remove(); // Remove the item
            updateGrandTotal(); // Update grand total after item deletion
        });

        // Calculate initial total
        calculateTotal();
    }

    // Function to update the grand total
    function updateGrandTotal() {
        let grandTotal = 0;
        document.querySelectorAll('input[name*="[total]"]').forEach(totalField => {
            grandTotal += parseFloat(totalField.value) || 0;
        });
        document.getElementById('totalAmount').innerText = grandTotal.toFixed(2) + " MYR"; // Update the grand total display
    }

    // Disable all other items when adding a new one
    function disableExistingItems() {
        document.querySelectorAll('.item').forEach(itemDiv => {
            const itemInputs = itemDiv.querySelectorAll('input');
            itemInputs.forEach(input => input.disabled = true); // Disable existing item inputs
            const editButton = itemDiv.querySelector('.edit-btn');
            if (editButton) {
                editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>'; // Reset to edit icon
                editButton.setAttribute('data-action', 'edit');
            }
        });
    }

    // Add new item when Add Item button is clicked
    document.getElementById('addItem').addEventListener('click', () => {
        itemCount++;

        // Disable all other items when adding a new one
        disableExistingItems();

        const newItemDiv = document.createElement('div');
        newItemDiv.className = 'item';
        newItemDiv.innerHTML = `
            <div class="item-fields">
                <input type="text" name="items[${itemCount}][itemCode]" placeholder="Item Code" required>
                <input type="text" name="items[${itemCount}][description]" placeholder="Description" required>
                <input type="number" name="items[${itemCount}][quantity]" placeholder="Quantity" required>
                <input type="number" name="items[${itemCount}][price]" placeholder="Unit Price" required>
                <input type="number" name="items[${itemCount}][tax]" placeholder="Tax (%)" required>
                <input type="text" name="items[${itemCount}][total]" placeholder="Total" readonly>
            </div>
            <div class="item-buttons">
                <button type="button" class="edit-btn" data-action="save"><i class="fas fa-save"></i></button>
                <button type="button" class="delete-btn"><i class="fas fa-trash"></i></button>
            </div>
        `;

        // Append the new item to the items container
        document.getElementById('items').appendChild(newItemDiv);

        // Initialize the new item with event listeners
        initializeItem(newItemDiv);

        // Make sure the new item's inputs are editable right away
        newItemDiv.querySelectorAll('input').forEach(input => input.disabled = false);
    });

    // Initialize the first item if present
    const firstItemDiv = document.querySelector('.item');
    if (firstItemDiv) {
        initializeItem(firstItemDiv);
    }
});
