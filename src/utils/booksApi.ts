/**
 * Module 3: Temporal API Filtering Algorithm
 * 
 * This module provides an optimized, asynchronous function to fetch recent books 
 * by a specific author from the Google Books API, filtering for releases within 
 * the last 30 days or scheduled for the future.
 */

export async function fetchRecentBooksByAuthor(authorName: string) {
  // 1. Instantiate a Date object representing exactly 30 days ago from the current system time at midnight.
  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - 30);
  thresholdDate.setHours(0, 0, 0, 0);

  // 2. Enforce literal URL-encoded quotes around the dynamic author name
  // encodeURIComponent('"') results in '%22'
  const encodedAuthor = encodeURIComponent(`"${authorName}"`);
  
  // 3. Append required query parameters
  const url = `https://www.googleapis.com/books/v1/volumes?q=inauthor:${encodedAuthor}&orderBy=newest&maxResults=40`;

  try {
    // 4. Utilize the native fetch API
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    if (!data.items) return [];

    // 5. Map over the JSON API response and filter
    const recentBooks = data.items.filter((book: any) => {
      let pubDateStr = book.volumeInfo?.publishedDate;
      if (!pubDateStr) return false;

      // 6. Handle partial date strings ("YYYY" -> "YYYY-01-01", "YYYY-MM" -> "YYYY-MM-01")
      if (/^\d{4}$/.test(pubDateStr)) {
        pubDateStr += "-01-01";
      } else if (/^\d{4}-\d{2}$/.test(pubDateStr)) {
        pubDateStr += "-01";
      }

      const publishDate = new Date(pubDateStr);
      
      // 7. Filter to return ONLY objects where the newly parsed Date is mathematically GREATER than the 30-day-ago timestamp
      return !isNaN(publishDate.getTime()) && publishDate.getTime() > thresholdDate.getTime();
    });

    return recentBooks;
  } catch (error) {
    console.error("Error fetching books:", error);
    return [];
  }
}
