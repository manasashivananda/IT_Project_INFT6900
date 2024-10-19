// $(document).ready(function () {
//   $("#refreshStats").click(function () {
//     // Simulating an AJAX call to refresh stats
//     alert("Refreshing statistics...");
//     // You can add an actual AJAX call here to fetch new statistics
//   });
// });

$(document).ready(function() {
  // Function to refresh statistics (example)
  $('#refreshStats').on('click', function() {
      alert('Statistics refreshed!'); // You can implement an API call here
  });

  // Search invoices function
  function searchInvoices() {
      const query = $('#search-input').val();
      alert('Searching invoices for: ' + query); // You can implement an API call here
  }
});

$(document).ready(function() {
  $('.dashboard-content, .search-bar, .charts').addClass('loaded');
});
