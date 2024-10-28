$(document).ready(function() {
  // Function to refresh statistics
  $('#refreshStats').on('click', function() {
      alert('Statistics refreshed!'); 
  });

  // Function to search invoices
  $('#search-input').on('input', function() {
      const query = $(this).val();
      alert('Searching invoices for: ' + query); 
  });

  // Initialize the recent activities section (if you need any custom logic here)
  function loadRecentActivities() {
      // Example for loading recent activities dynamically
  }

  // Function to initialize Chart.js with dynamic data passed from the server
  function initInvoiceChart(chartLabels, chartData) {
      const ctx = document.getElementById('invoiceChart').getContext('2d');
      const invoiceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartLabels,
          datasets: [{
            label: 'Invoices created',
            data: chartData,
            backgroundColor: '#007bff',
            borderColor: '#007bff',
            borderWidth: 1
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

  // Initialize the chart if data is available
  const chartLabels = window.chartLabels || [];
  const chartData = window.chartData || [];
  if (chartLabels.length && chartData.length) {
      initInvoiceChart(chartLabels, chartData);
  }

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
          text: `Invoice #${invoice.invoiceNumber} - ${invoice.buyerName} - ${invoice.totalAmount} MYR`
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

    // Reset the dropdown selection to default after download
    $('#invoiceSelect').val('');
  });

  // Load invoices when the page loads
  loadInvoices();

  // Ensure that animations are triggered after the page is fully loaded
  $('.dashboard-content, .search-bar, .charts').addClass('loaded');
});
