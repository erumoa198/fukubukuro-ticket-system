// Cloudflare Pages Function for dynamic ticket routes
export async function onRequest(context) {
  const url = new URL(context.request.url);

  // placeholder への直接アクセスはスキップ
  if (url.pathname.includes('/placeholder')) {
    return context.next();
  }

  // /ticket/placeholder/index.html を取得して返す
  const placeholderUrl = `${url.origin}/ticket/placeholder/index.html`;

  const response = await fetch(placeholderUrl);

  if (!response.ok) {
    return new Response('Page not found', { status: 404 });
  }

  const html = await response.text();

  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}
