/**
 * Cliente API para interactuar con el endpoint de Google Apps Script Web App
 * conectado a la hoja SOL_CREDITO_ACTUAL_2026 (1PbUYdmnj5LqQ9k5mFUjHyAL1ATxtEDNgsreAIHHfTUc).
 */

const getApiUrl = () => {
  return (
    import.meta.env.VITE_SHEETS_API_URL ||
    "https://script.google.com/macros/s/AKfycbzHw1GgzD58evJrZJqYzAVPHOV53vH_7EBvpDlSaEoASAdlOhFMKFMsykGUFiy-RCebag/exec"
  );
};

export const submitFormToSheets = async (payload) => {
  const url = getApiUrl();

  try {
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error al enviar datos a Google Sheets:", error);
    throw error;
  }
};

export const getRequestsFromSheets = async (password) => {
  const url = getApiUrl();

  try {
    const urlWithPass = password
      ? `${url}${url.includes("?") ? "&" : "?"}password=${encodeURIComponent(password)}`
      : url;
    const response = await fetch(urlWithPass, {
      method: "GET",
      mode: "cors"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success === false) {
      throw new Error(data.error || "No autorizado");
    }
    return data;
  } catch (error) {
    console.error("Error al obtener datos de Google Sheets:", error);
    throw error;
  }
};

export const updateFormInSheets = async (rowId, payload, password) => {
  const url = getApiUrl();

  const updatePayload = {
    action: "update",
    rowId: rowId,
    password: password,
    ...payload
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      mode: "cors",
      body: JSON.stringify(updatePayload)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    if (data && data.success === false) {
      throw new Error(data.error || "Fallo al actualizar registro");
    }
    return data;
  } catch (error) {
    console.error("Error al actualizar datos en Google Sheets:", error);
    throw error;
  }
};
