document.addEventListener('DOMContentLoaded', () => {
    const invoiceForm = document.getElementById('invoiceForm');

    invoiceForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData(invoiceForm);
        const data = {};
        let items = [];

        // Convert FormData to a JSON object
        formData.forEach((value, key) => {
            console.log(`Processing Field Key: ${key}, Field Value: ${value}`); // Debug each field and value

            if (key.startsWith('items')) {
                const match = key.match(/items\[(\d+)\]\[(.+)\]/);
                if (match) {
                    const index = match[1];
                    const field = match[2];

                    // Initialize item index if it doesn't exist
                    if (!items[index]) items[index] = {};

                    // Assign the field value to the appropriate item object
                    items[index][field] = value;
                }
            } else {
                data[key] = value;
            }
        });

        // Debugging - check parsed items array before validation
        console.log("Parsed items array before filtering:", items);

        // Validate items: ensure we have at least one valid item
        items = items.filter(item => item.itemCode && item.description && parseFloat(item.quantity) > 0 && parseFloat(item.price) > 0);

        console.log("Filtered items array after validation:", items);

        if (items.length === 0) {
            alert("Please add at least one item with valid details.");
            return;
        }

        // Final data structure with items included
        data.items = items;

        // Debug log to check the final data structure before sending to the server
        console.log("Data object before submission:", data);

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

    // Other functions like initializeItem, updateGrandTotal, disableExistingItems, etc.



    let itemCount = 0;

    function initializeItem(itemDiv) {
        const editButton = itemDiv.querySelector('.edit-btn');
        const deleteButton = itemDiv.querySelector('.delete-btn');
        const quantityInput = itemDiv.querySelector('input[name*="[quantity]"]');
        const priceInput = itemDiv.querySelector('input[name*="[price]"]');
        const taxInput = itemDiv.querySelector('input[name*="[tax]"]');
        const totalInput = itemDiv.querySelector('input[name*="[total]"]');
        const descriptionInput = itemDiv.querySelector('input[name*="[description]"]');
        const codeInput = itemDiv.querySelector('input[name*="[itemCode]"]');

        function calculateTotal() {
            const quantity = parseFloat(quantityInput.value) || 0;
            const price = parseFloat(priceInput.value) || 0;
            const tax = parseFloat(taxInput.value) || 0;
            const itemTotal = (quantity * price) + ((tax / 100) * quantity * price);
            totalInput.value = itemTotal.toFixed(2);
            updateGrandTotal();
        }

        quantityInput.addEventListener('input', calculateTotal);
        priceInput.addEventListener('input', calculateTotal);
        taxInput.addEventListener('input', calculateTotal);

        editButton.addEventListener('click', function () {
            const isSaving = this.getAttribute('data-action') === 'save';
            [quantityInput, priceInput, taxInput, totalInput, descriptionInput, codeInput].forEach(input => input.disabled = isSaving);
            this.innerHTML = isSaving ? '<i class="fas fa-pencil-alt"></i>' : '<i class="fas fa-save"></i>';
            this.setAttribute('data-action', isSaving ? 'edit' : 'save');
        });

        deleteButton.addEventListener('click', function () {
            itemDiv.remove();
            updateGrandTotal();
        });

        calculateTotal();
    }

    function updateGrandTotal() {
        let grandTotal = 0;
        document.querySelectorAll('input[name*="[total]"]').forEach(totalField => {
            grandTotal += parseFloat(totalField.value) || 0;
        });
        document.getElementById('totalAmount').innerText = grandTotal.toFixed(2) + " MYR";
    }

    function disableExistingItems() {
        document.querySelectorAll('.item').forEach(itemDiv => {
            const itemInputs = itemDiv.querySelectorAll('input');
            itemInputs.forEach(input => input.disabled = true);
            const editButton = itemDiv.querySelector('.edit-btn');
            if (editButton) {
                editButton.innerHTML = '<i class="fas fa-pencil-alt"></i>';
                editButton.setAttribute('data-action', 'edit');
            }
        });
    }

    document.getElementById('addItem').addEventListener('click', () => {
        itemCount++;

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

        document.getElementById('items').appendChild(newItemDiv);
        initializeItem(newItemDiv);
        newItemDiv.querySelectorAll('input').forEach(input => input.disabled = false);
    });

    const firstItemDiv = document.querySelector('.item');
    if (firstItemDiv) {
        initializeItem(firstItemDiv);
    }
});
