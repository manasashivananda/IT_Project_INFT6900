$(document).ready(function() {
  // Function to refresh statistics
  $('#refreshStats').on('click', function() {
      $.ajax({
          url: '/api/statistics', // Endpoint for fetching updated statistics
          method: 'GET',
          success: function(data) {
              $('#totalInvoicesCreated').text(data.totalInvoices || 0);
              $('#invoicesDueThisMonth').text(data.dueThisMonth || 0);
              $('#averageInvoiceAmount').text((data.averageInvoiceAmount || 0).toFixed(2) + ' MYR');
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
          $('#totalInvoicesCreated').text(stats.totalInvoices || 0);
          $('#invoicesDueThisMonth').text(stats.dueThisMonth || 0);
          $('#averageInvoiceAmount').text((stats.averageInvoiceAmount || 0).toFixed(2) + ' MYR');
          $('#totalClients').text(stats.totalClients || 0);
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
      $('#invoiceSelect').val(''); // Reset the dropdown selection
  });
});

$(document).ready(function() {
  // Load and initialize charts with performance data from the server
  async function loadPerformanceData() {
      try {
          const response = await fetch('/api/performance-data');
          const data = await response.json();
          console.log(data);
          // Initialize charts with real data
          initCharts(data);
      } catch (error) {
          console.error('Error loading performance data:', error);
      }
  }

  function initCharts(data) {
      // Monthly Invoices Created
      const ctx1 = document.getElementById('monthlyInvoicesChart').getContext('2d');
      new Chart(ctx1, {
          type: 'bar',
          data: {
              labels: data.monthlyLabels,
              datasets: [{
                  label: 'Invoices Created',
                  data: data.monthlyInvoices,
                  backgroundColor: '#007bff',
              }]
          }
      });

      // Revenue Trends
      const ctx2 = document.getElementById('revenueTrendChart').getContext('2d');
      new Chart(ctx2, {
          type: 'line',
          data: {
              labels: data.monthlyLabels,
              datasets: [{
                  label: 'Total Revenue',
                  data: data.monthlyRevenue,
                  backgroundColor: 'rgba(0, 123, 255, 0.5)',
                  borderColor: '#007bff',
                  fill: true
              }]
          }
      });

  }

  // Load performance data when the page loads
  loadPerformanceData();
});

 
    
     
  


 

 

