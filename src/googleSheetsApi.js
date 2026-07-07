const GOOGLE_SHEETS_API_URL =
  process.env.REACT_APP_GOOGLE_SHEETS_API_URL;

async function parseResponse(response) {
  const result = await response.json();

  if (!result.ok) {
    throw new Error(
      result.error || 'Google Sheets API gagal'
    );
  }

  return result.data;
}

export async function loadDashboardData() {
  if (!GOOGLE_SHEETS_API_URL) {
    throw new Error(
      'REACT_APP_GOOGLE_SHEETS_API_URL belum diatur'
    );
  }

  const response = await fetch(
    `${GOOGLE_SHEETS_API_URL}?action=bootstrap`
  );

  return parseResponse(response);
}

async function postAction(action, payload) {
  if (!GOOGLE_SHEETS_API_URL) {
    throw new Error(
      'REACT_APP_GOOGLE_SHEETS_API_URL belum diatur'
    );
  }

  const response = await fetch(
    GOOGLE_SHEETS_API_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify({
        action,
        payload,
      }),
    }
  );

  return parseResponse(response);
}

export const createProject = payload =>
  postAction('createProject', payload);

export const createJob = payload =>
  postAction('createJob', payload);

export const updateJob = payload =>
  postAction('updateJob', payload);
