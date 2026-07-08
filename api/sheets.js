const GOOGLE_APPS_SCRIPT_URL ='https://script.google.com/macros/s/AKfycbzZhZWr0GN5jxiXL4l2E0WJHh9GcfZQU1u2CqjXS6Rs5u9hsnjW2LpusUn0SzEqAW5x/exec';

function extractGoogleError(html) {
  return String(html || '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

export default async function handler(req, res) {
  if (
    !GOOGLE_APPS_SCRIPT_URL ||
    GOOGLE_APPS_SCRIPT_URL ===
      'https://script.google.com/macros/s/AKfycbzZhZWr0GN5jxiXL4l2E0WJHh9GcfZQU1u2CqjXS6Rs5u9hsnjW2LpusUn0SzEqAW5x/exec'
  ) {
    return res.status(500).json({
      ok: false,
      error: 'URL Google Apps Script belum diisi',
    });
  }

  try {
    let response;

    if (req.method === 'GET') {
      const action =
        typeof req.query.action === 'string'
          ? req.query.action
          : 'bootstrap';

      const url = new URL(GOOGLE_APPS_SCRIPT_URL);

      url.searchParams.set(
        'action',
        action
      );

      response = await fetch(url.toString(), {
        method: 'GET',
        redirect: 'follow',
        headers: {
          Accept: 'application/json',
        },
      });
    } else if (req.method === 'POST') {
      response = await fetch(
        GOOGLE_APPS_SCRIPT_URL,
        {
          method: 'POST',
          redirect: 'follow',
          headers: {
            'Content-Type':
              'text/plain;charset=utf-8',
            Accept: 'application/json',
          },
          body: JSON.stringify(req.body || {}),
        }
      );
    } else {
      res.setHeader(
        'Allow',
        ['GET', 'POST']
      );

      return res.status(405).json({
        ok: false,
        error: 'Method tidak diizinkan',
      });
    }

    const responseText =
      await response.text();

    let result;

    try {
      result =
        JSON.parse(responseText);
    } catch (error) {
      return res.status(502).json({
        ok: false,
        error:
          'Respons Google Apps Script bukan JSON',
        status: response.status,
        detail:
          extractGoogleError(
            responseText
          ),
      });
    }

    if (!response.ok) {
      return res
        .status(response.status)
        .json({
          ok: false,
          error:
            result.error ||
            `Google Apps Script mengembalikan status ${response.status}`,
          detail: result,
        });
    }

    return res
      .status(200)
      .json(result);
  } catch (error) {
    console.error(
      'Google Sheets proxy error:',
      error
    );

    return res
      .status(500)
      .json({
        ok: false,
        error:
          `Gagal terhubung ke Google Apps Script: ${error.message}`,
      });
  }
}
