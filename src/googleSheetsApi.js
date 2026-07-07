const GOOGLE_SHEETS_API_URL = '/api/sheets';

async function parseResponse(response) {
  const responseText = await response.text();

  let result;

  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(
      `Respons API bukan JSON: ${responseText.slice(0, 200)}`
    );
  }

  if (!response.ok || !result.ok) {
    throw new Error(
      result.error || `Request gagal dengan status ${response.status}`
    );
  }

  return result.data;
}

export async function loadDashboardData() {
  const response = await fetch(
    `${GOOGLE_SHEETS_API_URL}?action=bootstrap`,
    {
      method: 'GET',
      cache: 'no-store',
    }
  );

  return parseResponse(response);
}

async function postAction(action, payload) {
  const response = await fetch(GOOGLE_SHEETS_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action,
      payload,
    }),
  });

  return parseResponse(response);
}

export const createProject = payload =>
  postAction('createProject', payload);

export const createJob = payload =>
  postAction('createJob', payload);

export const updateJob = payload =>
  postAction('updateJob', payload);
