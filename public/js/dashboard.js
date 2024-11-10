$(document).ready(function() {
    // Function to refresh statistics
    $('#refreshStats').on('click', function() {
        $.ajax({
            url: '/api/statistics', // Endpoint for fetching updated statistics
            method: 'GET',
            success: function(data) {
                $('#totalInvoicesCreated').text(data.totalInvoices || 0);
                $('#invoicesDueThisMonth').text(data.dueThisMonth || 0);
                $('#averageInvoiceAmount').text((data.averageInvoiceAmount || 0).toFixed(2));
                $('#totalClients').text(data.totalClients || 0);
                alert('Statistics refreshed!');
            },
            error: function(error) {
                console.error('Error refreshing statistics:', error);
                alert('Failed to refresh statistics.');
            }
        });
    });
  
    // Function to search invoices
    $('#search-input').on('input', function() {
        const query = $(this).val();
        alert('Searching invoices for: ' + query); 
    });
  
    // Load statistics initially
    async function loadStatistics() {
        try {
            const response = await fetch('/api/statistics');
            const stats = await response.json();
            
            console.log("Loaded statistics:", stats); // Log the statistics for debugging
            
            // Check and use averageInvoiceAmount safely
            const averageInvoiceAmount = parseFloat(stats.averageInvoiceAmount) || 0; // Convert to float
            console.log("Parsed Average Invoice Amount:", averageInvoiceAmount); // Debugging log
            
            if (typeof averageInvoiceAmount === 'number' && !isNaN(averageInvoiceAmount)) {
                document.getElementById('averageInvoiceAmount').textContent = averageInvoiceAmount.toFixed(2);
            } else {
                console.error("Average Invoice Amount is not valid:", averageInvoiceAmount);
            }
    
            // Other statistics processing...
        } catch (error) {
            console.error('Error loading statistics:', error);
        }
    }

    // Function to delete the selected invoice
    async function deleteInvoice(invoiceNumber) {
        try {
            const response = await fetch(`/api/invoice/delete/${invoiceNumber}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error deleting invoice');
            }

            alert("Invoice deleted successfully.");
            $('#invoiceSelect option:selected').remove(); // Remove deleted invoice from dropdown
        } catch (error) {
            console.error("Error deleting invoice:", error);
            alert("Error deleting invoice: " + error.message);
        }
    }

    // Function to load the list of invoices into the dropdown
    async function loadInvoices() {
        try {
            const response = await fetch('/api/invoices');
            const invoices = await response.json();
            const invoiceSelect = $('#invoiceSelect');
            invoiceSelect.empty(); // Clear existing options
            invoiceSelect.append('<option value="">Select Invoice to Download or Delete</option>');
            invoices.forEach(invoice => {
                const option = $('<option>', {
                    value: invoice.invoiceNumber,
                    text: `Invoice #${invoice.invoiceNumber}`
                });
                invoiceSelect.append(option);
            });
        } catch (error) {
            console.error('Error loading invoices:', error);
        }
    }

    // Event listener for downloading the selected invoice
    $('#downloadInvoiceButton').on('click', function() {
        const selectedInvoiceNumber = $('#invoiceSelect').val();
        if (!selectedInvoiceNumber) {
            alert('Please select an invoice to download.');
            return;
        }
        // Redirect to download URL
        window.location.href = `/download-invoice-xml/${selectedInvoiceNumber}`;
        $('#invoiceSelect').val(''); // Reset the dropdown selection
    });

    // Event listener for deleting the selected invoice
    $('#deleteInvoiceButton').on('click', function() {
        const selectedInvoiceNumber = $('#invoiceSelect').val();
        if (!selectedInvoiceNumber) {
            alert('Please select an invoice to delete.');
            return;
        }

        const confirmation = confirm("Are you sure you want to delete this invoice?");
        if (!confirmation) {
            return; // Exit if user cancels
        }

        deleteInvoice(selectedInvoiceNumber); // Call deleteInvoice function
    });

    // Load invoices on page load
    loadInvoices();

    // Function to load performance data and initialize charts
    async function loadPerformanceData() {
        try {
            const response = await fetch('/api/performance-data');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            console.log("Performance Data Loaded:", data);

            if (!Array.isArray(data.monthlyInvoices) || !Array.isArray(data.monthlyRevenue) || !Array.isArray(data.monthlyLabels)) {
                console.error("Data structure is not as expected:", data);
                return;
            }
            
            initCharts(data);
        } catch (error) {
            console.error('Error loading performance data:', error);
        }
    }

    function initCharts(data) {
        const monthlyInvoices = data.monthlyInvoices.map(num => Number(num) || 0);
        const monthlyRevenue = data.monthlyRevenue.map(num => Number(num) || 0);

        const ctx1 = document.getElementById('monthlyInvoicesChart').getContext('2d');
        new Chart(ctx1, {
            type: 'bar',
            data: {
                labels: data.monthlyLabels,
                datasets: [{
                    label: 'Invoices Created',
                    data: monthlyInvoices,
                    backgroundColor: '#007bff',
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });

        const ctx2 = document.getElementById('revenueTrendChart').getContext('2d');
        new Chart(ctx2, {
            type: 'line',
            data: {
                labels: data.monthlyLabels,
                datasets: [{
                    label: 'Total Revenue',
                    data: monthlyRevenue,
                    backgroundColor: 'rgba(0, 123, 255, 0.5)',
                    borderColor: '#007bff',
                    fill: true
                }]
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }
   
    // Function to load recent activities
    async function loadRecentActivities() {
        try {
            const response = await fetch('/api/recent-activities?' + new Date().getTime());  // Cache-busting timestamp
            if (!response.ok) throw new Error('Failed to fetch recent activities.');
            
            const recentInvoices = await response.json();
            console.log('Recent Invoices:', recentInvoices);  // Log the full response for debugging
    
            // Sort the invoices by issueDate to show the latest first
            recentInvoices.sort((a, b) => new Date(b.issueDate) - new Date(a.issueDate));
    
            const recentActivitiesContainer = $('#recent-activities');
            
            // Clear existing activities
            recentActivitiesContainer.empty();
            console.log('Container cleared');
            
            // Check if there are recent invoices
            if (recentInvoices.length === 0) {
                recentActivitiesContainer.append('<p>No recent activities available.</p>');
            } else {
                recentInvoices.forEach(invoice => {
                    const date = new Date(invoice.issueDate);
                    
                    // Check if the date is valid
                    if (isNaN(date)) {
                        console.log(`Invalid date for invoice #${invoice.invoiceNumber}`);
                        return;  // Skip this invoice if the date is invalid
                    }
    
                    // Format the date if valid
                    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const invoiceNumber = invoice.invoiceNumber || "Unknown Number";
                    const activityText = `🧾 Invoice #${invoiceNumber} created on ${formattedDate}`;
                    
                    const activityElement = $('<p>').text(activityText);
                    recentActivitiesContainer.append(activityElement);
                });
            }
        } catch (error) {
            console.error('Error loading recent activities:', error);
            $('#recent-activities').append('<p>Unable to load recent activities.</p>');
        }
    }
    

    // Load recent activities when the page loads
    loadRecentActivities();


    // Load other data on page load
    loadStatistics();
    loadPerformanceData();
});