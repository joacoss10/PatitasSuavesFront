import { apiFetch } from "../Config/ApiClient";

export async function register({ nombre, mail, contrasenia, celular }) {
  const response = await apiFetch("/auth/register", {
    method: "POST",
    body: { nombre, mail, contrasenia, celular },
  });
  
  return response;
}
