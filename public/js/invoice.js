// Wait until the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Select the form element
        const invoiceForm = document.getElementById('invoiceForm');

        // Listen for the form's submit event
        invoiceForm.addEventListener('submit', async (e) => {
            e.preventDefault(); // Prevent the default form submission

            // Create a FormData object to hold the form values
            const formData = new FormData(invoiceForm);

            // Convert FormData to a JSON object
            const data = {};
            formData.forEach((value, key) => {
                if (key.includes('items')) {
                    // Handle nested items separately
                    const [_, index, field] = key.match(/items\[(\d+)\]\[(.+)\]/);
                    if (!data.items) data.items = [];
                    if (!data.items[index]) data.items[index] = {};
                    data.items[index][field] = value;
                } else {
                    data[key] = value;
                }
            });

            try {
                // Send a POST request to the server to create the invoice
                const response = await fetch('/api/invoice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data),
                });

                // Parse the response
                const result = await response.json();

                // Check if the response is successful
                if (response.ok) {
                    alert('Invoice created successfully!');
                    // Optional: Reset the form
                    invoiceForm.reset();
                } else {
                    alert(`Failed to create invoice: ${result.message}`);
                }
            } catch (error) {
                console.error('Error creating invoice:', error);
                alert('An error occurred while creating the invoice.');
            }
        });
    });


    // JavaScript to dynamically add, edit, and delete item fields
    // Wait until the DOM is fully loaded
    document.addEventListener('DOMContentLoaded', () => {
        let itemCount = 0;
    
        // Function to initialize the item (edit and delete button events)
        function initializeItem(itemDiv) {
            const editButton = itemDiv.querySelector('.edit-btn');
            const deleteButton = itemDiv.querySelector('.delete-btn');
            const itemInputs = itemDiv.querySelectorAll('input');
    
            // Edit/Save functionality
            editButton.addEventListener('click', function () {
                const isSaving = this.getAttribute('data-action') === 'save';
                itemInputs.forEach(input => input.disabled = isSaving); // Toggle disable on inputs
                this.innerHTML = isSaving ? '<i class="fas fa-pencil-alt"></i>' : '<i class="fas fa-save"></i>'; // Change icon
                this.setAttribute('data-action', isSaving ? 'edit' : 'save');
            });
    
            // Delete functionality
            deleteButton.addEventListener('click', function () {
                itemDiv.remove(); // Remove the item
            });
        }
    
        // Ensure first existing item is in editable mode on page load
        const firstItemDiv = document.querySelector('.item');
        if (firstItemDiv) {
            initializeItem(firstItemDiv); // Initialize first item on page load
            const firstItemInputs = firstItemDiv.querySelectorAll('input');
            firstItemInputs.forEach(input => input.disabled = false); // Ensure inputs are editable initially
        }
    
        // Add new item when Add Item button is clicked
        document.getElementById('addItem').addEventListener('click', () => {
            itemCount++;
    
            // Disable all other items when adding a new one
            document.querySelectorAll('.item input').forEach(input => input.disabled = true);
    
            const newItemDiv = document.createElement('div');
            newItemDiv.className = 'item';
            newItemDiv.innerHTML = `
                <div class="item-fields">
                    <input type="text" name="items[${itemCount}][itemName]" placeholder="Item Name" required>
                    <input type="number" name="items[${itemCount}][quantity]" placeholder="Quantity" required>
                    <input type="number" name="items[${itemCount}][price]" placeholder="Price" required>
                    <input type="number" name="items[${itemCount}][total]" placeholder="Total" required>
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
    });
    
    