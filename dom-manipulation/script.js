let quotes = [];
let selectedCategory = 'all'; 

// Simulated server URL (JSONPlaceholder doesn’t really support quotes, so use your own mock or fake API)
const SERVER_URL = 'https://jsonplaceholder.typicode.com/posts'; // Example placeholder URL

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

function saveQuotes() {
  localStorage.setItem('quotes', JSON.stringify(quotes));
}

function getUniqueCategories() {
  const categories = new Set(quotes.map(q => q.category));
  return Array.from(categories).sort();
}

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

function showRandomQuote() {
  filterQuotes();
}

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

// -------------- New: Sync with server --------------

// Fetch quotes from server (simulate GET)
async function fetchQuotesFromServer() {
  try {
    const response = await fetch(SERVER_URL);
    if (!response.ok) throw new Error('Network response was not ok');

    const serverData = await response.json();

    // Convert server data to expected format: {text, category}
    // Here we simulate: JSONPlaceholder posts have 'title' and 'body'
    const serverQuotes = serverData.map(item => ({
      text: item.title || 'No text',
      category: 'Server' // default category for demo
    }));

    // Merge serverQuotes with local quotes, resolving conflicts:
    // Strategy: server data overwrites local quotes if text matches
    let updated = false;
    serverQuotes.forEach(sq => {
      const localIndex = quotes.findIndex(lq => lq.text === sq.text);
      if (localIndex === -1) {
        // New quote from server - add it
        quotes.push(sq);
        updated = true;
      } else {
        // Conflict: overwrite local with server version
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

// Notify user about sync
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

// Periodically sync every 60 seconds
setInterval(fetchQuotesFromServer, 60000);

// Call once on load
fetchQuotesFromServer();

// -------------- End of new sync code --------------

loadQuotes();
populateCategories();
showLastQuote();
createAddQuoteForm();

document.getElementById('newQuote').addEventListener('click', showRandomQuote);
document.getElementById('exportQuotes').addEventListener('click', () => {
  const json = JSON.stringify(quotes, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = 'quotes.json';
  a.click();

  URL.revokeObjectURL(url);
});
document.getElementById('importFile').addEventListener('change', importFromJsonFile);
