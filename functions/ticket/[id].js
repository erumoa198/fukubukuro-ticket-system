// Cloudflare Pages Function for dynamic ticket routes
// This function serves the placeholder page for any /ticket/:id request

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Fetch the placeholder page
  const placeholderUrl = new URL('/ticket/placeholder/index.html', url.origin);

  try {
    // Get the placeholder HTML from the static assets
    const response = await env.ASSETS.fetch(placeholderUrl.toString());

    if (!response.ok) {
      // If placeholder doesn't exist, return 404
      return new Response('Page not found', { status: 404 });
    }

    // Return the placeholder page with the same headers
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=0, must-revalidate',
      },
    });
  } catch (error) {
    console.error('Error fetching placeholder:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}
