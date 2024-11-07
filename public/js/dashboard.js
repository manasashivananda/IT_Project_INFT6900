
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
    
  
    // Initialize statistics and loadInvoices
    loadStatistics();
    loadInvoices();
  
    // Load and display list of invoices for download
    async function loadInvoices() {
        try {
            const response = await fetch('/api/invoices');
            const invoices = await response.json();
            const invoiceSelect = $('#invoiceSelect');
            invoiceSelect.empty(); // Clear existing options
            invoiceSelect.append('<option value="">Select Invoice to Download</option>');
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
  
    // Trigger invoice download
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
  });
  
  $(document).ready(function() {
    async function loadPerformanceData() {
        try {
            const response = await fetch('/api/performance-data');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            console.log("Performance Data Loaded:", data);
            initCharts(data);
        } catch (error) {
            console.error('Error loading performance data:', error);
        }
    }

    function initCharts(data) {
        // Ensure that all data points are numbers
        const monthlyInvoices = data.monthlyInvoices.map(Number);
        const monthlyRevenue = data.monthlyRevenue.map(Number);

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

    loadPerformanceData();
});
