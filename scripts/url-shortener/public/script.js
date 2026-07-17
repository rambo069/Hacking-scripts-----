const form = document.getElementById('form');
const result = document.getElementById('result');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  result.textContent = 'Shortening...';
  const url = document.getElementById('url').value;
  try {
    const res = await fetch('/shorten', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (res.ok) {
      result.innerHTML = `Short URL: <a href="${data.short}" target="_blank">${data.short}</a>`;
    } else {
      result.textContent = data.error || 'Error';
    }
  } catch (err) {
    result.textContent = 'Network error';
  }
});
