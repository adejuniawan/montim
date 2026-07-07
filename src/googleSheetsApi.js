const GOOGLE_SHEETS_API_URL =
  process.env.REACT_APP_GOOGLE_SHEETS_API_URL;

async function parseResponse(response) {
  const responseText = await response.text();

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Respons API bukan JSON. Status: ${response.status}. Respons: ${responseText.slice(0, 200)}`
    );
  }

  if (!response.ok) {
    throw new Error(
      result.error || `Request gagal dengan status ${response.status}`
    );
  }

  if (!result.ok) {
    throw new Error(result.error || 'Google Sheets API gagal');
  }

  return result.data;
}

export async function loadDashboardData() {
  if (!GOOGLE_SHEETS_API_URL) {
    throw new Error(
      'REACT_APP_GOOGLE_SHEETS_API_URL belum diatur'
    );
  }

  const url =
    `${GOOGLE_SHEETS_API_URL}?action=bootstrap&timestamp=${Date.now()}`;

  try {
    const response = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
    });

    return await parseResponse(response);
  } catch (error) {
    throw new Error(
      `Tidak dapat terhubung ke Google Sheets API: ${error.message}`
    );
  }
}

async function postAction(action, payload) {
  if (!GOOGLE_SHEETS_API_URL) {
    throw new Error(
      'REACT_APP_GOOGLE_SHEETS_API_URL belum diatur'
    );
  }

  try {
    const response = await fetch(GOOGLE_SHEETS_API_URL, {
      method: 'POST',
      redirect: 'follow',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action,
        payload,
      }),
    });

    return await parseResponse(response);
  } catch (error) {
    throw new Error(
      `Tidak dapat mengirim data ke Google Sheets API: ${error.message}`
    );
  }
}

export const createProject = payload =>
  postAction('createProject', payload);

export const createJob = payload =>
  postAction('createJob', payload);

export const updateJob = payload =>
  postAction('updateJob', payload);
