/**
 * Generic utility to convert an array of JSON objects to a CSV file and trigger a browser download.
 * Handles nested commas, quotes, and newlines in text fields securely.
 */
export function downloadCSV(data: any[], filename: string) {
    if (!data || !data.length) return;

    // Extract headers from the first object
    const headers = Object.keys(data[0]);

    // Build CSV string
    const csvContent = [
        headers.join(','), // Header row
        ...data.map(row => 
            headers.map(header => {
                const cell = row[header] === null || row[header] === undefined ? '' : String(row[header]);
                // Escape quotes and wrap in quotes if there are commas, newlines, or quotes
                if (cell.includes(',') || cell.includes('\n') || cell.includes('"')) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(',')
        )
    ].join('\n');

    // Create Blob and trigger download artificially
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
