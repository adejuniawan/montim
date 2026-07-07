export default async function handler(req, res) {
  const apiUrl =
    'https://script.google.com/macros/s/AKfycbzc6R5bkz055W3i1EwNXaVfx_47LpAfPKFnvXPGakMTPDYuVhdTnX4FwFJ9IYfczUsQ/exec';

  try {
    let response;

    if (req.method === 'GET') {
      const action = req.query.action || 'bootstrap';

      response = await fetch(
        `${apiUrl}?action=${encodeURIComponent(action)}`,
        {
          method: 'GET',
          redirect: 'follow',
          headers: {
            Accept: 'application/json',
          },
        }
      );
    } else if (req.method === 'POST') {
      response = await fetch(apiUrl, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          Accept: 'application/json',
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
        detail: responseText.slice(0, 500),
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
