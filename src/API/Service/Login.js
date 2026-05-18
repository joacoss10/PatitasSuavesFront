import { apiFetch } from "../Config/ApiClient"; 

const TOKEN_KEY = "demo_token";
const USER_KEY = "demo_user_name";
const USER_EMAIL_KEY = "demo_user_email";
const USER_ROLE_KEY = "demo_user_role";

// Decodificar JWT para extraer el rol
function extractRoleFromToken(token) {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    return decoded.rol || "Cliente";
  } catch (err) {
    return "Cliente";
  }
}

function saveSession(token, user, mail) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
  // Guardamos el nombre como string
  const nombreAGuardar = (user && (user.nombre || user.email || user.mail)) || "Usuario";
  localStorage.setItem(USER_KEY, nombreAGuardar);
  // Usar el email del formulario como fallback si el user no trae email
  const emailAGuardar = (user && (user.email || user.mail)) || mail || "";
  localStorage.setItem(USER_EMAIL_KEY, emailAGuardar);
  // Extraer y guardar rol del JWT
  if (token) {
    const rol = extractRoleFromToken(token);
    localStorage.setItem(USER_ROLE_KEY, rol);
  }
}
export function getCurrentUser() {
  // El USER_KEY almacena el nombre como string, no un JSON
  const user = localStorage.getItem(USER_KEY);
  return user || null;
}
export function logout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(USER_ROLE_KEY);
}
export async function login({mail, contrasenia}) {
  const response = await apiFetch("/auth/login", {
    method: "POST",
    body: { mail, contrasenia },
  });

  if (response.error) {
    throw new Error(response.error);
  }
  
  if (response.token) {
    saveSession(response.token, null, mail);
    return { token: response.token };
  }

  throw new Error("Error inesperado en el login.");
}

export async function obtenerCodigoRecuperacion(mail) {
  const response = await apiFetch("/auth/obtenerCodigo", {
    method: "POST",
    body: { mail, codigo: null, contrasenia: null },
  });

  if (response && response.error) {
    throw new Error(response.error);
  }
  return response;
}

export async function validarCodigoRecuperacion(mail, codigo) {
  const response = await apiFetch("/auth/validarCodigo", {
    method: "POST",
    body: { mail, codigo, contrasenia: null },
  });

  if (response && response.error) {
    throw new Error(response.error);
  }
  return response;
}

export async function cambiarContrasenia(contrasenia, token) {
  const response = await apiFetch("/me/modificarContrasenia", {
    method: "POST",
    body: { mail: null, codigo: null, contrasenia },
    headers: { "Authorization": `Bearer ${token}` }
  });

  if (response && response.error) {
    throw new Error(response.error);
  }
  return response;
}