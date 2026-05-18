import { apiFetch } from "../Config/ApiClient";

export async function obtenerAgenda() {
  try {
    const response = await apiFetch("/auth/agenda", {
      method: "GET",
    });
    return response;
  } catch (err) {
    throw new Error(err.message || "Error al obtener la agenda");
  }
}

export async function obtenerServicios() {
  try {
    const response = await apiFetch("/turno/obtenerServicio", {
      method: "GET",
    });
    return response;
  } catch (err) {
    throw new Error(err.message || "Error al obtener servicios");
  }
}

export async function generarTurno(dto, token) {
  try {
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    const response = await apiFetch("/turno/generarTurno", {
      method: "POST",
      body: dto,
      headers
    });
    return response;
  } catch (err) {
    throw new Error(err.message || "Error al generar turno");
  }
}