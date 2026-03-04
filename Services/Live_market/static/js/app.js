// Configure API endpoint - replace with your API Gateway URL after deployment
const API_ENDPOINT = window.API_ENDPOINT || 'https://YOUR_API_GATEWAY_URL/Prod';

document.addEventListener('DOMContentLoaded', function() {
    const searchForm = document.getElementById('searchForm');
    const fetchDataBtn = document.getElementById('fetchDataBtn');
    const resultsSection = document.getElementById('results');
    const rawDataSection = document.getElementById('rawData');
    const errorSection = document.getElementById('error');

    searchForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const state = document.getElementById('state').value.trim();
        const district = document.getElementById('district').value.trim();
        const commodity = document.getElementById('commodity').value.trim();
        
        // Show loading state
        const submitBtn = searchForm.querySelector('.btn-primary');
        const btnText = submitBtn.querySelector('.btn-text');
        const loader = submitBtn.querySelector('.loader');
        
        btnText.textContent = 'Analyzing...';
        loader.style.display = 'block';
        submitBtn.disabled = true;
        
        // Hide previous results
        resultsSection.style.display = 'none';
        rawDataSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        try {
            const response = await fetch(`${API_ENDPOINT}/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ state, district, commodity, action: 'analyze' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                displayResults(result.data);
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Failed to connect to server: ' + error.message);
        } finally {
            btnText.textContent = 'Analyze with AI';
            loader.style.display = 'none';
            submitBtn.disabled = false;
        }
    });

    fetchDataBtn.addEventListener('click', async function() {
        const state = document.getElementById('state').value.trim();
        const district = document.getElementById('district').value.trim();
        const commodity = document.getElementById('commodity').value.trim();
        
        fetchDataBtn.disabled = true;
        fetchDataBtn.textContent = 'Loading...';
        
        resultsSection.style.display = 'none';
        rawDataSection.style.display = 'none';
        errorSection.style.display = 'none';
        
        try {
            const response = await fetch(`${API_ENDPOINT}/fetch`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ state, district, commodity, limit: 50, action: 'fetch' })
            });
            
            const result = await response.json();
            
            if (result.success) {
                displayRawData(result.data);
            } else {
                showError(result.error);
            }
        } catch (error) {
            showError('Failed to fetch data: ' + error.message);
        } finally {
            fetchDataBtn.disabled = false;
            fetchDataBtn.textContent = 'View Raw Data';
        }
    });

    function displayResults(data) {
        const metadata = data.metadata;
        const analysis = data.analysis;
        
        document.getElementById('metadata').innerHTML = `
            <p><strong>State:</strong> ${metadata.state || 'All'}</p>
            <p><strong>District:</strong> ${metadata.district || 'All'}</p>
            <p><strong>Commodity:</strong> ${metadata.commodity || 'All'}</p>
            <p><strong>Total Records:</strong> ${metadata.total_records.toLocaleString()}</p>
            <p><strong>Analyzed Records:</strong> ${metadata.analyzed_records}</p>
            <p><strong>Timestamp:</strong> ${new Date(metadata.timestamp).toLocaleString()}</p>
        `;
        
        document.getElementById('analysis').textContent = analysis;
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    function displayRawData(data) {
        const records = data.records || [];
        
        if (records.length === 0) {
            document.getElementById('dataTable').innerHTML = '<p>No records found.</p>';
        } else {
            const headers = Object.keys(records[0]);
            
            let tableHTML = '<table><thead><tr>';
            headers.forEach(header => {
                tableHTML += `<th>${header}</th>`;
            });
            tableHTML += '</tr></thead><tbody>';
            
            records.forEach(record => {
                tableHTML += '<tr>';
                headers.forEach(header => {
                    tableHTML += `<td>${record[header] || '-'}</td>`;
                });
                tableHTML += '</tr>';
            });
            
            tableHTML += '</tbody></table>';
            document.getElementById('dataTable').innerHTML = tableHTML;
        }
        
        rawDataSection.style.display = 'block';
        rawDataSection.scrollIntoView({ behavior: 'smooth' });
    }

    function showError(message) {
        errorSection.innerHTML = `<strong>Error:</strong> ${message}`;
        errorSection.style.display = 'block';
        errorSection.scrollIntoView({ behavior: 'smooth' });
    }
});
