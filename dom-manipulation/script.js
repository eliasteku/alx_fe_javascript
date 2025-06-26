let quotes = [];
let selectedCategory = 'all'; 

// Simulated server URL (replace with your real API if you have one)
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // Example placeholder URL

// Load quotes from local storage or initialize default quotes
function loadQuotes() {
  const savedQuotes = localStorage.getItem('quotes');
  if (savedQuotes) {
    quotes = JSON.parse(savedQuotes);
  } else {
    quotes = [
      { text: "The best way to get started is to quit talking and begin doing.", category: "Motivation" },
      { text: "Your time is limited, so don’t waste it living someone else’s life.", category: "Life" },
      { text: "If life were predictable it would cease to be life.", category: "Philosophy" }
    ];
    saveQuotes();
  }
}

// Save quotes array to local storage
function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

// Get unique categories from quotes
function getUniqueCategories() {
  const categories = new Set(quotes.map(q => q.category));
  return Array.from(categories).sort();
}

// Populate category dropdown dynamically
function populateCategories() {
  const select = document.getElementById('categoryFilter');
  select.innerHTML = '<option value="all">All Categories</option>';

  const categories = getUniqueCategories();
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  const lastFilter = localStorage.getItem('lastSelectedCategory');
  if (lastFilter && (lastFilter === 'all' || categories.includes(lastFilter))) {
    selectedCategory = lastFilter;
    select.value = lastFilter;
  } else {
    selectedCategory = 'all';
    select.value = 'all';
  }
}

// Filter quotes based on selected category and display a random one
function filterQuotes() {
  selectedCategory = document.getElementById('categoryFilter').value;
  localStorage.setItem('lastSelectedCategory', selectedCategory);

  const filteredQuotes = selectedCategory === 'all' ? quotes : quotes.filter(q => q.category === selectedCategory);
  
  if (filteredQuotes.length === 0) {
    document.getElementById('quoteDisplay').innerHTML = '<p>No quotes found for this category.</p>';
    return;
  }

  const randomIndex = Math.floor(Math.random() * filteredQuotes.length);
  const quote = filteredQuotes[randomIndex];
  document.getElementById('quoteDisplay').innerHTML = `
    <p><strong>Quote:</strong> ${quote.text}</p>
    <p><em>Category:</em> ${quote.category}</p>
  `;

  sessionStorage.setItem('lastFilteredQuoteIndex', randomIndex);
  sessionStorage.setItem('lastFilteredCategory', selectedCategory);
}

// Show random quote according to filter
function showRandomQuote() {
  filterQuotes();
}

// Show last displayed quote (if any)
function showLastQuote() {
  const lastCategory = sessionStorage.getItem('lastFilteredCategory') || 'all';
  const lastIndex = sessionStorage.getItem('lastFilteredQuoteIndex');
  const filteredQuotes = lastCategory === 'all' ? quotes : quotes.filter(q => q.category === lastCategory);

  if (filteredQuotes.length === 0) {
    document.getElementById('quoteDisplay').innerHTML = '<p>No quotes available.</p>';
    return;
  }

  let index = 0;
  if (lastIndex !== null && filteredQuotes[lastIndex]) {
    index = lastIndex;
  }

  const quote = filteredQuotes[index];
  document.getElementById('quoteDisplay').innerHTML = `
    <p><strong>Quote:</strong> ${quote.text}</p>
    <p><em>Category:</em> ${quote.category}</p>
  `;

  selectedCategory = lastCategory;
  document.getElementById('categoryFilter').value = lastCategory;
}

// Add a new quote and update storage and UI
function addQuote() {
  const text = document.getElementById('newQuoteText').value.trim();
  const category = document.getElementById('newQuoteCategory').value.trim();

  if (text && category) {
    quotes.push({ text, category });
    saveQuotes();
    populateCategories();
    alert("New quote added!");
    document.getElementById('newQuoteText').value = '';
    document.getElementById('newQuoteCategory').value = '';

    showRandomQuote();
  } else {
    alert("Please fill in both fields.");
  }
}

