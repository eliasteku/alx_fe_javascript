let quotes = [];

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
  // Remove all except "All Categories"
  select.innerHTML = '<option value="all">All Categories</option>';

  const categories = getUniqueCategories();
  categories.forEach(cat => {
    const option = document.createElement('option');
    option.value = cat;
    option.textContent = cat;
    select.appendChild(option);
  });

  // Restore last selected filter from localStorage
  const lastFilter = localStorage.getItem('lastSelectedCategory');
  if (lastFilter && (lastFilter === 'all' || categories.includes(lastFilter))) {
    select.value = lastFilter;
  }
}

function filterQuotes() {
  const filterValue = document.getElementById('categoryFilter').value;
  localStorage.setItem('lastSelectedCategory', filterValue);

  const filteredQuotes = filterValue === 'all' ? quotes : quotes.filter(q => q.category === filterValue);
  
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

  // Save last shown filtered quote index (index in filteredQuotes)
  sessionStorage.setItem('lastFilteredQuoteIndex', randomIndex);
  sessionStorage.setItem('lastFilteredCategory', filterValue);
}

function showRandomQuote() {
  // Use current filter selection
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

    // Refresh the displayed quote according to current filter
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

// Initialize app
loadQuotes();
populateCategories();
showLastQuote();
createAddQuoteForm();

// Event listeners
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
