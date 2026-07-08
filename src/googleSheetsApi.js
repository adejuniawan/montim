const GOOGLE_SHEETS_API_URL =
  '/api/sheets';

async function parseResponse(response) {
  const responseText =
    await response.text();

  let result;

  try {
    result =
      JSON.parse(responseText);
  } catch (error) {
    throw new Error(
      `Respons API bukan JSON: ${responseText.slice(0, 300)}`
    );
  }

  if (
    !response.ok ||
    !result.ok
  ) {
    throw new Error(
      result.error ||
      result.detail ||
      `Request gagal dengan status ${response.status}`
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

async function postAction(
  action,
  payload
) {
  const response = await fetch(
    GOOGLE_SHEETS_API_URL,
    {
      method: 'POST',
      headers: {
        'Content-Type':
          'application/json',
      },
      body: JSON.stringify({
        action,
        payload,
      }),
    }
  );

  return parseResponse(response);
}

export function createProject(payload) {
  return postAction(
    'createProject',
    payload
  );
}

export function createJob(payload) {
  return postAction(
    'createJob',
    payload
  );
}

export function updateJob(payload) {
  return postAction(
    'updateJob',
    payload
  );
}