// Create form dynamically (if needed)
function createAddQuoteForm() {
  const formContainer = document.createElement('div');

  const quoteInput = document.createElement('input');
  quoteInput.id = 'newQuoteText';
  quoteInput.placeholder = 'Enter a new quote';
  quoteInput.type = 'text';

  const categoryInput = document.createElement('input');
  categoryInput.id = 'newQuoteCategory';
  categoryInput.placeholder = 'Enter quote category';
  categoryInput.type = 'text';

  const addButton = document.createElement('button');
  addButton.textContent = 'Add Quote';
  addButton.onclick = addQuote;

  formContainer.appendChild(quoteInput);
  formContainer.appendChild(categoryInput);
  formContainer.appendChild(addButton);

  document.body.appendChild(formContainer);
}

// Import quotes from JSON file input
function importFromJsonFile(event) {
  const fileReader = new FileReader();
  fileReader.onload = function(event) {
    try {
      const importedQuotes = JSON.parse(event.target.result);
      if (Array.isArray(importedQuotes)) {
        quotes.push(...importedQuotes);
        saveQuotes();
        populateCategories();
        alert('Quotes imported successfully!');
        showRandomQuote();
      } else {
        alert('Invalid JSON format.');
      }
    } catch (error) {
      alert('Error parsing JSON file.');
    }
  };
  fileReader.readAsText(event.target.files[0]);
}

// Export quotes to JSON file download
function exportQuotes() {
  const json = JSON.stringify(quotes, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();

  URL.revokeObjectURL(url);
}

// -------------- Server Syncing --------------

// Fetch quotes from server (simulate GET)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error('Network response was not ok');

    const serverData = await response.json();

    // Convert server data to expected format: {text, category}
    // Simulated: JSONPlaceholder posts have 'title' which we use as text, category fixed as 'Server'
    const serverQuotes = serverData.map(item => ({
      text: item.title || 'No text',
      category: 'Server' 
    }));

    // Merge serverQuotes with local quotes, conflict resolution: server overwrites local
    let updated = false;
    serverQuotes.forEach(sq => {
      const localIndex = quotes.findIndex(lq => lq.text === sq.text);
      if (localIndex === -1) {
        // New quote from server
        quotes.push(sq);
        updated = true;
      } else {
        // Conflict: overwrite local with server version if different
        if (JSON.stringify(quotes[localIndex]) !== JSON.stringify(sq)) {
          quotes[localIndex] = sq;
          updated = true;
        }
      }
    });

    if (updated) {
      saveQuotes();
      populateCategories();
      showRandomQuote();
      showNotification("Quotes updated from server.");
    }
  } catch (error) {
    console.error('Fetch error:', error);
    showNotification("Error fetching data from server.");
  }
}

// Send local quotes to server (simulate POST)
async function sendQuotesToServer() {
  try {
    const response = await fetch(SERVER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(quotes)
    });
    if (!response.ok) throw new Error('Failed to send quotes');
    const data = await response.json();
    console.log('Server response to POST:', data);
    showNotification('Quotes synced with server!');
  } catch (error) {
    console.error('POST error:', error);
    showNotification('Error syncing quotes to server.');
  }
}

// Combined sync function to GET and POST
async function syncQuotes() {
  await fetchQuotesFromServer();
  await sendQuotesToServer();
}

// Show notification messages
function showNotification(message) {
  let notif = document.getElementById('notification');
  if (!notif) {
    notif = document.createElement('div');
    notif.id = 'notification';
    notif.style.position = 'fixed';
    notif.style.top = '10px';
    notif.style.right = '10px';
    notif.style.backgroundColor = '#4CAF50';
    notif.style.color = 'white';
    notif.style.padding = '10px';
    notif.style.borderRadius = '5px';
    notif.style.zIndex = 1000;
    document.body.appendChild(notif);
  }
  notif.textContent = message;
  notif.style.display = 'block';
  setTimeout(() => { notif.style.display = 'none'; }, 4000);
}

// ------------------- INIT -------------------

loadQuotes();
populateCategories();
showLastQuote();
createAddQuoteForm();

document.getElementById('newQuote').addEventListener('click', showRandomQuote);

// Attach event listeners for import/export buttons (assumes they exist in your HTML)
document.getElementById('exportQuotes').addEventListener('click', exportQuotes);
document.getElementById('importFile').addEventListener('change', importFromJsonFile);

// Start periodic syncing every 60 seconds
setInterval(syncQuotes, 60000);

// Initial sync call on load
syncQuotes();
