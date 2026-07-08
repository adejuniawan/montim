const GOOGLE_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzc6R5bkz055W3i1EwNXaVfx_47LpAfPKFnvXPGakMTPDYuVhdTnX4FwFJ9IYfczUsQ/exec';

export default async function handler(req, res) {
  try {
    let response;

    if (req.method === 'GET') {
      const action = req.query.action || 'bootstrap';

      const url = new URL(GOOGLE_APPS_SCRIPT_URL);
      url.searchParams.set('action', action);

      response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'application/json',
        },
      });
    } else if (req.method === 'POST') {
      response = await fetch(GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          Accept: 'application/json',
        },
        body: JSON.stringify(req.body),
      });
    } else {
      res.setHeader('Allow', ['GET', 'POST']);

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
        status: response.status,
        detail: responseText.slice(0, 500),
      });
    }

    if (!response.ok) {
      return res.status(response.status).json({
        ok: false,
        error:
          result.error ||
          `Google Apps Script mengembalikan status ${response.status}`,
        detail: result,
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error('Google Sheets proxy error:', error);

    return res.status(500).json({
      ok: false,
      error: `Gagal terhubung ke Google Apps Script: ${error.message}`,
    });
  }
}
