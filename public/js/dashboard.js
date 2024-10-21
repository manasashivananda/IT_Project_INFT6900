$(document).ready(function() {
  // Function to refresh statistics (example)
  $('#refreshStats').on('click', function() {
      // This is just a placeholder for an actual refresh stats API call
      alert('Statistics refreshed!'); 
      // You can add actual logic here for refreshing statistics, such as making an AJAX call to an endpoint.
  });

  // Function to search invoices
  $('#search-input').on('input', function() {
      const query = $(this).val();
      // Placeholder alert for search functionality
      alert('Searching invoices for: ' + query); 
      // You can implement an API call here for invoice search
  });

  // Initialize the recent activities section (if you need any custom logic here)
  function loadRecentActivities() {
      // If using AJAX to fetch recent activities dynamically, implement it here.
      // For example:
      // $.get('/api/recent-activities', function(data) {
      //   // Render the recent activities dynamically
      // });
  }

  // Function to initialize Chart.js with dynamic data passed from the server
  function initInvoiceChart(chartLabels, chartData) {
      const ctx = document.getElementById('invoiceChart').getContext('2d');
      const invoiceChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: chartLabels,  // Use dynamic labels from the server
          datasets: [{
            label: 'Invoices created',
            data: chartData,    // Use dynamic data from the server
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

  // Assuming chartLabels and chartData are available globally or passed to this script from the server-side template
  const chartLabels = window.chartLabels || [];
  const chartData = window.chartData || [];

  // Initialize the chart with data if it's available
  if (chartLabels.length && chartData.length) {
      initInvoiceChart(chartLabels, chartData);
  }

  // Ensure that animations are triggered after the page is fully loaded
  $('.dashboard-content, .search-bar, .charts').addClass('loaded');
});
