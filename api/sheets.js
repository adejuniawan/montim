export default async function handler(req, res) {
  const apiUrl = process.env.GOOGLE_APPS_SCRIPT_URL;

  if (!apiUrl) {
    return res.status(500).json({
      ok: false,
      error: 'GOOGLE_APPS_SCRIPT_URL belum diatur di Vercel',
    });
  }

  try {
    let response;

    if (req.method === 'GET') {
      const action = req.query.action || 'bootstrap';

      response = await fetch(
        `${apiUrl}?action=${encodeURIComponent(action)}`,
        {
          method: 'GET',
          redirect: 'follow',
        }
      );
    } else if (req.method === 'POST') {
      response = await fetch(apiUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify(req.body),
      });
    } else {
      return res.status(405).json({
        ok: false,
        error: 'Method tidak diizinkan',
      });
    }

    const responseText = await response.text();

    let result;

    try {
      result = JSON.parse(responseText);
    } catch {
      return res.status(502).json({
        ok: false,
        error: 'Respons Google Apps Script bukan JSON',
        detail: responseText.slice(0, 300),
      });
    }

    return res.status(response.ok ? 200 : response.status).json(result);
  } catch (error) {
    return res.status(500).json({
      ok: false,
      error: `Gagal terhubung ke Google Apps Script: ${error.message}`,
    });
  }
}
